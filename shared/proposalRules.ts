import { centsToDecimal, moneyToCents } from "./moneyRules";

export type PricingFactors = {
  basePrice: string | number;
  sizeFactor?: number;
  complexityFactor?: number;
  distanceAmount?: number;
  visitAmount?: number;
  urgencyAmount?: number;
  documentationAmount?: number;
};

function roundDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= BigInt(0)) throw new Error("Divisor monetário inválido.");
  const remainder = numerator % denominator;
  const absoluteRemainder = remainder < BigInt(0) ? -remainder : remainder;
  const rounded = absoluteRemainder * BigInt(2) >= denominator ? (numerator < BigInt(0) ? BigInt(-1) : BigInt(1)) : BigInt(0);
  return numerator / denominator + rounded;
}

export function calculateSuggestedPrice(input: PricingFactors): string {
  const additions = [input.distanceAmount, input.visitAmount, input.urgencyAmount, input.documentationAmount].reduce((total, value) => total + moneyToCents(value || 0), BigInt(0));
  const base = moneyToCents(input.basePrice || 0);
  const sizeFactor = moneyToCents(input.sizeFactor ?? 1);
  const complexityFactor = moneyToCents(input.complexityFactor ?? 1);
  const weightedBase = roundDivide(base * sizeFactor * complexityFactor, BigInt(10_000));
  return centsToDecimal(weightedBase + additions);
}

export const proposalCreationStages = ["proposal", "negotiation", "approved", "won", "contracting", "execution", "delivery", "closed", "aftercare"] as const;
export type ProposalCreationStage = (typeof proposalCreationStages)[number];

export function canCreateProposalFromOpportunity(stage: string) {
  return (proposalCreationStages as readonly string[]).includes(stage);
}

export const proposalProfessionals = ["Miguel Gentine", "Laleska Fernanda"] as const;
export type ProposalProfessional = (typeof proposalProfessionals)[number];

export const proposalStatuses = ["draft", "technical_review", "commercial_review", "approved_internal", "issued", "sent", "negotiating", "accepted", "rejected", "cancelled"] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];

const proposalTransitions: Record<ProposalStatus, readonly ProposalStatus[]> = {
  draft: ["technical_review", "cancelled"],
  technical_review: ["draft", "commercial_review", "cancelled"],
  commercial_review: ["technical_review", "approved_internal", "cancelled"],
  approved_internal: ["commercial_review", "issued", "cancelled"],
  issued: ["sent", "cancelled"],
  sent: ["negotiating", "accepted", "rejected", "cancelled"],
  negotiating: ["sent", "accepted", "rejected", "cancelled"],
  accepted: [],
  rejected: [],
  cancelled: [],
};

export function canProfileUpdateProposalStatus(profile: string | undefined, role: string | undefined, next: ProposalStatus) {
  if (role === "admin") return true;
  if (profile === "technical") return ["draft", "technical_review"].includes(next);
  return ["draft", "technical_review", "commercial_review", "approved_internal", "issued", "sent", "negotiating", "accepted", "rejected", "cancelled"].includes(next);
}

export function validateProposalTransition(current: ProposalStatus, next: ProposalStatus, hasRequiredContent = true) {
  if (!proposalTransitions[current]?.includes(next)) throw new Error(`Transição de proposta inválida: ${current} → ${next}.`);
  if (["technical_review", "commercial_review", "approved_internal", "issued"].includes(next) && !hasRequiredContent) throw new Error("A proposta precisa ter investimento e informações pendentes revisadas antes de avançar.");
  return true as const;
}

export function buildProposalSourceMap() {
  return { company: "companies", opportunity: "opportunities", service: "service_catalog", investment: "user_approved", rules: "proposalRules" } as const;
}
