CREATE TABLE `execution_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`companyId` int NOT NULL,
	`ownerId` int,
	`title` varchar(255) NOT NULL,
	`status` enum('planning','in_progress','blocked','delivered','accepted','closed','cancelled') NOT NULL DEFAULT 'planning',
	`scopeSnapshot` text NOT NULL,
	`deliverablesSnapshot` text NOT NULL,
	`exclusionsSnapshot` text,
	`assumptionsSnapshot` text,
	`requiredDocumentsSnapshot` text,
	`startAt` timestamp,
	`dueAt` timestamp,
	`deliveredAt` timestamp,
	`acceptedAt` timestamp,
	`closedAt` timestamp,
	`acceptanceNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `execution_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_checklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`required` int NOT NULL DEFAULT 1,
	`status` enum('pending','received','approved','rejected','waived') NOT NULL DEFAULT 'pending',
	`ownerId` int,
	`dueAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_checklist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'technical',
	`ownerId` int,
	`status` enum('open','in_progress','blocked','done','cancelled') NOT NULL DEFAULT 'open',
	`dueAt` timestamp,
	`notes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `execution_projects_proposal_idx` ON `execution_projects` (`proposalId`);--> statement-breakpoint
CREATE INDEX `execution_projects_company_idx` ON `execution_projects` (`companyId`);--> statement-breakpoint
CREATE INDEX `execution_projects_status_idx` ON `execution_projects` (`status`);--> statement-breakpoint
CREATE INDEX `project_checklist_project_idx` ON `project_checklist` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_checklist_status_idx` ON `project_checklist` (`status`);--> statement-breakpoint
CREATE INDEX `project_tasks_project_idx` ON `project_tasks` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_tasks_status_idx` ON `project_tasks` (`status`);