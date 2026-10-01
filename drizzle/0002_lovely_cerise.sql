CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'website' NOT NULL,
	`site` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_projects_owner_site` ON `projects` (`owner`,`site`);--> statement-breakpoint
CREATE INDEX `idx_projects_owner_updated` ON `projects` (`owner`,`updated`);--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `project` text REFERENCES projects(id);--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `started` text;--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `finished` text;--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `config` text;--> statement-breakpoint
CREATE INDEX `idx_audit_runs_project_created` ON `audit_runs` (`project`,`created`);