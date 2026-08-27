export type ProposalPanelRow = {
  proposal: {
    status: string;
    professional?: string | null;
    investment?: string | number | null;
    proposalNumber?: string | null;
  };
  company?: { legalName?: string | null; tradeName?: string | null } | null;
  service?: { name?: string | null } | null;
};

export type ProposalPanelFilters = {
  search?: string;
  status?: string;
  professional?: string;
};

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
