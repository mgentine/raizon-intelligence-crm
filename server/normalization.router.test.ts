import { describe, expect, it, vi } from "vitest";

const createRecurringItemMock = vi.hoisted(() => vi.fn(async (input: unknown) => input));
const completeRecurringItemMock = vi.hoisted(() => vi.fn(async (id: number, ownerId: number) => ({ id, ownerId, status: "done" })));
const listUpcomingRecurringMock = vi.hoisted(() => vi.fn(async () => [{ item: { id: 21, status: "open" } }]));
const updateRegulatoryActMock = vi.hoisted(() => vi.fn(async (id: number, input: unknown) => ({ id, input })));
const archiveRegulatoryActMock = vi.hoisted(() => vi.fn(async (id: number) => ({ success: true, id })));
const listRegulatoryActsMock = vi.hoisted(() => vi.fn(async () => [{ act: { id: 31, archivedAt: null }, regulatoryStatus: "valid" }]));
const listEvidenceFilesMock = vi.hoisted(() => vi.fn(async () => [{ id: 41, regulatoryActId: 31, filename: "licenca.pdf", archivedAt: null }]));
const archiveEvidenceFileMock = vi.hoisted(() => vi.fn(async (id: number) => ({ success: true, id })));
const updateUnitMock = vi.hoisted(() => vi.fn(async (id: number, input: unknown) => ({ id, input })));
const archiveUnitMock = vi.hoisted(() => vi.fn(async (id: number) => ({ success: true, id })));
const updateContactMock = vi.hoisted(() => vi.fn(async (id: number, input: unknown) => ({ id, input })));
const archiveContactMock = vi.hoisted(() => vi.fn(async (id: number) => ({ success: true, id })));
const decideImportConflictMock = vi.hoisted(() => vi.fn(async (id: number, userId: number, decision: string, rationale?: string) => ({ success: true, id, userId, decision, rationale })));
const updateOpportunityDetailsMock = vi.hoisted(() => vi.fn(async (id: number, changes: unknown) => ({ success: true, id, changes })));
const updateOpportunityStageWithLossReasonMock = vi.hoisted(() => vi.fn(async (id: number, stage: string, lossReason?: string) => ({ success: true, id, stage, lossReason })));
const sendTitanEmailMock = vi.hoisted(() => vi.fn(async () => ({ messageId: "admin-test-message" })));

vi.mock("./email", () => ({ sendTitanEmail: sendTitanEmailMock }));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, createRecurringItem: createRecurringItemMock, completeRecurringItem: completeRecurringItemMock, listUpcomingRecurring: listUpcomingRecurringMock, updateRegulatoryAct: updateRegulatoryActMock, archiveRegulatoryAct: archiveRegulatoryActMock, listRegulatoryActs: listRegulatoryActsMock, listEvidenceFiles: listEvidenceFilesMock, archiveEvidenceFile: archiveEvidenceFileMock, updateUnit: updateUnitMock, archiveUnit: archiveUnitMock, updateContact: updateContactMock, archiveContact: archiveContactMock, decideImportConflict: decideImportConflictMock, updateOpportunityDetails: updateOpportunityDetailsMock, updateOpportunityStageWithLossReason: updateOpportunityStageWithLossReasonMock };
});

import { appRouter } from "./routers";

describe("normalização nas mutations", () => {
  it("permite teste SMTP somente para administrador", async () => {
    sendTitanEmailMock.mockClear();
    const adminCaller = appRouter.createCaller({ user: { id: 1, role: "admin", profile: "commercial" } } as any);
    await expect(adminCaller.notifications.sendTestEmail({ subject: "Teste controlado" })).resolves.toEqual({ sent: true, messageId: "admin-test-message" });
    expect(sendTitanEmailMock).toHaveBeenCalledWith(expect.objectContaining({ subject: "Teste controlado" }));
    const commercialCaller = appRouter.createCaller({ user: { id: 88, role: "user", profile: "commercial" } } as any);
    await expect(commercialCaller.notifications.sendTestEmail({ subject: "Sem permissão" })).rejects.toThrow();
  });
  it("persiste dueAt normalizado na recurring.create", async () => {
    const caller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    const dueAt = new Date("2026-12-31T12:00:00.000Z");
    await caller.recurring.create({ companyId: 12, title: "Renovação de licença", recurrenceType: "anual", dueAt });
    expect(createRecurringItemMock).toHaveBeenCalledWith(expect.objectContaining({ companyId: 12, dueAt, ownerId: 77 }));
    await expect(caller.dashboard.recurring()).resolves.toEqual([{ item: { id: 21, status: "open" } }]);
    expect(listUpcomingRecurringMock).toHaveBeenCalled();
  });

  it("conclui recorrência pelo proprietário e bloqueia perfil comercial", async () => {
    completeRecurringItemMock.mockClear();
    const technicalCaller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(technicalCaller.recurring.complete({ id: 21 })).resolves.toEqual({ id: 21, ownerId: 77, status: "done" });
    expect(completeRecurringItemMock).toHaveBeenCalledWith(21, 77);
    const commercialCaller = appRouter.createCaller({ user: { id: 88, role: "user", profile: "commercial" } } as any);
    await expect(commercialCaller.recurring.complete({ id: 21 })).rejects.toThrow();
  });

  it("protege update/archive de ato por perfil técnico e mantém filtro de arquivados", async () => {
    updateRegulatoryActMock.mockClear(); archiveRegulatoryActMock.mockClear(); listRegulatoryActsMock.mockClear();
    const technicalCaller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(technicalCaller.regulatory.update({ id: 31, publishedStatus: "Vigente", expiresAt: new Date("2027-01-10T12:00:00.000Z") })).resolves.toEqual(expect.objectContaining({ id: 31 }));
    await expect(technicalCaller.regulatory.archive({ id: 31 })).resolves.toEqual({ success: true, id: 31 });
    await expect(technicalCaller.regulatory.list()).resolves.toEqual([{ act: { id: 31, archivedAt: null }, regulatoryStatus: "valid" }]);
    expect(updateRegulatoryActMock).toHaveBeenCalled(); expect(archiveRegulatoryActMock).toHaveBeenCalledWith(31); expect(listRegulatoryActsMock).toHaveBeenCalled();
    const commercialCaller = appRouter.createCaller({ user: { id: 88, role: "user", profile: "commercial" } } as any);
    await expect(commercialCaller.regulatory.archive({ id: 31 })).rejects.toThrow();
  });

  it("lista e desvincula evidência por ato com autorização técnica", async () => {
    const technicalCaller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(technicalCaller.evidence.list({ regulatoryActId: 31 })).resolves.toEqual([{ id: 41, regulatoryActId: 31, filename: "licenca.pdf", archivedAt: null }]);
    await expect(technicalCaller.evidence.archive({ id: 41 })).resolves.toEqual({ success: true, id: 41 });
    expect(listEvidenceFilesMock).toHaveBeenCalledWith({ regulatoryActId: 31 }); expect(archiveEvidenceFileMock).toHaveBeenCalledWith(41);
    const commercialCaller = appRouter.createCaller({ user: { id: 88, role: "user", profile: "commercial" } } as any);
    await expect(commercialCaller.evidence.archive({ id: 41 })).rejects.toThrow();
  });

  it("protege update/archive de unidades e contatos por perfil", async () => {
    const technicalCaller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(technicalCaller.units.update({ id: 11, name: "Unidade atualizada", city: "São José do Rio Preto" })).resolves.toEqual(expect.objectContaining({ id: 11 }));
    await expect(technicalCaller.units.archive({ id: 11 })).resolves.toEqual({ success: true, id: 11 });
    await expect(technicalCaller.contacts.update({ id: 12, name: "Contato atualizado", phone: "(17) 99999-0000" })).resolves.toEqual(expect.objectContaining({ id: 12 }));
    await expect(technicalCaller.contacts.archive({ id: 12 })).resolves.toEqual({ success: true, id: 12 });
    expect(updateUnitMock).toHaveBeenCalledWith(11, expect.objectContaining({ city: "São José do Rio Preto" })); expect(archiveUnitMock).toHaveBeenCalledWith(11);
    expect(updateContactMock).toHaveBeenCalledWith(12, expect.objectContaining({ phone: "17999990000" })); expect(archiveContactMock).toHaveBeenCalledWith(12);
    const commercialCaller = appRouter.createCaller({ user: { id: 88, role: "user", profile: "commercial" } } as any);
    await expect(commercialCaller.units.update({ id: 11, name: "Tentativa comercial" })).rejects.toThrow();
    await expect(commercialCaller.units.archive({ id: 11 })).rejects.toThrow();
    await expect(commercialCaller.evidence.list({ regulatoryActId: 31 })).rejects.toThrow();
    await expect(commercialCaller.evidence.archive({ id: 41 })).rejects.toThrow();
    await expect(commercialCaller.contacts.update({ id: 12, name: "Contato comercial" })).resolves.toEqual(expect.objectContaining({ id: 12 }));
    await expect(commercialCaller.contacts.archive({ id: 12 })).resolves.toEqual({ success: true, id: 12 });
    const readOnlyCaller = appRouter.createCaller({ user: { id: 99, role: "user", profile: "user" } } as any);
    await expect(readOnlyCaller.contacts.update({ id: 12, name: "Tentativa sem permissão" })).rejects.toThrow();
    await expect(readOnlyCaller.contacts.archive({ id: 12 })).rejects.toThrow();
  });

  it("persiste decisão de conflito e bloqueia decisão para perfil comercial", async () => {
    decideImportConflictMock.mockClear();
    const technicalCaller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(technicalCaller.imports.decideConflict({ id: 55, decision: "reject", rationale: "Registro não comprovado na fonte" })).resolves.toEqual({ success: true, id: 55, userId: 77, decision: "reject", rationale: "Registro não comprovado na fonte" });
    expect(decideImportConflictMock).toHaveBeenCalledWith(55, 77, "reject", "Registro não comprovado na fonte");
    const commercialCaller = appRouter.createCaller({ user: { id: 88, role: "user", profile: "commercial" } } as any);
    await expect(commercialCaller.imports.decideConflict({ id: 55, decision: "keep_current" })).rejects.toThrow();
  });

  it("atualiza detalhes comerciais com datas normalizadas e bloqueia perfil técnico", async () => {
    updateOpportunityDetailsMock.mockClear();
    const commercialCaller = appRouter.createCaller({ user: { id: 88, role: "user", profile: "commercial" } } as any);
    const nextActionAt = new Date("2026-12-31T12:00:00.000Z");
    await expect(commercialCaller.opportunities.updateDetails({ id: 91, ownerId: 88, estimatedValue: "12500.00", nextAction: "Enviar proposta técnica", nextActionAt, notes: "Escopo preliminar" })).resolves.toEqual(expect.objectContaining({ success: true, id: 91 }));
    expect(updateOpportunityDetailsMock).toHaveBeenCalledWith(91, expect.objectContaining({ ownerId: 88, estimatedValue: "12500.00", nextAction: "Enviar proposta técnica", nextActionAt, notes: "Escopo preliminar" }));
    const technicalCaller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(technicalCaller.opportunities.updateDetails({ id: 91, notes: "Sem permissão" })).rejects.toThrow();
  });

  it("permite mudar etapa pelo contrato comercial e bloqueia perfil técnico", async () => {
    updateOpportunityStageWithLossReasonMock.mockClear();
    const commercialCaller = appRouter.createCaller({ user: { id: 88, role: "user", profile: "commercial" } } as any);
    await expect(commercialCaller.opportunities.updateStage({ id: 91, stage: "lost", lossReason: "Orçamento incompatível" })).resolves.toEqual({ success: true, id: 91, stage: "lost", lossReason: "Orçamento incompatível" });
    expect(updateOpportunityStageWithLossReasonMock).toHaveBeenCalledWith(91, "lost", "Orçamento incompatível");
    const technicalCaller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(technicalCaller.opportunities.updateStage({ id: 91, stage: "proposal" })).rejects.toThrow();
  });

  it("rejeita data inválida no contrato antes de persistir", async () => {
    createRecurringItemMock.mockClear();
    const caller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(caller.recurring.create({ companyId: 12, title: "Renovação de licença", recurrenceType: "anual", dueAt: "não é uma data" as any })).rejects.toThrow();
    expect(createRecurringItemMock).not.toHaveBeenCalledWith(expect.objectContaining({ companyId: 12, title: "Renovação de licença" }));
  });
});
