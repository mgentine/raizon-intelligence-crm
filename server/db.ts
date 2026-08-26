import { and, asc, desc, eq, isNotNull, isNull, lt, lte, sql } from "drizzle-orm";
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
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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
    if (!exists.length) { await db.insert(notifications).values({ userId, type: "regulatory_expiry", title: "Ato regulatório próximo do vencimento", body: `Verifique o ato vinculado à empresa ${act.companyId}.`, entityType: "regulatory_act", entityId: act.id }); created++; }
  }
  for (const item of overdue) {
    const exists = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.type, "overdue_activity"), eq(notifications.entityId, item.id), isNull(notifications.readAt))).limit(1);
    if (!exists.length) { await db.insert(notifications).values({ userId, type: "overdue_activity", title: "Atividade atrasada", body: `Existe uma próxima ação vencida para a empresa ${item.companyId}.`, entityType: "activity", entityId: item.id }); created++; }
  }
  return { created };
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(20);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
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

export async function listRegulatoryActs() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ act: regulatoryActs, company: companies }).from(regulatoryActs).leftJoin(companies, eq(regulatoryActs.companyId, companies.id)).orderBy(asc(regulatoryActs.expiresAt)).limit(100);
}

export async function listOpportunities() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ opportunity: opportunities, company: companies }).from(opportunities).leftJoin(companies, eq(opportunities.companyId, companies.id)).orderBy(desc(opportunities.updatedAt)).limit(100);
}

export async function listUpcomingRecurring() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ item: recurringItems, company: companies }).from(recurringItems).leftJoin(companies, eq(recurringItems.companyId, companies.id)).where(eq(recurringItems.status, "open")).orderBy(asc(recurringItems.dueAt)).limit(50);
}

export async function listRecentActivities() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ activity: activities, company: companies }).from(activities).leftJoin(companies, eq(activities.companyId, companies.id)).orderBy(desc(activities.happenedAt)).limit(20);
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
