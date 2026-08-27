import { describe, expect, it } from "vitest";
import { calculateCommercialMetrics, isEligibleForProposalFollowUp } from "../shared/intelligenceRules";

const now = new Date("2026-08-27T12:00:00.000Z");

describe("Intelligence rules", () => {
  it("identifica somente propostas enviadas há pelo menos três dias", () => {
    expect(isEligibleForProposalFollowUp({ status: "sent", sentAt: new Date("2026-08-23T12:00:00.000Z") }, now)).toBe(true);
    expect(isEligibleForProposalFollowUp({ status: "negotiating", sentAt: new Date("2026-08-24T12:00:00.000Z") }, now)).toBe(true);
    expect(isEligibleForProposalFollowUp({ status: "sent", sentAt: new Date("2026-08-25T12:00:00.000Z") }, now)).toBe(false);
    expect(isEligibleForProposalFollowUp({ status: "accepted", sentAt: new Date("2026-08-20T12:00:00.000Z") }, now)).toBe(false);
  });

  it("calcula indicadores comerciais a partir dos registros fornecidos", () => {
    const metrics = calculateCommercialMetrics([
      { createdAt: new Date("2026-08-02"), updatedAt: new Date("2026-08-07"), investment: "10000", status: "accepted", sentAt: null },
      { createdAt: new Date("2026-08-03"), updatedAt: new Date("2026-08-04"), investment: "5000", status: "sent", sentAt: null },
      { createdAt: new Date("2026-07-02"), updatedAt: new Date("2026-07-03"), investment: "9000", status: "rejected", sentAt: null },
    ], [
      { stage: "won", estimatedValue: "10000", lossReason: null },
      { stage: "lost", estimatedValue: "8000", lossReason: "prazo" },
      { stage: "lost", estimatedValue: "6000", lossReason: "prazo" },
    ], now);
    expect(metrics.proposalsThisMonth).toBe(2);
    expect(metrics.proposedValueThisMonth).toBe(15000);
    expect(metrics.closedValueThisMonth).toBe(10000);
    expect(metrics.conversionRate).toBe(33);
    expect(metrics.averageTicket).toBe(10000);
    expect(metrics.averageCycleDays).toBe(5);
    expect(metrics.lossReasons).toEqual([{ reason: "prazo", count: 2 }]);
  });
});
