import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessions";
import {
  queueEmail,
  getUserEmailPreferences,
  markWelcomeEmailSent,
} from "@/lib/email-service";
import { generateWelcomeEmail } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request.headers);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await getUserEmailPreferences(user.id);

    if (prefs.welcomeEmailSent) {
      return NextResponse.json(
        { error: "Welcome email already sent" },
        { status: 400 }
      );
    }

    const emailContent = generateWelcomeEmail({
      userName: user.name,
      userEmail: user.email,
    });

    await queueEmail({
      userId: user.id,
      recipientEmail: user.email,
      emailType: "welcome",
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      textContent: emailContent.text,
    });

    await markWelcomeEmailSent(user.id);

    return NextResponse.json({
      success: true,
      message: "Welcome email queued for sending",
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
