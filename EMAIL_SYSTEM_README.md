# Dienstato Email System

## Overview

Dienstato now includes a comprehensive email system for user communication. The system supports:

- **Welcome emails** when users register
- **Monthly calendar reports** sent via PDF attachment on a scheduled basis
- **Email preferences** management for users
- **Email queue system** with retry logic
- **Delivery logging** and tracking

## Setup

### 1. SMTP Configuration

Add the following environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.strato.de
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=dienste@sabry.io
SMTP_PASSWORD=your_actual_password
SMTP_FROM_EMAIL=dienste@sabry.io
SMTP_FROM_NAME=Dienstato

# Cron Job Secret (for scheduled email processing)
CRON_SECRET=your-secure-secret-key-here

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Migration

The email system requires additional database tables. Run the migration:

```bash
npm run db:migrate
```

This creates the following tables:
- `email_preferences` - User email settings
- `email_queue` - Pending and sent emails
- `email_delivery_logs` - Email send attempts and results
- `user_monthly_email_sent` - Track which monthly reports have been sent

### 3. Process Email Queue

Set up a cron job to process the email queue every few minutes. The endpoint is:

```
POST /api/emails/process-queue
Authorization: Bearer YOUR_CRON_SECRET
```

Example cron job (every 5 minutes):
```bash
*/5 * * * * curl -X POST https://your-domain.com/api/emails/process-queue -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 4. Process Monthly Reports

Set up a cron job to run once daily (checks if it's the right day to send reports):

```
POST /api/emails/process-monthly-reports
Authorization: Bearer YOUR_CRON_SECRET
```

Example cron job (runs at 1 AM daily):
```bash
0 1 * * * curl -X POST https://your-domain.com/api/emails/process-monthly-reports -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Features

### Welcome Emails

When users register, they can receive a welcome email. The email includes:
- Personalized greeting
- Overview of Dienstato features
- Getting started information
- Links to the application

To trigger a welcome email:
```bash
POST /api/emails/send-welcome
```

This endpoint requires the user to be authenticated and will only send if a welcome email hasn't been sent yet.

### Monthly Calendar Reports

Users can opt-in to receive monthly calendar reports via email. The reports include:

- PDF export of the calendar for the month
- Summary statistics (total shifts, total hours)
- Delivery on a specified day of the month (1-28)

Users configure this in their profile under "Email Preferences".

#### How Monthly Reports Work

1. **Daily Check**: The `process-monthly-reports` endpoint runs daily
2. **User Filter**: It finds users who have monthly reports enabled and whose preferred day matches today
3. **Calendar Filter**: For each user, it finds their subscribed calendars
4. **Duplicate Prevention**: Checks if a report was already sent for this calendar/month/year
5. **PDF Generation**: Creates a PDF of the calendar
6. **Email Queue**: Adds the email to the queue with PDF attachment
7. **Tracking**: Records that the email was sent

### Email Preferences

Users can manage their email preferences in their profile:

- **Monthly Report Enabled**: Toggle monthly calendar reports on/off
- **Monthly Report Day**: Choose which day of the month to receive reports (1-28)

API Endpoints:
```bash
# Get preferences
GET /api/emails/preferences

# Update preferences
PUT /api/emails/preferences
Content-Type: application/json
{
  "monthlyReportEnabled": true,
  "monthlyReportDay": 1
}
```

## Architecture

### Email Service (`lib/email-service.ts`)

Core service that handles:
- SMTP configuration and transport
- Email sending with nodemailer
- Queue management
- Email preferences CRUD
- Email processing with retry logic

### Email Templates (`lib/email-templates.ts`)

HTML and text email templates for:
- Welcome emails
- Monthly reports

Templates are responsive and include proper styling.

### Monthly Scheduler (`lib/monthly-email-scheduler.ts`)

Handles the complex logic of:
- Finding users eligible for monthly reports
- Generating PDFs for calendars
- Calculating shift statistics
- Preventing duplicate sends
- Batch processing emails

### API Endpoints

- `POST /api/emails/preferences` - Get user email preferences
- `PUT /api/emails/preferences` - Update email preferences
- `POST /api/emails/send-welcome` - Send welcome email
- `POST /api/emails/process-queue` - Process pending emails (cron)
- `POST /api/emails/process-monthly-reports` - Generate and queue monthly reports (cron)

## Email Queue System

The email queue provides reliability through:

1. **Asynchronous Processing**: Emails are queued and processed in the background
2. **Retry Logic**: Failed emails are retried up to 3 times
3. **Rate Limiting**: Delays between sends to avoid SMTP limits
4. **Delivery Tracking**: All attempts are logged
5. **Status Management**: Emails have statuses: pending, sent, failed

### Processing Flow

1. Email is added to queue (status: pending)
2. Queue processor picks up pending emails
3. Attempts to send via SMTP
4. On success: status = sent, log created
5. On failure: retryCount++, status stays pending (or changes to failed if max retries reached)
6. Logs record all attempts with error messages

## Database Schema

### email_preferences
- userId (unique, foreign key to user)
- welcomeEmailSent (boolean)
- monthlyReportEnabled (boolean)
- monthlyReportDay (1-28)
- lastMonthlyEmailSentAt (timestamp)

### email_queue
- userId (foreign key)
- recipientEmail
- emailType (welcome, monthly_report)
- subject
- htmlContent
- textContent
- attachmentPath (for PDFs)
- status (pending, sent, failed)
- retryCount
- maxRetries
- lastErrorMessage
- scheduledFor (optional delay)
- sentAt

### email_delivery_logs
- emailQueueId (foreign key)
- userId (foreign key)
- status (sent, failed, bounced)
- errorMessage
- smtpResponse
- attemptNumber

### user_monthly_email_sent
- userId (foreign key)
- calendarId (foreign key)
- year
- month
- sentAt

This tracks which monthly emails have been sent to prevent duplicates.

## Monitoring

### Check Email Queue Status

Query the database to see pending/failed emails:

```sql
SELECT * FROM email_queue WHERE status = 'pending';
SELECT * FROM email_queue WHERE status = 'failed';
```

### View Delivery Logs

```sql
SELECT * FROM email_delivery_logs
ORDER BY created_at DESC
LIMIT 100;
```

### Check User Preferences

```sql
SELECT u.email, ep.*
FROM email_preferences ep
JOIN user u ON u.id = ep.user_id
WHERE ep.monthly_report_enabled = 1;
```

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials in `.env`
2. Verify email queue processor cron is running
3. Check `email_queue` table for failed emails
4. Review `email_delivery_logs` for error messages

### Monthly Reports Not Being Sent

1. Verify cron job is running daily
2. Check user has `monthlyReportEnabled = true`
3. Verify current day matches user's `monthlyReportDay`
4. Check `user_monthly_email_sent` table for duplicate prevention
5. Ensure user has subscribed calendars

### SMTP Authentication Errors

- Double-check SMTP_USER and SMTP_PASSWORD
- Verify SMTP_HOST and SMTP_PORT are correct
- For Strato: ensure port 465 with SSL (SMTP_SECURE=true)

## Security

- Email queue processor requires CRON_SECRET authentication
- Rate limiting on all email API endpoints
- User email preferences are user-specific (can't modify others')
- SMTP credentials are server-side only

## Future Enhancements

Potential improvements:
- Email templates in database for easy customization
- Email open/click tracking
- Unsubscribe links management
- Additional email types (password reset, notifications)
- Webhook endpoints for email service provider callbacks
- Dashboard for email analytics
- Support for multiple languages in emails
