import { describe, expect, it, vi } from "vitest";

const getRaizonProfileMock = vi.hoisted(() => vi.fn(async () => null));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getRaizonProfile: getRaizonProfileMock };
});

import { appRouter } from "./routers";

describe("perfil mestre Raizon", () => {
  it("retorna null quando o cadastro mestre ainda não existe", async () => {
    getRaizonProfileMock.mockResolvedValueOnce(null);
    const caller = appRouter.createCaller({ user: { id: 1, role: "admin", profile: "commercial" } } as any);
    await expect(caller.raizon.profile()).resolves.toBeNull();
  });
});
