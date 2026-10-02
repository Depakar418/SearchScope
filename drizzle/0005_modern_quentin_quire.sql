CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`name` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_events` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`details` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_project_created` ON `project_events` (`project`,`created`);--> statement-breakpoint
CREATE TABLE `project_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`kind` text NOT NULL,
	`inviter` text NOT NULL,
	`status` text NOT NULL,
	`created` text NOT NULL,
	`expires` text NOT NULL,
	`accepted_by` text,
	`accepted_at` text,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_invites_email_status` ON `project_invites` (`email`,`status`);--> statement-breakpoint
CREATE INDEX `idx_invites_project_status` ON `project_invites` (`project`,`status`);--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`user` text NOT NULL,
	`role` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_project_user` ON `project_members` (`project`,`user`);--> statement-breakpoint
CREATE INDEX `idx_members_user` ON `project_members` (`user`);