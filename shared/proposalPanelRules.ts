export type ProposalPanelRow = {
  proposal: {
    status: string;
    professional?: string | null;
    investment?: string | number | null;
    proposalNumber?: string | null;
    createdAt?: Date | string;
    issuedAt?: Date | string | null;
    validityDays?: number;
  };
  company?: { legalName?: string | null; tradeName?: string | null } | null;
  service?: { name?: string | null } | null;
};

export type ProposalPanelFilters = {
  search?: string;
  status?: string;
  professional?: string;
};

export type ProposalPanelSort = "created_desc" | "investment_desc" | "validity_asc";

export function filterProposalPanelRows<T extends ProposalPanelRow>(rows: T[], filters: ProposalPanelFilters): T[] {
  const term = filters.search?.trim().toLowerCase() ?? "";
  return rows.filter(({ proposal, company, service }) => {
    const client = `${company?.tradeName ?? ""} ${company?.legalName ?? ""}`.toLowerCase();
    const serviceName = (service?.name ?? "").toLowerCase();
    const matchesSearch = !term || client.includes(term) || serviceName.includes(term) || (proposal.professional ?? "").toLowerCase().includes(term) || (proposal.proposalNumber ?? "").toLowerCase().includes(term);
    const matchesStatus = !filters.status || filters.status === "all" || proposal.status === filters.status;
    const matchesProfessional = !filters.professional || filters.professional === "all" || proposal.professional === filters.professional;
    return matchesSearch && matchesStatus && matchesProfessional;
  });
}

export function aggregateProposalValueByStatus(rows: ProposalPanelRow[], labels: Record<string, string>) {
  return Object.entries(labels)
    .map(([status, label]) => ({ status, label, value: rows.filter((row) => row.proposal.status === status).reduce((total, row) => total + Number(row.proposal.investment || 0), 0) }))
    .filter((item) => item.value > 0);
}

export function sortProposalPanelRows<T extends ProposalPanelRow>(rows: T[], sort: ProposalPanelSort): T[] {
  return [...rows].sort((left, right) => {
    if (sort === "investment_desc") return Number(right.proposal.investment || 0) - Number(left.proposal.investment || 0);
    if (sort === "validity_asc") {
      const leftExpiresAt = new Date(left.proposal.issuedAt ?? left.proposal.createdAt ?? 0).getTime() + Number(left.proposal.validityDays || 0) * 86_400_000;
      const rightExpiresAt = new Date(right.proposal.issuedAt ?? right.proposal.createdAt ?? 0).getTime() + Number(right.proposal.validityDays || 0) * 86_400_000;
      return leftExpiresAt - rightExpiresAt;
    }
    return new Date(right.proposal.createdAt ?? 0).getTime() - new Date(left.proposal.createdAt ?? 0).getTime();
  });
}
