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
  importStaging,
  raizonProfiles,
  serviceCatalog,
  proposals,
  proposalSequences,
  executionProjects,
  projectTasks,
  projectChecklist,
  projectEvidence,
  intelligenceSuggestions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { normalizeRegulatoryStatus, shouldCreateOpenNotification } from "../shared/crmRules";
import { onlyActive, onlyActiveBy } from "../shared/archiveRules";
import { buildBlockedSourceAttempt } from "../shared/sourceReadiness";
import { validateProposalTransition, buildProposalSourceMap, canCreateProposalFromOpportunity, type ProposalStatus } from "../shared/proposalRules";
import { canTransitionExecution, canCloseExecution, type ExecutionStatus } from "../shared/executionRules";
import { calculateCommercialMetrics, isEligibleForProposalFollowUp } from "../shared/intelligenceRules";
import { buildCompanyImportPreviewCandidate, compareCompanyImportCandidate, type ImportRow } from "../shared/importRules";

let _db: ReturnType<typeof drizzle> | null = null;

const MAX_TRANSACTION_ATTEMPTS = 3;

export function isRetryableTransactionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /write conflict|deadlock|pessimistic lock not found|try again later|lazyuniquenesscheckfailure/i.test(message);
}

function isDuplicateKeyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /duplicate|unique|er_dup_entry|1062/i.test(message);
}

export async function withTransactionRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableTransactionError(error) || attempt === MAX_TRANSACTION_ATTEMPTS) throw error;
    }
  }
  throw lastError;
}

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

export async function getRaizonProfile() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(raizonProfiles).where(eq(raizonProfiles.profileKey, "default")).limit(1);
  return rows[0] ?? null;
}

export async function upsertRaizonProfile(input: Omit<typeof raizonProfiles.$inferInsert, "id" | "profileKey" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(raizonProfiles).values({ profileKey: "default", ...input }).onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
  return getRaizonProfile();
}

export async function listServiceCatalog(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(serviceCatalog).where(includeInactive ? undefined : eq(serviceCatalog.isActive, 1)).orderBy(asc(serviceCatalog.name));
  return rows;
}

export async function createServiceCatalogItem(input: typeof serviceCatalog.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(serviceCatalog).values(input);
  return Number(result[0].insertId);
}

export async function updateServiceCatalogItem(id: number, input: Partial<typeof serviceCatalog.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(serviceCatalog).set({ ...input, updatedAt: new Date() }).where(eq(serviceCatalog.id, id));
  return { success: true } as const;
}

export async function archiveServiceCatalogItem(id: number) {
  return updateServiceCatalogItem(id, { isActive: 0 });
}

export async function listProposals() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ proposal: proposals, company: { id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName }, service: { id: serviceCatalog.id, name: serviceCatalog.name, category: serviceCatalog.category } })
    .from(proposals)
    .leftJoin(companies, eq(proposals.companyId, companies.id))
    .leftJoin(serviceCatalog, eq(proposals.serviceId, serviceCatalog.id))
    .orderBy(desc(proposals.updatedAt));
}

export async function createProposalFromRefs(input: { opportunityId: number; companyId: number; unitId?: number; contactId?: number; serviceId: number; ownerId: number; professional?: string; investment: string; paymentTerms?: string; validityDays?: number; visitsIncluded?: number; missingInformation?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [opportunity] = await tx.select().from(opportunities).where(eq(opportunities.id, input.opportunityId)).limit(1).for("update");
    const [company] = await tx.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
    const [service] = await tx.select().from(serviceCatalog).where(and(eq(serviceCatalog.id, input.serviceId), eq(serviceCatalog.isActive, 1))).limit(1);
    if (!company || !opportunity || !service) throw new Error("Empresa, oportunidade ou serviço não encontrado.");
    if (opportunity.companyId !== company.id) throw new Error("A oportunidade não pertence à empresa selecionada.");
    if (!canCreateProposalFromOpportunity(opportunity.stage)) throw new Error("A oportunidade precisa estar em proposta ou em uma etapa posterior antes de criar o rascunho.");
    if (input.unitId) { const [unit] = await tx.select({ id: units.id }).from(units).where(and(eq(units.id, input.unitId), eq(units.companyId, company.id))).limit(1); if (!unit) throw new Error("A unidade selecionada não pertence à empresa."); }
    if (input.contactId) { const [contact] = await tx.select({ id: contacts.id }).from(contacts).where(and(eq(contacts.id, input.contactId), eq(contacts.companyId, company.id))).limit(1); if (!contact) throw new Error("O contato selecionado não pertence à empresa."); }
    const clientSnapshot = JSON.stringify({ id: company.id, cnpj: company.cnpj, legalName: company.legalName, tradeName: company.tradeName, address: company.address, addressNumber: company.addressNumber, city: company.city, state: company.state });
    const professional = input.professional?.trim() || undefined;
    const serviceSnapshot = JSON.stringify({ id: service.id, name: service.name, category: service.category, agency: service.agency, state: service.state, summary: service.summary });
    const [latest] = await tx.select({ version: proposals.version, proposalNumber: proposals.proposalNumber }).from(proposals).where(eq(proposals.seriesKey, `opportunity:${input.opportunityId}`)).orderBy(desc(proposals.version)).limit(1);
    const result = await tx.insert(proposals).values({ seriesKey: `opportunity:${input.opportunityId}`, version: (latest?.version ?? 0) + 1, proposalNumber: latest?.proposalNumber ?? undefined, opportunityId: input.opportunityId, companyId: input.companyId, unitId: input.unitId, contactId: input.contactId, serviceId: input.serviceId, ownerId: input.ownerId, professional, clientSnapshot, serviceSnapshot, scopeSnapshot: service.scope, deliverablesSnapshot: service.deliverables, assumptionsSnapshot: service.assumptions, exclusionsSnapshot: service.exclusions, requiredDocumentsSnapshot: service.requiredDocuments, investment: input.investment, paymentTerms: input.paymentTerms, validityDays: input.validityDays ?? 20, visitsIncluded: input.visitsIncluded ?? service.defaultVisits, missingInformation: input.missingInformation, sourceMap: JSON.stringify(buildProposalSourceMap()), notes: input.notes });
    return Number(result[0].insertId);
  }));
}

export async function updateProposalDetails(id: number, input: Partial<typeof proposals.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [current] = await tx.select({ id: proposals.id, status: proposals.status }).from(proposals).where(eq(proposals.id, id)).limit(1).for("update");
    if (!current) throw new Error("Proposta não encontrada.");
    if (!["draft", "technical_review", "commercial_review"].includes(current.status)) throw new Error("A proposta não pode ser alterada após aprovação interna, emissão ou aceite. Crie uma nova versão para revisar o conteúdo.");
    const [project] = await tx.select({ id: executionProjects.id }).from(executionProjects).where(eq(executionProjects.proposalId, id)).limit(1);
    if (project) throw new Error("A proposta está vinculada a um projeto de execução e não pode ser alterada. Crie uma nova versão para revisar o conteúdo.");
    await tx.update(proposals).set({ ...input, updatedAt: new Date() }).where(eq(proposals.id, id));
    return { success: true } as const;
  }));
}

export async function updateProposalStatus(id: number, status: ProposalStatus, reviewedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [current] = await tx.select().from(proposals).where(eq(proposals.id, id)).limit(1).for("update");
    if (!current) throw new Error("Proposta não encontrada.");
    if (current.status !== status) {
      validateProposalTransition(current.status, status, Number(current.investment) > 0 && Boolean(current.scopeSnapshot && current.deliverablesSnapshot));
      await tx.update(proposals).set({ status, reviewedBy, updatedAt: new Date() }).where(eq(proposals.id, id));
    }

    if (status !== "accepted") return { success: true, executionProjectId: null, alreadyApplied: current.status === status } as const;

    const [existing] = await tx.select({ id: executionProjects.id }).from(executionProjects).where(eq(executionProjects.proposalId, current.id)).limit(1);
    if (existing) return { success: true, executionProjectId: existing.id, alreadyApplied: true } as const;

    const title = `Execução — ${current.proposalNumber || `Proposta #${current.id}`}`;
    const inserted = await tx.insert(executionProjects).values({ proposalId: current.id, opportunityId: current.opportunityId, companyId: current.companyId, ownerId: reviewedBy, title, scopeSnapshot: current.scopeSnapshot, deliverablesSnapshot: current.deliverablesSnapshot, assumptionsSnapshot: current.assumptionsSnapshot ?? undefined, exclusionsSnapshot: current.exclusionsSnapshot ?? undefined, requiredDocumentsSnapshot: current.requiredDocumentsSnapshot ?? undefined }).$returningId();
    const projectId = Number(inserted[0]?.id);
    if (!Number.isInteger(projectId) || projectId <= 0) throw new Error("Não foi possível obter o identificador do projeto de execução criado.");
    const documents = String(current.requiredDocumentsSnapshot || "").split(/\r?\n|[,;]+/).map((item) => item.trim()).filter(Boolean);
    if (documents.length) await tx.insert(projectChecklist).values(documents.map((title) => ({ projectId, title, required: 1, ownerId: reviewedBy })));
    return { success: true, executionProjectId: projectId, alreadyApplied: false } as const;
  }));
}

export async function createProposalVersion(id: number, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [requested] = await tx.select({ opportunityId: proposals.opportunityId }).from(proposals).where(eq(proposals.id, id)).limit(1);
    if (!requested) throw new Error("Proposta não encontrada.");
    await tx.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.id, requested.opportunityId)).limit(1).for("update");
    const [current] = await tx.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    if (!current) throw new Error("Proposta não encontrada.");
    const [latest] = await tx.select({ version: proposals.version }).from(proposals).where(eq(proposals.seriesKey, current.seriesKey)).orderBy(desc(proposals.version)).limit(1);
    const result = await tx.insert(proposals).values({ seriesKey: current.seriesKey, version: (latest?.version ?? 0) + 1, proposalNumber: current.proposalNumber, opportunityId: current.opportunityId, companyId: current.companyId, unitId: current.unitId ?? undefined, contactId: current.contactId ?? undefined, serviceId: current.serviceId, ownerId, professional: current.professional ?? undefined, status: "draft", clientSnapshot: current.clientSnapshot, serviceSnapshot: current.serviceSnapshot, scopeSnapshot: current.scopeSnapshot, deliverablesSnapshot: current.deliverablesSnapshot, assumptionsSnapshot: current.assumptionsSnapshot ?? undefined, exclusionsSnapshot: current.exclusionsSnapshot ?? undefined, requiredDocumentsSnapshot: current.requiredDocumentsSnapshot ?? undefined, investment: current.investment, paymentTerms: current.paymentTerms ?? undefined, validityDays: current.validityDays, visitsIncluded: current.visitsIncluded, missingInformation: current.missingInformation ?? undefined, sourceMap: current.sourceMap ?? undefined, notes: current.notes ?? undefined });
    return Number(result[0].insertId);
  }));
}

export async function issueProposal(id: number, reviewedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [current] = await tx.select().from(proposals).where(eq(proposals.id, id)).limit(1).for("update");
    if (!current) throw new Error("Proposta não encontrada.");
    if (current.status !== "approved_internal") throw new Error("A proposta precisa estar aprovada internamente antes da emissão.");
    let proposalNumber = current.proposalNumber;
    if (!proposalNumber) {
      const year = new Date().getFullYear();
      await tx.insert(proposalSequences).values({ year, nextNumber: 2 }).onDuplicateKeyUpdate({ set: { nextNumber: sql`${proposalSequences.nextNumber} + 1` } });
      const [sequence] = await tx.select().from(proposalSequences).where(eq(proposalSequences.year, year)).limit(1);
      const number = Math.max(Number(sequence?.nextNumber ?? 2) - 1, 1);
      proposalNumber = `${String(number).padStart(3, "0")}/${year}`;
    }
    await tx.update(proposals).set({ proposalNumber, status: "issued", reviewedBy, issuedAt: new Date(), updatedAt: new Date() }).where(eq(proposals.id, id));
    return { proposalNumber, version: current.version };
  }));
}

export async function listExecutionProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ project: executionProjects, company: { id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName }, proposal: { id: proposals.id, proposalNumber: proposals.proposalNumber, version: proposals.version } })
    .from(executionProjects)
    .leftJoin(companies, eq(executionProjects.companyId, companies.id))
    .leftJoin(proposals, eq(executionProjects.proposalId, proposals.id))
    .orderBy(desc(executionProjects.updatedAt)).limit(100);
}

export async function getExecutionProjectDetails(projectId: number) {
  const db = await getDb();
  if (!db) return { project: null, tasks: [], checklist: [] };
  const [projectRow] = await db.select({ project: executionProjects, company: { id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName }, proposal: { id: proposals.id, proposalNumber: proposals.proposalNumber, version: proposals.version } }).from(executionProjects).leftJoin(companies, eq(executionProjects.companyId, companies.id)).leftJoin(proposals, eq(executionProjects.proposalId, proposals.id)).where(eq(executionProjects.id, projectId)).limit(1);
  const tasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId)).orderBy(desc(projectTasks.createdAt));
  const checklist = await db.select().from(projectChecklist).where(eq(projectChecklist.projectId, projectId)).orderBy(desc(projectChecklist.createdAt));
  return { project: projectRow || null, tasks, checklist };
}

export async function createExecutionProjectFromProposal(input: { proposalId: number; ownerId: number; title?: string; startAt?: Date; dueAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  try {
    return await withTransactionRetry(() => db.transaction(async (tx) => {
      const [proposal] = await tx.select().from(proposals).where(eq(proposals.id, input.proposalId)).limit(1).for("update");
      if (!proposal) throw new Error("Proposta não encontrada.");
      if (proposal.status !== "accepted") throw new Error("Somente propostas aceitas pelo cliente podem iniciar uma execução.");
      const [existing] = await tx.select({ id: executionProjects.id }).from(executionProjects).where(eq(executionProjects.proposalId, input.proposalId)).limit(1);
      if (existing) return existing.id;
      const title = input.title?.trim() || `Execução — ${proposal.proposalNumber || `Proposta #${proposal.id}`}`;
      const inserted = await tx.insert(executionProjects).values({ proposalId: proposal.id, opportunityId: proposal.opportunityId, companyId: proposal.companyId, ownerId: input.ownerId, title, scopeSnapshot: proposal.scopeSnapshot, deliverablesSnapshot: proposal.deliverablesSnapshot, assumptionsSnapshot: proposal.assumptionsSnapshot ?? undefined, exclusionsSnapshot: proposal.exclusionsSnapshot ?? undefined, requiredDocumentsSnapshot: proposal.requiredDocumentsSnapshot ?? undefined, startAt: input.startAt, dueAt: input.dueAt }).$returningId();
      const projectId = Number(inserted[0]?.id);
      const documents = String(proposal.requiredDocumentsSnapshot || "").split(/\r?\n|[,;]+/).map((item) => item.trim()).filter(Boolean);
      if (documents.length) await tx.insert(projectChecklist).values(documents.map((title) => ({ projectId, title, required: 1, ownerId: input.ownerId })));
      return projectId;
    }));
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const [existing] = await db.select({ id: executionProjects.id }).from(executionProjects).where(eq(executionProjects.proposalId, input.proposalId)).limit(1);
    if (existing) return existing.id;
    throw error;
  }
}

export async function updateExecutionProjectStatus(id: number, status: string, acceptanceNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [current] = await tx.select().from(executionProjects).where(eq(executionProjects.id, id)).limit(1).for("update");
    if (!current) throw new Error("Projeto de execução não encontrado.");
    if (!canTransitionExecution(current.status, status as ExecutionStatus)) throw new Error(`Transição de execução inválida: ${current.status} → ${status}.`);
    if (status === "closed") {
      const checklist = await tx.select({ required: projectChecklist.required, status: projectChecklist.status }).from(projectChecklist).where(eq(projectChecklist.projectId, id)).for("update");
      if (!canCloseExecution("accepted", checklist)) throw new Error("Não é possível encerrar enquanto houver documentos obrigatórios pendentes.");
    }
    const now = new Date();
    await tx.update(executionProjects).set({ status: status as any, acceptanceNotes: acceptanceNotes ?? current.acceptanceNotes, deliveredAt: status === "delivered" ? now : current.deliveredAt, acceptedAt: status === "accepted" ? now : current.acceptedAt, closedAt: status === "closed" ? now : current.closedAt, updatedAt: now }).where(eq(executionProjects.id, id));
    return { success: true } as const;
  }));
}

export async function createProjectTask(input: { projectId: number; title: string; category?: string; ownerId?: number; dueAt?: Date; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [project] = await tx.select({ id: executionProjects.id, status: executionProjects.status }).from(executionProjects).where(eq(executionProjects.id, input.projectId)).limit(1).for("update");
    if (!project) throw new Error("Projeto de execução não encontrado.");
    if (["closed", "cancelled"].includes(project.status)) throw new Error("Não é possível criar tarefas em projeto encerrado ou cancelado.");
    const inserted = await tx.insert(projectTasks).values({ ...input, category: input.category || "technical" }).$returningId();
    return Number(inserted[0]?.id);
  }));
}

export async function updateProjectTaskStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [task] = await tx.select({ id: projectTasks.id, projectId: projectTasks.projectId }).from(projectTasks).where(eq(projectTasks.id, id)).limit(1).for("update");
    if (!task) throw new Error("Tarefa de execução não encontrada.");
    const [project] = await tx.select({ id: executionProjects.id, status: executionProjects.status }).from(executionProjects).where(eq(executionProjects.id, task.projectId)).limit(1).for("update");
    if (!project) throw new Error("Projeto de execução não encontrado.");
    if (["closed", "cancelled"].includes(project.status)) throw new Error("Não é possível alterar tarefas em projeto encerrado ou cancelado.");
    const completedAt = status === "done" ? new Date() : undefined;
    await tx.update(projectTasks).set({ status: status as any, completedAt, updatedAt: new Date() }).where(eq(projectTasks.id, id));
    return { success: true } as const;
  }));
}

export async function listProjectEvidence(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectEvidence).where(eq(projectEvidence.projectId, projectId)).orderBy(desc(projectEvidence.createdAt));
}

export async function createProjectEvidence(input: { projectId: number; taskId?: number; title: string; fileName: string; mimeType: string; fileKey: string; fileUrl: string; uploadedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const [project] = await tx.select({ id: executionProjects.id }).from(executionProjects).where(eq(executionProjects.id, input.projectId)).limit(1);
    if (!project) throw new Error("Projeto de execução não encontrado.");
    if (input.taskId) {
      const [task] = await tx.select({ id: projectTasks.id }).from(projectTasks).where(and(eq(projectTasks.id, input.taskId), eq(projectTasks.projectId, input.projectId))).limit(1);
      if (!task) throw new Error("A tarefa informada não pertence ao projeto de execução.");
    }
    const inserted = await tx.insert(projectEvidence).values(input).$returningId();
    return Number(inserted[0]?.id);
  });
}

export async function updateProjectChecklistStatus(id: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const [item] = await tx.select({ id: projectChecklist.id, projectId: projectChecklist.projectId }).from(projectChecklist).where(eq(projectChecklist.id, id)).limit(1).for("update");
    if (!item) throw new Error("Item de checklist não encontrado.");
    const [project] = await tx.select({ id: executionProjects.id, status: executionProjects.status }).from(executionProjects).where(eq(executionProjects.id, item.projectId)).limit(1).for("update");
    if (!project) throw new Error("Projeto de execução não encontrado.");
    if (["closed", "cancelled"].includes(project.status)) throw new Error("Não é possível alterar checklist em projeto encerrado ou cancelado.");
    await tx.update(projectChecklist).set({ status: status as any, notes, updatedAt: new Date() }).where(eq(projectChecklist.id, id));
    return { success: true } as const;
  }));
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
    if (shouldCreateOpenNotification(exists.length)) { const severity = act.expiresAt && act.expiresAt <= new Date(Date.now() + 30 * 86400000) ? "critical" : "warning"; await db.insert(notifications).values({ userId, type: "regulatory_expiry", severity, groupingKey: `regulatory_act:${act.id}`, title: "Ato regulatório próximo do vencimento", body: `Verifique o ato vinculado à empresa ${act.companyId}.`, entityType: "regulatory_act", entityId: act.id }); created++; }
  }
  const stalled = await db.select({ id: opportunities.id, companyId: opportunities.companyId, title: opportunities.title }).from(opportunities).where(and(sql`${opportunities.stage} not in ('won','lost','discarded')`, or(isNull(opportunities.nextActionAt), lt(opportunities.nextActionAt, sql`date_sub(now(), interval 14 day)`)))).limit(100);
  for (const opportunity of stalled) {
    const exists = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.type, "stalled_opportunity"), eq(notifications.entityId, opportunity.id), isNull(notifications.readAt))).limit(1);
    if (shouldCreateOpenNotification(exists.length)) { await db.insert(notifications).values({ userId, type: "stalled_opportunity", severity: "warning", groupingKey: `opportunity:${opportunity.id}`, title: "Oportunidade sem avanço", body: `${opportunity.title} não possui próxima ação recente.`, entityType: "opportunity", entityId: opportunity.id }); created++; }
  }
  for (const item of overdue) {
    const exists = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.type, "overdue_activity"), eq(notifications.entityId, item.id), isNull(notifications.readAt))).limit(1);
    if (shouldCreateOpenNotification(exists.length)) { await db.insert(notifications).values({ userId, type: "overdue_activity", severity: "critical", groupingKey: `activity:${item.id}`, title: "Atividade atrasada", body: `Existe uma próxima ação vencida para a empresa ${item.companyId}.`, entityType: "activity", entityId: item.id }); created++; }
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

export async function getIntelligenceRadar() {
  const db = await getDb();
  if (!db) return { regulatory: [], recurring: [], overdueActivities: [], staleOpportunities: [] };
  const now = new Date();
  const next90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const staleSince = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const [regulatory, recurring, overdueActivities, staleOpportunities] = await Promise.all([
    db.select({ act: regulatoryActs, company: { id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName } }).from(regulatoryActs).leftJoin(companies, eq(regulatoryActs.companyId, companies.id)).where(and(isNull(regulatoryActs.archivedAt), isNotNull(regulatoryActs.expiresAt), lte(regulatoryActs.expiresAt, next90Days))).orderBy(asc(regulatoryActs.expiresAt)).limit(25),
    db.select({ item: recurringItems, company: { id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName } }).from(recurringItems).leftJoin(companies, eq(recurringItems.companyId, companies.id)).where(and(eq(recurringItems.status, "open"), lte(recurringItems.dueAt, next90Days))).orderBy(asc(recurringItems.dueAt)).limit(25),
    db.select({ activity: activities, company: { id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName }, opportunity: { id: opportunities.id, title: opportunities.title } }).from(activities).leftJoin(companies, eq(activities.companyId, companies.id)).leftJoin(opportunities, eq(activities.opportunityId, opportunities.id)).where(and(isNotNull(activities.nextActionAt), lt(activities.nextActionAt, now))).orderBy(asc(activities.nextActionAt)).limit(25),
    db.select({ opportunity: opportunities, company: { id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName } }).from(opportunities).leftJoin(companies, eq(opportunities.companyId, companies.id)).where(and(sql`${opportunities.stage} not in ('won','lost','discarded')`, lt(opportunities.updatedAt, staleSince))).orderBy(asc(opportunities.updatedAt)).limit(25),
  ]);
  return { regulatory, recurring, overdueActivities, staleOpportunities };
}

export async function getCommercialMetrics() {
  const db = await getDb();
  if (!db) return { proposalsThisMonth: 0, proposedValueThisMonth: 0, closedValueThisMonth: 0, conversionRate: 0, averageTicket: 0, averageCycleDays: 0, lossReasons: [] };
  const [proposalRows, opportunityRows] = await Promise.all([db.select().from(proposals), db.select().from(opportunities)]);
  return calculateCommercialMetrics(proposalRows, opportunityRows);
}

export async function recordRegulatoryValidation(input: { regulatoryActId: number; sourceVersion?: string; publishedStatus?: string; expiresAt?: Date; evidenceUrl?: string; rawEssential: string; confidence: number; validationStatus: "unverified" | "confirmed" | "needs_review"; validatedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [act] = await db.select().from(regulatoryActs).where(eq(regulatoryActs.id, input.regulatoryActId)).limit(1);
  if (!act) throw new Error("Ato regulatório não encontrado.");
  const fingerprint = createHash("sha256").update(JSON.stringify({ regulatoryActId: input.regulatoryActId, sourceVersion: input.sourceVersion || null, publishedStatus: input.publishedStatus || null, expiresAt: input.expiresAt?.toISOString() || null, evidenceUrl: input.evidenceUrl || null, rawEssential: input.rawEssential.trim() })).digest("hex");
  const [existing] = await db.select({ id: regulatoryVersions.id }).from(regulatoryVersions).where(and(eq(regulatoryVersions.regulatoryActId, input.regulatoryActId), eq(regulatoryVersions.payloadFingerprint, fingerprint))).limit(1);
  if (existing) return { id: existing.id, created: false } as const;
  const result = await db.insert(regulatoryVersions).values({ regulatoryActId: input.regulatoryActId, sourceVersion: input.sourceVersion, payloadFingerprint: fingerprint, publishedStatus: input.publishedStatus, expiresAt: input.expiresAt, evidenceUrl: input.evidenceUrl, rawEssential: input.rawEssential.trim(), confidence: input.confidence.toFixed(2), validationStatus: input.validationStatus, validatedBy: input.validatedBy, collectedAt: new Date() });
  await db.update(regulatoryActs).set({ publishedStatus: input.publishedStatus, expiresAt: input.expiresAt, evidenceUrl: input.evidenceUrl, sourceVersion: input.sourceVersion, collectedAt: new Date(), rawFingerprint: fingerprint, needsValidation: input.validationStatus === "confirmed" ? 0 : 1, updatedAt: new Date() }).where(eq(regulatoryActs.id, input.regulatoryActId));
  return { id: Number(result[0].insertId), created: true } as const;
}

export async function runProposalFollowUps() {
  const db = await getDb();
  if (!db) return { scanned: 0, created: 0, skipped: 0 };
  const candidates = (await db.select().from(proposals).where(or(eq(proposals.status, "sent"), eq(proposals.status, "negotiating"))).limit(100)).filter((proposal) => isEligibleForProposalFollowUp(proposal));
  let created = 0;
  let skipped = 0;
  for (const proposal of candidates) {
    const objective = `auto_followup:proposal:${proposal.id}`;
    const existing = await db.select({ id: activities.id }).from(activities).where(and(eq(activities.opportunityId, proposal.opportunityId), eq(activities.objective, objective))).limit(1);
    if (existing.length) { skipped++; continue; }
    const followUpAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    try {
      await db.insert(activities).values({ companyId: proposal.companyId, opportunityId: proposal.opportunityId, ownerId: proposal.ownerId, channel: "automação", objective, automationKey: objective, outcome: "Follow-up criado automaticamente após envio da proposta; intervenção humana necessária.", nextAction: "Confirmar recebimento e obter retorno da proposta", nextActionAt: followUpAt, happenedAt: new Date() });
    } catch (error) {
      if (String(error).toLowerCase().includes("duplicate") || String(error).toLowerCase().includes("unique")) { skipped++; continue; }
      throw error;
    }
    if (proposal.ownerId) {
      const groupingKey = `proposal_followup:${proposal.id}`;
      const alreadyNotified = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, proposal.ownerId), eq(notifications.groupingKey, groupingKey))).limit(1);
      if (!alreadyNotified.length) await db.insert(notifications).values({ userId: proposal.ownerId, type: "proposal_followup", severity: "info", groupingKey, title: "Follow-up de proposta criado", body: `A proposta ${proposal.proposalNumber || `#${proposal.id}`} está sem retorno registrado.`, entityType: "proposal", entityId: proposal.id });
    }
    created++;
  }
  return { scanned: candidates.length, created, skipped };
}

export async function listIntelligenceSuggestions(status?: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(intelligenceSuggestions).where(status ? eq(intelligenceSuggestions.status, status) : undefined).orderBy(desc(intelligenceSuggestions.createdAt)).limit(50);
}

export async function createIntelligenceSuggestion(input: typeof intelligenceSuggestions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(intelligenceSuggestions).values(input);
  return Number(result[0].insertId);
}

export async function reviewIntelligenceSuggestion(id: number, status: "approved" | "rejected", reviewedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(intelligenceSuggestions).set({ status, reviewedBy, reviewedAt: new Date() }).where(eq(intelligenceSuggestions.id, id));
  return { success: true } as const;
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
  return companyId ? db.select().from(units).where(and(eq(units.companyId, companyId), isNull(units.archivedAt))).orderBy(asc(units.name)) : db.select().from(units).where(isNull(units.archivedAt)).orderBy(desc(units.updatedAt)).limit(100);
}

export async function listContacts(companyId?: number) {
  const db = await getDb();
  if (!db) return [];
  return companyId ? db.select().from(contacts).where(and(eq(contacts.companyId, companyId), isNull(contacts.archivedAt))).orderBy(asc(contacts.name)) : db.select().from(contacts).where(isNull(contacts.archivedAt)).orderBy(desc(contacts.updatedAt)).limit(100);
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
export async function updateUnit(id: number, input: Partial<typeof units.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(units).set({ ...input, updatedAt: new Date() }).where(eq(units.id, id));
  return { success: true } as const;
}
export async function updateContact(id: number, input: Partial<typeof contacts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(contacts).set({ ...input, updatedAt: new Date() }).where(eq(contacts.id, id));
  return { success: true } as const;
}
export async function archiveUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(units).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(units.id, id));
  return { success: true } as const;
}
export async function archiveContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(contacts).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(contacts.id, id));
  return { success: true } as const;
}

export async function listCompanies(search?: string, relationshipStatus?: "prospect" | "client" | "inactive") {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (search?.trim()) conditions.push(sql`${companies.legalName} like ${`%${search.trim()}%`} or ${companies.cnpj} like ${`%${search.trim()}%`}`);
  if (relationshipStatus) conditions.push(eq(companies.relationshipStatus, relationshipStatus));
  return db.select().from(companies).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(companies.updatedAt)).limit(100);
}

export async function createRegulatoryAct(input: typeof regulatoryActs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(regulatoryActs).values(input);
  return Number(result[0].insertId);
}

export async function updateRegulatoryAct(id: number, input: Partial<typeof regulatoryActs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(regulatoryActs).set({ ...input, updatedAt: new Date() }).where(eq(regulatoryActs.id, id));
  return { success: true } as const;
}
export async function archiveRegulatoryAct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(regulatoryActs).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(regulatoryActs.id, id));
  return { success: true } as const;
}
export function decorateRegulatoryActRow<T extends { act: { publishedStatus: string | null; expiresAt: Date | null; needsValidation: number } }>(row: T, now = new Date()) {
  return { ...row, regulatoryStatus: normalizeRegulatoryStatus(row.act.publishedStatus, row.act.expiresAt, now, row.act.needsValidation === 1) };
}

export function filterRegulatoryActRows<T extends { act: { archivedAt: Date | null } }>(rows: T[]): T[] {
  return onlyActiveBy(rows, "act");
}

export function filterEvidenceRows<T extends { archivedAt: Date | null }>(rows: T[]): T[] {
  return onlyActive(rows);
}

export async function listRegulatoryActs() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ act: regulatoryActs, company: companies }).from(regulatoryActs).leftJoin(companies, eq(regulatoryActs.companyId, companies.id)).where(isNull(regulatoryActs.archivedAt)).orderBy(asc(regulatoryActs.expiresAt)).limit(100);
  return filterRegulatoryActRows(rows).map((row) => decorateRegulatoryActRow(row));
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

export async function getCompanyByCnpj(cnpj: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [company] = await db.select().from(companies).where(eq(companies.cnpj, cnpj)).limit(1);
  return company;
}

export async function createImportRun(input: { source: string; filename?: string; createdBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(importRuns).values({ ...input, status: "processing" });
  return Number(result[0].insertId);
}

export async function recordBlockedSourceAttempt(source: "cetesb" | "sp_aguas", message: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(importRuns).values({ ...buildBlockedSourceAttempt(source, message), finishedAt: new Date() });
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

export async function createCompanyImportPreview(input: { source: string; filename?: string; createdBy: number; rows: Array<ImportRow & { tradeName?: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return withTransactionRetry(() => db.transaction(async (tx) => {
    const source = input.rows[0]?.source || input.source;
    const created = await tx.insert(importRuns).values({ source, filename: input.filename, createdBy: input.createdBy, status: "processing" }).$returningId();
    const runId = Number(created[0]?.id);
    let valid = 0;
    let rejected = 0;
    let conflictCount = 0;
    let duplicateCount = 0;
    let wouldCreate = 0;
    let wouldUpdate = 0;
    let unchanged = 0;
    const seenCnpjs = new Map<string, number>();

    for (let index = 0; index < input.rows.length; index++) {
      const row = input.rows[index]!;
      const candidate = buildCompanyImportPreviewCandidate(row, index + 1);
      const rawPayload = JSON.stringify(row);
      const normalizedPayload = JSON.stringify(candidate);
      const rawFingerprint = createHash("sha256").update(normalizedPayload).digest("hex");
      const duplicateOf = candidate.cnpj ? seenCnpjs.get(candidate.cnpj) : undefined;
      const validationMessage = candidate.validationMessage || (duplicateOf ? `CNPJ duplicado na própria prévia; primeira ocorrência na linha ${duplicateOf}.` : undefined);
      const validationStatus = validationMessage ? (duplicateOf ? "conflict" : "rejected") : "valid";
      const staged = await tx.insert(importStaging).values({ importRunId: runId, lineNumber: candidate.lineNumber, rawPayload, rawFingerprint, normalizedCnpj: candidate.cnpj || null, normalizedPayload, validationStatus, validationMessage: validationMessage || null }).$returningId();
      const stagingId = Number(staged[0]?.id);

      if (candidate.cnpj && !duplicateOf) seenCnpjs.set(candidate.cnpj, candidate.lineNumber);
      if (candidate.validationMessage) { rejected++; continue; }
      if (duplicateOf) {
        duplicateCount++;
        conflictCount++;
        await tx.insert(importConflicts).values({ importRunId: runId, stagingId, entityType: "company_import", fieldName: "cnpj", currentValue: `Linha ${duplicateOf}`, incomingValue: `Linha ${candidate.lineNumber}` });
        continue;
      }

      valid++;
      const [current] = await tx.select({ id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName, city: companies.city, state: companies.state, segment: companies.segment }).from(companies).where(eq(companies.cnpj, candidate.cnpj)).limit(1);
      if (!current) { wouldCreate++; continue; }
      const differences = compareCompanyImportCandidate(current, candidate);
      if (!differences.length) { unchanged++; continue; }
      wouldUpdate++;
      conflictCount += differences.length;
      await tx.update(importStaging).set({ validationStatus: "conflict", validationMessage: `${differences.length} divergência(s) com o cadastro canônico.` }).where(eq(importStaging.id, stagingId));
      await tx.insert(importConflicts).values(differences.map((difference) => ({ importRunId: runId, stagingId, entityType: "company", entityId: current.id, ...difference })));
    }

    await tx.update(importRuns).set({ status: "review_required", receivedCount: input.rows.length, insertedCount: 0, updatedCount: 0, rejectedCount: rejected, conflictCount, finishedAt: new Date() }).where(eq(importRuns.id, runId));
    return { runId, received: input.rows.length, valid, rejected, conflicts: conflictCount, duplicates: duplicateCount, wouldCreate, wouldUpdate, unchanged, status: "review_required" as const };
  }));
}

/** @deprecated Importação canônica direta permanece bloqueada até aprovação explícita de uma prévia persistida. */
export async function bulkUpsertCompanies() {
  throw new Error("IMPORT_PREVIEW_REQUIRED: gere e aprove uma prévia de importação antes de alterar empresas canônicas.");
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

export async function updateOpportunityDetails(id: number, changes: Partial<typeof opportunities.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(opportunities).set(changes).where(eq(opportunities.id, id));
  return { success: true, id } as const;
}

export async function updateOpportunityStageWithLossReason(id: number, stage: typeof opportunities.$inferInsert.stage, lossReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(opportunities).set({ stage, lossReason: stage === "lost" ? lossReason : undefined }).where(eq(opportunities.id, id));
  return { success: true, id, stage } as const;
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
  return rows.map((row) => ({ ...row, regulatoryStatus: normalizeRegulatoryStatus(row.lead.regulatoryStatusSnapshot, row.act?.expiresAt, new Date(), row.act?.needsValidation === 1) }));
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

export async function convertLeadToClient(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const leadRows = await db.select({ lead: leads, company: companies }).from(leads).innerJoin(companies, eq(leads.companyId, companies.id)).where(eq(leads.id, leadId)).limit(1);
  const current = leadRows[0];
  if (!current) throw new Error("Lead não encontrado");
  const allowed = ["qualified", "approved", "won"];
  if (!allowed.includes(current.lead.commercialStatus)) throw new Error("O lead precisa estar qualificado, aprovado ou ganho antes da conversão.");
  await db.transaction(async (tx) => {
    await tx.update(companies).set({ relationshipStatus: "client", updatedAt: new Date() }).where(eq(companies.id, current.company.id));
    await tx.update(leads).set({ commercialStatus: "won", updatedAt: new Date() }).where(eq(leads.id, leadId));
  });
  return { leadId, companyId: current.company.id, relationshipStatus: "client" as const, commercialStatus: "won" as const };
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
  conditions.push(isNull(evidenceFiles.archivedAt));
  const query = db.select().from(evidenceFiles).orderBy(desc(evidenceFiles.createdAt)).limit(100);
  const rows = conditions.length ? await query.where(and(...conditions)) : await query;
  return filterEvidenceRows(rows);
}

export async function archiveEvidenceFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(evidenceFiles).set({ archivedAt: new Date() }).where(eq(evidenceFiles.id, id));
  return { success: true } as const;
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
