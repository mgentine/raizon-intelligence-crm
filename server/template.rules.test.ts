import { describe, expect, it } from "vitest";
import { DOCX_MIME, validateDocxTemplateMetadata } from "../shared/templateRules";

describe("Template rules", () => {
  it("sanitiza o nome e retorna MIME canônico para DOCX", () => {
    expect(validateDocxTemplateMetadata(" modelo final 2026.docx ", DOCX_MIME)).toEqual({ normalizedFilename: "modelo_final_2026.docx", mimeType: DOCX_MIME });
  });

  it("aceita octet-stream para navegadores que não informam MIME", () => {
    expect(validateDocxTemplateMetadata("modelo.docx", "application/octet-stream").mimeType).toBe(DOCX_MIME);
  });

  it("rejeita arquivos que não sejam DOCX", () => {
    expect(() => validateDocxTemplateMetadata("modelo.pdf", "application/pdf")).toThrow("DOCX válido");
  });
});
