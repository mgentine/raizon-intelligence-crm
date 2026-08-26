import { describe, expect, it } from "vitest";
import { normalizeRegulatoryStatus, validateCommercialTransition } from "../shared/crmRules";
import { decorateRegulatoryActRow } from "./db";

describe("lead and regulatory rules", () => {
  it("keeps published status separate while classifying an expired act", () => {
    const now = new Date("2026-08-26T12:00:00Z");
    expect(normalizeRegulatoryStatus("Licença válida", new Date("2026-08-25T12:00:00Z"), now)).toBe("expired");
    expect(normalizeRegulatoryStatus("Suspensa", null, now)).toBe("suspended");
    expect(normalizeRegulatoryStatus("Vigente", new Date("2026-12-01T12:00:00Z"), now)).toBe("valid");
  });

  it("propagates normalized regulatory status from published status and expiresAt", () => {
    const now = new Date("2026-08-26T12:00:00Z");
    expect(normalizeRegulatoryStatus("Vigente", new Date("2026-09-01T12:00:00Z"), now)).toBe("expiring");
    expect(normalizeRegulatoryStatus("Vigente", new Date("2026-08-01T12:00:00Z"), now)).toBe("expired");
  });

  it("decorates regulatory act list rows with normalized status", () => {
    const row = decorateRegulatoryActRow({ act: { publishedStatus: "Vigente", expiresAt: new Date("2026-08-01T12:00:00Z") } }, new Date("2026-08-26T12:00:00Z"));
    expect(row.act.publishedStatus).toBe("Vigente");
    expect(row.regulatoryStatus).toBe("expired");
  });

  it("requires next action for open commercial stages", () => {
    expect(() => validateCommercialTransition("qualified")).toThrow("próxima ação");
    expect(validateCommercialTransition("qualified", "Ligar para decisor", { hasValidContact: true })).toBe(true);
    expect(validateCommercialTransition("lost", undefined, { lossReason: "Sem orçamento" })).toBe(true);
  });
});
