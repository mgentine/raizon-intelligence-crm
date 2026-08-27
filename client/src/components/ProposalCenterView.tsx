import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Copy, FileText, Plus, Send, ShieldCheck, X } from "lucide-react";

const emptyForm = {
  companyId: "",
  opportunityId: "",
  serviceId: "",
  professional: "Miguel Gentine",
  investment: "",
  paymentTerms: "50% na contratação + 50% no protocolo",
  validityDays: "20",
  visitsIncluded: "0",
  missingInformation: "",
  notes: "",
};

const emptyServiceForm = { name: "", category: "", scope: "", deliverables: "" };
const statusLabels: Record<string, string> = { draft: "Rascunho", technical_review: "Revisão técnica", commercial_review: "Revisão comercial", approved_internal: "Aprovada internamente", issued: "Emitida", sent: "Enviada", negotiating: "Negociação", accepted: "Aceita pelo cliente", rejected: "Recusada", cancelled: "Cancelada" };
const professionals = ["Miguel Gentine", "Laleska Fernanda"] as const;

function money(value: string | number | null | undefined) { return value ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)) : "—"; }
function formatCnpj(value: string) { const digits = value.replace(/\D/g, "").slice(0, 14); return digits.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2"); }

export function ProposalCenterView() {
  const { user } = useAuth();
  const proposals = trpc.proposals.list.useQuery();
  const companies = trpc.companies.list.useQuery({});
  const opportunities = trpc.opportunities.list.useQuery();
  const services = trpc.services.list.useQuery();
  const [showForm, setShowForm] = useState(() => new URLSearchParams(window.location.search).get("openProposalForm") === "1");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [feedback, setFeedback] = useState("");

  const selectedCompany = useMemo(() => companies.data?.find((company) => String(company.id) === form.companyId), [companies.data, form.companyId]);
  const companyOpportunities = useMemo(() => opportunities.data?.filter(({ opportunity }) => String(opportunity.companyId) === form.companyId) ?? [], [opportunities.data, form.companyId]);
  const selectedService = useMemo(() => services.data?.find((service) => String(service.id) === form.serviceId), [services.data, form.serviceId]);
  const selectedOpportunity = useMemo(() => companyOpportunities.find((row) => String(row.opportunity.id) === form.opportunityId), [companyOpportunities, form.opportunityId]);
  const canCreateService = user?.role === "admin" || user?.profile === "technical";

  useEffect(() => {
    if (selectedService?.basePrice && !form.investment) setForm((current) => ({ ...current, investment: String(selectedService.basePrice) }));
    if (selectedService?.defaultVisits && form.visitsIncluded === "0") setForm((current) => ({ ...current, visitsIncluded: String(selectedService.defaultVisits) }));
  }, [selectedService?.basePrice, selectedService?.defaultVisits, form.investment, form.visitsIncluded]);

  const create = trpc.proposals.create.useMutation({ onSuccess: () => { setShowForm(false); setForm(emptyForm); setFeedback("Rascunho criado com cliente, profissional e condições comerciais registrados."); proposals.refetch(); }, onError: (error) => setFeedback(`Não foi possível criar o rascunho: ${error.message}`) });
  const createService = trpc.services.create.useMutation({ onSuccess: (service) => { setShowServiceForm(false); setServiceForm(emptyServiceForm); setFeedback("Serviço cadastrado no catálogo e disponível para futuras propostas."); services.refetch(); setForm((current) => ({ ...current, serviceId: String(service) })); }, onError: (error) => setFeedback(`Não foi possível cadastrar o serviço: ${error.message}`) });
  const updateStatus = trpc.proposals.updateStatus.useMutation({ onSuccess: () => { setFeedback("Status atualizado."); proposals.refetch(); }, onError: (error) => setFeedback(`Não foi possível atualizar o status: ${error.message}`) });
  const createVersion = trpc.proposals.createVersion.useMutation({ onSuccess: () => { setFeedback("Nova versão criada como rascunho."); proposals.refetch(); }, onError: (error) => setFeedback(`Não foi possível criar a versão: ${error.message}`) });
  const issue = trpc.proposals.issue.useMutation({ onSuccess: (result) => { setFeedback(`Proposta ${result.proposalNumber} emitida.`); proposals.refetch(); }, onError: (error) => setFeedback(`Não foi possível emitir: ${error.message}`) });

  const set = (field: keyof typeof emptyForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const setService = (field: keyof typeof emptyServiceForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServiceForm((current) => ({ ...current, [field]: event.target.value }));
  const resetCompanyDependentFields = () => setForm((current) => ({ ...current, opportunityId: "", serviceId: current.serviceId }));

  return <div>
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7"><div><p className="text-[#65736c] text-sm">Propostas governadas por cliente, oportunidade e serviço aprovado.</p></div>{(user?.role === "admin" || user?.profile === "commercial") && <Button className="bg-[#e13b32] text-white" onClick={() => { setForm(emptyForm); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" />Nova proposta</Button>}</div>

    {showForm && <section className="bg-white border border-[#dfe5e0] p-6 mb-6" aria-labelledby="new-proposal-title">
      <div className="flex items-start justify-between gap-4 mb-5"><div><h2 id="new-proposal-title" className="text-xl font-black">Nova proposta — rascunho</h2><p className="text-sm text-[#65736c] mt-1">Selecione um cliente cadastrado, escolha o serviço e registre as condições antes da revisão.</p></div><Button variant="outline" size="icon" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="text-xs font-bold text-[#65736c] block mb-1">Cliente cadastrado por CNPJ *</label><select className="h-10 w-full border border-[#dfe5e0] bg-white px-3 text-sm" value={form.companyId} onChange={(event) => { set("companyId")(event); resetCompanyDependentFields(); }}><option value="">Selecione a empresa</option>{companies.data?.map((company) => <option key={company.id} value={company.id}>{formatCnpj(company.cnpj)} — {company.tradeName || company.legalName}</option>)}</select></div>
        <div><label className="text-xs font-bold text-[#65736c] block mb-1">Oportunidade do cliente *</label><select className="h-10 w-full border border-[#dfe5e0] bg-white px-3 text-sm" value={form.opportunityId} onChange={set("opportunityId")} disabled={!form.companyId}><option value="">{form.companyId ? "Selecione a oportunidade" : "Selecione primeiro o cliente"}</option>{companyOpportunities.map(({ opportunity }) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title} · {opportunity.serviceType}</option>)}</select></div>
        <div className="md:col-span-2 bg-[#f5f7f5] border border-[#edf0ee] px-4 py-3 text-sm"><span className="text-[#87918c]">Cliente selecionado: </span><strong>{selectedCompany?.tradeName || selectedCompany?.legalName || "selecione um cliente por CNPJ"}</strong>{selectedCompany?.cnpj && <span className="text-[#65736c]"> · {formatCnpj(selectedCompany.cnpj)}</span>}{selectedOpportunity && <span className="text-[#65736c]"> · oportunidade: {selectedOpportunity.opportunity.title}</span>}</div>
        <div><label className="text-xs font-bold text-[#65736c] block mb-1">Serviço do catálogo *</label><div className="flex gap-2"><select className="h-10 min-w-0 flex-1 border border-[#dfe5e0] bg-white px-3 text-sm" value={form.serviceId} onChange={set("serviceId")}><option value="">Selecione o serviço</option>{services.data?.map((service) => <option key={service.id} value={service.id}>{service.name}{service.basePrice ? ` · ${money(service.basePrice)}` : ""}</option>)}</select>{canCreateService && <Button type="button" variant="outline" size="icon" aria-label="Cadastrar novo serviço" title="Cadastrar novo serviço" onClick={() => setShowServiceForm((current) => !current)}><Plus className="h-4 w-4" /></Button>}</div></div>
        <div><label className="text-xs font-bold text-[#65736c] block mb-1">Profissional responsável *</label><select className="h-10 w-full border border-[#dfe5e0] bg-white px-3 text-sm" value={form.professional} onChange={set("professional")}><option value="">Selecione o profissional</option>{professionals.map((professional) => <option key={professional} value={professional}>{professional}</option>)}</select></div>
        <Input aria-label="Valor da proposta" placeholder="Valor da proposta (R$) *" inputMode="decimal" value={form.investment} onChange={set("investment")} />
        <Input aria-label="Condição de pagamento" placeholder="Condição de pagamento *" value={form.paymentTerms} onChange={set("paymentTerms")} />
        <Input aria-label="Validade da proposta" placeholder="Validade da proposta em dias *" inputMode="numeric" value={form.validityDays} onChange={set("validityDays")} />
        <Input aria-label="Visitas incluídas" placeholder="Visitas incluídas" inputMode="numeric" value={form.visitsIncluded} onChange={set("visitsIncluded")} />
        <textarea className="min-h-[96px] border border-[#dfe5e0] px-3 py-3 text-sm" placeholder="Informações pendentes antes da emissão" value={form.missingInformation} onChange={set("missingInformation")} />
        <textarea className="min-h-[96px] border border-[#dfe5e0] px-3 py-3 text-sm" placeholder="Observações da proposta" value={form.notes} onChange={set("notes")} />
      </div>
      {showServiceForm && canCreateService && <div className="mt-4 border border-[#e13b32]/30 bg-[#fff8f7] p-4"><div className="flex justify-between items-center mb-3"><div><h3 className="font-black">Cadastrar serviço reutilizável</h3><p className="text-xs text-[#65736c] mt-1">O serviço será salvo no catálogo para futuras propostas.</p></div><Button variant="outline" size="icon" aria-label="Fechar cadastro de serviço" onClick={() => setShowServiceForm(false)}><X className="h-4 w-4" /></Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Input placeholder="Nome do serviço *" value={serviceForm.name} onChange={setService("name")} /><Input placeholder="Categoria *" value={serviceForm.category} onChange={setService("category")} /><textarea className="min-h-[84px] border border-[#dfe5e0] px-3 py-3 text-sm" placeholder="Escopo do serviço (mínimo 10 caracteres) *" value={serviceForm.scope} onChange={setService("scope")} /><textarea className="min-h-[84px] border border-[#dfe5e0] px-3 py-3 text-sm" placeholder="Entregáveis (mínimo 5 caracteres) *" value={serviceForm.deliverables} onChange={setService("deliverables")} /></div><div className="mt-3 flex justify-end"><Button className="bg-[#1d2b25] text-white" disabled={createService.isPending || !serviceForm.name || !serviceForm.category || serviceForm.scope.length < 10 || serviceForm.deliverables.length < 5} onClick={() => createService.mutate({ ...serviceForm })}>{createService.isPending ? "Salvando…" : "Salvar no catálogo"}</Button></div></div>}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><p className="text-xs text-[#87918c]">Escopo, entregáveis e exclusões vêm do catálogo e ficam congelados no snapshot.</p><div className="flex items-center gap-3"><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button className="bg-[#e13b32] text-white" disabled={create.isPending || !form.companyId || !form.opportunityId || !form.serviceId || !form.professional || !form.investment || !form.paymentTerms || !form.validityDays} onClick={() => create.mutate({ opportunityId: Number(form.opportunityId), companyId: Number(form.companyId), serviceId: Number(form.serviceId), professional: form.professional as typeof professionals[number], investment: form.investment, paymentTerms: form.paymentTerms, validityDays: Number(form.validityDays || 20), visitsIncluded: Number(form.visitsIncluded || selectedService?.defaultVisits || 0), missingInformation: form.missingInformation, notes: form.notes })}>{create.isPending ? "Criando…" : "Criar rascunho"}</Button></div></div>
    </section>}

    <section className="bg-white border border-[#dfe5e0] p-6"><div className="flex items-start gap-3 mb-5"><FileText className="h-5 w-5 text-[#e13b32] mt-1" /><div><h2 className="text-xl font-black">Painel de propostas</h2><p className="text-sm text-[#65736c] mt-1">Emissão numerada somente após revisão; versões anteriores permanecem preservadas.</p></div></div>{proposals.isLoading && <p className="py-8 text-sm text-[#65736c]">Carregando propostas…</p>}{proposals.isError && <p className="py-8 text-sm text-[#e13b32]">Não foi possível carregar as propostas.</p>}{!proposals.isLoading && !proposals.isError && !proposals.data?.length && <div className="py-12 text-center"><ShieldCheck className="h-8 w-8 text-[#d6ded8] mx-auto mb-3" /><p className="font-bold">Nenhuma proposta cadastrada</p><p className="text-sm text-[#65736c] mt-1">Crie um rascunho a partir de uma oportunidade qualificada.</p></div>}<div className="space-y-4">{proposals.data?.map(({ proposal, company, service }) => <article key={proposal.id} className="border-t border-[#edf0ee] pt-4 first:border-t-0 first:pt-0"><div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{proposal.proposalNumber || "Rascunho"} · V{String(proposal.version).padStart(2, "0")}</h3><span className="text-xs uppercase tracking-[.1em] text-[#87918c]">{statusLabels[proposal.status] || proposal.status}</span></div><p className="text-sm text-[#65736c] mt-2">{company?.tradeName || company?.legalName || `Empresa #${proposal.companyId}`} · {service?.name || "Serviço arquivado"} · {money(proposal.investment)}</p><p className="text-xs text-[#87918c] mt-2">Profissional: {proposal.professional || "não informado"} · Pagamento: {proposal.paymentTerms || "não informado"} · Validade: {proposal.validityDays} dias · Atualizada em {new Date(proposal.updatedAt).toLocaleDateString("pt-BR")}</p></div><div className="flex flex-wrap items-center gap-2"><select aria-label="Status da proposta" className="h-9 border border-[#dfe5e0] bg-white px-2 text-xs" value={proposal.status} onChange={(event) => updateStatus.mutate({ id: proposal.id, status: event.target.value as "draft" })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{!proposal.proposalNumber && (user?.role === "admin" || user?.profile === "commercial") && <Button size="sm" className="bg-[#e13b32] text-white" disabled={issue.isPending} onClick={() => issue.mutate({ id: proposal.id })}><Send className="h-4 w-4 mr-1" />Emitir</Button>}{(user?.role === "admin" || user?.profile === "commercial") && <Button size="sm" variant="outline" onClick={() => createVersion.mutate({ id: proposal.id })}><Copy className="h-4 w-4 mr-1" />Nova versão</Button>}</div></div></article>)}</div></section><p className="text-sm text-[#65736c] mt-4" role="status">{feedback}</p>
  </div>;
}
