import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Building2, Save, ShieldCheck } from "lucide-react";
import { UserAccessManagement } from "./UserAccessManagement";

type MasterForm = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  responsibleName: string;
  professionalTitle: string;
  crea: string;
  mte: string;
  phone: string;
  email: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  signatureText: string;
};

const emptyForm: MasterForm = {
  legalName: "",
  tradeName: "Raizon Ambiental",
  cnpj: "",
  responsibleName: "",
  professionalTitle: "",
  crea: "",
  mte: "",
  phone: "",
  email: "",
  address: "",
  addressNumber: "",
  addressComplement: "",
  neighborhood: "",
  postalCode: "",
  city: "",
  state: "SP",
  signatureText: "",
};

export function RaizonMasterData() {
  const profile = trpc.raizon.profile.useQuery();
  const [form, setForm] = useState<MasterForm>(emptyForm);
  const [feedback, setFeedback] = useState("");
  const save = trpc.raizon.update.useMutation({
    onSuccess: () => { setFeedback("Dados mestres salvos com sucesso."); profile.refetch(); },
    onError: (error) => setFeedback(`Não foi possível salvar: ${error.message}`),
  });

  useEffect(() => {
    if (profile.data) {
      setForm({
        legalName: profile.data.legalName || "",
        tradeName: profile.data.tradeName || "",
        cnpj: profile.data.cnpj || "",
        responsibleName: profile.data.responsibleName || "",
        professionalTitle: profile.data.professionalTitle || "",
        crea: profile.data.crea || "",
        mte: profile.data.mte || "",
        phone: profile.data.phone || "",
        email: profile.data.email || "",
        address: profile.data.address || "",
        addressNumber: profile.data.addressNumber || "",
        addressComplement: profile.data.addressComplement || "",
        neighborhood: profile.data.neighborhood || "",
        postalCode: profile.data.postalCode || "",
        city: profile.data.city || "",
        state: profile.data.state || "SP",
        signatureText: profile.data.signatureText || "",
      });
    }
  }, [profile.data]);

  const update = (field: keyof MasterForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));

  return <><UserAccessManagement /><section className="bg-white border border-[#dfe5e0] p-6 mb-6">
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3"><div className="p-3 bg-[#fbe5e3] text-[#e13b32]"><Building2 className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Cadastro mestre da Raizon</h2><p className="text-sm text-[#65736c] mt-1">Dados que alimentam propostas e documentos oficiais.</p></div></div>
      <ShieldCheck className="h-5 w-5 text-[#e13b32]" aria-label="Acesso administrativo" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input placeholder="Razão social da contratada *" value={form.legalName} onChange={update("legalName")} className="md:col-span-2" />
      <Input placeholder="Nome comercial" value={form.tradeName} onChange={update("tradeName")} />
      <Input placeholder="CNPJ" value={form.cnpj} onChange={update("cnpj")} />
      <Input placeholder="Responsável técnico" value={form.responsibleName} onChange={update("responsibleName")} />
      <Input placeholder="Título profissional" value={form.professionalTitle} onChange={update("professionalTitle")} />
      <Input placeholder="CREA" value={form.crea} onChange={update("crea")} />
      <Input placeholder="MTE" value={form.mte} onChange={update("mte")} />
      <Input placeholder="Telefone" value={form.phone} onChange={update("phone")} />
      <Input placeholder="E-mail" type="email" value={form.email} onChange={update("email")} />
      <Input placeholder="Logradouro" value={form.address} onChange={update("address")} className="md:col-span-2" />
      <Input placeholder="Número" value={form.addressNumber} onChange={update("addressNumber")} />
      <Input placeholder="Complemento" value={form.addressComplement} onChange={update("addressComplement")} />
      <Input placeholder="Bairro" value={form.neighborhood} onChange={update("neighborhood")} />
      <Input placeholder="CEP" value={form.postalCode} onChange={update("postalCode")} />
      <Input placeholder="Município" value={form.city} onChange={update("city")} />
      <Input placeholder="UF" maxLength={2} value={form.state} onChange={update("state")} />
    </div>
    <div className="mt-4"><textarea className="min-h-[112px] w-full border border-[#dfe5e0] bg-white px-3 py-3 text-sm outline-none focus:border-[#e13b32]" placeholder="Assinatura padrão que será usada nos documentos" value={form.signatureText} onChange={update("signatureText")} /></div>
    <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><p className="text-xs text-[#87918c]">Apenas administradores podem alterar estes dados.</p><div className="flex items-center gap-3"><span className="text-sm text-[#65736c]" role="status">{feedback}</span><Button className="bg-[#e13b32] text-white" disabled={save.isPending || !form.legalName.trim()} onClick={() => save.mutate(form)}><Save className="h-4 w-4 mr-2" />{save.isPending ? "Salvando…" : "Salvar dados mestres"}</Button></div></div>
  </section></>;
}
