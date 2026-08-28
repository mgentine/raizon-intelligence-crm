import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Users } from "lucide-react";

function maskEmail(email: string | null) {
  if (!email) return "E-mail não disponível";
  const [local, domain] = email.split("@");
  if (!domain) return "E-mail não disponível";
  return `${local.slice(0, 1)}${local.length > 1 ? "•••" : ""}@${domain}`;
}

export function UserAccessManagement() {
  const { user } = useAuth();
  const users = trpc.access.listUsers.useQuery(undefined, { enabled: user?.role === "admin" });
  const update = trpc.access.updateUser.useMutation({ onSuccess: () => { void users.refetch(); } });

  if (user?.role !== "admin") return <section className="mb-6 border border-[#dfe5e0] bg-white p-5 text-sm text-[#65736c]"><div className="flex items-center gap-2 font-bold text-[#16221f]"><ShieldCheck className="h-4 w-4 text-[#e13b32]" />Acessos de equipe</div><p className="mt-2">A gestão de perfis é exclusiva de administradores.</p></section>;

  return <section className="mb-6 border border-[#dfe5e0] bg-white p-5 sm:p-6" aria-labelledby="access-management-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3"><div className="bg-[#fbe5e3] p-3 text-[#e13b32]"><Users className="h-5 w-5" /></div><div><h2 id="access-management-title" className="text-xl font-black text-[#16221f]">Acessos de equipe</h2><p className="mt-1 text-sm text-[#65736c]">Contas aparecem após o primeiro acesso via Manus OAuth. Defina o perfil mínimo necessário; o CRM não coleta senhas.</p></div></div>
      <Button variant="outline" size="sm" disabled={users.isFetching} onClick={() => void users.refetch()}>{users.isFetching ? "Atualizando…" : "Atualizar lista"}</Button>
    </div>
    {users.isLoading && <p className="py-6 text-sm text-[#65736c]">Carregando acessos…</p>}
    {users.isError && <p className="py-6 text-sm text-[#b32318]">Não foi possível carregar os acessos. Tente atualizar a lista.</p>}
    {!users.isLoading && !users.isError && <div className="mt-5 divide-y divide-[#edf0ee] border-y border-[#edf0ee]">{users.data?.map((managedUser) => <div key={managedUser.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_150px_150px] lg:items-end"><div className="min-w-0"><p className="truncate font-bold text-[#16221f]">{managedUser.name || `Usuário #${managedUser.id}`}</p><p className="mt-1 text-xs text-[#65736c]">{maskEmail(managedUser.email)} · último acesso {new Date(managedUser.lastSignedIn).toLocaleDateString("pt-BR")}</p></div><label className="text-xs font-bold text-[#65736c]">Papel<select className="mt-1 h-10 w-full border border-[#dfe5e0] bg-white px-2 text-sm font-normal text-[#16221f]" defaultValue={managedUser.role} disabled={update.isPending} onChange={(event) => update.mutate({ id: managedUser.id, role: event.target.value as "user" | "admin", profile: managedUser.profile })}><option value="user">Usuário</option><option value="admin">Administrador</option></select></label><label className="text-xs font-bold text-[#65736c]">Perfil operacional<select className="mt-1 h-10 w-full border border-[#dfe5e0] bg-white px-2 text-sm font-normal text-[#16221f]" defaultValue={managedUser.profile} disabled={update.isPending} onChange={(event) => update.mutate({ id: managedUser.id, role: managedUser.role, profile: event.target.value as "commercial" | "technical" })}><option value="commercial">Comercial</option><option value="technical">Técnico</option></select></label></div>)}</div>}
    <p className="mt-4 text-xs text-[#87918c]" role="status">{update.isError ? `Não foi possível salvar: ${update.error.message}` : update.isSuccess ? "Acesso atualizado e registrado em auditoria." : "A conta proprietária e o administrador atual não podem perder administração nesta tela."}</p>
  </section>;
}
