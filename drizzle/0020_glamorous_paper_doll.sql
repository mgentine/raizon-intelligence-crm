DROP INDEX `execution_projects_proposal_idx` ON `execution_projects`;--> statement-breakpoint
ALTER TABLE `execution_projects` ADD CONSTRAINT `execution_projects_proposal_unique` UNIQUE(`proposalId`);--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_series_version_unique` UNIQUE(`seriesKey`,`version`);--> statement-breakpoint
CREATE INDEX `execution_projects_opportunity_idx` ON `execution_projects` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `proposals_company_idx` ON `proposals` (`companyId`);--> statement-breakpoint
CREATE INDEX `proposals_service_idx` ON `proposals` (`serviceId`);--> statement-breakpoint
ALTER TABLE `execution_projects` ADD CONSTRAINT `execution_projects_proposal_fk` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `execution_projects` ADD CONSTRAINT `execution_projects_opportunity_fk` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `execution_projects` ADD CONSTRAINT `execution_projects_company_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_checklist` ADD CONSTRAINT `project_checklist_project_fk` FOREIGN KEY (`projectId`) REFERENCES `execution_projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_evidence` ADD CONSTRAINT `project_evidence_project_fk` FOREIGN KEY (`projectId`) REFERENCES `execution_projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_evidence` ADD CONSTRAINT `project_evidence_task_fk` FOREIGN KEY (`taskId`) REFERENCES `project_tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_project_fk` FOREIGN KEY (`projectId`) REFERENCES `execution_projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_company_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_opportunity_fk` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_service_fk` FOREIGN KEY (`serviceId`) REFERENCES `service_catalog`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
