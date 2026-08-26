import { describe, expect, it } from "vitest";
import { isImportConflictDecision, normalizeRegulatoryStatus, validateCommercialTransition } from "../shared/crmRules";
import { mapImportRows, validateImportMapping } from "../shared/importRules";
import { decorateRegulatoryActRow, groupNotifications } from "./db";

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

  it("groups notifications by key and keeps the highest severity", () => {
    const grouped = groupNotifications([
      { id: 1, type: "regulatory_expiry", entityType: "regulatory_act", entityId: 9, groupingKey: "regulatory_act:9", readAt: null, severity: "warning" },
      { id: 2, type: "regulatory_expiry", entityType: "regulatory_act", entityId: 9, groupingKey: "regulatory_act:9", readAt: new Date("2026-08-26T12:00:00Z"), severity: "critical" },
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].groupingCount).toBe(2);
    expect(grouped[0].severity).toBe("critical");
    expect(grouped[0].readAt).toBeNull();
    const allRead = groupNotifications([
      { id: 3, type: "overdue_activity", entityType: "activity", entityId: 4, groupingKey: "activity:4", readAt: new Date("2026-08-26T12:00:00Z"), severity: "critical" },
      { id: 4, type: "overdue_activity", entityType: "activity", entityId: 4, groupingKey: "activity:4", readAt: new Date("2026-08-26T12:01:00Z"), severity: "critical" },
    ]);
    expect(allRead[0].readAt).not.toBeNull();
  });

  it("validates manual import mapping before confirmation", () => {
    const raw = [{ Documento: "12.345.678/0001-90", Empresa: "Empresa Exemplo", UF: "SP" }];
    const mapping = { cnpj: "Documento", legalName: "Empresa", city: "", state: "UF", segment: "" } as const;
    const rows = mapImportRows(raw, mapping, "cetesb");
    expect(validateImportMapping(mapping, rows)).toBeNull();
    expect(validateImportMapping({ ...mapping, cnpj: "" }, rows)).toContain("CNPJ");
    expect(validateImportMapping(mapping, [])).toContain("registros válidos");
  });

  it("accepts the reject conflict decision and rejects unknown decisions", () => {
    expect(isImportConflictDecision("reject")).toBe(true);
    expect(isImportConflictDecision("delete_everything")).toBe(false);
  });

  it("requires next action for open commercial stages", () => {
    expect(() => validateCommercialTransition("qualified")).toThrow("próxima ação");
    expect(validateCommercialTransition("qualified", "Ligar para decisor", { hasValidContact: true })).toBe(true);
    expect(validateCommercialTransition("lost", undefined, { lossReason: "Sem orçamento" })).toBe(true);
  });
});
