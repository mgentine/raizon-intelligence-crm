ALTER TABLE `execution_projects` ADD `activationBasis` enum('customer_acceptance','documented_contract','legacy') DEFAULT 'customer_acceptance' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposals` ADD `contractReference` varchar(120);--> statement-breakpoint
ALTER TABLE `proposals` ADD `contractDocumentedAt` timestamp;