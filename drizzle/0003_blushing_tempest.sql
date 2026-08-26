CREATE TABLE `evidence_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int,
	`unitId` int,
	`regulatoryActId` int,
	`opportunityId` int,
	`uploadedBy` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(700) NOT NULL,
	`storageUrl` varchar(700) NOT NULL,
	`source` varchar(80) NOT NULL DEFAULT 'manual',
	`collectedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_conflicts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importRunId` int NOT NULL,
	`stagingId` int,
	`entityType` varchar(60) NOT NULL,
	`entityId` int,
	`fieldName` varchar(100) NOT NULL,
	`currentValue` text,
	`incomingValue` text,
	`decision` enum('pending','accept_incoming','keep_current','accept_partial','review','reject') NOT NULL DEFAULT 'pending',
	`decidedBy` int,
	`decidedAt` timestamp,
	`rationale` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `import_conflicts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_staging` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importRunId` int NOT NULL,
	`lineNumber` int NOT NULL,
	`rawPayload` text NOT NULL,
	`rawFingerprint` varchar(128) NOT NULL,
	`normalizedCnpj` varchar(14),
	`normalizedPayload` text,
	`validationStatus` enum('pending','valid','rejected','conflict') NOT NULL DEFAULT 'pending',
	`validationMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `import_staging_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_staging_run_line_unique` UNIQUE(`importRunId`,`lineNumber`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`unitId` int,
	`regulatoryActId` int,
	`source` varchar(80) NOT NULL,
	`sourceRecordKey` varchar(180),
	`candidateReason` text,
	`regulatoryStatusSnapshot` varchar(120),
	`regulatoryCollectedAt` timestamp,
	`commercialStatus` enum('new','enrichment','actionable','contacted','qualified','diagnosis','scoping','proposal','negotiation','approved','won','lost','nurture','discarded') NOT NULL DEFAULT 'new',
	`technicalPriority` enum('A','B','C','D') NOT NULL DEFAULT 'C',
	`commercialPriority` enum('A','B','C','D') NOT NULL DEFAULT 'B',
	`ownerId` int,
	`nextAction` varchar(255),
	`nextActionAt` timestamp,
	`lastContactedAt` timestamp,
	`discardedReason` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `leads_source_key_unique` UNIQUE(`source`,`sourceRecordKey`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`regulatoryActId` int NOT NULL,
	`sourceVersion` varchar(120),
	`payloadFingerprint` varchar(128) NOT NULL,
	`publishedStatus` varchar(120),
	`expiresAt` timestamp,
	`evidenceUrl` varchar(700),
	`collectedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regulatory_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `regulatory_versions_act_fingerprint_unique` UNIQUE(`regulatoryActId`,`payloadFingerprint`)
);
--> statement-breakpoint
CREATE INDEX `evidence_act_idx` ON `evidence_files` (`regulatoryActId`);--> statement-breakpoint
CREATE INDEX `evidence_company_idx` ON `evidence_files` (`companyId`);--> statement-breakpoint
CREATE INDEX `import_conflicts_run_idx` ON `import_conflicts` (`importRunId`);--> statement-breakpoint
CREATE INDEX `import_conflicts_pending_idx` ON `import_conflicts` (`decision`);--> statement-breakpoint
CREATE INDEX `import_staging_fingerprint_idx` ON `import_staging` (`rawFingerprint`);--> statement-breakpoint
CREATE INDEX `leads_company_idx` ON `leads` (`companyId`);--> statement-breakpoint
CREATE INDEX `leads_commercial_status_idx` ON `leads` (`commercialStatus`);--> statement-breakpoint
CREATE INDEX `leads_next_action_idx` ON `leads` (`nextActionAt`);--> statement-breakpoint
CREATE INDEX `regulatory_versions_act_idx` ON `regulatory_versions` (`regulatoryActId`);