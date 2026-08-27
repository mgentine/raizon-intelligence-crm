import { describe, expect, it } from "vitest";
import { buildCompanyImportPreviewCandidate, compareCompanyImportCandidate } from "../shared/importRules";

describe("prévia de importação de empresas", () => {
  it("normaliza o registro e rejeita linha sem CNPJ válido ou razão social", () => {
    const valid = buildCompanyImportPreviewCandidate({ cnpj: "04.252.011/0001-10", legalName: " Empresa Ambiental ", city: " votuporanga ", state: "sp", source: "manual" }, 4);
    expect(valid).toMatchObject({ lineNumber: 4, cnpj: "04252011000110", legalName: "Empresa Ambiental", city: "votuporanga", state: "SP", source: "manual" });
    expect(valid.validationMessage).toBeUndefined();

    const invalid = buildCompanyImportPreviewCandidate({ cnpj: "123", legalName: "Empresa inválida" }, 5);
    expect(invalid.validationMessage).toContain("obrigatórios");
  });

  it("lista somente as divergências explícitas contra o cadastro canônico", () => {
    const incoming = buildCompanyImportPreviewCandidate({ cnpj: "12.345.678/0001-90", legalName: "Empresa Ambiental", city: "Votuporanga", state: "SP", segment: "Mineração" }, 1);
    const differences = compareCompanyImportCandidate({ id: 9, legalName: "Empresa Ambiental", tradeName: null, city: "Votuporanga", state: "SP", segment: "Cerâmica" }, incoming);
    expect(differences).toEqual([{ fieldName: "segment", currentValue: "Cerâmica", incomingValue: "Mineração" }]);
  });
});
