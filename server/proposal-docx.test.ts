import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { buildProposalDocx, getProposalDocxContent } from "../client/src/lib/proposalDocx";

const input = {
  proposal: {
    id: 58,
    proposalNumber: "RAI-2026-058",
    version: 1,
    investment: "9800.00",
    paymentTerms: "50% na contratação + 50% no protocolo",
    validityDays: 20,
    visitsIncluded: 0,
    professional: "Miguel Gentine",
    status: "issued",
    issuedAt: "2026-08-27T12:00:00.000Z",
    createdAt: "2026-08-27T12:00:00.000Z",
    clientSnapshot: JSON.stringify({ legalName: "TANSAN INDUSTRIA QUIMICA LTDA", tradeName: "SIBELCO BRASIL", cnpj: "20927059001885", city: "Jarinu", state: "SP" }),
    serviceSnapshot: JSON.stringify({ name: "Renovação de outorgas subterrâneas", summary: "Análise documental, elaboração e acompanhamento técnico da renovação." }),
    scopeSnapshot: "Análise da documentação, conferência cadastral e preparação do pedido de renovação.",
    deliverablesSnapshot: "Checklist técnico, documentos organizados e protocolo quando aplicável.",
    assumptionsSnapshot: "As informações e os documentos entregues pela contratante devem ser suficientes para instrução do pedido.",
    exclusionsSnapshot: "Taxas públicas, estudos complementares e intervenções físicas não estão inclusos.",
    requiredDocumentsSnapshot: "Ato vigente, processos vinculados e documentos técnicos das captações.",
    missingInformation: "Aguardar confirmação do ato completo e dos dados técnicos.",
    notes: "A situação regulatória deve ser validada na fonte oficial.",
  },
  raizon: { legalName: "Raizon Ambiental", tradeName: "Raizon Ambiental", cnpj: "59786718000106", responsibleName: "Miguel Gentine", professionalTitle: "Engenheiro Ambiental", crea: "5070449007", phone: "(17) 99604-6995", email: "contato@raizonambiental.com.br" },
};

describe("Proposal DOCX", () => {
  it("organiza o Word a partir de snapshots confirmados, sem inventar dados", () => {
    const content = getProposalDocxContent(input);
    expect(content.title).toBe("RENOVAÇÃO DE OUTORGAS SUBTERRÂNEAS");
    expect(content.overviewRows).toContainEqual(["Cliente", "SIBELCO BRASIL — TANSAN INDUSTRIA QUIMICA LTDA"]);
    expect(content.assumptions).toContain("documentos entregues");
    expect(content.exclusions).toContain("Taxas públicas");
    expect(content.validUntil.toISOString().slice(0, 10)).toBe("2026-09-16");
  });

  it("gera um arquivo DOCX válido com nome versionado", async () => {
    const { document, filename } = await buildProposalDocx(input);
    const bytes = await Packer.toBuffer(document);
    expect(filename).toBe("proposta-RAI-2026-058-v1.docx");
    expect(bytes.byteLength).toBeGreaterThan(1_000);
    expect(Buffer.from(bytes).subarray(0, 2).toString()).toBe("PK");
  });
});
