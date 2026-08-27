import { describe, expect, it } from "vitest";
import { buildProposalPdf } from "../client/src/lib/proposalPdf";

describe("Proposal PDF", () => {
  it("gera documento PDF a partir de snapshots persistidos", async () => {
    const { doc, filename } = await buildProposalPdf({
      proposal: { id: 9, proposalNumber: "RAI-2026-001", version: 2, investment: "12500.00", paymentTerms: "50% na contratação + 50% no protocolo", validityDays: 20, visitsIncluded: 1, professional: "Miguel Gentine", status: "issued", issuedAt: "2026-08-20T12:00:00.000Z", createdAt: "2026-08-19T12:00:00.000Z", clientSnapshot: JSON.stringify({ legalName: "Empresa de Homologação Ltda.", cnpj: "12345678000199", city: "Votuporanga", state: "SP" }), serviceSnapshot: JSON.stringify({ name: "Licenciamento ambiental" }), scopeSnapshot: "Análise de documentos e condução do processo de licenciamento.", deliverablesSnapshot: "Relatório técnico e protocolo do processo.", assumptionsSnapshot: "Abrange uma unidade e exige validação documental antes do protocolo.", exclusionsSnapshot: "Taxas públicas e estudos complementares.", requiredDocumentsSnapshot: "Documentos societários e licenças vigentes.", notes: "Condições sujeitas à confirmação documental." },
      raizon: { tradeName: "Raizon Ambiental", cnpj: "56431364000180", responsibleName: "Miguel Gentine", professionalTitle: "Engenheiro Ambiental" },
    });
    expect(filename).toBe("proposta-RAI-2026-001-v2.pdf");
    expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(1_000);
    expect(doc.output()).toContain("PREMISSAS E LIMITES DO ESCOPO");
  });
});
