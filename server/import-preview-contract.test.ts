import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("contrato de prévia de importação", () => {
  it("expõe somente a mutation de staging e não o antigo caminho de escrita direta", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const db = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const page = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");

    expect(router).toContain("previewImport:");
    expect(router).toContain("createCompanyImportPreview");
    expect(router).not.toContain("bulkUpsert:");
    expect(db).toContain("importStaging");
    expect(db).toContain("importConflicts");
    expect(db).toContain('status: "review_required"');
    const previewBody = db.slice(db.indexOf("export async function createCompanyImportPreview"), db.indexOf("/** @deprecated Importação canônica direta"));
    expect(previewBody).toContain("tx.insert(importStaging)");
    expect(previewBody).toContain("tx.insert(importConflicts)");
    expect(previewBody).not.toContain("tx.insert(companies)");
    expect(previewBody).not.toContain("tx.update(companies)");
    expect(page).toContain("trpc.companies.previewImport.useMutation");
    expect(page).toContain("Nenhuma empresa foi criada ou alterada.");
  });
});
