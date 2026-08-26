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

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, createRecurringItem: createRecurringItemMock, completeRecurringItem: completeRecurringItemMock, listUpcomingRecurring: listUpcomingRecurringMock, updateRegulatoryAct: updateRegulatoryActMock, archiveRegulatoryAct: archiveRegulatoryActMock, listRegulatoryActs: listRegulatoryActsMock, listEvidenceFiles: listEvidenceFilesMock, archiveEvidenceFile: archiveEvidenceFileMock, updateUnit: updateUnitMock, archiveUnit: archiveUnitMock, updateContact: updateContactMock, archiveContact: archiveContactMock };
});

import { appRouter } from "./routers";

describe("normalização nas mutations", () => {
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

  it("rejeita data inválida no contrato antes de persistir", async () => {
    createRecurringItemMock.mockClear();
    const caller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(caller.recurring.create({ companyId: 12, title: "Renovação de licença", recurrenceType: "anual", dueAt: "não é uma data" as any })).rejects.toThrow();
    expect(createRecurringItemMock).not.toHaveBeenCalledWith(expect.objectContaining({ companyId: 12, title: "Renovação de licença" }));
  });
});
