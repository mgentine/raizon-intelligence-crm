CREATE TABLE `project_blockers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`reason` text NOT NULL,
	`status` enum('open','resolved','cancelled') NOT NULL DEFAULT 'open',
	`ownerId` int,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_blockers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `companies` ADD `operationalStatus` enum('active','inactive') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `execution_projects` ADD `phase` enum('planning','in_progress','delivered','accepted','closed','cancelled') DEFAULT 'planning' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `convertedOpportunityId` int;--> statement-breakpoint
ALTER TABLE `leads` ADD `convertedAt` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proposals` ADD `documentStatus` enum('draft','technical_review','commercial_review','approved_internal','issued') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposals` ADD `decisionStatus` enum('pending','accepted','rejected','cancelled') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposals` ADD `decidedAt` timestamp;--> statement-breakpoint
ALTER TABLE `project_blockers` ADD CONSTRAINT `project_blockers_project_fk` FOREIGN KEY (`projectId`) REFERENCES `execution_projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `project_blockers_project_idx` ON `project_blockers` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_blockers_status_idx` ON `project_blockers` (`status`);--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_converted_opportunity_fk` FOREIGN KEY (`convertedOpportunityId`) REFERENCES `opportunities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `execution_projects_phase_idx` ON `execution_projects` (`phase`);--> statement-breakpoint
CREATE INDEX `leads_converted_opportunity_idx` ON `leads` (`convertedOpportunityId`);--> statement-breakpoint
CREATE INDEX `proposals_document_status_idx` ON `proposals` (`documentStatus`);--> statement-breakpoint
CREATE INDEX `proposals_decision_status_idx` ON `proposals` (`decisionStatus`);