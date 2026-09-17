import { describe, expect, it } from "vitest";
import { hashPassword, isLocalOpenId, localOpenIdForUser, verifyPassword } from "./localAuth";

describe("local authentication password handling", () => {
  it("stores a scrypt-derived value and never the plain password", async () => {
    const password = "SenhaTesteSegura123!";
    const encoded = await hashPassword(password);
    expect(encoded.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(encoded).not.toContain(password);
    expect(await verifyPassword(password, encoded)).toBe(true);
    expect(await verifyPassword("senha-incorreta", encoded)).toBe(false);
  });

  it("rejects malformed hashes without throwing", async () => {
    expect(await verifyPassword("qualquer", "plain-text-password")).toBe(false);
    expect(await verifyPassword("qualquer", null)).toBe(false);
  });

  it("uses a distinct namespace for local sessions", () => {
    expect(localOpenIdForUser(8460001)).toBe("local:8460001");
    expect(isLocalOpenId("local:8460001")).toBe(true);
    expect(isLocalOpenId("oauth-open-id")).toBe(false);
  });
});
