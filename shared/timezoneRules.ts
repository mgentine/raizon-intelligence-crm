export type TemporalKind = "civil_date" | "utc_instant";

const civilDateFields = new Set(["expiresAt", "validityDate", "criticalDate", "regulatoryDueDate"]);

export function classifyTemporalField(field: string): TemporalKind {
  return civilDateFields.has(field) ? "civil_date" : "utc_instant";
}

export function isValidCivilDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function normalizeCivilDate(value: string): string {
  if (!isValidCivilDate(value)) throw new Error("Data civil inválida; use AAAA-MM-DD.");
  return value;
}

export function toUtcIso(value: Date | string | number): string {
  const instant = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(instant.getTime())) throw new Error("Instante UTC inválido.");
  return instant.toISOString();
}

export function formatCivilDateInSaoPaulo(value: string): string {
  const civil = normalizeCivilDate(value);
  const [year, month, day] = civil.split("-");
  return `${day}/${month}/${year}`;
}
