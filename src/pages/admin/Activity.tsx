import { useEffect, useState } from "react";
import { Activity as ActivityIcon, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState, LoadingState } from "@/components/ui/data-state";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ActivityEntry = { id: string; label: string; detail: string; status: string; created_at: string };
type RunRow = { id: string; agent_name: string; status: string; summary: string | null; started_at: string };
type ActionRow = { id: string; action_type: string | null; status: string | null; created_at: string };
type NotificationRow = { id: string; title: string; message: string; read: boolean; created_at: string };

function date(value: string) { return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default function Activity() {
  const { company } = useCompany();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!company) return;
    setLoading(true);
    const [runs, actions, notices] = await Promise.all([
      supabase.from("agent_runs").select("id,agent_name,status,summary,started_at").eq("company_id", company.id).order("started_at", { ascending: false }).limit(30),
      supabase.from("agent_actions").select("id,action_type,status,created_at").eq("company_id", company.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("notifications").select("id,title,message,read,created_at").eq("company_id", company.id).order("created_at", { ascending: false }).limit(30),
    ]);
    if (runs.error && actions.error && notices.error) toast.error("Não foi possível carregar a atividade.");
    const next: ActivityEntry[] = [
      ...((runs.data as RunRow[] | null) ?? []).map((item) => ({ id: `run-${item.id}`, label: item.agent_name, detail: item.summary || "Execução de agente", status: item.status, created_at: item.started_at })),
      ...((actions.data as ActionRow[] | null) ?? []).map((item) => ({ id: `action-${item.id}`, label: item.action_type || "Ação", detail: "Ação registada pelo sistema", status: item.status || "registada", created_at: item.created_at })),
      ...((notices.data as NotificationRow[] | null) ?? []).map((item) => ({ id: `notice-${item.id}`, label: item.title, detail: item.message, status: item.read ? "lida" : "nova", created_at: item.created_at })),
    ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 60);
    setEntries(next);
    setLoading(false);
  };

  useEffect(() => { load(); }, [company?.id]);

  return <AdminLayout title="Atividade"><div className="space-y-8"><PageHeader eyebrow="Operação / Atividade" title="Atividade" description="Uma linha do tempo dos agentes, notificações e ações registadas na operação." actions={<button type="button" onClick={load} className="inline-flex h-9 items-center gap-2 border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm font-semibold text-[#5f625d]"><RefreshCw className="h-3.5 w-3.5" />Atualizar</button>} />{loading ? <LoadingState label="A carregar atividade" /> : entries.length === 0 ? <EmptyState title="Ainda não existe atividade" description="As ações da operação aparecerão aqui quando houver pedidos, agentes ou notificações." /> : <section className="border border-[#ded9d0] bg-[#fffdf9]">{entries.map((entry) => <div key={entry.id} className="flex gap-4 border-b border-[#ebe7df] px-5 py-4 last:border-0"><div className="mt-1 grid h-7 w-7 shrink-0 place-items-center bg-[#e9eee9] text-[#2c6457]"><ActivityIcon className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-[#202522]">{entry.label}</span><time className="text-[10px] text-[#979c95]">{date(entry.created_at)}</time></div><p className="mt-1 text-xs leading-5 text-[#747b73]">{entry.detail}</p></div><span className="h-fit border border-[#ded9d0] px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-[#747b73]">{entry.status}</span></div>)}</section>}</div></AdminLayout>;
}
