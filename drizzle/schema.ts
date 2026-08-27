import {
  bigint,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  profile: mysqlEnum("profile", ["commercial", "technical"]).default("commercial").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const raizonProfiles = mysqlTable("raizon_profiles", {
  id: int("id").autoincrement().primaryKey(),
  profileKey: varchar("profileKey", { length: 30 }).default("default").notNull().unique(),
  legalName: varchar("legalName", { length: 255 }).notNull(),
  tradeName: varchar("tradeName", { length: 255 }),
  cnpj: varchar("cnpj", { length: 14 }),
  responsibleName: varchar("responsibleName", { length: 255 }),
  professionalTitle: varchar("professionalTitle", { length: 255 }),
  crea: varchar("crea", { length: 80 }),
  mte: varchar("mte", { length: 80 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  address: varchar("address", { length: 255 }),
  addressNumber: varchar("addressNumber", { length: 30 }),
  addressComplement: varchar("addressComplement", { length: 120 }),
  neighborhood: varchar("neighborhood", { length: 120 }),
  postalCode: varchar("postalCode", { length: 12 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 2 }),
  signatureText: text("signatureText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RaizonProfile = typeof raizonProfiles.$inferSelect;
export type InsertRaizonProfile = typeof raizonProfiles.$inferInsert;

export const serviceCatalog = mysqlTable("service_catalog", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  agency: varchar("agency", { length: 120 }),
  state: varchar("state", { length: 2 }),
  summary: text("summary"),
  scope: text("scope").notNull(),
  deliverables: text("deliverables").notNull(),
  requiredDocuments: text("requiredDocuments"),
  exclusions: text("exclusions"),
  assumptions: text("assumptions"),
  defaultVisits: int("defaultVisits").default(0).notNull(),
  basePrice: decimal("basePrice", { precision: 12, scale: 2 }),
  templateKey: varchar("templateKey", { length: 255 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("service_catalog_category_idx").on(table.category),
  activeIdx: index("service_catalog_active_idx").on(table.isActive),
}));

export type ServiceCatalogItem = typeof serviceCatalog.$inferSelect;
export type InsertServiceCatalogItem = typeof serviceCatalog.$inferInsert;

export const proposalSequences = mysqlTable("proposal_sequences", {
  year: int("year").primaryKey(),
  nextNumber: int("nextNumber").default(1).notNull(),
});

export type ProposalSequence = typeof proposalSequences.$inferSelect;

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  cnpj: varchar("cnpj", { length: 14 }).notNull(),
  legalName: varchar("legalName", { length: 255 }).notNull(),
  tradeName: varchar("tradeName", { length: 255 }),
  registrationStatus: varchar("registrationStatus", { length: 80 }),
  companySize: varchar("companySize", { length: 80 }),
  relationshipStatus: mysqlEnum("relationshipStatus", ["prospect", "client", "inactive"]).default("prospect").notNull(),
  mainCnae: varchar("mainCnae", { length: 20 }),
  address: varchar("address", { length: 255 }),
  addressNumber: varchar("addressNumber", { length: 30 }),
  addressComplement: varchar("addressComplement", { length: 120 }),
  neighborhood: varchar("neighborhood", { length: 120 }),
  postalCode: varchar("postalCode", { length: 12 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 2 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  segment: varchar("segment", { length: 120 }),
  source: varchar("source", { length: 80 }).default("manual").notNull(),
  sourceUpdatedAt: timestamp("sourceUpdatedAt"),
  confidenceLevel: mysqlEnum("confidenceLevel", ["high", "medium", "low"]).default("medium").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  cnpjUnique: uniqueIndex("companies_cnpj_unique").on(table.cnpj),
  cityIdx: index("companies_city_idx").on(table.city),
}));

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export const units = mysqlTable("units", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 2 }),
  operationType: varchar("operationType", { length: 160 }),
  responsibleName: varchar("responsibleName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  archivedAt: timestamp("archivedAt"),
}, (table) => ({
  companyIdx: index("units_company_idx").on(table.companyId),
}));

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  unitId: int("unitId"),
  name: varchar("name", { length: 255 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 160 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  decisionRole: varchar("decisionRole", { length: 100 }),
  validationStatus: mysqlEnum("validationStatus", ["unverified", "verified", "invalid"]).default("unverified").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  archivedAt: timestamp("archivedAt"),
}, (table) => ({
  companyIdx: index("contacts_company_idx").on(table.companyId),
  emailIdx: index("contacts_email_idx").on(table.email),
}));

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

export const regulatoryActs = mysqlTable("regulatory_acts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  unitId: int("unitId"),
  source: varchar("source", { length: 80 }).notNull(),
  agency: varchar("agency", { length: 120 }),
  actType: varchar("actType", { length: 120 }).notNull(),
  actNumber: varchar("actNumber", { length: 120 }),
  processNumber: varchar("processNumber", { length: 120 }),
  publishedStatus: varchar("publishedStatus", { length: 120 }),
  issuedAt: timestamp("issuedAt"),
  expiresAt: timestamp("expiresAt"),
  evidenceUrl: varchar("evidenceUrl", { length: 700 }),
  collectedAt: timestamp("collectedAt"),
  needsValidation: int("needsValidation").default(1).notNull(),
  sourceVersion: varchar("sourceVersion", { length: 120 }),
  rawFingerprint: varchar("rawFingerprint", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  archivedAt: timestamp("archivedAt"),
}, (table) => ({
  sourceActUnique: uniqueIndex("regulatory_source_act_unique").on(table.source, table.actType, table.actNumber, table.processNumber),
  companyIdx: index("regulatory_company_idx").on(table.companyId),
  expiryIdx: index("regulatory_expiry_idx").on(table.expiresAt),
}));

export type RegulatoryAct = typeof regulatoryActs.$inferSelect;
export type InsertRegulatoryAct = typeof regulatoryActs.$inferInsert;

export const opportunityStages = ["new", "enrichment", "actionable", "contacted", "qualified", "diagnosis", "scoping", "proposal", "negotiation", "approved", "won", "contracting", "execution", "delivery", "closed", "aftercare", "lost", "nurture", "discarded"] as const;
export type OpportunityStage = (typeof opportunityStages)[number];

export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  unitId: int("unitId"),
  regulatoryActId: int("regulatoryActId"),
  ownerId: int("ownerId"),
  title: varchar("title", { length: 255 }).notNull(),
  serviceType: varchar("serviceType", { length: 160 }).notNull(),
  source: varchar("source", { length: 80 }),
  stage: mysqlEnum("stage", opportunityStages).default("new").notNull(),
  technicalPriority: mysqlEnum("technicalPriority", ["A", "B", "C", "D"]).default("C").notNull(),
  commercialPriority: mysqlEnum("commercialPriority", ["A", "B", "C", "D"]).default("B").notNull(),
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
  probability: int("probability").default(20).notNull(),
  criticalDate: timestamp("criticalDate"),
  nextAction: varchar("nextAction", { length: 255 }),
  nextActionAt: timestamp("nextActionAt"),
  lossReason: varchar("lossReason", { length: 180 }),
  notes: text("notes"),
  deliverables: text("deliverables"),
  pendingItems: text("pendingItems"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  stageIdx: index("opportunities_stage_idx").on(table.stage),
  ownerIdx: index("opportunities_owner_idx").on(table.ownerId),
  actionIdx: index("opportunities_action_idx").on(table.nextActionAt),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

export const proposalStatuses = ["draft", "technical_review", "commercial_review", "approved_internal", "issued", "sent", "negotiating", "accepted", "rejected", "cancelled"] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];

export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  seriesKey: varchar("seriesKey", { length: 80 }).notNull(),
  version: int("version").default(1).notNull(),
  proposalNumber: varchar("proposalNumber", { length: 20 }),
  opportunityId: int("opportunityId").notNull(),
  companyId: int("companyId").notNull(),
  unitId: int("unitId"),
  contactId: int("contactId"),
  serviceId: int("serviceId").notNull(),
  ownerId: int("ownerId"),
  professional: varchar("professional", { length: 120 }),
  status: mysqlEnum("status", proposalStatuses).default("draft").notNull(),
  clientSnapshot: text("clientSnapshot").notNull(),
  serviceSnapshot: text("serviceSnapshot").notNull(),
  scopeSnapshot: text("scopeSnapshot").notNull(),
  deliverablesSnapshot: text("deliverablesSnapshot").notNull(),
  assumptionsSnapshot: text("assumptionsSnapshot"),
  exclusionsSnapshot: text("exclusionsSnapshot"),
  requiredDocumentsSnapshot: text("requiredDocumentsSnapshot"),
  investment: decimal("investment", { precision: 12, scale: 2 }).notNull(),
  paymentTerms: varchar("paymentTerms", { length: 255 }),
  validityDays: int("validityDays").default(20).notNull(),
  visitsIncluded: int("visitsIncluded").default(0).notNull(),
  missingInformation: text("missingInformation"),
  sourceMap: text("sourceMap"),
  notes: text("notes"),
  reviewedBy: int("reviewedBy"),
  issuedAt: timestamp("issuedAt"),
  sentAt: timestamp("sentAt"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  seriesIdx: index("proposals_series_idx").on(table.seriesKey),
  opportunityIdx: index("proposals_opportunity_idx").on(table.opportunityId),
  statusIdx: index("proposals_status_idx").on(table.status),
  numberVersionUnique: uniqueIndex("proposals_number_version_unique").on(table.proposalNumber, table.version),
}));

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

export const executionProjectStatuses = ["planning", "in_progress", "blocked", "delivered", "accepted", "closed", "cancelled"] as const;
export type ExecutionProjectStatus = (typeof executionProjectStatuses)[number];

export const executionProjects = mysqlTable("execution_projects", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  companyId: int("companyId").notNull(),
  ownerId: int("ownerId"),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", executionProjectStatuses).default("planning").notNull(),
  scopeSnapshot: text("scopeSnapshot").notNull(),
  deliverablesSnapshot: text("deliverablesSnapshot").notNull(),
  exclusionsSnapshot: text("exclusionsSnapshot"),
  assumptionsSnapshot: text("assumptionsSnapshot"),
  requiredDocumentsSnapshot: text("requiredDocumentsSnapshot"),
  startAt: timestamp("startAt"),
  dueAt: timestamp("dueAt"),
  deliveredAt: timestamp("deliveredAt"),
  acceptedAt: timestamp("acceptedAt"),
  closedAt: timestamp("closedAt"),
  acceptanceNotes: text("acceptanceNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  proposalIdx: index("execution_projects_proposal_idx").on(table.proposalId),
  companyIdx: index("execution_projects_company_idx").on(table.companyId),
  statusIdx: index("execution_projects_status_idx").on(table.status),
}));

export type ExecutionProject = typeof executionProjects.$inferSelect;
export type InsertExecutionProject = typeof executionProjects.$inferInsert;

export const projectTaskStatuses = ["open", "in_progress", "blocked", "done", "cancelled"] as const;
export const projectTasks = mysqlTable("project_tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull().default("technical"),
  ownerId: int("ownerId"),
  status: mysqlEnum("status", projectTaskStatuses).default("open").notNull(),
  dueAt: timestamp("dueAt"),
  notes: text("notes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdx: index("project_tasks_project_idx").on(table.projectId),
  statusIdx: index("project_tasks_status_idx").on(table.status),
}));

export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = typeof projectTasks.$inferInsert;

export const projectChecklistStatuses = ["pending", "received", "approved", "rejected", "waived"] as const;
export const projectChecklist = mysqlTable("project_checklist", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  required: int("required").default(1).notNull(),
  status: mysqlEnum("status", projectChecklistStatuses).default("pending").notNull(),
  ownerId: int("ownerId"),
  dueAt: timestamp("dueAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdx: index("project_checklist_project_idx").on(table.projectId),
  statusIdx: index("project_checklist_status_idx").on(table.status),
}));

export type ProjectChecklist = typeof projectChecklist.$inferSelect;
export type InsertProjectChecklist = typeof projectChecklist.$inferInsert;

export const projectEvidence = mysqlTable("project_evidence", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  taskId: int("taskId"),
  title: varchar("title", { length: 255 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("project_evidence_project_idx").on(table.projectId),
  taskIdx: index("project_evidence_task_idx").on(table.taskId),
}));

export type ProjectEvidence = typeof projectEvidence.$inferSelect;
export type InsertProjectEvidence = typeof projectEvidence.$inferInsert;

export const intelligenceSuggestionStatuses = ["pending", "approved", "rejected"] as const;
export type IntelligenceSuggestionStatus = (typeof intelligenceSuggestionStatuses)[number];

export const intelligenceSuggestions = mysqlTable("intelligence_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 60 }).notNull(),
  entityId: int("entityId"),
  suggestionType: varchar("suggestionType", { length: 80 }).notNull(),
  sourceSnapshot: text("sourceSnapshot").notNull(),
  suggestion: text("suggestion").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", intelligenceSuggestionStatuses).default("pending").notNull(),
  createdBy: int("createdBy").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("intelligence_suggestions_entity_idx").on(table.entityType, table.entityId),
  statusIdx: index("intelligence_suggestions_status_idx").on(table.status),
}));

export type IntelligenceSuggestion = typeof intelligenceSuggestions.$inferSelect;
export type InsertIntelligenceSuggestion = typeof intelligenceSuggestions.$inferInsert;

export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  opportunityId: int("opportunityId"),
  ownerId: int("ownerId"),
  channel: varchar("channel", { length: 60 }).notNull(),
  objective: varchar("objective", { length: 255 }),
  automationKey: varchar("automationKey", { length: 180 }),
  outcome: text("outcome"),
  nextAction: varchar("nextAction", { length: 255 }),
  nextActionAt: timestamp("nextActionAt"),
  happenedAt: timestamp("happenedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("activities_company_idx").on(table.companyId),
    nextActionIdx: index("activities_next_action_idx").on(table.nextActionAt),
    automationKeyUnique: uniqueIndex("activities_automation_key_unique").on(table.automationKey),
  }));

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

export const recurringItems = mysqlTable("recurring_items", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  regulatoryActId: int("regulatoryActId"),
  title: varchar("title", { length: 255 }).notNull(),
  recurrenceType: varchar("recurrenceType", { length: 80 }).notNull(),
  dueAt: timestamp("dueAt").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "done", "dismissed"]).default("open").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  ownerId: int("ownerId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dueIdx: index("recurring_due_idx").on(table.dueAt),
  scheduleIdx: index("recurring_schedule_idx").on(table.scheduleCronTaskUid),
}));

export type RecurringItem = typeof recurringItems.$inferSelect;
export type InsertRecurringItem = typeof recurringItems.$inferInsert;

export const importRuns = mysqlTable("import_runs", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 80 }).notNull(),
  filename: varchar("filename", { length: 255 }),
  sourceVersion: varchar("sourceVersion", { length: 120 }),
  status: mysqlEnum("status", ["received", "processing", "completed", "failed", "review_required"]).default("received").notNull(),
  receivedCount: int("receivedCount").default(0).notNull(),
  insertedCount: int("insertedCount").default(0).notNull(),
  updatedCount: int("updatedCount").default(0).notNull(),
  conflictCount: int("conflictCount").default(0).notNull(),
  rejectedCount: int("rejectedCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
});

export type ImportRun = typeof importRuns.$inferSelect;
export type InsertImportRun = typeof importRuns.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).default("info").notNull(),
  groupingKey: varchar("groupingKey", { length: 180 }),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  readAt: timestamp("readAt"),
  entityType: varchar("entityType", { length: 80 }),
  entityId: int("entityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  unreadIdx: index("notifications_unread_idx").on(table.userId, table.readAt),
  groupingIdx: index("notifications_grouping_idx").on(table.userId, table.groupingKey),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const leadStages = ["new", "enrichment", "actionable", "contacted", "qualified", "diagnosis", "scoping", "proposal", "negotiation", "approved", "won", "lost", "nurture", "discarded"] as const;
export type LeadStage = (typeof leadStages)[number];

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  unitId: int("unitId"),
  regulatoryActId: int("regulatoryActId"),
  source: varchar("source", { length: 80 }).notNull(),
  sourceRecordKey: varchar("sourceRecordKey", { length: 180 }),
  candidateReason: text("candidateReason"),
  regulatoryStatusSnapshot: varchar("regulatoryStatusSnapshot", { length: 120 }),
  regulatoryCollectedAt: timestamp("regulatoryCollectedAt"),
  commercialStatus: mysqlEnum("commercialStatus", leadStages).default("new").notNull(),
  technicalPriority: mysqlEnum("technicalPriority", ["A", "B", "C", "D"]).default("C").notNull(),
  commercialPriority: mysqlEnum("commercialPriority", ["A", "B", "C", "D"]).default("B").notNull(),
  ownerId: int("ownerId"),
  nextAction: varchar("nextAction", { length: 255 }),
  nextActionAt: timestamp("nextActionAt"),
  lastContactedAt: timestamp("lastContactedAt"),
  discardedReason: varchar("discardedReason", { length: 180 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyIdx: index("leads_company_idx").on(table.companyId),
  statusIdx: index("leads_commercial_status_idx").on(table.commercialStatus),
  actionIdx: index("leads_next_action_idx").on(table.nextActionAt),
  sourceKeyUnique: uniqueIndex("leads_source_key_unique").on(table.source, table.sourceRecordKey),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export const importStaging = mysqlTable("import_staging", {
  id: int("id").autoincrement().primaryKey(),
  importRunId: int("importRunId").notNull(),
  lineNumber: int("lineNumber").notNull(),
  rawPayload: text("rawPayload").notNull(),
  rawFingerprint: varchar("rawFingerprint", { length: 128 }).notNull(),
  normalizedCnpj: varchar("normalizedCnpj", { length: 14 }),
  normalizedPayload: text("normalizedPayload"),
  validationStatus: mysqlEnum("validationStatus", ["pending", "valid", "rejected", "conflict"]).default("pending").notNull(),
  validationMessage: text("validationMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  runLineUnique: uniqueIndex("import_staging_run_line_unique").on(table.importRunId, table.lineNumber),
  fingerprintIdx: index("import_staging_fingerprint_idx").on(table.rawFingerprint),
}));

export type ImportStaging = typeof importStaging.$inferSelect;
export type InsertImportStaging = typeof importStaging.$inferInsert;

export const importConflicts = mysqlTable("import_conflicts", {
  id: int("id").autoincrement().primaryKey(),
  importRunId: int("importRunId").notNull(),
  stagingId: int("stagingId"),
  entityType: varchar("entityType", { length: 60 }).notNull(),
  entityId: int("entityId"),
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  currentValue: text("currentValue"),
  incomingValue: text("incomingValue"),
  decision: mysqlEnum("decision", ["pending", "accept_incoming", "keep_current", "accept_partial", "review", "reject"]).default("pending").notNull(),
  decidedBy: int("decidedBy"),
  decidedAt: timestamp("decidedAt"),
  rationale: text("rationale"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  runIdx: index("import_conflicts_run_idx").on(table.importRunId),
  pendingIdx: index("import_conflicts_pending_idx").on(table.decision),
}));

export type ImportConflict = typeof importConflicts.$inferSelect;
export type InsertImportConflict = typeof importConflicts.$inferInsert;

export const regulatoryVersions = mysqlTable("regulatory_versions", {
  id: int("id").autoincrement().primaryKey(),
  regulatoryActId: int("regulatoryActId").notNull(),
  sourceVersion: varchar("sourceVersion", { length: 120 }),
  payloadFingerprint: varchar("payloadFingerprint", { length: 128 }).notNull(),
  publishedStatus: varchar("publishedStatus", { length: 120 }),
  expiresAt: timestamp("expiresAt"),
  evidenceUrl: varchar("evidenceUrl", { length: 700 }),
  rawEssential: text("rawEssential"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  validationStatus: mysqlEnum("validationStatus", ["unverified", "confirmed", "needs_review"]).default("unverified").notNull(),
  validatedBy: int("validatedBy"),
  collectedAt: timestamp("collectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  actVersionUnique: uniqueIndex("regulatory_versions_act_fingerprint_unique").on(table.regulatoryActId, table.payloadFingerprint),
  actIdx: index("regulatory_versions_act_idx").on(table.regulatoryActId),
}));

export type RegulatoryVersion = typeof regulatoryVersions.$inferSelect;
export type InsertRegulatoryVersion = typeof regulatoryVersions.$inferInsert;

export const evidenceFiles = mysqlTable("evidence_files", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
  unitId: int("unitId"),
  regulatoryActId: int("regulatoryActId"),
  opportunityId: int("opportunityId"),
  uploadedBy: int("uploadedBy").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 700 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 700 }).notNull(),
  source: varchar("source", { length: 80 }).default("manual").notNull(),
  collectedAt: timestamp("collectedAt"),
  archivedAt: timestamp("archivedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  actIdx: index("evidence_act_idx").on(table.regulatoryActId),
  companyIdx: index("evidence_company_idx").on(table.companyId),
}));

export type EvidenceFile = typeof evidenceFiles.$inferSelect;
export type InsertEvidenceFile = typeof evidenceFiles.$inferInsert;
