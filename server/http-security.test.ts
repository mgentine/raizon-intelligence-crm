import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("proteções HTTP de borda", () => {
  it("mantém headers, rate limits e parser compatível com o limite de evidência", async () => {
    const source = await readFile(new URL("./_core/index.ts", import.meta.url), "utf8");
    expect(source).toContain('app.disable("x-powered-by")');
    expect(source).toContain("app.use(helmet(");
    expect(source).toContain('frameAncestors: ["\'none\'"]');
    expect(source).toContain('app.use("/api/oauth", oauthRateLimit)');
    expect(source).toContain('app.use("/api/trpc", apiRateLimit)');
    expect(source).toContain('limit: "8mb"');
    expect(source).toContain("limit: 300");
    expect(source).toContain("limit: 20");
  });
});
