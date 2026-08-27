import { describe, expect, it } from "vitest";
import { buildProposalSourceMap, calculateSuggestedPrice, canCreateProposalFromOpportunity, canProfileUpdateProposalStatus, proposalProfessionals, validateProposalTransition } from "../shared/proposalRules";

describe("Proposal rules", () => {
  it("calcula preço sugerido com fatores e adicionais explícitos", () => {
    expect(calculateSuggestedPrice({ basePrice: 2000, sizeFactor: 1.25, complexityFactor: 1.1, distanceAmount: 300, visitAmount: 200 })).toBe(3250);
  });

  it("bloqueia proposta para oportunidade antes da etapa de proposta", () => {
    expect(canCreateProposalFromOpportunity("qualified")).toBe(false);
    expect(canCreateProposalFromOpportunity("proposal")).toBe(true);
    expect(canCreateProposalFromOpportunity("execution")).toBe(true);
  });

  it("restringe status externos para o perfil técnico", () => {
    expect(canProfileUpdateProposalStatus("technical", "user", "technical_review")).toBe(true);
    expect(canProfileUpdateProposalStatus("technical", "user", "approved_internal")).toBe(false);
    expect(canProfileUpdateProposalStatus("commercial", "user", "approved_internal")).toBe(true);
    expect(canProfileUpdateProposalStatus("technical", "admin", "accepted")).toBe(true);
  });

  it("permite apenas transições governadas", () => {
    expect(validateProposalTransition("draft", "technical_review")).toBe(true);
    expect(() => validateProposalTransition("draft", "issued")).toThrow("Transição de proposta inválida");
    expect(validateProposalTransition("approved_internal", "issued")).toBe(true);
  });

  it("exige conteúdo antes das revisões", () => {
    expect(() => validateProposalTransition("draft", "technical_review", false)).toThrow("investimento");
  });

  it("restringe o profissional responsável aos nomes autorizados", () => {
    expect(proposalProfessionals).toEqual(["Miguel Gentine", "Laleska Fernanda"]);
  });

  it("declara as fontes do snapshot para auditoria", () => {
    expect(buildProposalSourceMap()).toMatchObject({ company: "companies", service: "service_catalog", investment: "user_approved" });
  });
});
