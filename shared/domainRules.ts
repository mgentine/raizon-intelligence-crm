import type { ProposalStatus } from "./proposalRules";
import type { ExecutionStatus } from "./executionRules";

export type ProposalDecisionStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type ProposalDocumentLifecycle = "draft" | "review" | "approved" | "issued" | "communicated";

export function deriveProposalDimensions(status: ProposalStatus): { documentLifecycle: ProposalDocumentLifecycle; decisionStatus: ProposalDecisionStatus; communicationEvent: "none" | "sent" | "negotiating" } {
  const decisionStatus: ProposalDecisionStatus = status === "accepted" ? "accepted" : status === "rejected" ? "rejected" : status === "cancelled" ? "cancelled" : "pending";
  const documentLifecycle: ProposalDocumentLifecycle = ["draft"].includes(status) ? "draft" : ["technical_review", "commercial_review"].includes(status) ? "review" : status === "approved_internal" ? "approved" : status === "issued" ? "issued" : "communicated";
  const communicationEvent = status === "sent" ? "sent" : status === "negotiating" ? "negotiating" : "none";
  return { documentLifecycle, decisionStatus, communicationEvent };
}

export type ExecutionPhase = "planning" | "execution" | "delivery" | "acceptance" | "closed" | "cancelled";

export function deriveExecutionDimensions(status: ExecutionStatus): { phase: ExecutionPhase; hasOpenBlocker: boolean } {
  if (status === "planning") return { phase: "planning", hasOpenBlocker: false };
  if (status === "blocked") return { phase: "execution", hasOpenBlocker: true };
  if (status === "in_progress") return { phase: "execution", hasOpenBlocker: false };
  if (status === "delivered") return { phase: "delivery", hasOpenBlocker: false };
  if (status === "accepted") return { phase: "acceptance", hasOpenBlocker: false };
  if (status === "closed") return { phase: "closed", hasOpenBlocker: false };
  return { phase: "cancelled", hasOpenBlocker: false };
}
