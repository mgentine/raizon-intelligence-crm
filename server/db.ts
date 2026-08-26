import { and, asc, desc, eq, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activities,
  companies,
  opportunities,
  regulatoryActs,
  recurringItems,
  users,
  InsertUser,
  importRuns,
  notifications,
  units,
  contacts,
  leads,
  regulatoryVersions,
  evidenceFiles,
  importConflicts,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { normalizeRegulatoryStatus } from "../shared/crmRules";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod", "profile"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] as never;
      updateSet[field] = user[field];
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function refreshUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return { created: 0 };
  const [acts, overdue] = await Promise.all([
    db.select({ id: regulatoryActs.id, expiresAt: regulatoryActs.expiresAt, companyId: regulatoryActs.companyId }).from(regulatoryActs).where(and(isNotNull(regulatoryActs.expiresAt), lte(regulatoryActs.expiresAt, sql`date_add(now(), interval 90 day)`))).limit(100),
    db.select({ id: activities.id, nextActionAt: activities.nextActionAt, companyId: activities.companyId }).from(activities).where(and(isNotNull(activities.nextActionAt), lt(activities.nextActionAt, sql`now()`))).limit(100),
  ]);
  let created = 0;
  for (const act of acts) {
    const exists = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.type, "regulatory_expiry"), eq(notifications.entityId, act.id), isNull(notifications.readAt))).limit(1);
    if (!exists.length) { const severity = act.expiresAt && act.expiresAt <= new Date(Date.now() + 30 * 86400000) ? "critical" : "warning"; await db.insert(notifications).values({ userId, type: "regulatory_expiry", severity, groupingKey: `regulatory_act:${act.id}`, title: "Ato regulatório próximo do vencimento", body: `Verifique o ato vinculado à empresa ${act.companyId}.`, entityType: "regulatory_act", entityId: act.id }); created++; }
  }
  const stalled = await db.select({ id: opportunities.id, companyId: opportunities.companyId, title: opportunities.title }).from(opportunities).where(and(sql`${opportunities.stage} not in ('won','lost','discarded')`, or(isNull(opportunities.nextActionAt), lt(opportunities.nextActionAt, sql`date_sub(now(), interval 14 day)`)))).limit(100);
  for (const opportunity of stalled) {
    const exists = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.type, "stalled_opportunity"), eq(notifications.entityId, opportunity.id), isNull(notifications.readAt))).limit(1);
    if (!exists.length) { await db.insert(notifications).values({ userId, type: "stalled_opportunity", severity: "warning", groupingKey: `opportunity:${opportunity.id}`, title: "Oportunidade sem avanço", body: `${opportunity.title} não possui próxima ação recente.`, entityType: "opportunity", entityId: opportunity.id }); created++; }
  }
  for (const item of overdue) {
    const exists = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.type, "overdue_activity"), eq(notifications.entityId, item.id), isNull(notifications.readAt))).limit(1);
    if (!exists.length) { await db.insert(notifications).values({ userId, type: "overdue_activity", severity: "critical", groupingKey: `activity:${item.id}`, title: "Atividade atrasada", body: `Existe uma próxima ação vencida para a empresa ${item.companyId}.`, entityType: "activity", entityId: item.id }); created++; }
  }
  return { created };
}

export async function listImportRuns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(importRuns).orderBy(desc(importRuns.createdAt)).limit(30);
}

export function groupNotifications<T extends { id: number; type: string; entityType: string | null; entityId: number | null; groupingKey: string | null; readAt: Date | null; severity: "critical" | "warning" | "info" }>(rows: T[]) {
  const grouped = new Map<string, T & { groupingCount: number }>();
  for (const row of rows) {
    const key = row.groupingKey || `${row.type}:${row.entityType || "none"}:${row.entityId || row.id}`;
    const current = grouped.get(key);
    if (!current) grouped.set(key, { ...row, groupingCount: 1 });
    else { current.groupingCount += 1; current.readAt = current.readAt && row.readAt ? current.readAt : null; if (row.severity === "critical") current.severity = "critical"; else if (row.severity === "warning" && current.severity === "info") current.severity = "warning"; }
  }
  return Array.from(grouped.values()).slice(0, 20);
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(100);
  return groupNotifications(rows);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const selected = await db.select({ groupingKey: notifications.groupingKey }).from(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId))).limit(1);
  const groupingKey = selected[0]?.groupingKey;
  await db.update(notifications).set({ readAt: new Date() }).where(groupingKey ? and(eq(notifications.userId, userId), eq(notifications.groupingKey, groupingKey)) : and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { companies: 0, opportunities: 0, openOpportunities: 0, expiringActs: 0, overdueActivities: 0 };
  const [companyCount, opportunityCount, openCount, expiringCount, overdueCount, forecast] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(companies),
    db.select({ count: sql<number>`count(*)` }).from(opportunities),
    db.select({ count: sql<number>`count(*)` }).from(opportunities).where(sql`${opportunities.stage} not in ('won','lost','discarded')`),
    db.select({ count: sql<number>`count(*)` }).from(regulatoryActs).where(and(isNotNull(regulatoryActs.expiresAt), lt(regulatoryActs.expiresAt, sql`date_add(now(), interval 90 day)`))),
    db.select({ count: sql<number>`count(*)` }).from(activities).where(sql`${activities.nextActionAt} < now()`),
    db.select({ value: sql<string>`coalesce(sum(cast(${opportunities.estimatedValue} as decimal(12,2)) * ${opportunities.probability} / 100), 0)` }).from(opportunities).where(sql`${opportunities.stage} not in ('won', 'lost', 'discarded')`),
  ]);
  return {
    companies: Number(companyCount[0]?.count ?? 0),
    opportunities: Number(opportunityCount[0]?.count ?? 0),
    openOpportunities: Number(openCount[0]?.count ?? 0),
    expiringActs: Number(expiringCount[0]?.count ?? 0),
    overdueActivities: Number(overdueCount[0]?.count ?? 0),
    forecastRevenue: Number(forecast[0]?.value ?? 0),
  };
}

export async function getOperationalCoverage() {
  const db = await getDb();
  if (!db) return { companiesWithContact: 0, companiesWithoutContact: 0, priorityA: 0, priorityB: 0, priorityC: 0, priorityD: 0 };
  const [coverage, priorities] = await Promise.all([
    db.select({ covered: sql<number>`count(distinct ${contacts.companyId})` }).from(contacts),
    db.select({ priority: opportunities.commercialPriority, count: sql<number>`count(*)` }).from(opportunities).where(sql`${opportunities.stage} not in ('won','lost','discarded')`).groupBy(opportunities.commercialPriority),
  ]);
  const total = Number((await db.select({ count: sql<number>`count(*)` }).from(companies))[0]?.count ?? 0);
  const covered = Number(coverage[0]?.covered ?? 0);
  const counts = Object.fromEntries(priorities.map((item) => [item.priority, Number(item.count)]));
  return { companiesWithContact: covered, companiesWithoutContact: Math.max(total - covered, 0), priorityA: counts.A || 0, priorityB: counts.B || 0, priorityC: counts.C || 0, priorityD: counts.D || 0 };
}

export async function listUnits(companyId?: number) {
  const db = await getDb();
  if (!db) return [];
  return companyId ? db.select().from(units).where(eq(units.companyId, companyId)).orderBy(asc(units.name)) : db.select().from(units).orderBy(desc(units.updatedAt)).limit(100);
}

export async function listContacts(companyId?: number) {
  const db = await getDb();
  if (!db) return [];
  return companyId ? db.select().from(contacts).where(eq(contacts.companyId, companyId)).orderBy(asc(contacts.name)) : db.select().from(contacts).orderBy(desc(contacts.updatedAt)).limit(100);
}

export async function createUnit(input: typeof units.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(units).values(input);
  return Number(result[0].insertId);
}

export async function createContact(input: typeof contacts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(contacts).values(input);
  return Number(result[0].insertId);
}

export async function listCompanies(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const base = db.select().from(companies).orderBy(desc(companies.updatedAt)).limit(100);
  if (!search?.trim()) return base;
  return db.select().from(companies).where(sql`${companies.legalName} like ${`%${search.trim()}%`} or ${companies.cnpj} like ${`%${search.trim()}%`}`).orderBy(desc(companies.updatedAt)).limit(100);
}

export async function createRegulatoryAct(input: typeof regulatoryActs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(regulatoryActs).values(input);
  return Number(result[0].insertId);
}

export function decorateRegulatoryActRow<T extends { act: { publishedStatus: string | null; expiresAt: Date | null } }>(row: T, now = new Date()) {
  return { ...row, regulatoryStatus: normalizeRegulatoryStatus(row.act.publishedStatus, row.act.expiresAt, now) };
}

export async function listRegulatoryActs() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ act: regulatoryActs, company: companies }).from(regulatoryActs).leftJoin(companies, eq(regulatoryActs.companyId, companies.id)).orderBy(asc(regulatoryActs.expiresAt)).limit(100);
  return rows.map((row) => decorateRegulatoryActRow(row));
}

export async function listOpportunities() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ opportunity: opportunities, company: companies }).from(opportunities).leftJoin(companies, eq(opportunities.companyId, companies.id)).orderBy(desc(opportunities.updatedAt)).limit(100);
}

export async function completeRecurringItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(recurringItems).set({ status: "done", updatedAt: new Date() }).where(and(eq(recurringItems.id, id), eq(recurringItems.ownerId, userId)));
  return { success: true } as const;
}

export async function listUpcomingRecurring() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ item: recurringItems, company: companies }).from(recurringItems).leftJoin(companies, eq(recurringItems.companyId, companies.id)).where(eq(recurringItems.status, "open")).orderBy(asc(recurringItems.dueAt)).limit(50);
}

export async function listRecentActivities(filters?: { companyId?: number; opportunityId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.companyId) conditions.push(eq(activities.companyId, filters.companyId));
  if (filters?.opportunityId) conditions.push(eq(activities.opportunityId, filters.opportunityId));
  return db.select({ activity: activities, company: companies, opportunity: opportunities }).from(activities).leftJoin(companies, eq(activities.companyId, companies.id)).leftJoin(opportunities, eq(activities.opportunityId, opportunities.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(activities.happenedAt)).limit(50);
}

export async function createCompany(input: typeof companies.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(companies).values(input);
  return result[0].insertId;
}

export async function createImportRun(input: { source: string; filename?: string; createdBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(importRuns).values({ ...input, status: "processing" });
  return Number(result[0].insertId);
}

export async function finishImportRun(id: number, result: { received: number; inserted: number; updated: number; rejected: number; conflictCount?: number; status?: "completed" | "failed" | "review_required"; errorMessage?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(importRuns).set({ ...result, conflictCount: result.conflictCount ?? 0, finishedAt: new Date() }).where(eq(importRuns.id, id));
}

export async function createImportFailureNotification(userId: number, importRunId: number, message: string) {
  const db = await getDb();
  if (!db) return { created: false } as const;
  const groupingKey = `import_run:${importRunId}`;
  const existing = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.groupingKey, groupingKey))).limit(1);
  if (existing.length) return { created: false } as const;
  await db.insert(notifications).values({ userId, type: "import_failure", severity: "critical", groupingKey, title: "Falha na importação", body: message, entityType: "import_run", entityId: importRunId });
  return { created: true } as const;
}

export async function bulkUpsertCompanies(rows: Array<{ cnpj: string; legalName: string; tradeName?: string; city?: string; state?: string; segment?: string; source?: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  let inserted = 0;
  let updated = 0;
  let rejected = 0;
  for (const row of rows) {
    const cnpj = row.cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14 || !row.legalName?.trim()) { rejected++; continue; }
    const existing = await db.select({ id: companies.id }).from(companies).where(eq(companies.cnpj, cnpj)).limit(1);
    const values = { cnpj, legalName: row.legalName.trim(), tradeName: row.tradeName || null, city: row.city || null, state: row.state || null, segment: row.segment || null, source: row.source || "import" } as const;
    if (existing[0]) {
      await db.update(companies).set(values).where(eq(companies.id, existing[0].id));
      updated++;
    } else {
      await db.insert(companies).values(values);
      inserted++;
    }
  }
  return { received: rows.length, inserted, updated, rejected };
}

export async function bulkUpsertRegulatoryActs(rows: Array<{ cnpj: string; source: string; actType: string; actNumber?: string; processNumber?: string; publishedStatus?: string; expiresAt?: Date; issuedAt?: Date; evidenceUrl?: string; sourceVersion?: string; notes?: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  let inserted = 0, updated = 0, rejected = 0, unchanged = 0;
  for (const row of rows) {
    const cnpj = row.cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14 || !row.source || !row.actType) { rejected++; continue; }
    const company = await db.select({ id: companies.id }).from(companies).where(eq(companies.cnpj, cnpj)).limit(1);
    if (!company[0]) { rejected++; continue; }
    const fingerprint = createHash("sha256").update(JSON.stringify({ cnpj, source: row.source, actType: row.actType.trim(), actNumber: row.actNumber || null, processNumber: row.processNumber || null, publishedStatus: row.publishedStatus || null, expiresAt: row.expiresAt?.toISOString() || null, issuedAt: row.issuedAt?.toISOString() || null, evidenceUrl: row.evidenceUrl || null, sourceVersion: row.sourceVersion || null })).digest("hex");
    const existing = await db.select({ id: regulatoryActs.id, rawFingerprint: regulatoryActs.rawFingerprint }).from(regulatoryActs).where(and(eq(regulatoryActs.source, row.source), eq(regulatoryActs.actType, row.actType), eq(regulatoryActs.actNumber, row.actNumber || ""), eq(regulatoryActs.processNumber, row.processNumber || ""))).limit(1);
    const values = { companyId: company[0].id, source: row.source, actType: row.actType.trim(), actNumber: row.actNumber || null, processNumber: row.processNumber || null, publishedStatus: row.publishedStatus || null, expiresAt: row.expiresAt || null, issuedAt: row.issuedAt || null, evidenceUrl: row.evidenceUrl || null, collectedAt: new Date(), sourceVersion: row.sourceVersion || null, rawFingerprint: fingerprint, notes: row.notes || null, needsValidation: 1 } as const;
    let actId: number;
    if (existing[0]) {
      actId = existing[0].id;
      if (existing[0].rawFingerprint === fingerprint) { unchanged++; continue; }
      await db.update(regulatoryActs).set(values).where(eq(regulatoryActs.id, actId)); updated++;
    } else {
      const result = await db.insert(regulatoryActs).values(values); actId = Number(result[0].insertId); inserted++;
    }
    await db.insert(regulatoryVersions).values({ regulatoryActId: actId, sourceVersion: row.sourceVersion || null, payloadFingerprint: fingerprint, publishedStatus: row.publishedStatus || null, expiresAt: row.expiresAt || null, evidenceUrl: row.evidenceUrl || null, collectedAt: new Date() }).onDuplicateKeyUpdate({ set: { payloadFingerprint: fingerprint } });
    await db.insert(leads).values({ companyId: company[0].id, regulatoryActId: actId, source: row.source, sourceRecordKey: `${row.source}:${row.actType}:${row.actNumber || ""}:${row.processNumber || ""}`, candidateReason: `Ato ${row.actType} com situação publicada: ${row.publishedStatus || "não informada"}`, regulatoryStatusSnapshot: row.publishedStatus || null, regulatoryCollectedAt: new Date(), technicalPriority: row.expiresAt && row.expiresAt.getTime() < Date.now() + 90 * 86400000 ? "A" : "C", commercialPriority: "B", nextAction: "Validar oportunidade regulatória", nextActionAt: row.expiresAt || new Date(Date.now() + 7 * 86400000) }).onDuplicateKeyUpdate({ set: { regulatoryStatusSnapshot: row.publishedStatus || null, regulatoryCollectedAt: new Date(), updatedAt: new Date() } });
  }
  return { received: rows.length, inserted, updated, unchanged, rejected };
}

export async function createOpportunity(input: typeof opportunities.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(opportunities).values(input);
  return result[0].insertId;
}

export async function createActivity(input: typeof activities.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(activities).values(input);
  return result[0].insertId;
}

export async function createRecurringItem(input: typeof recurringItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(recurringItems).values(input);
  return result[0].insertId;
}

export async function updateOpportunityStage(id: number, stage: typeof opportunities.$inferInsert.stage) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(opportunities).set({ stage }).where(eq(opportunities.id, id));
}

export async function getCetesbLeadStatus() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    status: regulatoryActs.publishedStatus,
    count: sql<number>`count(*)`,
  }).from(regulatoryActs).where(eq(regulatoryActs.source, "cetesb")).groupBy(regulatoryActs.publishedStatus);
  return rows.map((row) => ({
    status: row.status?.trim() || "Sem status informado",
    count: Number(row.count ?? 0),
  })).sort((a, b) => b.count - a.count);
}

export async function listLeads(filters?: { commercialStatus?: string; ownerId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.commercialStatus) conditions.push(eq(leads.commercialStatus, filters.commercialStatus as typeof leads.$inferSelect.commercialStatus));
  if (filters?.ownerId) conditions.push(eq(leads.ownerId, filters.ownerId));
  const query = db.select({ lead: leads, company: companies, act: regulatoryActs }).from(leads).leftJoin(companies, eq(leads.companyId, companies.id)).leftJoin(regulatoryActs, eq(leads.regulatoryActId, regulatoryActs.id)).orderBy(asc(leads.nextActionAt), desc(leads.updatedAt)).limit(filters?.limit ?? 100);
  const rows = conditions.length ? await query.where(and(...conditions)) : await query;
  return rows.map((row) => ({ ...row, regulatoryStatus: normalizeRegulatoryStatus(row.lead.regulatoryStatusSnapshot, row.act?.expiresAt) }));
}

export async function getCommercialFunnelSummary() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ status: leads.commercialStatus, count: sql<number>`count(*)` }).from(leads).groupBy(leads.commercialStatus);
  return rows.map((row) => ({ status: row.status, count: Number(row.count ?? 0) }));
}

export async function createLead(input: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(leads).values(input).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  return Number(result[0].insertId ?? 0);
}

export async function updateLeadCommercialStatus(id: number, status: typeof leads.$inferInsert.commercialStatus, nextAction?: string, nextActionAt?: Date, discardedReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(leads).set({ commercialStatus: status, nextAction: nextAction ?? null, nextActionAt: nextActionAt ?? null, discardedReason: discardedReason ?? null, updatedAt: new Date() }).where(eq(leads.id, id));
}

export async function listOperationalQueue(userId: number) {
  const db = await getDb();
  if (!db) return { leads: [], opportunities: [], recurring: [], activities: [] };
  const now = new Date();
  const [leadRows, opportunityRows, recurringRows, activityRows] = await Promise.all([
    db.select({ lead: leads, company: companies }).from(leads).leftJoin(companies, eq(leads.companyId, companies.id)).where(and(eq(leads.ownerId, userId), or(and(isNotNull(leads.nextActionAt), lte(leads.nextActionAt, sql`date_add(now(), interval 1 day)`)), lt(leads.updatedAt, sql`date_sub(now(), interval 14 day)`)))).orderBy(asc(leads.nextActionAt)).limit(30),
    db.select({ opportunity: opportunities, company: companies }).from(opportunities).leftJoin(companies, eq(opportunities.companyId, companies.id)).where(and(eq(opportunities.ownerId, userId), or(and(isNotNull(opportunities.nextActionAt), lte(opportunities.nextActionAt, sql`date_add(now(), interval 1 day)`)), lt(opportunities.updatedAt, sql`date_sub(now(), interval 14 day)`)))).orderBy(asc(opportunities.nextActionAt)).limit(30),
    db.select({ item: recurringItems, company: companies }).from(recurringItems).leftJoin(companies, eq(recurringItems.companyId, companies.id)).where(and(eq(recurringItems.ownerId, userId), eq(recurringItems.status, "open"), lte(recurringItems.dueAt, sql`date_add(now(), interval 1 day)`))).orderBy(asc(recurringItems.dueAt)).limit(30),
    db.select({ activity: activities, company: companies }).from(activities).leftJoin(companies, eq(activities.companyId, companies.id)).where(and(eq(activities.ownerId, userId), isNotNull(activities.nextActionAt), lte(activities.nextActionAt, sql`date_add(now(), interval 1 day)`))).orderBy(asc(activities.nextActionAt)).limit(30),
  ]);
  return { leads: leadRows.map((row) => ({ ...row, queueReason: row.lead.nextActionAt && row.lead.nextActionAt <= now ? "atrasado" : "sem avanço há 14 dias" })), opportunities: opportunityRows.map((row) => ({ ...row, queueReason: row.opportunity.nextActionAt && row.opportunity.nextActionAt <= now ? "atrasada" : "sem avanço há 14 dias" })), recurring: recurringRows, activities: activityRows, generatedAt: now };
}

export async function createEvidenceFile(input: typeof evidenceFiles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(evidenceFiles).values(input);
  return Number(result[0].insertId);
}

export async function listEvidenceFiles(filters: { regulatoryActId?: number; companyId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.regulatoryActId) conditions.push(eq(evidenceFiles.regulatoryActId, filters.regulatoryActId));
  if (filters.companyId) conditions.push(eq(evidenceFiles.companyId, filters.companyId));
  const query = db.select().from(evidenceFiles).orderBy(desc(evidenceFiles.createdAt)).limit(100);
  return conditions.length ? query.where(and(...conditions)) : query;
}

export async function listPendingImportConflicts(importRunId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(importConflicts.decision, "pending")];
  if (importRunId) conditions.push(eq(importConflicts.importRunId, importRunId));
  return db.select().from(importConflicts).where(and(...conditions)).orderBy(asc(importConflicts.createdAt)).limit(200);
}

export async function decideImportConflict(id: number, userId: number, decision: typeof importConflicts.$inferInsert.decision, rationale?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(importConflicts).set({ decision, decidedBy: userId, decidedAt: new Date(), rationale: rationale || null }).where(eq(importConflicts.id, id));
  return { success: true } as const;
}

export async function getLeadTransitionEvidence(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const lead = await db.select({ companyId: leads.companyId }).from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead[0]) throw new Error("Lead não encontrado");
  const [contactRows, diagnosisRows, proposalRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(contacts).where(eq(contacts.companyId, lead[0].companyId)),
    db.select({ count: sql<number>`count(*)` }).from(activities).where(and(eq(activities.companyId, lead[0].companyId), sql`lower(coalesce(${activities.objective}, '')) like '%diagnos%'`)),
    db.select({ count: sql<number>`count(*)` }).from(opportunities).where(and(eq(opportunities.companyId, lead[0].companyId), sql`${opportunities.stage} in ('proposal','negotiation','approved','won')`)),
  ]);
  return { hasValidContact: Number(contactRows[0]?.count ?? 0) > 0, hasDiagnosis: Number(diagnosisRows[0]?.count ?? 0) > 0, hasProposal: Number(proposalRows[0]?.count ?? 0) > 0 };
}
