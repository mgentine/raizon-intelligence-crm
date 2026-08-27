import { describe, expect, it } from "vitest";
import { getProposalValidityAlert } from "../shared/proposalAlertRules";

describe("Proposal validity alerts", () => {
  const asOf = new Date("2026-08-27T12:00:00.000Z");

  it("destaca proposta ativa próxima da validade", () => {
    const alert = getProposalValidityAlert({ status: "sent", validityDays: 20, createdAt: "2026-08-13T12:00:00.000Z" }, asOf);
    expect(alert.level).toBe("near_expiry");
    expect(alert.daysRemaining).toBe(6);
  });

  it("destaca proposta ativa vencida e ignora status terminal", () => {
    expect(getProposalValidityAlert({ status: "sent", validityDays: 20, createdAt: "2026-08-01T12:00:00.000Z" }, asOf).level).toBe("expired");
    expect(getProposalValidityAlert({ status: "accepted", validityDays: 20, createdAt: "2026-08-01T12:00:00.000Z" }, asOf).level).toBe("none");
  });
});
