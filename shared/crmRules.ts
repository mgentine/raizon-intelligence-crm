export type CompanyImportRow = { cnpj: string; legalName: string; city?: string; state?: string; segment?: string; source?: string };

export function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeText(value: string | undefined | null) {
  return (value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value);
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calculateDigit = (base: string, weights: number[]) => weights.reduce((sum, weight, index) => sum + Number(base[index]) * weight, 0) % 11;
  const firstRemainder = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const firstDigit = firstRemainder < 2 ? 0 : 11 - firstRemainder;
  const secondRemainder = calculateDigit(cnpj.slice(0, 12) + firstDigit, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = secondRemainder < 2 ? 0 : 11 - secondRemainder;
  return Number(cnpj[12]) === firstDigit && Number(cnpj[13]) === secondDigit;
}

export function dedupeCompanyRows(rows: CompanyImportRow[]) {
  const grouped = new Map<string, CompanyImportRow & { sources: string[]; conflict: boolean }>();
  for (const row of rows) {
    const cnpj = normalizeCnpj(row.cnpj);
    if (!cnpj) continue;
    const existing = grouped.get(cnpj);
    if (!existing) {
      grouped.set(cnpj, { ...row, cnpj, sources: row.source ? [row.source] : [], conflict: false });
      continue;
    }
    const sources = new Set<string>([...existing.sources, ...(row.source ? [row.source] : [])]);
    const conflict = existing.conflict || (normalizeText(existing.legalName) !== normalizeText(row.legalName) && normalizeText(row.legalName) !== "");
    grouped.set(cnpj, { ...existing, sources: Array.from(sources), conflict });
  }
  return Array.from(grouped.values());
}

export function classifyCommercialPriority(input: { urgency: number; fit: number; contactability: number; decisionAccess: number }) {
  const score = input.urgency + input.fit + input.contactability + input.decisionAccess;
  if (score >= 16) return "A" as const;
  if (score >= 11) return "B" as const;
  if (score >= 6) return "C" as const;
  return "D" as const;
}

export type RecurringStatus = "open" | "in_progress" | "done" | "dismissed";

export function completeRecurringStatus(status: RecurringStatus): "done" {
  if (status === "done" || status === "dismissed") throw new Error("Item recorrente já encerrado");
  return "done";
}

export type RegulatoryStatusClass = "Validação pendente" | "valid" | "expiring" | "expired" | "suspended" | "unknown";

export function normalizeRegulatoryStatus(value: string | undefined | null, expiresAt?: Date | null, now = new Date(), needsValidation = false): RegulatoryStatusClass {
  if (needsValidation) return "Validação pendente";
  const normalized = normalizeText(value);
  if (normalized.includes("suspens")) return "suspended";
  if (expiresAt) {
    const time = expiresAt.getTime() - now.getTime();
    if (time < 0) return "expired";
    if (time <= 90 * 24 * 60 * 60 * 1000) return "expiring";
  }
  if (normalized.includes("vencid") || normalized.includes("expirad")) return "expired";
  if (normalized.includes("valida") || normalized.includes("vigente") || normalized.includes("deferid")) return "valid";
  return "unknown";
}

export function requiresNextAction(stage: string) {
  return !["closed", "lost", "discarded"].includes(stage);
}

export const importConflictDecisions = ["accept_incoming", "keep_current", "review", "reject"] as const;
export type ImportConflictDecision = (typeof importConflictDecisions)[number];

export function shouldCreateOpenNotification(existingOpenCount: number): boolean {
  return existingOpenCount === 0;
}

export function isImportConflictDecision(value: string): value is ImportConflictDecision {
  return (importConflictDecisions as readonly string[]).includes(value);
}

export function buildOpportunityStageChange(stage: string, lossReason?: string) {
  if (stage === "lost" && !lossReason?.trim()) throw new Error("Informe o motivo da perda.");
  return { stage, lossReason: stage === "lost" ? lossReason!.trim() : undefined };
}

export function validateCommercialTransition(stage: string, nextAction?: string | null, requirements?: { hasValidContact?: boolean; hasDiagnosis?: boolean; hasProposal?: boolean; lossReason?: string | null }) {
  if (requiresNextAction(stage) && !nextAction?.trim()) throw new Error("Etapas comerciais abertas exigem próxima ação definida");
  if (["contacted", "qualified", "diagnosis", "scoping", "proposal", "negotiation", "approved", "contracting", "execution", "delivery", "aftercare"].includes(stage) && requirements?.hasValidContact !== true) throw new Error("A etapa exige contato válido registrado");
  if (["proposal", "negotiation", "approved"].includes(stage) && requirements?.hasDiagnosis !== true) throw new Error("A etapa exige diagnóstico registrado");
  if (["negotiation", "approved"].includes(stage) && requirements?.hasProposal !== true) throw new Error("A etapa exige proposta registrada");
  if (stage === "lost" && !requirements?.lossReason?.trim()) throw new Error("O motivo da perda é obrigatório");
  return true as const;
}
