import { describe, expect, it } from "vitest";
import { aggregateProposalValueByStatus, filterProposalPanelRows } from "../shared/proposalPanelRules";

const rows = [
  { proposal: { status: "sent", professional: "Miguel Gentine", investment: "2500", proposalNumber: "001/2026" }, company: { tradeName: "Pedreira Alfa", legalName: "Alfa Mineracao Ltda" }, service: { name: "Renovação de LO" } },
  { proposal: { status: "accepted", professional: "Laleska Fernanda", investment: "4800", proposalNumber: "002/2026" }, company: { tradeName: "Concreto Beta", legalName: "Beta Concreto Ltda" }, service: { name: "PGR" } },
  { proposal: { status: "rejected", professional: "Miguel Gentine", investment: "1500", proposalNumber: "003/2026" }, company: { tradeName: "Areia Gama", legalName: "Gama Areia Ltda" }, service: { name: "CADRI" } },
];

describe("Proposal panel rules", () => {
  it("filtra por cliente, serviço, status e profissional", () => {
    expect(filterProposalPanelRows(rows, { search: "beta" })).toHaveLength(1);
    expect(filterProposalPanelRows(rows, { search: "lo" })).toHaveLength(1);
    expect(filterProposalPanelRows(rows, { status: "sent", professional: "Miguel Gentine" })).toHaveLength(1);
    expect(filterProposalPanelRows(rows, { professional: "Laleska Fernanda" })[0].proposal.proposalNumber).toBe("002/2026");
  });

  it("soma somente os valores persistidos por status", () => {
    expect(aggregateProposalValueByStatus(rows, { sent: "Enviada", accepted: "Aceita", rejected: "Recusada" })).toEqual([
      { status: "sent", label: "Enviada", value: 2500 },
      { status: "accepted", label: "Aceita", value: 4800 },
      { status: "rejected", label: "Recusada", value: 1500 },
    ]);
  });
});
