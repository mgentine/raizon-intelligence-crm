import { describe, expect, it } from "vitest";
import { buildOpportunityStageChange, classifyCommercialPriority, completeRecurringStatus, dedupeCompanyRows, isValidCnpj, normalizeCnpj } from "../shared/crmRules";
import { applyCompanyLookupToDraft, normalizeCnpjInput } from "../shared/companyFormRules";

describe("CRM rules", () => {
  it("prepara perda com motivo obrigatório para o card do funil", () => {
    expect(buildOpportunityStageChange("lost", "  Orçamento incompatível  ")).toEqual({ stage: "lost", lossReason: "Orçamento incompatível" });
    expect(() => buildOpportunityStageChange("lost", "  ")).toThrow("Informe o motivo da perda.");
    expect(buildOpportunityStageChange("proposal")).toEqual({ stage: "proposal", lossReason: undefined });
  });

  it("normalizes formatted CNPJ and validates length", () => {
    expect(normalizeCnpj("12.345.678/0001-90")).toBe("12345678000190");
    expect(isValidCnpj("12.345.678/0001-90")).toBe(true);
    expect(isValidCnpj("123")).toBe(false);
  });

  it("normalizes CNPJ input and preserves manual company edits when applying lookup data", () => {
    expect(normalizeCnpjInput("12.345.678/0001-90 extra")).toBe("12345678000190");
    const draft = applyCompanyLookupToDraft({ cnpj: "12.345.678/0001-90", legalName: "Nome digitado", city: "Votuporanga", state: "SP", segment: "SST", relationshipStatus: "client" }, { cnpj: "12345678000190", legalName: "Nome da consulta", city: "São Paulo", state: "SP" });
    expect(draft.legalName).toBe("Nome digitado");
    expect(draft.city).toBe("Votuporanga");
    expect(draft.segment).toBe("SST");
    const emptyDraft = applyCompanyLookupToDraft({ cnpj: "", legalName: "", city: "", state: "SP", segment: "", relationshipStatus: "client" }, { cnpj: "12345678000190", legalName: "Nome da consulta", city: "São Paulo", state: "RJ" });
    expect(emptyDraft.legalName).toBe("Nome da consulta");
    expect(emptyDraft.city).toBe("São Paulo");
    expect(emptyDraft.state).toBe("RJ");
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

  it("allows completing open and in-progress recurring items but rejects closed ones", () => {
    expect(completeRecurringStatus("open")).toBe("done");
    expect(completeRecurringStatus("in_progress")).toBe("done");
    expect(() => completeRecurringStatus("done")).toThrow("já encerrado");
    expect(() => completeRecurringStatus("dismissed")).toThrow("já encerrado");
  });

  it("classifies commercial priority independently from technical status", () => {
    expect(classifyCommercialPriority({ urgency: 5, fit: 5, contactability: 4, decisionAccess: 4 })).toBe("A");
    expect(classifyCommercialPriority({ urgency: 4, fit: 3, contactability: 2, decisionAccess: 2 })).toBe("B");
    expect(classifyCommercialPriority({ urgency: 1, fit: 1, contactability: 1, decisionAccess: 1 })).toBe("D");
  });
});
