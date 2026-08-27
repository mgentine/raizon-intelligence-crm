CREATE TABLE `intelligence_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(60) NOT NULL,
	`entityId` int,
	`suggestionType` varchar(80) NOT NULL,
	`sourceSnapshot` text NOT NULL,
	`suggestion` text NOT NULL,
	`confidence` decimal(5,2),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intelligence_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `intelligence_suggestions_entity_idx` ON `intelligence_suggestions` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `intelligence_suggestions_status_idx` ON `intelligence_suggestions` (`status`);