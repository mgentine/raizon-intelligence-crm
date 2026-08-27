import { centsToDecimal, moneyToCents } from "./moneyRules";

export type IntelligenceProposalInput = {
  createdAt: Date;
  updatedAt: Date;
  investment: string | number | null;
  status: string;
  sentAt: Date | null;
};

export type IntelligenceOpportunityInput = {
  stage: string;
  estimatedValue: string | number | null;
  lossReason: string | null;
};

export function isEligibleForProposalFollowUp(input: { status: string; sentAt: Date | null }, now = new Date()) {
  if (!(input.status === "sent" || input.status === "negotiating") || !input.sentAt) return false;
  return now.getTime() - input.sentAt.getTime() >= 3 * 24 * 60 * 60 * 1000;
}

export function calculateCommercialMetrics(proposals: IntelligenceProposalInput[], opportunities: IntelligenceOpportunityInput[], now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const proposalsThisMonth = proposals.filter((row) => row.createdAt >= monthStart);
  const closed = opportunities.filter((row) => row.stage === "won");
  const decided = opportunities.filter((row) => row.stage === "won" || row.stage === "lost");
  const accepted = proposals.filter((row) => row.status === "accepted");
  const reasons = new Map<string, number>();
  opportunities.filter((row) => row.stage === "lost" && row.lossReason).forEach((row) => reasons.set(row.lossReason!, (reasons.get(row.lossReason!) || 0) + 1));
  const closedValueCents = closed.reduce((sum, row) => sum + moneyToCents(row.estimatedValue || 0), BigInt(0));
  const proposedValueCents = proposalsThisMonth.reduce((sum, row) => sum + moneyToCents(row.investment || 0), BigInt(0));
  return {
    proposalsThisMonth: proposalsThisMonth.length,
    proposedValueThisMonth: centsToDecimal(proposedValueCents),
    closedValueThisMonth: centsToDecimal(closedValueCents),
    conversionRate: decided.length ? Math.round((closed.length / decided.length) * 100) : 0,
    averageTicket: closed.length ? centsToDecimal(closedValueCents / BigInt(closed.length)) : "0.00",
    averageCycleDays: accepted.length ? Math.round(accepted.reduce((sum, row) => sum + Math.max(0, row.updatedAt.getTime() - row.createdAt.getTime()) / 86400000, 0) / accepted.length) : 0,
    lossReasons: Array.from(reasons.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
  };
}
