CREATE TABLE `audit_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`run` text NOT NULL,
	`url` text NOT NULL,
	`audited` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`scores` text,
	`issues` text,
	`changes` text,
	`report` text,
	FOREIGN KEY (`run`) REFERENCES `audit_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_revisions_run_url_audited` ON `audit_revisions` (`run`,`url`,`audited`);