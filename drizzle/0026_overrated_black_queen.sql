ALTER TABLE `users` ADD `loginId` varchar(80);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_loginId_unique` UNIQUE(`loginId`);