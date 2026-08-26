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

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  cnpj: varchar("cnpj", { length: 14 }).notNull(),
  legalName: varchar("legalName", { length: 255 }).notNull(),
  tradeName: varchar("tradeName", { length: 255 }),
  registrationStatus: varchar("registrationStatus", { length: 80 }),
  mainCnae: varchar("mainCnae", { length: 20 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 2 }),
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
}, (table) => ({
  sourceActUnique: uniqueIndex("regulatory_source_act_unique").on(table.source, table.actType, table.actNumber, table.processNumber),
  companyIdx: index("regulatory_company_idx").on(table.companyId),
  expiryIdx: index("regulatory_expiry_idx").on(table.expiresAt),
}));

export type RegulatoryAct = typeof regulatoryActs.$inferSelect;
export type InsertRegulatoryAct = typeof regulatoryActs.$inferInsert;

export const opportunityStages = ["new", "enrichment", "actionable", "contacted", "qualified", "diagnosis", "scoping", "proposal", "negotiation", "approved", "won", "lost", "nurture", "discarded"] as const;
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  stageIdx: index("opportunities_stage_idx").on(table.stage),
  ownerIdx: index("opportunities_owner_idx").on(table.ownerId),
  actionIdx: index("opportunities_action_idx").on(table.nextActionAt),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  opportunityId: int("opportunityId"),
  ownerId: int("ownerId"),
  channel: varchar("channel", { length: 60 }).notNull(),
  objective: varchar("objective", { length: 255 }),
  outcome: text("outcome"),
  nextAction: varchar("nextAction", { length: 255 }),
  nextActionAt: timestamp("nextActionAt"),
  happenedAt: timestamp("happenedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("activities_company_idx").on(table.companyId),
  nextActionIdx: index("activities_next_action_idx").on(table.nextActionAt),
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
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  readAt: timestamp("readAt"),
  entityType: varchar("entityType", { length: 80 }),
  entityId: int("entityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  unreadIdx: index("notifications_unread_idx").on(table.userId, table.readAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
