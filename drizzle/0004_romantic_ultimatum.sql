CREATE TABLE `audit_snapshots` (
	`run` text PRIMARY KEY NOT NULL,
	`sealed` text NOT NULL,
	`provenance` text NOT NULL,
	`inventory` text NOT NULL,
	`selected` text NOT NULL,
	`config` text,
	`manifest` text NOT NULL,
	FOREIGN KEY (`run`) REFERENCES `audit_runs`(`id`) ON UPDATE no action ON DELETE no action
);
