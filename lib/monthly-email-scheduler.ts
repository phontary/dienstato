import { db } from "@/lib/db";
import {
  emailPreferences,
  userCalendarSubscriptions,
  calendars,
  shifts,
  userMonthlyEmailSent,
  type NewUserMonthlyEmailSent,
} from "@/lib/db/schema";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import { jsPDF } from "jspdf";
import { queueEmail } from "@/lib/email-service";
import { generateMonthlyReportEmail } from "@/lib/email-templates";
import path from "path";
import fs from "fs";

interface MonthlyReportData {
  userId: string;
  userEmail: string;
  userName: string;
  calendarId: string;
  calendarName: string;
  year: number;
  month: number;
}

function calculateHoursBetween(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
}

async function generatePDFForCalendar(
  calendarId: string,
  year: number,
  month: number
): Promise<Buffer | null> {
  try {
    const calendar = await db.query.calendars.findFirst({
      where: eq(calendars.id, calendarId),
    });

    if (!calendar) return null;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const calendarShifts = await db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.calendarId, calendarId),
          gte(shifts.date, startDate),
          lt(shifts.date, endDate)
        )
      )
      .orderBy(shifts.date);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    const checkPageBreak = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(calendar.name, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const monthName = startDate.toLocaleDateString("en", {
      month: "long",
      year: "numeric",
    });
    doc.text(monthName, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    if (calendarShifts.length === 0) {
      doc.setFontSize(10);
      doc.text("No shifts for this month", margin, yPosition);
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      for (const shift of calendarShifts) {
        checkPageBreak(15);

        const shiftDate = shift.date as Date;
        const dateStr = shiftDate.toLocaleDateString("en", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        });

        const rgb = hexToRgb(shift.color);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.rect(margin, yPosition - 2, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.text(dateStr, margin + 6, yPosition);

        doc.setFont("helvetica", "normal");
        const timeStr = shift.isAllDay
          ? "All Day"
          : `${shift.startTime} - ${shift.endTime}`;
        doc.text(timeStr, margin + 35, yPosition);

        doc.setFont("helvetica", "bold");
        doc.text(shift.title, margin + 70, yPosition);

        yPosition += 5;

        if (shift.notes) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          const notesLines = doc.splitTextToSize(
            shift.notes,
            pageWidth - margin * 2 - 10
          );
          for (const line of notesLines) {
            checkPageBreak(5);
            doc.text(line, margin + 10, yPosition);
            yPosition += 4;
          }
          doc.setFontSize(10);
          yPosition += 2;
        } else {
          yPosition += 3;
        }
      }
    }

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error(`Error generating PDF for calendar ${calendarId}:`, error);
    return null;
  }
}

async function getMonthlyReportsToSend(): Promise<MonthlyReportData[]> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const usersWithPreferences = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.monthlyReportEnabled, true));

  const reports: MonthlyReportData[] = [];

  for (const userPref of usersWithPreferences) {
    if (now.getDate() !== userPref.monthlyReportDay) {
      continue;
    }

    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, userPref.userId),
    });

    if (!user) continue;

    const userSubscriptions = await db
      .select()
      .from(userCalendarSubscriptions)
      .where(
        and(
          eq(userCalendarSubscriptions.userId, userPref.userId),
          eq(userCalendarSubscriptions.status, "subscribed")
        )
      );

    for (const subscription of userSubscriptions) {
      const alreadySent = await db
        .select()
        .from(userMonthlyEmailSent)
        .where(
          and(
            eq(userMonthlyEmailSent.userId, userPref.userId),
            eq(userMonthlyEmailSent.calendarId, subscription.calendarId),
            eq(userMonthlyEmailSent.year, currentYear),
            eq(userMonthlyEmailSent.month, currentMonth)
          )
        );

      if (alreadySent.length > 0) {
        continue;
      }

      const calendar = await db.query.calendars.findFirst({
        where: (calendars, { eq }) => eq(calendars.id, subscription.calendarId),
      });

      if (!calendar) continue;

      reports.push({
        userId: userPref.userId,
        userEmail: user.email,
        userName: user.name,
        calendarId: subscription.calendarId,
        calendarName: calendar.name,
        year: currentYear,
        month: currentMonth,
      });
    }
  }

  return reports;
}

export async function processMonthlyReports(): Promise<{
  processed: number;
  failed: number;
}> {
  const reports = await getMonthlyReportsToSend();
  let processed = 0;
  let failed = 0;

  console.log(`Processing ${reports.length} monthly reports...`);

  for (const report of reports) {
    try {
      const startDate = new Date(report.year, report.month - 1, 1);
      const endDate = new Date(report.year, report.month, 0, 23, 59, 59);

      const calendarShifts = await db
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.calendarId, report.calendarId),
            gte(shifts.date, startDate),
            lt(shifts.date, endDate)
          )
        );

      const totalShifts = calendarShifts.length;
      const totalHours = calendarShifts.reduce((sum, shift) => {
        if (shift.isAllDay) return sum + 8;
        return sum + calculateHoursBetween(shift.startTime, shift.endTime);
      }, 0);

      const pdfBuffer = await generatePDFForCalendar(
        report.calendarId,
        report.year,
        report.month
      );

      let pdfPath: string | undefined;
      if (pdfBuffer) {
        const tempDir = path.join(process.cwd(), "temp", "pdfs");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const filename = `${report.userId}_${report.calendarId}_${report.year}_${report.month}.pdf`;
        pdfPath = path.join(tempDir, filename);
        fs.writeFileSync(pdfPath, pdfBuffer);
      }

      const monthName = new Date(report.year, report.month - 1).toLocaleDateString(
        "en",
        { month: "long" }
      );

      const emailContent = generateMonthlyReportEmail({
        userName: report.userName,
        calendarName: report.calendarName,
        month: monthName,
        year: report.year,
        totalShifts,
        totalHours,
        hasAttachment: !!pdfPath,
      });

      await queueEmail({
        userId: report.userId,
        recipientEmail: report.userEmail,
        emailType: "monthly_report",
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        attachmentPath: pdfPath,
      });

      const sentRecord: NewUserMonthlyEmailSent = {
        userId: report.userId,
        calendarId: report.calendarId,
        year: report.year,
        month: report.month,
      };

      await db.insert(userMonthlyEmailSent).values(sentRecord);

      processed++;

      if (pdfPath && fs.existsSync(pdfPath)) {
        setTimeout(() => {
          try {
            fs.unlinkSync(pdfPath!);
          } catch (error) {
            console.error(`Error deleting temp PDF ${pdfPath}:`, error);
          }
        }, 60000);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(
        `Error processing monthly report for user ${report.userId}, calendar ${report.calendarId}:`,
        error
      );
      failed++;
    }
  }

  console.log(`Monthly reports processed: ${processed}, failed: ${failed}`);
  return { processed, failed };
}
