import { and, asc, desc, eq, isNotNull, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activities,
  companies,
  opportunities,
  regulatoryActs,
  recurringItems,
  users,
  InsertUser,
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

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { companies: 0, opportunities: 0, openOpportunities: 0, expiringActs: 0, overdueActivities: 0 };
  const [companyCount, opportunityCount, openCount, expiringCount, overdueCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(companies),
    db.select({ count: sql<number>`count(*)` }).from(opportunities),
    db.select({ count: sql<number>`count(*)` }).from(opportunities).where(sql`${opportunities.stage} not in ('won','lost','discarded')`),
    db.select({ count: sql<number>`count(*)` }).from(regulatoryActs).where(and(isNotNull(regulatoryActs.expiresAt), lt(regulatoryActs.expiresAt, sql`date_add(now(), interval 90 day)`))),
    db.select({ count: sql<number>`count(*)` }).from(activities).where(and(isNotNull(activities.nextActionAt), lt(activities.nextActionAt, sql`now()`))),
  ]);
  return {
    companies: Number(companyCount[0]?.count ?? 0),
    opportunities: Number(opportunityCount[0]?.count ?? 0),
    openOpportunities: Number(openCount[0]?.count ?? 0),
    expiringActs: Number(expiringCount[0]?.count ?? 0),
    overdueActivities: Number(overdueCount[0]?.count ?? 0),
  };
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
