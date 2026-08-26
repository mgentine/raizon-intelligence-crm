CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`opportunityId` int,
	`ownerId` int,
	`channel` varchar(60) NOT NULL,
	`objective` varchar(255),
	`outcome` text,
	`nextAction` varchar(255),
	`nextActionAt` timestamp,
	`happenedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cnpj` varchar(14) NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`tradeName` varchar(255),
	`registrationStatus` varchar(80),
	`mainCnae` varchar(20),
	`city` varchar(120),
	`state` varchar(2),
	`segment` varchar(120),
	`source` varchar(80) NOT NULL DEFAULT 'manual',
	`sourceUpdatedAt` timestamp,
	`confidenceLevel` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`unitId` int,
	`name` varchar(255) NOT NULL,
	`jobTitle` varchar(160),
	`phone` varchar(40),
	`email` varchar(320),
	`decisionRole` varchar(100),
	`validationStatus` enum('unverified','verified','invalid') NOT NULL DEFAULT 'unverified',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(80) NOT NULL,
	`filename` varchar(255),
	`sourceVersion` varchar(120),
	`status` enum('received','processing','completed','failed','review_required') NOT NULL DEFAULT 'received',
	`receivedCount` int NOT NULL DEFAULT 0,
	`insertedCount` int NOT NULL DEFAULT 0,
	`updatedCount` int NOT NULL DEFAULT 0,
	`conflictCount` int NOT NULL DEFAULT 0,
	`rejectedCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	CONSTRAINT `import_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`unitId` int,
	`regulatoryActId` int,
	`ownerId` int,
	`title` varchar(255) NOT NULL,
	`serviceType` varchar(160) NOT NULL,
	`source` varchar(80),
	`stage` enum('new','enrichment','actionable','contacted','qualified','diagnosis','scoping','proposal','negotiation','approved','won','lost','nurture','discarded') NOT NULL DEFAULT 'new',
	`technicalPriority` enum('A','B','C','D') NOT NULL DEFAULT 'C',
	`commercialPriority` enum('A','B','C','D') NOT NULL DEFAULT 'B',
	`estimatedValue` decimal(12,2),
	`probability` int NOT NULL DEFAULT 20,
	`criticalDate` timestamp,
	`nextAction` varchar(255),
	`nextActionAt` timestamp,
	`lossReason` varchar(180),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurring_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`regulatoryActId` int,
	`title` varchar(255) NOT NULL,
	`recurrenceType` varchar(80) NOT NULL,
	`dueAt` timestamp NOT NULL,
	`status` enum('open','in_progress','done','dismissed') NOT NULL DEFAULT 'open',
	`scheduleCronTaskUid` varchar(65),
	`ownerId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurring_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_acts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`unitId` int,
	`source` varchar(80) NOT NULL,
	`agency` varchar(120),
	`actType` varchar(120) NOT NULL,
	`actNumber` varchar(120),
	`processNumber` varchar(120),
	`publishedStatus` varchar(120),
	`issuedAt` timestamp,
	`expiresAt` timestamp,
	`evidenceUrl` varchar(700),
	`collectedAt` timestamp,
	`needsValidation` int NOT NULL DEFAULT 1,
	`sourceVersion` varchar(120),
	`rawFingerprint` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regulatory_acts_id` PRIMARY KEY(`id`),
	CONSTRAINT `regulatory_source_act_unique` UNIQUE(`source`,`actType`,`actNumber`,`processNumber`)
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(255),
	`city` varchar(120),
	`state` varchar(2),
	`operationType` varchar(160),
	`responsibleName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `profile` enum('commercial','technical') DEFAULT 'commercial' NOT NULL;--> statement-breakpoint
CREATE INDEX `activities_company_idx` ON `activities` (`companyId`);--> statement-breakpoint
CREATE INDEX `activities_next_action_idx` ON `activities` (`nextActionAt`);--> statement-breakpoint
CREATE INDEX `companies_city_idx` ON `companies` (`city`);--> statement-breakpoint
CREATE INDEX `contacts_company_idx` ON `contacts` (`companyId`);--> statement-breakpoint
CREATE INDEX `contacts_email_idx` ON `contacts` (`email`);--> statement-breakpoint
CREATE INDEX `opportunities_stage_idx` ON `opportunities` (`stage`);--> statement-breakpoint
CREATE INDEX `opportunities_owner_idx` ON `opportunities` (`ownerId`);--> statement-breakpoint
CREATE INDEX `opportunities_action_idx` ON `opportunities` (`nextActionAt`);--> statement-breakpoint
CREATE INDEX `recurring_due_idx` ON `recurring_items` (`dueAt`);--> statement-breakpoint
CREATE INDEX `recurring_schedule_idx` ON `recurring_items` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `regulatory_company_idx` ON `regulatory_acts` (`companyId`);--> statement-breakpoint
CREATE INDEX `regulatory_expiry_idx` ON `regulatory_acts` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `units_company_idx` ON `units` (`companyId`);