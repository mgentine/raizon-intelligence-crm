import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("coletor de diagnóstico do navegador", () => {
  it("não registra payload, cabeçalhos ou parâmetros de URL de chamadas tRPC", async () => {
    const source = await readFile(new URL("../client/public/__manus__/debug-collector.js", import.meta.url), "utf8");
    expect(source).toContain('function isSensitiveRpcRequest(url)');
    expect(source).toContain('"[tRPC payload not recorded]"');
    expect(source).toContain('headers: sensitiveRpc ? {} : requestHeaders');
    expect(source).toContain('url: diagnosticUrl(url)');
    expect(source).toContain('url: diagnosticUrl(xhr._manusData.url)');
  });
});
