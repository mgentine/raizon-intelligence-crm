import { normalizeCnpjValue, normalizeMunicipalityValue } from "./normalization";
import { isValidCnpj } from "./crmRules";

export type ImportMapping = { cnpj: string; legalName: string; city: string; state: string; segment: string };
export type ImportRow = { cnpj: string; legalName: string; city?: string; state?: string; segment?: string; source?: string };
export type CompanyImportPreviewCandidate = {
  lineNumber: number;
  cnpj: string;
  legalName: string;
  tradeName?: string;
  city?: string;
  state?: string;
  segment?: string;
  source: string;
  validationMessage?: string;
};
export type ExistingCompanyForPreview = { id: number; legalName: string; tradeName?: string | null; city?: string | null; state?: string | null; segment?: string | null };

const previewComparisonFields = ["legalName", "tradeName", "city", "state", "segment"] as const;

export function buildCompanyImportPreviewCandidate(row: ImportRow & { tradeName?: string }, lineNumber: number): CompanyImportPreviewCandidate {
  const rawCnpj = String(row.cnpj || "").replace(/\D/g, "");
  const cnpj = normalizeCnpjValue(row.cnpj);
  const legalName = String(row.legalName || "").trim();
  const source = String(row.source || "import").trim() || "import";
  const candidate: CompanyImportPreviewCandidate = {
    lineNumber,
    cnpj,
    legalName,
    tradeName: row.tradeName?.trim() || undefined,
    city: normalizeMunicipalityValue(row.city) || undefined,
    state: row.state?.trim().slice(0, 2).toUpperCase() || undefined,
    segment: row.segment?.trim() || undefined,
    source,
  };
  if (!isValidCnpj(rawCnpj) || !legalName) candidate.validationMessage = "CNPJ válido e razão social são obrigatórios.";
  return candidate;
}

export function compareCompanyImportCandidate(current: ExistingCompanyForPreview, incoming: CompanyImportPreviewCandidate) {
  return previewComparisonFields.flatMap((field) => {
    const currentValue = current[field] || "";
    const incomingValue = incoming[field] || "";
    return currentValue !== incomingValue ? [{ fieldName: field, currentValue, incomingValue }] : [];
  });
}

export function mapImportRows(raw: Record<string, unknown>[], mapping: ImportMapping, source: string): ImportRow[] {
  return raw.map(row => ({ cnpj: normalizeCnpjValue(row[mapping.cnpj]), legalName: String(row[mapping.legalName] || "").trim(), city: mapping.city ? normalizeMunicipalityValue(row[mapping.city]) || undefined : undefined, state: mapping.state ? String(row[mapping.state] || "").trim().slice(0, 2).toUpperCase() || undefined : undefined, segment: mapping.segment ? String(row[mapping.segment] || "").trim() || undefined : undefined, source })).filter(row => row.cnpj || row.legalName).slice(0, 1000);
}

export function validateImportMapping(mapping: ImportMapping, rows: ImportRow[]) {
  if (!mapping.cnpj) return "Mapeie a coluna de CNPJ antes de confirmar.";
  if (!mapping.legalName) return "Mapeie a coluna de razão social/requerente antes de confirmar.";
  if (!rows.length) return "O mapeamento atual não produziu registros válidos.";
  return null;
}
