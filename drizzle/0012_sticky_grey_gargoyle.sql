CREATE TABLE `proposal_sequences` (
	`year` int NOT NULL,
	`nextNumber` int NOT NULL DEFAULT 1,
	CONSTRAINT `proposal_sequences_year` PRIMARY KEY(`year`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seriesKey` varchar(80) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`proposalNumber` varchar(20),
	`opportunityId` int NOT NULL,
	`companyId` int NOT NULL,
	`unitId` int,
	`contactId` int,
	`serviceId` int NOT NULL,
	`ownerId` int,
	`status` enum('draft','technical_review','commercial_review','approved_internal','issued','sent','negotiating','accepted','rejected','cancelled') NOT NULL DEFAULT 'draft',
	`clientSnapshot` text NOT NULL,
	`serviceSnapshot` text NOT NULL,
	`scopeSnapshot` text NOT NULL,
	`deliverablesSnapshot` text NOT NULL,
	`exclusionsSnapshot` text,
	`requiredDocumentsSnapshot` text,
	`investment` decimal(12,2) NOT NULL,
	`paymentTerms` varchar(255),
	`validityDays` int NOT NULL DEFAULT 20,
	`visitsIncluded` int NOT NULL DEFAULT 0,
	`missingInformation` text,
	`sourceMap` text,
	`notes` text,
	`reviewedBy` int,
	`issuedAt` timestamp,
	`sentAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `proposals_number_version_unique` UNIQUE(`proposalNumber`,`version`)
);
--> statement-breakpoint
CREATE TABLE `raizon_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileKey` varchar(30) NOT NULL DEFAULT 'default',
	`legalName` varchar(255) NOT NULL,
	`tradeName` varchar(255),
	`cnpj` varchar(14),
	`responsibleName` varchar(255),
	`professionalTitle` varchar(255),
	`crea` varchar(80),
	`mte` varchar(80),
	`phone` varchar(40),
	`email` varchar(320),
	`address` varchar(255),
	`addressNumber` varchar(30),
	`addressComplement` varchar(120),
	`neighborhood` varchar(120),
	`postalCode` varchar(12),
	`city` varchar(120),
	`state` varchar(2),
	`signatureText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `raizon_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `raizon_profiles_profileKey_unique` UNIQUE(`profileKey`)
);
--> statement-breakpoint
CREATE TABLE `service_catalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(120) NOT NULL,
	`agency` varchar(120),
	`state` varchar(2),
	`summary` text,
	`scope` text NOT NULL,
	`deliverables` text NOT NULL,
	`requiredDocuments` text,
	`exclusions` text,
	`assumptions` text,
	`defaultVisits` int NOT NULL DEFAULT 0,
	`basePrice` decimal(12,2),
	`templateKey` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_catalog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `proposals_series_idx` ON `proposals` (`seriesKey`);--> statement-breakpoint
CREATE INDEX `proposals_opportunity_idx` ON `proposals` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `proposals_status_idx` ON `proposals` (`status`);--> statement-breakpoint
CREATE INDEX `service_catalog_category_idx` ON `service_catalog` (`category`);--> statement-breakpoint
CREATE INDEX `service_catalog_active_idx` ON `service_catalog` (`isActive`);