import { describe, expect, it, vi } from "vitest";

const createRecurringItemMock = vi.hoisted(() => vi.fn(async (input: unknown) => input));
const completeRecurringItemMock = vi.hoisted(() => vi.fn(async (id: number, ownerId: number) => ({ id, ownerId, status: "done" })));
const listUpcomingRecurringMock = vi.hoisted(() => vi.fn(async () => [{ item: { id: 21, status: "open" } }]));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, createRecurringItem: createRecurringItemMock, completeRecurringItem: completeRecurringItemMock, listUpcomingRecurring: listUpcomingRecurringMock };
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

  it("rejeita data inválida no contrato antes de persistir", async () => {
    createRecurringItemMock.mockClear();
    const caller = appRouter.createCaller({ user: { id: 77, role: "user", profile: "technical" } } as any);
    await expect(caller.recurring.create({ companyId: 12, title: "Renovação de licença", recurrenceType: "anual", dueAt: "não é uma data" as any })).rejects.toThrow();
    expect(createRecurringItemMock).not.toHaveBeenCalledWith(expect.objectContaining({ companyId: 12, title: "Renovação de licença" }));
  });
});
