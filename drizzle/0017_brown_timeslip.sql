ALTER TABLE `regulatory_versions` ADD `rawEssential` text;--> statement-breakpoint
ALTER TABLE `regulatory_versions` ADD `confidence` decimal(5,2);--> statement-breakpoint
ALTER TABLE `regulatory_versions` ADD `validationStatus` enum('unverified','confirmed','needs_review') DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `regulatory_versions` ADD `validatedBy` int;