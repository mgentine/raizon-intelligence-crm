export type ProposalValidityInput = {
  status: string;
  validityDays: number;
  createdAt: Date | string;
  issuedAt?: Date | string | null;
};

export type ProposalValidityAlert = {
  level: "none" | "near_expiry" | "expired";
  daysRemaining: number;
  expiresAt: Date;
};

const terminalStatuses = new Set(["accepted", "rejected", "cancelled"]);

export function getProposalValidityAlert(input: ProposalValidityInput, asOf = new Date(), alertWindowDays = 7): ProposalValidityAlert {
  const reference = new Date(input.issuedAt ?? input.createdAt);
  const expiresAt = new Date(reference.getTime() + input.validityDays * 86_400_000);
  const daysRemaining = Math.ceil((expiresAt.getTime() - asOf.getTime()) / 86_400_000);
  if (terminalStatuses.has(input.status) || input.validityDays <= 0 || Number.isNaN(expiresAt.getTime())) return { level: "none", daysRemaining, expiresAt };
  if (daysRemaining < 0) return { level: "expired", daysRemaining, expiresAt };
  if (daysRemaining <= alertWindowDays) return { level: "near_expiry", daysRemaining, expiresAt };
  return { level: "none", daysRemaining, expiresAt };
}
