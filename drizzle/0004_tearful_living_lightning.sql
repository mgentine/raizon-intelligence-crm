ALTER TABLE `notifications` ADD `severity` enum('critical','warning','info') DEFAULT 'info' NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `groupingKey` varchar(180);--> statement-breakpoint
CREATE INDEX `notifications_grouping_idx` ON `notifications` (`userId`,`groupingKey`);