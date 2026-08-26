import { z } from "zod";
import { normalizeCnpj, validateCommercialTransition } from "../shared/crmRules";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { bulkUpsertCompanies, createImportFailureNotification, createActivity, createCompany, createContact, createEvidenceFile, createImportRun, decideImportConflict, completeRecurringItem, createLead, createOpportunity, createRecurringItem, createRegulatoryAct, createUnit, finishImportRun, getCommercialFunnelSummary, getDashboardStats, getLeadTransitionEvidence, getOperationalCoverage, getCetesbLeadStatus, listCompanies, listContacts, listEvidenceFiles, listImportRuns, listPendingImportConflicts, listLeads, listNotifications, listOpportunities, listOperationalQueue, listRecentActivities, listRegulatoryActs, listUpcomingRecurring, listUnits, markNotificationRead, updateLeadCommercialStatus, updateOpportunityStage } from "./db";
import { lookupCnpj } from "./integrations/cnpj";
import { storagePut } from "./storage";
import { normalizeDateValue, normalizeEmailValue, normalizeMunicipalityValue, normalizePersistedDates, normalizePhoneValue } from "../shared/normalization";

const cnpjSchema = z.string().transform(normalizeCnpj).refine((value) => value.length === 14, "CNPJ deve conter 14 dígitos");
const leadStageSchema = z.enum(["new", "enrichment", "actionable", "contacted", "qualified", "diagnosis", "scoping", "proposal", "negotiation", "approved", "won", "lost", "nurture", "discarded"]);
function requireProfile(ctx: { user: { role: string; profile: string } }, allowed: Array<"admin" | "commercial" | "technical">) {
  const profile = ctx.user.role === "admin" ? "admin" : ctx.user.profile;
  if (!allowed.includes(profile as never)) throw new TRPCError({ code: "FORBIDDEN", message: "Perfil sem permissão para esta operação." });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => markNotificationRead(input.id, ctx.user.id)),
  }),
  dashboard: router({
    stats: protectedProcedure.query(() => getDashboardStats()),
    activities: protectedProcedure.input(z.object({ companyId: z.number().int().positive().optional(), opportunityId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial", "technical"]); return listRecentActivities(input); }),
    recurring: protectedProcedure.query(() => listUpcomingRecurring()),
    cetesbLeadStatus: protectedProcedure.query(() => getCetesbLeadStatus()),
    commercialFunnel: protectedProcedure.query(() => getCommercialFunnelSummary()),
    operationalCoverage: protectedProcedure.query(() => getOperationalCoverage()),
    myQueue: protectedProcedure.query(({ ctx }) => listOperationalQueue(ctx.user.id)),
  }),
  leads: router({
    list: protectedProcedure.input(z.object({ commercialStatus: leadStageSchema.optional(), ownerId: z.number().int().positive().optional() }).optional()).query(({ input }) => listLeads(input)),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), unitId: z.number().int().positive().optional(), regulatoryActId: z.number().int().positive().optional(), source: z.string().min(2), sourceRecordKey: z.string().max(180).optional(), candidateReason: z.string().optional(), regulatoryStatusSnapshot: z.string().optional(), technicalPriority: z.enum(["A", "B", "C", "D"]).default("C"), commercialPriority: z.enum(["A", "B", "C", "D"]).default("B"), nextAction: z.string().min(3), nextActionAt: z.date() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial", "technical"]); return createLead({ ...input, ownerId: ctx.user.id, regulatoryCollectedAt: input.regulatoryStatusSnapshot ? new Date() : undefined }); }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), commercialStatus: leadStageSchema, nextAction: z.string().min(3).optional(), nextActionAt: z.date().optional(), discardedReason: z.string().max(180).optional() })).mutation(async ({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial"]); const evidence = await getLeadTransitionEvidence(input.id); try { validateCommercialTransition(input.commercialStatus, input.nextAction, { ...evidence, lossReason: input.discardedReason }); } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : String(error) }); } return updateLeadCommercialStatus(input.id, input.commercialStatus, input.nextAction, input.nextActionAt, input.discardedReason); }),
  }),
  companies: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listCompanies(input?.search)),
    create: protectedProcedure.input(z.object({ cnpj: cnpjSchema, legalName: z.string().min(2), tradeName: z.string().optional(), city: z.string().optional(), state: z.string().length(2).optional(), segment: z.string().optional() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial", "technical"]); return createCompany({ ...input, city: normalizeMunicipalityValue(input.city) || undefined, source: "manual" }); }),
    bulkUpsert: protectedProcedure.input(z.object({ filename: z.string().optional(), source: z.string().default("import"), rows: z.array(z.object({ cnpj: z.string(), legalName: z.string(), tradeName: z.string().optional(), city: z.string().optional(), state: z.string().optional(), segment: z.string().optional(), source: z.string().optional() })).max(1000) })).mutation(async ({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); const runId = await createImportRun({ source: input.source, filename: input.filename, createdBy: ctx.user.id }); try { const result = await bulkUpsertCompanies(input.rows); await finishImportRun(runId, { ...result, status: result.rejected > 0 ? "review_required" : "completed" }); return { ...result, runId }; } catch (error) { const errorMessage = error instanceof Error ? error.message : String(error); await finishImportRun(runId, { received: input.rows.length, inserted: 0, updated: 0, rejected: input.rows.length, status: "failed", errorMessage }); await createImportFailureNotification(ctx.user.id, runId, errorMessage); throw error; } }),
  }),
  units: router({
    list: protectedProcedure.input(z.object({ companyId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); return listUnits(input?.companyId); }),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), name: z.string().min(2), address: z.string().optional(), city: z.string().optional(), state: z.string().length(2).optional(), operationType: z.string().optional(), responsibleName: z.string().optional() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); return createUnit({ ...input, city: normalizeMunicipalityValue(input.city) || undefined }); }),
  }),
  contacts: router({
    list: protectedProcedure.input(z.object({ companyId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial", "technical"]); return listContacts(input?.companyId); }),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), unitId: z.number().int().positive().optional(), name: z.string().min(2), jobTitle: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional(), decisionRole: z.string().optional() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial", "technical"]); return createContact({ ...input, phone: normalizePhoneValue(input.phone) || undefined, email: normalizeEmailValue(input.email) }); }),
  }),
  cnpj: router({
    lookup: protectedProcedure.input(z.object({ cnpj: z.string() })).query(({ input }) => lookupCnpj(input.cnpj)),
  }),
  imports: router({
    capabilities: protectedProcedure.query(() => ({ cnpj: "provider-ready", cetesb: "controlled-public-source", spAguas: "controlled-public-source" })),
    history: protectedProcedure.query(({ ctx }) => { requireProfile(ctx, ["admin", "technical"]); return listImportRuns(); }),
    pendingConflicts: protectedProcedure.input(z.object({ importRunId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); return listPendingImportConflicts(input?.importRunId); }),
    decideConflict: protectedProcedure.input(z.object({ id: z.number().int().positive(), decision: z.enum(["accept_incoming", "keep_current", "accept_partial", "review", "reject"]), rationale: z.string().max(500).optional() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); return decideImportConflict(input.id, ctx.user.id, input.decision, input.rationale); }),
  }),
  regulatory: router({
    list: protectedProcedure.query(({ ctx }) => { requireProfile(ctx, ["admin", "technical", "commercial"]); return listRegulatoryActs(); }),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), source: z.string().min(2), agency: z.string().optional(), actType: z.string().min(2), actNumber: z.string().optional(), processNumber: z.string().optional(), publishedStatus: z.string().optional(), expiresAt: z.date().optional(), evidenceUrl: z.string().url().optional(), notes: z.string().optional() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); return createRegulatoryAct({ ...normalizePersistedDates(input, ["expiresAt"]), needsValidation: 1, collectedAt: new Date() }); }),
  }),
  evidence: router({
    list: protectedProcedure.input(z.object({ regulatoryActId: z.number().int().positive().optional(), companyId: z.number().int().positive().optional() })).query(({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); return listEvidenceFiles(input); }),
    upload: protectedProcedure.input(z.object({ filename: z.string().min(1).max(255), mimeType: z.string().min(1).max(120), base64: z.string().max(7_000_000), companyId: z.number().int().positive().optional(), unitId: z.number().int().positive().optional(), regulatoryActId: z.number().int().positive().optional(), opportunityId: z.number().int().positive().optional(), source: z.string().default("manual"), notes: z.string().optional() })).mutation(async ({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); const buffer = Buffer.from(input.base64, "base64"); if (buffer.byteLength > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Evidências devem ter no máximo 5 MB." }); const stored = await storagePut(`evidence/${ctx.user.id}/${input.filename}`, buffer, input.mimeType); const { base64: _base64, ...metadata } = input; return createEvidenceFile({ ...metadata, sizeBytes: buffer.byteLength, storageKey: stored.key, storageUrl: stored.url, uploadedBy: ctx.user.id, collectedAt: new Date() }); }),
  }),
  opportunities: router({
    list: protectedProcedure.query(() => listOpportunities()),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), title: z.string().min(2), serviceType: z.string().min(2), source: z.string().optional(), technicalPriority: z.enum(["A", "B", "C", "D"]).default("C"), commercialPriority: z.enum(["A", "B", "C", "D"]).default("B"), estimatedValue: z.string().optional(), criticalDate: z.date().optional(), nextAction: z.string().optional(), nextActionAt: z.date().optional() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial"]); return createOpportunity({ ...normalizePersistedDates(input, ["criticalDate", "nextActionAt"]), ownerId: ctx.user.id, probability: 20 }); }),
    updateStage: protectedProcedure.input(z.object({ id: z.number().int().positive(), stage: z.enum(["new", "enrichment", "actionable", "contacted", "qualified", "diagnosis", "scoping", "proposal", "negotiation", "approved", "won", "lost", "nurture", "discarded"]) })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial"]); return updateOpportunityStage(input.id, input.stage); }),
  }),
  activities: router({
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), opportunityId: z.number().int().positive().optional(), channel: z.string().min(2), objective: z.string().optional(), outcome: z.string().optional(), nextAction: z.string().optional(), nextActionAt: z.date().optional() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "commercial", "technical"]); return createActivity({ ...normalizePersistedDates(input, ["nextActionAt"]), ownerId: ctx.user.id }); }),
  }),
  recurring: router({
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), title: z.string().min(2), recurrenceType: z.string().min(2), dueAt: z.date(), regulatoryActId: z.number().int().positive().optional() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); return createRecurringItem({ ...normalizePersistedDates(input, ["dueAt"]), ownerId: ctx.user.id }); }),
    complete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => { requireProfile(ctx, ["admin", "technical"]); return completeRecurringItem(input.id, ctx.user.id); }),
  }),
});

export type AppRouter = typeof appRouter;
