import type { Document } from "docx";
import type { ProposalPdfInput } from "./proposalPdf";

export type ProposalDocxInput = ProposalPdfInput;

type SnapshotClient = {
  legalName?: string;
  tradeName?: string;
  cnpj?: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  state?: string;
};

type SnapshotService = { name?: string; category?: string; summary?: string };

export type ProposalDocxContent = {
  proposalNumber: string;
  version: number;
  documentDate: Date;
  validUntil: Date;
  title: string;
  clientLines: string[];
  overviewRows: Array<[string, string]>;
  executiveSummary: string;
  scope: string;
  deliverables: string;
  assumptions: string;
  exclusions: string;
  requiredDocuments: string;
  missingInformation: string;
  notes: string;
  investment: string;
  paymentTerms: string;
  professional: string;
  credentials: string;
  contact: string;
};

function parseSnapshot<T extends Record<string, unknown>>(raw: string, fallback: T): T {
  try { return { ...fallback, ...JSON.parse(raw) } as T; } catch { return fallback; }
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function formatDate(value: Date) {
  return value.toLocaleDateString("pt-BR");
}

function formatCnpj(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length === 14 ? digits.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2") : value || "";
}

function listLines(value?: string | null) {
  return (value ?? "").split(/\n|\r\n?/).map((line) => line.trim()).filter(Boolean);
}

export function getProposalDocxContent(input: ProposalDocxInput): ProposalDocxContent {
  const { proposal, company, service, raizon } = input;
  const client = parseSnapshot<SnapshotClient>(proposal.clientSnapshot, {
    legalName: company?.legalName ?? "Cliente não informado",
    tradeName: company?.tradeName ?? "",
    cnpj: company?.cnpj ?? "",
    address: "",
    addressNumber: "",
    city: "",
    state: "",
  });
  const serviceSnapshot = parseSnapshot<SnapshotService>(proposal.serviceSnapshot, {
    name: service?.name ?? "Serviço não informado",
    category: "",
    summary: "",
  });
  const documentDate = new Date(proposal.issuedAt ?? proposal.createdAt);
  const validUntil = new Date(documentDate.getTime() + proposal.validityDays * 86_400_000);
  const clientName = client.tradeName && client.tradeName !== client.legalName ? `${client.tradeName} — ${client.legalName}` : client.legalName || "Cliente não informado";
  const clientAddress = [client.address, client.addressNumber].filter(Boolean).join(", ");
  const clientLocation = [client.city, client.state].filter(Boolean).join("/");
  const clientLines = [clientName, client.cnpj ? `CNPJ ${formatCnpj(client.cnpj)}` : "", clientAddress, clientLocation].filter(Boolean);
  const credentials = [raizon?.professionalTitle, raizon?.crea && `CREA ${raizon.crea}`, raizon?.mte && `MTE ${raizon.mte}`].filter(Boolean).join(" · ");
  const contact = [raizon?.phone, raizon?.email].filter(Boolean).join(" · ");
  const overviewRows: Array<[string, string]> = [
    ["Cliente", clientName],
    ...(client.cnpj ? [["CNPJ", formatCnpj(client.cnpj)] as [string, string]] : []),
    ...(clientAddress || clientLocation ? [["Unidade / endereço", [clientAddress, clientLocation].filter(Boolean).join(" — ")] as [string, string]] : []),
    ...(raizon?.legalName ? [["Contratada", raizon.legalName] as [string, string]] : []),
    ["Responsável técnico", proposal.professional || raizon?.responsibleName || "Profissional não informado"],
  ];

  return {
    proposalNumber: proposal.proposalNumber || "RASCUNHO",
    version: proposal.version,
    documentDate,
    validUntil,
    title: String(serviceSnapshot.name || service?.name || "Serviço técnico").toUpperCase(),
    clientLines,
    overviewRows,
    executiveSummary: serviceSnapshot.summary?.trim() || "Esta proposta foi estruturada a partir dos snapshots aprovados no Raizon Intelligence CRM.",
    scope: proposal.scopeSnapshot,
    deliverables: proposal.deliverablesSnapshot,
    assumptions: proposal.assumptionsSnapshot || "",
    exclusions: proposal.exclusionsSnapshot || "",
    requiredDocuments: proposal.requiredDocumentsSnapshot || "",
    missingInformation: proposal.missingInformation || "",
    notes: proposal.notes || "",
    investment: formatMoney(proposal.investment),
    paymentTerms: proposal.paymentTerms || "A definir",
    professional: proposal.professional || raizon?.responsibleName || "Profissional responsável",
    credentials,
    contact,
  };
}

export async function buildProposalDocx(input: ProposalDocxInput): Promise<{ document: Document; filename: string }> {
  const {
    AlignmentType,
    BorderStyle,
    Document: DocxDocument,
    Footer,
    Header,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
  } = await import("docx");
  void Packer;
  const content = getProposalDocxContent(input);
  const border = { style: BorderStyle.SINGLE, size: 4, color: "D7DDD8" };
  const pageNumber = content.proposalNumber.replace(/[^a-zA-Z0-9-]/g, "-");
  const bodySections = (title: string, value: string, options?: { bullet?: boolean; shaded?: boolean }) => {
    if (!value.trim()) return [];
    const paragraphs = listLines(value).map((line) => new Paragraph({
      text: line,
      bullet: options?.bullet ? { level: 0 } : undefined,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 90, line: 280 },
    }));
    return [
      new Paragraph({ text: title.toUpperCase(), heading: "Heading2", spacing: { before: 250, after: 110 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1E4C40", space: 3 } } }),
      ...(options?.shaded ? [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: "F3F4F0" }, margins: { top: 140, bottom: 140, left: 180, right: 180 }, children: paragraphs })] })] })] : paragraphs),
    ];
  };

  const header = new Header({ children: [
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
      new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "B79A55" } }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: "RAIZON", bold: true, size: 30, color: "1E4C40" }), new TextRun({ text: "\nambiental", size: 16, color: "1E4C40" })] })] }),
      new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "B79A55" } }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "PROPOSTA COMERCIAL", bold: true, size: 17, color: "B79A55" }), new TextRun({ text: `\nProposta nº ${content.proposalNumber}`, bold: true, size: 16, color: "1E4C40" })] })] }),
    ] })] }),
  ] });

  const overviewTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: content.overviewRows.map(([label, value]) => new TableRow({ children: [
    new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "F3F4F0" }, borders: { top: border, bottom: border, left: border, right: border }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: "1E4C40" })] })] }),
    new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, borders: { top: border, bottom: border, left: border, right: border }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: value, size: 18, color: "26342F" })] })] }),
  ] })) });

  const investmentTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ children: [
      new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "1E4C40" }, borders: { top: border, bottom: border, left: border, right: border }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DESCRIÇÃO", bold: true, size: 18, color: "FFFFFF" })] })] }),
      new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "1E4C40" }, borders: { top: border, bottom: border, left: border, right: border }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "INVESTIMENTO", bold: true, size: 18, color: "FFFFFF" })] })] }),
    ] }),
    new TableRow({ children: [
      new TableCell({ borders: { top: border, bottom: border, left: border, right: border }, margins: { top: 120, bottom: 120, left: 150, right: 150 }, children: [new Paragraph({ text: content.title, alignment: AlignmentType.JUSTIFIED, spacing: { line: 270 } })] }),
      new TableCell({ borders: { top: border, bottom: border, left: border, right: border }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: content.investment, bold: true, size: 21, color: "1E4C40" })] })] }),
    ] }),
  ] });

  const document = new DocxDocument({
    creator: "Raizon Intelligence CRM",
    title: `Proposta ${content.proposalNumber}`,
    description: "Proposta comercial gerada a partir de snapshots aprovados no Raizon Intelligence CRM.",
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1040, left: 980, right: 980 } } },
      headers: { default: header },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 12, color: "B79A55", space: 4 } }, children: [new TextRun({ text: [input.raizon?.phone, input.raizon?.email, "www.raizonambiental.com.br"].filter(Boolean).join("   •   "), size: 14, color: "1E4C40" })] })] }) },
      children: [
        new Paragraph({ text: content.title, heading: "Title", spacing: { before: 370, after: 120 }, alignment: AlignmentType.LEFT }),
        new Paragraph({ text: `Proposta comercial para ${content.clientLines[0] || "cliente não informado"}.`, spacing: { after: 240 }, alignment: AlignmentType.LEFT }),
        overviewTable,
        ...bodySections("Resumo executivo", content.executiveSummary, { shaded: true }),
        ...bodySections("Escopo técnico", content.scope, { bullet: true }),
        ...bodySections("Entregáveis", content.deliverables, { bullet: true }),
        ...bodySections("Premissas e limites do escopo", content.assumptions, { bullet: true }),
        new Paragraph({ text: "INVESTIMENTO", heading: "Heading2", spacing: { before: 250, after: 110 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1E4C40", space: 3 } } }),
        investmentTable,
        ...bodySections("Forma de pagamento", content.paymentTerms, { shaded: true }),
        ...bodySections("Validade da proposta", `Esta proposta é válida até ${formatDate(content.validUntil)}.`, { shaded: true }),
        ...bodySections("Não estão inclusos", content.exclusions, { bullet: true }),
        ...bodySections("Documentos iniciais necessários", content.requiredDocuments, { bullet: true }),
        ...bodySections("Informações pendentes", content.missingInformation, { shaded: true }),
        ...bodySections("Observações", content.notes, { shaded: true }),
        new Paragraph({ text: "RESPONSÁVEL TÉCNICO", heading: "Heading2", spacing: { before: 290, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1E4C40", space: 3 } } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 440, after: 60 }, children: [new TextRun({ text: content.professional, bold: true, size: 20, color: "1E4C40" })] }),
        ...(content.credentials ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: content.credentials, size: 16 })] })] : []),
        ...(content.contact ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: content.contact, size: 16 })] })] : []),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 220 }, children: [new TextRun({ text: `Documento gerado em ${formatDate(new Date())} a partir dos snapshots aprovados no Raizon Intelligence CRM.`, italics: true, size: 13, color: "65736C" })] }),
      ],
    }],
  });

  return { document, filename: `proposta-${pageNumber}-v${content.version}.docx` };
}

export async function downloadProposalDocx(input: ProposalDocxInput) {
  const { document, filename } = await buildProposalDocx(input);
  const { Packer } = await import("docx");
  const blob = await Packer.toBlob(document);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
