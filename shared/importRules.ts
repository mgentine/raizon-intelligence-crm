export type ImportMapping = { cnpj: string; legalName: string; city: string; state: string; segment: string };
export type ImportRow = { cnpj: string; legalName: string; city?: string; state?: string; segment?: string; source?: string };

export function mapImportRows(raw: Record<string, unknown>[], mapping: ImportMapping, source: string): ImportRow[] {
  return raw.map(row => ({ cnpj: String(row[mapping.cnpj] || ""), legalName: String(row[mapping.legalName] || ""), city: mapping.city ? String(row[mapping.city] || "") || undefined : undefined, state: mapping.state ? String(row[mapping.state] || "").slice(0, 2).toUpperCase() || undefined : undefined, segment: mapping.segment ? String(row[mapping.segment] || "") || undefined : undefined, source })).filter(row => row.cnpj || row.legalName).slice(0, 1000);
}

export function validateImportMapping(mapping: ImportMapping, rows: ImportRow[]) {
  if (!mapping.cnpj) return "Mapeie a coluna de CNPJ antes de confirmar.";
  if (!mapping.legalName) return "Mapeie a coluna de razão social/requerente antes de confirmar.";
  if (!rows.length) return "O mapeamento atual não produziu registros válidos.";
  return null;
}
