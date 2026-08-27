export type PricingFactors = {
  basePrice: number;
  sizeFactor?: number;
  complexityFactor?: number;
  distanceAmount?: number;
  visitAmount?: number;
  urgencyAmount?: number;
  documentationAmount?: number;
};

export function calculateSuggestedPrice(input: PricingFactors) {
  const amounts = [input.basePrice, input.distanceAmount, input.visitAmount, input.urgencyAmount, input.documentationAmount].map((value) => Number(value || 0));
  const factor = Math.max(0, Number(input.sizeFactor ?? 1)) * Math.max(0, Number(input.complexityFactor ?? 1));
  return Number((amounts[0] * factor + amounts.slice(1).reduce((total, value) => total + value, 0)).toFixed(2));
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
