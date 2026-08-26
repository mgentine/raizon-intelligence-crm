export type CompanyFormDraft = {
  cnpj: string;
  legalName: string;
  city: string;
  state: string;
  segment: string;
  relationshipStatus: "prospect" | "client" | "inactive";
};

export type CompanyLookupResult = {
  cnpj?: string | null;
  legalName?: string | null;
  city?: string | null;
  state?: string | null;
};

export function applyCompanyLookupToDraft(current: CompanyFormDraft, lookup: CompanyLookupResult): CompanyFormDraft {
  return {
    ...current,
    cnpj: lookup.cnpj || current.cnpj,
    legalName: current.legalName || lookup.legalName || "",
    city: current.city || lookup.city || "",
    state: current.state === "SP" && !current.city ? (lookup.state || current.state) : current.state,
  };
}

export function normalizeCnpjInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}
