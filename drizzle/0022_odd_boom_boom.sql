ALTER TABLE `opportunities` ADD `legacyLeadId` int;--> statement-breakpoint
ALTER TABLE `proposals` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_legacy_lead_unique` UNIQUE(`legacyLeadId`);
--> statement-breakpoint
UPDATE `companies`
SET `operationalStatus` = CASE WHEN `relationshipStatus` = 'inactive' THEN 'inactive' ELSE 'active' END;
--> statement-breakpoint
UPDATE `proposals`
SET `documentStatus` = CASE
  WHEN `status` = 'draft' THEN 'draft'
  WHEN `status` = 'technical_review' THEN 'technical_review'
  WHEN `status` = 'commercial_review' THEN 'commercial_review'
  WHEN `status` = 'approved_internal' THEN 'approved_internal'
  ELSE 'issued'
END,
`decisionStatus` = CASE
  WHEN `status` = 'accepted' THEN 'accepted'
  WHEN `status` = 'rejected' THEN 'rejected'
  WHEN `status` = 'cancelled' THEN 'cancelled'
  ELSE 'pending'
END,
`decidedAt` = CASE
  WHEN `status` = 'cancelled' THEN COALESCE(`cancelledAt`, `updatedAt`)
  WHEN `status` IN ('accepted', 'rejected') THEN COALESCE(`sentAt`, `issuedAt`, `updatedAt`)
  ELSE NULL
END;
--> statement-breakpoint
UPDATE `execution_projects`
SET `phase` = CASE
  WHEN `status` IN ('in_progress', 'blocked') THEN 'in_progress'
  WHEN `status` = 'delivered' THEN 'delivered'
  WHEN `status` = 'accepted' THEN 'accepted'
  WHEN `status` = 'closed' THEN 'closed'
  WHEN `status` = 'cancelled' THEN 'cancelled'
  ELSE 'planning'
END;
--> statement-breakpoint
INSERT INTO `opportunities` (`companyId`, `unitId`, `regulatoryActId`, `legacyLeadId`, `ownerId`, `title`, `serviceType`, `source`, `stage`, `technicalPriority`, `commercialPriority`, `probability`, `criticalDate`, `nextAction`, `nextActionAt`, `lossReason`, `notes`, `createdAt`, `updatedAt`)
SELECT
  l.`companyId`, l.`unitId`, l.`regulatoryActId`, l.`id`, l.`ownerId`,
  COALESCE(NULLIF(TRIM(l.`candidateReason`), ''), CONCAT('Lead migrado #', l.`id`)),
  'A classificar', l.`source`,
  CASE l.`commercialStatus`
    WHEN 'qualified' THEN 'qualified'
    WHEN 'diagnosis' THEN 'diagnosis'
    WHEN 'scoping' THEN 'scoping'
    WHEN 'proposal' THEN 'proposal'
    WHEN 'negotiation' THEN 'negotiation'
    WHEN 'approved' THEN 'approved'
    WHEN 'won' THEN 'won'
    WHEN 'lost' THEN 'lost'
    WHEN 'nurture' THEN 'nurture'
    WHEN 'discarded' THEN 'discarded'
    ELSE 'new'
  END,
  l.`technicalPriority`, l.`commercialPriority`, 20, NULL, l.`nextAction`, l.`nextActionAt`, l.`discardedReason`,
  CONCAT('Migrada do Lead #', l.`id`, '. Origem: ', l.`source`, '. Motivo: ', COALESCE(l.`candidateReason`, 'não informado'), '. Status regulatório snapshot: ', COALESCE(l.`regulatoryStatusSnapshot`, 'não informado')),
  l.`createdAt`, l.`updatedAt`
FROM `leads` l
WHERE l.`archivedAt` IS NULL
  AND l.`commercialStatus` IN ('qualified', 'diagnosis', 'scoping', 'proposal', 'negotiation', 'approved', 'won', 'lost', 'nurture', 'discarded')
ON DUPLICATE KEY UPDATE `legacyLeadId` = VALUES(`legacyLeadId`);
--> statement-breakpoint
UPDATE `leads` l
INNER JOIN `opportunities` o ON o.`legacyLeadId` = l.`id`
SET l.`convertedOpportunityId` = o.`id`,
    l.`convertedAt` = COALESCE(l.`convertedAt`, NOW()),
    l.`archivedAt` = COALESCE(l.`archivedAt`, NOW())
WHERE l.`convertedOpportunityId` IS NULL;
