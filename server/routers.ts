import { z } from "zod";
import { normalizeCnpj } from "../shared/crmRules";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { bulkUpsertCompanies, createActivity, createCompany, createContact, createImportRun, createOpportunity, createRecurringItem, createUnit, finishImportRun, getDashboardStats, listCompanies, listContacts, listNotifications, listOpportunities, listRecentActivities, listRegulatoryActs, listUpcomingRecurring, listUnits, markNotificationRead, updateOpportunityStage } from "./db";
import { lookupCnpj } from "./integrations/cnpj";

const cnpjSchema = z.string().transform(normalizeCnpj).refine((value) => value.length === 14, "CNPJ deve conter 14 dígitos");

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
    activities: protectedProcedure.query(() => listRecentActivities()),
    recurring: protectedProcedure.query(() => listUpcomingRecurring()),
  }),
  companies: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listCompanies(input?.search)),
    create: protectedProcedure.input(z.object({ cnpj: cnpjSchema, legalName: z.string().min(2), tradeName: z.string().optional(), city: z.string().optional(), state: z.string().length(2).optional(), segment: z.string().optional() })).mutation(({ input }) => createCompany({ ...input, source: "manual" })),
    bulkUpsert: protectedProcedure.input(z.object({ filename: z.string().optional(), source: z.string().default("import"), rows: z.array(z.object({ cnpj: z.string(), legalName: z.string(), tradeName: z.string().optional(), city: z.string().optional(), state: z.string().optional(), segment: z.string().optional(), source: z.string().optional() })).max(1000) })).mutation(async ({ ctx, input }) => { const runId = await createImportRun({ source: input.source, filename: input.filename, createdBy: ctx.user.id }); try { const result = await bulkUpsertCompanies(input.rows); await finishImportRun(runId, { ...result, status: result.rejected > 0 ? "review_required" : "completed" }); return { ...result, runId }; } catch (error) { await finishImportRun(runId, { received: input.rows.length, inserted: 0, updated: 0, rejected: input.rows.length, status: "failed", errorMessage: error instanceof Error ? error.message : String(error) }); throw error; } }),
  }),
  units: router({
    list: protectedProcedure.input(z.object({ companyId: z.number().int().positive().optional() }).optional()).query(({ input }) => listUnits(input?.companyId)),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), name: z.string().min(2), address: z.string().optional(), city: z.string().optional(), state: z.string().length(2).optional(), operationType: z.string().optional(), responsibleName: z.string().optional() })).mutation(({ input }) => createUnit(input)),
  }),
  contacts: router({
    list: protectedProcedure.input(z.object({ companyId: z.number().int().positive().optional() }).optional()).query(({ input }) => listContacts(input?.companyId)),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), unitId: z.number().int().positive().optional(), name: z.string().min(2), jobTitle: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional(), decisionRole: z.string().optional() })).mutation(({ input }) => createContact(input)),
  }),
  cnpj: router({
    lookup: protectedProcedure.input(z.object({ cnpj: z.string() })).query(({ input }) => lookupCnpj(input.cnpj)),
  }),
  imports: router({
    capabilities: protectedProcedure.query(() => ({ cnpj: "provider-ready", cetesb: "controlled-public-source", spAguas: "controlled-public-source" })),
  }),
  regulatory: router({
    list: protectedProcedure.query(() => listRegulatoryActs()),
  }),
  opportunities: router({
    list: protectedProcedure.query(() => listOpportunities()),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), title: z.string().min(2), serviceType: z.string().min(2), source: z.string().optional(), technicalPriority: z.enum(["A", "B", "C", "D"]).default("C"), commercialPriority: z.enum(["A", "B", "C", "D"]).default("B"), estimatedValue: z.string().optional(), criticalDate: z.date().optional(), nextAction: z.string().optional(), nextActionAt: z.date().optional() })).mutation(({ ctx, input }) => createOpportunity({ ...input, ownerId: ctx.user.id, probability: 20 })),
    updateStage: protectedProcedure.input(z.object({ id: z.number().int().positive(), stage: z.enum(["new", "enrichment", "actionable", "contacted", "qualified", "diagnosis", "scoping", "proposal", "negotiation", "approved", "won", "lost", "nurture", "discarded"]) })).mutation(({ input }) => updateOpportunityStage(input.id, input.stage)),
  }),
  activities: router({
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), opportunityId: z.number().int().positive().optional(), channel: z.string().min(2), objective: z.string().optional(), outcome: z.string().optional(), nextAction: z.string().optional(), nextActionAt: z.date().optional() })).mutation(({ ctx, input }) => createActivity({ ...input, ownerId: ctx.user.id })),
  }),
  recurring: router({
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), title: z.string().min(2), recurrenceType: z.string().min(2), dueAt: z.date(), regulatoryActId: z.number().int().positive().optional() })).mutation(({ ctx, input }) => createRecurringItem({ ...input, ownerId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
