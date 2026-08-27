type ProposalPdfInput = {
  proposal: {
    id?: number;
    proposalNumber?: string | null;
    version: number;
    investment: string | number;
    paymentTerms?: string | null;
    validityDays: number;
    visitsIncluded?: number | null;
    professional?: string | null;
    status: string;
    issuedAt?: Date | string | null;
    createdAt: Date | string;
    clientSnapshot: string;
    serviceSnapshot: string;
    scopeSnapshot: string;
    deliverablesSnapshot: string;
    exclusionsSnapshot?: string | null;
    requiredDocumentsSnapshot?: string | null;
    missingInformation?: string | null;
    notes?: string | null;
  };
  company?: { legalName?: string | null; tradeName?: string | null; cnpj?: string | null } | null;
  service?: { name?: string | null } | null;
  raizon?: { legalName?: string | null; tradeName?: string | null; cnpj?: string | null; responsibleName?: string | null; professionalTitle?: string | null; crea?: string | null; mte?: string | null; phone?: string | null; email?: string | null; city?: string | null; state?: string | null } | null;
};

function parseSnapshot<T extends Record<string, unknown>>(raw: string, fallback: T): T {
  try { return { ...fallback, ...JSON.parse(raw) } as T; } catch { return fallback; }
}

function formatMoney(value: string | number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0)); }
function formatCnpj(value?: string | null) { const digits = (value ?? "").replace(/\D/g, ""); return digits.length === 14 ? digits.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2") : value || "—"; }

export async function buildProposalPdf(input: ProposalPdfInput) {
  const { jsPDF } = await import("jspdf");
  const { proposal, company, service, raizon } = input;
  const client = parseSnapshot(proposal.clientSnapshot, { legalName: company?.legalName ?? "Cliente não informado", tradeName: company?.tradeName ?? "", cnpj: company?.cnpj ?? "", address: "", addressNumber: "", city: "", state: "" });
  const serviceSnapshot = parseSnapshot(proposal.serviceSnapshot, { name: service?.name ?? "Serviço não informado", category: "", summary: "" });
  const documentDate = new Date(proposal.issuedAt ?? proposal.createdAt);
  const validUntil = new Date(documentDate.getTime() + proposal.validityDays * 86_400_000);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 18;

  const writeSection = (title: string, content?: string | null) => {
    if (!content?.trim()) return;
    const lines = doc.splitTextToSize(content.trim(), pageWidth - margin * 2);
    if (y + 13 + lines.length * 5 > 278) { doc.addPage(); y = 18; }
    doc.setFillColor(22, 34, 31); doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(title.toUpperCase(), margin + 4, y + 5.4);
    y += 14; doc.setTextColor(31, 43, 38); doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(lines, margin, y); y += lines.length * 5 + 7;
  };

  doc.setFillColor(22, 34, 31); doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(raizon?.tradeName || "RAIZON AMBIENTAL", margin, 16);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(raizon?.legalName || "Consultoria Ambiental, SST e SSMA", margin, 23);
  doc.setFontSize(8); doc.text([raizon?.cnpj ? `CNPJ ${formatCnpj(raizon.cnpj)}` : "", [raizon?.city, raizon?.state].filter(Boolean).join("/")].filter(Boolean).join(" · "), margin, 29);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("PROPOSTA COMERCIAL", pageWidth - margin, 16, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(`${proposal.proposalNumber || "RASCUNHO"} · Versão ${String(proposal.version).padStart(2, "0")}`, pageWidth - margin, 23, { align: "right" });
  doc.text(`Emissão: ${documentDate.toLocaleDateString("pt-BR")}`, pageWidth - margin, 29, { align: "right" });
  y = 47;

  doc.setTextColor(31, 43, 38); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("CLIENTE", margin, y);
  y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const clientLines = [client.tradeName && client.tradeName !== client.legalName ? client.tradeName : null, client.legalName, client.cnpj ? `CNPJ ${formatCnpj(String(client.cnpj))}` : null, [client.address, client.addressNumber].filter(Boolean).join(", "), [client.city, client.state].filter(Boolean).join("/")].filter(Boolean) as string[];
  doc.text(clientLines, margin, y); y += clientLines.length * 5 + 7;

  doc.setFillColor(248, 249, 247); doc.rect(margin, y, pageWidth - margin * 2, 31, "F");
  doc.setTextColor(31, 43, 38); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("SERVIÇO", margin + 4, y + 7); doc.text("INVESTIMENTO", margin + 4, y + 19);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(String(serviceSnapshot.name), margin + 32, y + 7); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(formatMoney(proposal.investment), margin + 32, y + 19);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(`Pagamento: ${proposal.paymentTerms || "A definir"}`, margin + 4, y + 27); doc.text(`Validade: até ${validUntil.toLocaleDateString("pt-BR")}`, pageWidth - margin - 4, y + 27, { align: "right" });
  y += 40;

  writeSection("Escopo", proposal.scopeSnapshot);
  writeSection("Entregáveis", proposal.deliverablesSnapshot);
  writeSection("Documentos e informações necessários", proposal.requiredDocumentsSnapshot);
  writeSection("Exclusões", proposal.exclusionsSnapshot);
  writeSection("Informações pendentes", proposal.missingInformation);
  writeSection("Observações", proposal.notes);

  if (y > 245) { doc.addPage(); y = 18; }
  doc.setDrawColor(211, 220, 214); doc.line(margin, y, pageWidth - margin, y); y += 9;
  doc.setTextColor(31, 43, 38); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(proposal.professional || raizon?.responsibleName || "Profissional responsável", margin, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); const credentials = [raizon?.professionalTitle, raizon?.crea && `CREA ${raizon.crea}`, raizon?.mte && `MTE ${raizon.mte}`].filter(Boolean).join(" · "); if (credentials) doc.text(credentials, margin, y + 5);
  const contact = [raizon?.phone, raizon?.email].filter(Boolean).join(" · "); if (contact) doc.text(contact, margin, y + 10);
  doc.setTextColor(101, 115, 108); doc.setFontSize(7.5); doc.text("Documento gerado a partir dos snapshots aprovados no Raizon Intelligence CRM. A proposta permanece sujeita às etapas internas de revisão e emissão.", pageWidth / 2, 288, { align: "center", maxWidth: pageWidth - margin * 2 });
  const fileNumber = (proposal.proposalNumber || `rascunho-${proposal.id ?? ""}`).replace(/[^a-zA-Z0-9-]/g, "-");
  return { doc, filename: `proposta-${fileNumber}-v${proposal.version}.pdf` };
}

export async function downloadProposalPdf(input: ProposalPdfInput) {
  const { doc, filename } = await buildProposalPdf(input);
  doc.save(filename);
}
