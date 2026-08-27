ALTER TABLE `activities` ADD `automationKey` varchar(180);--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_automation_key_unique` UNIQUE(`automationKey`);