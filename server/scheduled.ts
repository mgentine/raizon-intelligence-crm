import type { Request, Response } from "express";
import { and, isNotNull, lte, sql } from "drizzle-orm";
import { regulatoryActs } from "../drizzle/schema";
import { getDb, getUserByOpenId, refreshUserNotifications } from "./db";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

export async function refreshRegulatoryPriorities(req: Request, res: Response) {
  const startedAt = new Date().toISOString();
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "database-unavailable" });
    const result = await db.update(regulatoryActs).set({ needsValidation: 1 }).where(and(isNotNull(regulatoryActs.expiresAt), lte(regulatoryActs.expiresAt, sql`date_add(now(), interval 90 day)`)));
    const owner = await getUserByOpenId(ENV.ownerOpenId);
    const notifications = owner ? await refreshUserNotifications(owner.id) : { created: 0 };
    return res.json({ ok: true, taskUid: user.taskUid, refreshed: result[0].affectedRows ?? 0, notificationsCreated: notifications.created, startedAt, finishedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl, taskUid: "unknown" }, timestamp: new Date().toISOString() });
  }
}
