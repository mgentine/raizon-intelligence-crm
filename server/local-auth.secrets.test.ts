import { describe, expect, it } from "vitest";

describe("local authentication secrets", () => {
  it("exposes bootstrap credentials only through server environment variables", () => {
    expect(process.env.LOCAL_AUTH_ADMIN_LOGIN).toBeTruthy();
    expect(process.env.LOCAL_AUTH_ADMIN_PASSWORD).toBeTruthy();
  });
});
