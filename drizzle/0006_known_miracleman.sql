ALTER TABLE `regulatory_versions` MODIFY COLUMN `collectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `evidence_files` ADD `archivedAt` timestamp;