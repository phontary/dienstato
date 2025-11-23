CREATE TABLE `calendar_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`calendar_id` text NOT NULL,
	`date` integer NOT NULL,
	`note` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON UPDATE no action ON DELETE cascade
);
