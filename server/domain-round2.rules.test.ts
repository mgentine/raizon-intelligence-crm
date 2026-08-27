import { describe, expect, it } from "vitest";
import { formatBrl, moneyToCents, splitMoney, sumMoney } from "../shared/moneyRules";
import { classifyTemporalField, formatCivilDateInSaoPaulo, isValidCivilDate, normalizeCivilDate, toUtcIso } from "../shared/timezoneRules";
import { onlyActive } from "../shared/archiveRules";
import { readFileSync } from "node:fs";

describe("Rodada estrutural 2 — dinheiro, timezone e archive", () => {
  it("soma centavos sem erro de ponto flutuante", () => {
    expect(sumMoney(["0,10", "0,20"])).toBe("0.30");
    expect(moneyToCents("1.234,56")).toBe(BigInt(123456));
    expect(formatBrl(moneyToCents("1234.56"))).toBe("R$ 1.234,56");
  });

  it("divide valores em parcelas preservando o total", () => {
    expect(splitMoney("0,10", 3)).toEqual(["0.04", "0.03", "0.03"]);
    expect(sumMoney(splitMoney("100,00", 3))).toBe("100.00");
    expect(() => splitMoney("100", 0)).toThrow("parcelas");
  });

  it("distingue datas civis de instantes e preserva a virada de dia", () => {
    expect(classifyTemporalField("expiresAt")).toBe("civil_date");
    expect(classifyTemporalField("createdAt")).toBe("utc_instant");
    expect(isValidCivilDate("2026-02-28")).toBe(true);
    expect(isValidCivilDate("2026-02-29")).toBe(false);
    expect(normalizeCivilDate("2026-08-27")).toBe("2026-08-27");
    expect(formatCivilDateInSaoPaulo("2026-08-27")).toBe("27/08/2026");
    expect(toUtcIso("2026-08-27T02:00:00-03:00")).toBe("2026-08-27T05:00:00.000Z");
  });

  it("não expõe registros arquivados na coleção operacional", () => {
    const rows = [{ id: 1, archivedAt: null }, { id: 2, archivedAt: new Date("2026-08-27T00:00:00Z") }];
    expect(onlyActive(rows).map((row) => row.id)).toEqual([1]);
  });
});

import { deriveExecutionDimensions, deriveProposalDimensions } from "../shared/domainRules";

describe("Dimensões derivadas compatíveis", () => {
  it("separa decisão, comunicação e ciclo documental sem alterar o status legado", () => {
    expect(deriveProposalDimensions("issued")).toEqual({ documentLifecycle: "issued", decisionStatus: "pending", communicationEvent: "none" });
    expect(deriveProposalDimensions("sent")).toEqual({ documentLifecycle: "communicated", decisionStatus: "pending", communicationEvent: "sent" });
    expect(deriveProposalDimensions("negotiating")).toEqual({ documentLifecycle: "communicated", decisionStatus: "pending", communicationEvent: "negotiating" });
    expect(deriveProposalDimensions("accepted")).toEqual({ documentLifecycle: "communicated", decisionStatus: "accepted", communicationEvent: "none" });
  });

  it("interpreta blocked como execução com condição de bloqueio", () => {
    expect(deriveExecutionDimensions("blocked")).toEqual({ phase: "execution", hasOpenBlocker: true });
    expect(deriveExecutionDimensions("in_progress")).toEqual({ phase: "execution", hasOpenBlocker: false });
    expect(deriveExecutionDimensions("delivered")).toEqual({ phase: "delivery", hasOpenBlocker: false });
  });
});

describe("Remodelagem autorizada — migration compatível", () => {
  it("mantém a migration exclusivamente aditiva e com backfill idempotente", () => {
    const migration = ["0021_fearless_adam_warlock.sql", "0022_odd_boom_boom.sql"].map((file) => readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8")).join("\n");
    expect(migration).toContain("ADD `legacyLeadId`");
    expect(migration).toContain("ADD `documentStatus`");
    expect(migration).toContain("ADD `decisionStatus`");
    expect(migration).toContain("ON DUPLICATE KEY UPDATE");
    expect(migration).toContain("convertedOpportunityId");
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN|INDEX|CONSTRAINT)\b|\bDELETE\s+FROM\b/i);
  });

  it("mantém bloqueio como condição separada da fase operacional", () => {
    const migration = readFileSync(new URL("../drizzle/0022_odd_boom_boom.sql", import.meta.url), "utf8");
    expect(migration).toContain("WHEN `status` IN ('in_progress', 'blocked') THEN 'in_progress'");
    expect(migration).toContain("INSERT INTO `opportunities`");
    expect(migration).toContain("legacyLeadId");
  });
});
