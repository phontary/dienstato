import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { db } from "@/lib/db";
import {
  emailQueue,
  emailDeliveryLogs,
  emailPreferences,
  type NewEmailQueue,
  type NewEmailDeliveryLog,
} from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.strato.de",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
};

const FROM_CONFIG = {
  email: process.env.SMTP_FROM_EMAIL || "dienste@sabry.io",
  name: process.env.SMTP_FROM_NAME || "Dienstato",
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `"${FROM_CONFIG.name}" <${FROM_CONFIG.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    console.log(`Email sent successfully to ${options.to}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
}

export async function queueEmail(data: {
  userId: string;
  recipientEmail: string;
  emailType: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachmentPath?: string;
  scheduledFor?: Date;
}): Promise<string> {
  const newEmail: NewEmailQueue = {
    userId: data.userId,
    recipientEmail: data.recipientEmail,
    emailType: data.emailType,
    subject: data.subject,
    htmlContent: data.htmlContent,
    textContent: data.textContent,
    attachmentPath: data.attachmentPath,
    status: "pending",
    retryCount: 0,
    maxRetries: 3,
    scheduledFor: data.scheduledFor,
  };

  const [inserted] = await db.insert(emailQueue).values(newEmail).returning();
  return inserted.id;
}

export async function processEmailQueue(): Promise<void> {
  const now = new Date();
  const pendingEmails = await db
    .select()
    .from(emailQueue)
    .where(
      and(
        eq(emailQueue.status, "pending"),
        lte(emailQueue.retryCount, emailQueue.maxRetries)
      )
    )
    .limit(50);

  for (const email of pendingEmails) {
    if (email.scheduledFor && email.scheduledFor > now) {
      continue;
    }

    try {
      const attachments = email.attachmentPath
        ? [{ filename: "calendar.pdf", path: email.attachmentPath }]
        : undefined;

      const success = await sendEmail({
        to: email.recipientEmail,
        subject: email.subject,
        html: email.htmlContent,
        text: email.textContent || undefined,
        attachments,
      });

      const log: NewEmailDeliveryLog = {
        emailQueueId: email.id,
        userId: email.userId,
        status: success ? "sent" : "failed",
        errorMessage: success ? null : "SMTP send failed",
        smtpResponse: null,
        attemptNumber: email.retryCount + 1,
      };

      await db.insert(emailDeliveryLogs).values(log);

      if (success) {
        await db
          .update(emailQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(emailQueue.id, email.id));
      } else {
        const newRetryCount = email.retryCount + 1;
        const newStatus =
          newRetryCount >= email.maxRetries ? "failed" : "pending";

        await db
          .update(emailQueue)
          .set({
            retryCount: newRetryCount,
            status: newStatus,
            lastErrorMessage: "SMTP send failed",
          })
          .where(eq(emailQueue.id, email.id));
      }
    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);

      const log: NewEmailDeliveryLog = {
        emailQueueId: email.id,
        userId: email.userId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        smtpResponse: null,
        attemptNumber: email.retryCount + 1,
      };

      await db.insert(emailDeliveryLogs).values(log);

      const newRetryCount = email.retryCount + 1;
      const newStatus =
        newRetryCount >= email.maxRetries ? "failed" : "pending";

      await db
        .update(emailQueue)
        .set({
          retryCount: newRetryCount,
          status: newStatus,
          lastErrorMessage: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(emailQueue.id, email.id));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export async function getUserEmailPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.userId, userId));

  if (!prefs) {
    const [newPrefs] = await db
      .insert(emailPreferences)
      .values({
        userId,
        welcomeEmailSent: false,
        monthlyReportEnabled: true,
        monthlyReportDay: 1,
      })
      .returning();
    return newPrefs;
  }

  return prefs;
}

export async function updateUserEmailPreferences(
  userId: string,
  updates: {
    monthlyReportEnabled?: boolean;
    monthlyReportDay?: number;
  }
) {
  const prefs = await getUserEmailPreferences(userId);

  await db
    .update(emailPreferences)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(emailPreferences.userId, userId));

  return await getUserEmailPreferences(userId);
}

export async function markWelcomeEmailSent(userId: string) {
  await db
    .update(emailPreferences)
    .set({ welcomeEmailSent: true, updatedAt: new Date() })
    .where(eq(emailPreferences.userId, userId));
}
