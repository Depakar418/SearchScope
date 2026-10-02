CREATE TABLE `intelligence_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`revision` text NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`actor` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`revision`) REFERENCES `audit_revisions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_intelligence_actions_project_revision` ON `intelligence_actions` (`project`,`revision`);--> statement-breakpoint
CREATE TABLE `page_intelligence` (
	`revision` text PRIMARY KEY NOT NULL,
	`run` text NOT NULL,
	`project` text NOT NULL,
	`page` text NOT NULL,
	`analyzed` text NOT NULL,
	`analysis_version` text NOT NULL,
	`crawl_version` text NOT NULL,
	`extraction_version` text NOT NULL,
	`recommendation_version` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`revision`) REFERENCES `audit_revisions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`run`) REFERENCES `audit_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_page_intelligence_project_run` ON `page_intelligence` (`project`,`run`);