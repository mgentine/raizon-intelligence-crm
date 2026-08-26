import { describe, expect, it } from "vitest";
import { classifyCommercialPriority, dedupeCompanyRows, isValidCnpj, normalizeCnpj } from "../shared/crmRules";

describe("CRM rules", () => {
  it("normalizes formatted CNPJ and validates length", () => {
    expect(normalizeCnpj("12.345.678/0001-90")).toBe("12345678000190");
    expect(isValidCnpj("12.345.678/0001-90")).toBe(true);
    expect(isValidCnpj("123")).toBe(false);
  });

  it("deduplicates by CNPJ and flags conflicting names", () => {
    const result = dedupeCompanyRows([
      { cnpj: "12.345.678/0001-90", legalName: "Empresa Alfa", source: "cetesb" },
      { cnpj: "12345678000190", legalName: "Empresa Alfa", source: "sp_aguas" },
      { cnpj: "12345678000190", legalName: "Empresa Beta", source: "sp_aguas" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.sources).toEqual(["cetesb", "sp_aguas"]);
    expect(result[0]?.conflict).toBe(true);
  });

  it("classifies commercial priority independently from technical status", () => {
    expect(classifyCommercialPriority({ urgency: 5, fit: 5, contactability: 4, decisionAccess: 4 })).toBe("A");
    expect(classifyCommercialPriority({ urgency: 4, fit: 3, contactability: 2, decisionAccess: 2 })).toBe("B");
    expect(classifyCommercialPriority({ urgency: 1, fit: 1, contactability: 1, decisionAccess: 1 })).toBe("D");
  });
});
