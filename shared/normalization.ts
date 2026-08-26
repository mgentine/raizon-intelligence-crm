export function normalizeCnpjValue(value: unknown) { return String(value ?? "").replace(/\D/g, "").padStart(14, "0").slice(-14); }
export function normalizePhoneValue(value: unknown) { return String(value ?? "").replace(/\D/g, ""); }
export function normalizeEmailValue(value: unknown) { const email = String(value ?? "").trim().toLowerCase(); return email || undefined; }
export function normalizeMunicipalityValue(value: unknown) { return String(value ?? "").trim().replace(/\s+/g, " "); }
export function normalizeDateValue(value: unknown) { if (!value) return undefined; const date = value instanceof Date ? value : new Date(String(value)); return Number.isNaN(date.getTime()) ? undefined : date; }
export function normalizePersistedDates<T extends Record<string, unknown>>(input: T, fields: string[]) { const next = { ...input } as T; for (const field of fields) (next as Record<string, unknown>)[field] = normalizeDateValue((input as Record<string, unknown>)[field]); return next; }
