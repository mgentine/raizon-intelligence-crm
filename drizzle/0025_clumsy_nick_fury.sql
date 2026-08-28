CREATE TABLE `audit_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`actorId` int,
	`origin` varchar(80) NOT NULL DEFAULT 'application',
	`requestId` varchar(100),
	`beforeSnapshot` text,
	`afterSnapshot` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `audit_events_entity_idx` ON `audit_events` (`entityType`,`entityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_events_actor_idx` ON `audit_events` (`actorId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_events_request_idx` ON `audit_events` (`requestId`);