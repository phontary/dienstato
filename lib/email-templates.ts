export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export interface MonthlyReportEmailData {
  userName: string;
  calendarName: string;
  month: string;
  year: number;
  totalShifts: number;
  totalHours: number;
  hasAttachment: boolean;
}

export function generateWelcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Welcome to Dienstato!";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Dienstato</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #1f2937;
      font-size: 20px;
      margin-top: 0;
    }
    .content p {
      margin: 15px 0;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .features {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .feature-item {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    .feature-item:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #3b82f6;
      font-weight: bold;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Dienstato!</h1>
    </div>
    <div class="content">
      <h2>Hello ${data.userName}!</h2>
      <p>Thank you for joining Dienstato, your personal shift calendar management system.</p>

      <p>We're excited to help you organize and track your work schedules efficiently.</p>

      <div class="features">
        <h3 style="margin-top: 0; color: #1f2937;">What you can do with Dienstato:</h3>
        <div class="feature-item">Create and manage multiple calendars</div>
        <div class="feature-item">Track your shifts with detailed information</div>
        <div class="feature-item">Share calendars with team members</div>
        <div class="feature-item">Export your schedules as PDF or ICS</div>
        <div class="feature-item">Sync with external calendars</div>
        <div class="feature-item">Receive monthly calendar reports via email</div>
      </div>

      <p>To get started, simply log in to your account and create your first calendar.</p>

      <center>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login" class="button">Go to Dienstato</a>
      </center>

      <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>

      <p>Best regards,<br>The Dienstato Team</p>
    </div>
    <div class="footer">
      <p>You're receiving this email because you registered for a Dienstato account with ${data.userEmail}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Welcome to Dienstato!

Hello ${data.userName}!

Thank you for joining Dienstato, your personal shift calendar management system.

We're excited to help you organize and track your work schedules efficiently.

What you can do with Dienstato:
- Create and manage multiple calendars
- Track your shifts with detailed information
- Share calendars with team members
- Export your schedules as PDF or ICS
- Sync with external calendars
- Receive monthly calendar reports via email

To get started, simply log in to your account and create your first calendar.

Visit: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login

If you have any questions or need assistance, don't hesitate to reach out to our support team.

Best regards,
The Dienstato Team

You're receiving this email because you registered for a Dienstato account with ${data.userEmail}
  `.trim();

  return { subject, html, text };
}

export function generateMonthlyReportEmail(
  data: MonthlyReportEmailData
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your ${data.month} ${data.year} Calendar Report`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Calendar Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #1f2937;
      font-size: 20px;
      margin-top: 0;
    }
    .content p {
      margin: 15px 0;
      color: #4b5563;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 25px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #0284c7;
      margin: 5px 0;
    }
    .stat-label {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #10b981;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .info-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Monthly Calendar Report</h1>
    </div>
    <div class="content">
      <h2>Hello ${data.userName}!</h2>
      <p>Here's your monthly summary for <strong>${data.calendarName}</strong> in ${data.month} ${data.year}.</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Shifts</div>
          <div class="stat-value">${data.totalShifts}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Hours</div>
          <div class="stat-value">${data.totalHours.toFixed(1)}</div>
        </div>
      </div>

      ${
        data.hasAttachment
          ? `
      <div class="info-box">
        <p style="margin: 0;"><strong>📎 Attachment Included</strong></p>
        <p style="margin: 5px 0 0 0;">Your detailed calendar report is attached as a PDF file.</p>
      </div>
      `
          : ""
      }

      <p>You can view your complete calendar and manage your shifts anytime by logging into your Dienstato account.</p>

      <center>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login" class="button">View Full Calendar</a>
      </center>

      <p>Keep up the great work tracking your schedule!</p>

      <p>Best regards,<br>The Dienstato Team</p>
    </div>
    <div class="footer">
      <p>You're receiving this monthly report because you have monthly email notifications enabled.</p>
      <p>You can manage your email preferences in your account settings.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Monthly Calendar Report - ${data.month} ${data.year}

Hello ${data.userName}!

Here's your monthly summary for ${data.calendarName} in ${data.month} ${data.year}.

Statistics:
- Total Shifts: ${data.totalShifts}
- Total Hours: ${data.totalHours.toFixed(1)}

${data.hasAttachment ? "Your detailed calendar report is attached as a PDF file.\n" : ""}

You can view your complete calendar and manage your shifts anytime by logging into your Dienstato account.

Visit: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login

Keep up the great work tracking your schedule!

Best regards,
The Dienstato Team

You're receiving this monthly report because you have monthly email notifications enabled.
You can manage your email preferences in your account settings.
  `.trim();

  return { subject, html, text };
}
