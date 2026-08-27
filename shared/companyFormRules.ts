export type CompanyFormDraft = {
  cnpj: string;
  legalName: string;
  tradeName: string;
  registrationStatus: string;
  companySize: string;
  mainCnae: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  segment: string;
  notes: string;
  relationshipStatus: "prospect" | "client" | "inactive";
};

export type CompanyLookupResult = {
  cnpj?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  registrationStatus?: string | null;
  companySize?: string | null;
  mainCnae?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  neighborhood?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
};

export function applyCompanyLookupToDraft(current: CompanyFormDraft, lookup: CompanyLookupResult): CompanyFormDraft {
  return {
    ...current,
    cnpj: lookup.cnpj || current.cnpj,
    legalName: current.legalName || lookup.legalName || "",
    tradeName: current.tradeName || lookup.tradeName || "",
    registrationStatus: current.registrationStatus || lookup.registrationStatus || "",
    companySize: current.companySize || lookup.companySize || "",
    mainCnae: current.mainCnae || lookup.mainCnae || "",
    address: current.address || lookup.address || "",
    addressNumber: current.addressNumber || lookup.addressNumber || "",
    addressComplement: current.addressComplement || lookup.addressComplement || "",
    neighborhood: current.neighborhood || lookup.neighborhood || "",
    postalCode: current.postalCode || lookup.postalCode || "",
    phone: current.phone || lookup.phone || "",
    email: current.email || lookup.email || "",
    city: current.city || lookup.city || "",
    state: current.state === "SP" && !current.city ? (lookup.state || current.state) : current.state,
  };
}

export function normalizeCnpjInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}
