export type CompanyImportRow = { cnpj: string; legalName: string; city?: string; state?: string; segment?: string; source?: string };

export function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeText(value: string | undefined | null) {
  return (value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function isValidCnpj(value: string) {
  return normalizeCnpj(value).length === 14;
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
