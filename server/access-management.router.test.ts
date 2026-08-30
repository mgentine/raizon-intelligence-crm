import { describe, expect, it, vi } from "vitest";

const listManagedUsersMock = vi.hoisted(() => vi.fn(async () => [{ id: 7, name: "Usuário de teste", email: "u@exemplo.com", role: "user", profile: "technical", lastSignedIn: new Date("2026-08-28T12:00:00.000Z") }]));
const updateManagedUserAccessMock = vi.hoisted(() => vi.fn(async (id: number, input: unknown, actorId: number) => ({ id, ...(input as object), actorId })));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, listManagedUsers: listManagedUsersMock, updateManagedUserAccess: updateManagedUserAccessMock };
});

import { appRouter } from "./routers";

describe("access management", () => {
  it("permite que administrador liste e atualize acesso, registrando o ator", async () => {
    const caller = appRouter.createCaller({ user: { id: 1, role: "admin", profile: "commercial" } } as any);
    await expect(caller.access.listUsers()).resolves.toHaveLength(1);
    await expect(caller.access.updateUser({ id: 7, role: "user", profile: "technical" })).resolves.toMatchObject({ id: 7, actorId: 1 });
    expect(updateManagedUserAccessMock).toHaveBeenCalledWith(7, { id: 7, role: "user", profile: "technical" }, 1);
  });

  it("bloqueia usuários não administradores no servidor", async () => {
    const caller = appRouter.createCaller({ user: { id: 7, role: "user", profile: "commercial" } } as any);
    await expect(caller.access.listUsers()).rejects.toThrow("Perfil sem permissão");
    await expect(caller.access.updateUser({ id: 1, role: "admin", profile: "commercial" })).rejects.toThrow("Perfil sem permissão");
  });

  it("bloqueia perfil sem atribuição operacional da listagem comercial", async () => {
    const caller = appRouter.createCaller({ user: { id: 8, role: "user", profile: "user" } } as any);
    await expect(caller.opportunities.list()).rejects.toThrow("Perfil sem permissão");
  });

  it("bloqueia perfil sem atribuição operacional em consultas de dados do CRM", async () => {
    const caller = appRouter.createCaller({ user: { id: 8, role: "user", profile: "user" } } as any);
    await expect(caller.dashboard.stats()).rejects.toThrow("Perfil sem permissão");
    await expect(caller.dashboard.myQueue()).rejects.toThrow("Perfil sem permissão");
    await expect(caller.leads.list()).rejects.toThrow("Perfil sem permissão");
    await expect(caller.companies.list()).rejects.toThrow("Perfil sem permissão");
    await expect(caller.cnpj.lookup({ cnpj: "45746112000124" })).rejects.toThrow("Perfil sem permissão");
  });
});
