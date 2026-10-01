CREATE TABLE `audit_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`site` text NOT NULL,
	`created` text NOT NULL,
	`status` text NOT NULL,
	`inventory` text NOT NULL,
	`selected` text NOT NULL,
	`keyword` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_runs_owner_created` ON `audit_runs` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `page_audits` (
	`id` text PRIMARY KEY NOT NULL,
	`run` text NOT NULL,
	`url` text NOT NULL,
	`audited` text NOT NULL,
	`type` text NOT NULL,
	`type_source` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`report` text,
	FOREIGN KEY (`run`) REFERENCES `audit_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_page_audits_run_url` ON `page_audits` (`run`,`url`);