CREATE TABLE `email_delivery_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`email_queue_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`smtp_response` text,
	`attempt_number` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`email_queue_id`) REFERENCES `email_queue`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `email_delivery_logs_userId_idx` ON `email_delivery_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_delivery_logs_emailQueueId_idx` ON `email_delivery_logs` (`email_queue_id`);--> statement-breakpoint
CREATE INDEX `email_delivery_logs_status_idx` ON `email_delivery_logs` (`status`);--> statement-breakpoint
CREATE TABLE `email_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`welcome_email_sent` integer DEFAULT false NOT NULL,
	`monthly_report_enabled` integer DEFAULT true NOT NULL,
	`monthly_report_day` integer DEFAULT 1 NOT NULL,
	`last_monthly_email_sent_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_preferences_user_id_unique` ON `email_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_preferences_userId_idx` ON `email_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `email_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`recipient_email` text NOT NULL,
	`email_type` text NOT NULL,
	`subject` text NOT NULL,
	`html_content` text NOT NULL,
	`text_content` text,
	`attachment_path` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`max_retries` integer DEFAULT 3 NOT NULL,
	`last_error_message` text,
	`scheduled_for` integer,
	`sent_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `email_queue_userId_idx` ON `email_queue` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_queue_status_idx` ON `email_queue` (`status`);--> statement-breakpoint
CREATE INDEX `email_queue_emailType_idx` ON `email_queue` (`email_type`);--> statement-breakpoint
CREATE TABLE `user_monthly_email_sent` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`calendar_id` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`sent_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_monthly_email_sent_userId_idx` ON `user_monthly_email_sent` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_monthly_email_sent_calendarId_idx` ON `user_monthly_email_sent` (`calendar_id`);--> statement-breakpoint
CREATE INDEX `user_monthly_email_sent_year_month_idx` ON `user_monthly_email_sent` (`year`,`month`);