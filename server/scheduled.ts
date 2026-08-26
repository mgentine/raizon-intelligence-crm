import type { Request, Response } from "express";
import { and, isNotNull, lte, sql } from "drizzle-orm";
import { regulatoryActs } from "../drizzle/schema";
import { getDb, getUserByOpenId, recordBlockedSourceAttempt, refreshUserNotifications } from "./db";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { getSourceUpdateReadiness } from "../shared/sourceReadiness";

export async function refreshRegulatoryPriorities(req: Request, res: Response) {
  const startedAt = new Date().toISOString();
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "database-unavailable" });
    const result = await db.update(regulatoryActs).set({ needsValidation: 1 }).where(and(isNotNull(regulatoryActs.expiresAt), lte(regulatoryActs.expiresAt, sql`date_add(now(), interval 90 day)`)));
    const sourceUpdates = getSourceUpdateReadiness();
    const blockedSources = Object.entries(sourceUpdates).filter(([, state]) => state === "blocked_no_authorized_endpoint").map(([source]) => (source === "spAguas" ? "sp_aguas" : "cetesb") as "cetesb" | "sp_aguas");
    const blockedAttemptIds = await Promise.all(blockedSources.map((source) => recordBlockedSourceAttempt(source, "Fonte oficial sem endpoint/exportação autorizada; última versão válida preservada.")));
    const owner = await getUserByOpenId(ENV.ownerOpenId);
    const notifications = owner ? await refreshUserNotifications(owner.id) : { created: 0 };
    return res.json({ ok: true, taskUid: user.taskUid, refreshed: result[0].affectedRows ?? 0, notificationsCreated: notifications.created, sourceUpdates, blockedAttemptIds, startedAt, finishedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl, taskUid: "unknown" }, timestamp: new Date().toISOString() });
  }
}
