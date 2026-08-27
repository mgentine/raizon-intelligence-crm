CREATE TABLE `project_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`taskId` int,
	`title` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `project_evidence_project_idx` ON `project_evidence` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_evidence_task_idx` ON `project_evidence` (`taskId`);