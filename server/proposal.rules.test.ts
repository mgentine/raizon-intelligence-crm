import { describe, expect, it } from "vitest";
import { buildProposalSourceMap, calculateSuggestedPrice, validateProposalTransition } from "../shared/proposalRules";

describe("Proposal rules", () => {
  it("calcula preço sugerido com fatores e adicionais explícitos", () => {
    expect(calculateSuggestedPrice({ basePrice: 2000, sizeFactor: 1.25, complexityFactor: 1.1, distanceAmount: 300, visitAmount: 200 })).toBe(3250);
  });

  it("permite apenas transições governadas", () => {
    expect(validateProposalTransition("draft", "technical_review")).toBe(true);
    expect(() => validateProposalTransition("draft", "issued")).toThrow("Transição de proposta inválida");
    expect(validateProposalTransition("approved_internal", "issued")).toBe(true);
  });

  it("exige conteúdo antes das revisões", () => {
    expect(() => validateProposalTransition("draft", "technical_review", false)).toThrow("investimento");
  });

  it("declara as fontes do snapshot para auditoria", () => {
    expect(buildProposalSourceMap()).toMatchObject({ company: "companies", service: "service_catalog", investment: "user_approved" });
  });
});
