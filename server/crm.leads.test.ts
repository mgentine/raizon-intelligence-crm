import { describe, expect, it } from "vitest";
import { isImportConflictDecision, normalizeRegulatoryStatus, shouldCreateOpenNotification, validateCommercialTransition } from "../shared/crmRules";
import { mapImportRows, validateImportMapping } from "../shared/importRules";
import { normalizeCnpjValue, normalizeDateValue, normalizeEmailValue, normalizeMunicipalityValue, normalizePersistedDates, normalizePhoneValue } from "../shared/normalization";
import { decorateRegulatoryActRow, filterEvidenceRows, filterRegulatoryActRows, groupNotifications } from "./db";
import { onlyActive, onlyActiveBy } from "../shared/archiveRules";
import { getSourceUpdateReadiness } from "../shared/sourceReadiness";

describe("archivedAt operational filtering", () => {
  it("removes archived rows from simple and nested operational lists", () => {
    const rows = [{ id: 1, archivedAt: null }, { id: 2, archivedAt: new Date("2026-01-01") }];
    expect(onlyActive(rows)).toEqual([rows[0]]);
    const nested = [{ act: rows[0] }, { act: rows[1] }];
    expect(onlyActiveBy(nested, "act")).toEqual([nested[0]]);
    expect(filterRegulatoryActRows(nested)).toEqual([nested[0]]);
    expect(filterEvidenceRows(rows)).toEqual([rows[0]]);
  });
});

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

  it("normalizes imported identifiers and contact fields", () => {
    expect(normalizeCnpjValue("12.345.678/0001-90")).toBe("12345678000190");
    expect(normalizePhoneValue("(17) 99999-0000")).toBe("17999990000");
    expect(normalizeEmailValue("  CONTATO@EXEMPLO.COM ")).toBe("contato@exemplo.com");
    expect(normalizeMunicipalityValue("  Votuporanga   ")).toBe("Votuporanga");
    expect(normalizeDateValue("2026-12-31T12:00:00Z")).toBeInstanceOf(Date);
    const persisted = normalizePersistedDates({ dueAt: "2026-12-31T12:00:00Z", invalid: "not-a-date", title: "Renovação" }, ["dueAt", "invalid"]);
    expect(persisted.dueAt).toBeInstanceOf(Date);
    expect(persisted.invalid).toBeUndefined();
    expect(persisted.title).toBe("Renovação");
  });

  it("expõe bloqueio explícito quando fontes oficiais não têm endpoint autorizado", () => {
    expect(getSourceUpdateReadiness()).toEqual({ cetesb: "blocked_no_authorized_endpoint", spAguas: "blocked_no_authorized_endpoint" });
    expect(getSourceUpdateReadiness({ cetesbAuthorizedEndpoint: true })).toEqual({ cetesb: "updated", spAguas: "blocked_no_authorized_endpoint" });
  });

  it("mantém a criação de notificações idempotente por ocorrência aberta", () => {
    expect(shouldCreateOpenNotification(0)).toBe(true);
    expect(shouldCreateOpenNotification(1)).toBe(false);
    expect(shouldCreateOpenNotification(3)).toBe(false);
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
