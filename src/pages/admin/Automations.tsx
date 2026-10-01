import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type AgentRun = {
  id: string;
  agent_name: string;
  status: string | null;
  trigger: string | null;
  started_at: string;
  completed_at: string | null;
  summary: string | null;
};

type FilterValue = "all" | string;

type LooseQueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

type LooseQuery = {
  select: (columns: string) => LooseQuery;
  eq: (column: string, value: string) => LooseQuery;
  order: (column: string, options: { ascending: boolean }) => LooseQuery;
  limit: (count: number) => Promise<LooseQueryResult>;
};

function date(value: string | null) {
  if (!value) return "Ainda em execução / não registado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(parsed);
}

function statusKey(status: string | null) {
  return status?.trim().toLowerCase() || "__empty__";
}

function statusLabel(status: string | null) {
  const value = status?.trim();
  if (!value) return "Sem estado registado";
  if (value.toLowerCase() === "running") return "Em execução";
  if (value.toLowerCase() === "success") return "Concluída";
  if (value.toLowerCase() === "failed") return "Falhou";
  return `Estado não reconhecido · ${value}`;
}

function statusClass(status: string | null) {
  const value = statusKey(status);
  if (value === "success") return "border-[#b8cbbd] bg-[#e9eee9] text-[#2c6457]";
  if (value === "failed") return "border-[#e7c3b8] bg-[#f8e9e4] text-[#9e412c]";
  if (value === "running") return "border-[#d7c9ae] bg-[#f5efe3] text-[#795d31]";
  return "border-[#ded9d0] bg-[#fffdf9] text-[#747b73]";
}

function triggerLabel(trigger: string | null) {
  if (!trigger?.trim()) return "Sem gatilho registado";
  if (trigger.toLowerCase() === "manual") return "Manual";
  return `Gatilho registado · ${trigger}`;
}

export default function Automations() {
  const { company } = useCompany();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    setError(null);
    const queryClient = supabase as unknown as {
      from: (table: string) => LooseQuery;
    };
    const { data, error: queryError } = await queryClient
      .from("agent_runs")
      .select("id,agent_name,status,trigger,started_at,completed_at,summary")
      .eq("company_id", company.id)
      .order("started_at", { ascending: false })
      .limit(50);

    if (queryError) {
      setError("Não foi possível carregar as execuções dos agentes.");
      setRuns([]);
    } else {
      setRuns((data as AgentRun[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const statuses = useMemo(() => Array.from(new Set(runs.map((run) => statusKey(run.status)))), [runs]);
  const filteredRuns = useMemo(() => runs.filter((run) => statusFilter === "all" || statusKey(run.status) === statusFilter), [runs, statusFilter]);
  const summary = useMemo(() => ({
    total: runs.length,
    running: runs.filter((run) => statusKey(run.status) === "running").length,
    success: runs.filter((run) => statusKey(run.status) === "success").length,
    failed: runs.filter((run) => statusKey(run.status) === "failed").length,
  }), [runs]);

  return (
    <AdminLayout title="Automações">
      <div className="space-y-6">
        <section className="pb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">Automação / Execuções</p>
          <h1 className="mt-2 font-serif text-[clamp(2rem,4vw,2.8rem)] font-medium leading-[1.04] tracking-[-0.045em] text-[#202522]">Automações</h1>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-[#747b73]">Acompanhamento das execuções reais de agentes desta loja. Os gatilhos customizáveis não existem nesta interface; não há agendamento nem ativação de regras aqui.</p>
            <Link to="/admin/agentes" className="inline-flex h-9 shrink-0 items-center gap-2 border border-[#ded9d0] bg-[#fffdf9] px-3 text-xs font-semibold text-[#5f625d] hover:bg-[#e9eee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]">Gerir agentes <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>

        <section className="grid gap-px border border-[#ded9d0] bg-[#ded9d0] sm:grid-cols-4">
          {[["Carregadas", summary.total], ["Em execução", summary.running], ["Concluídas", summary.success], ["Falharam", summary.failed]].map(([label, value]) => <div key={String(label)} className="bg-[#fffdf9] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#858c83]">{label}</p><p className="mt-2 font-serif text-2xl text-[#202522]">{value}</p></div>)}
        </section>

        <div className="flex flex-col gap-3 border border-[#ded9d0] bg-[#fffdf9] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-[#202522]">Histórico de execuções</p><p className="mt-1 text-xs text-[#747b73]">Limite de 50 execuções recentes; os estados acima são derivados apenas deste conjunto.</p></div>
          <div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="run-status-filter">Filtrar por estado</label><select id="run-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 min-w-36 border border-[#ded9d0] bg-[#fffdf9] px-2.5 text-xs text-[#5f625d] outline-none focus:border-[#2c6457]"><option value="all">Todos os estados</option>{statuses.map((value) => <option key={value} value={value}>{value === "__empty__" ? "Sem estado registado" : statusLabel(value)}</option>)}</select><button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-2 border border-[#ded9d0] bg-[#f1eee7] px-3 text-xs font-semibold text-[#5f625d] hover:bg-[#e9eee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"><RefreshCw className="h-3.5 w-3.5" />Atualizar</button></div>
        </div>

        {loading ? <div className="grid min-h-[300px] place-items-center border border-[#ded9d0] bg-[#fffdf9]"><div className="flex items-center gap-3 text-sm text-[#747b73]"><Loader2 className="h-4 w-4 animate-spin" />A carregar execuções...</div></div> : error ? <section className="border border-[#e7c3b8] bg-[#fff8f5] p-6"><p className="text-sm font-semibold text-[#9e412c]">Não foi possível mostrar as execuções</p><p className="mt-2 text-sm leading-6 text-[#747b73]">{error} Confirme o acesso à loja e tente novamente.</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex h-9 items-center gap-2 bg-[#202522] px-3 text-xs font-semibold text-white hover:bg-[#2c6457]"><RefreshCw className="h-3.5 w-3.5" />Tentar novamente</button></section> : filteredRuns.length === 0 ? <section className="border border-dashed border-[#cfc9bd] bg-[#fffdf9] p-10 text-center"><Activity className="mx-auto h-5 w-5 text-[#9aa198]" /><p className="mt-4 font-serif text-xl text-[#202522]">Nenhuma execução neste recorte</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#747b73]">Quando um agente for executado, a execução registada aparecerá aqui.</p></section> : <section className="overflow-hidden border border-[#ded9d0] bg-[#fffdf9]">{filteredRuns.map((run) => <article key={run.id} className="border-b border-[#ebe7df] p-4 last:border-0 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-[#202522]">{run.agent_name || "Agente sem nome"}</p><span className={cn("border px-2 py-1 text-[10px] font-semibold", statusClass(run.status))}>{statusLabel(run.status)}</span></div><p className="mt-2 text-xs text-[#858c83]">{triggerLabel(run.trigger)} · início {date(run.started_at)}</p></div><p className="font-mono text-[10px] text-[#a0a59e]" title={run.id}>ID {run.id.slice(0, 8)}</p></div><div className="mt-4 grid gap-3 text-xs text-[#747b73] sm:grid-cols-2"><p><span className="font-semibold text-[#5f625d]">Conclusão:</span> {date(run.completed_at)}</p><p><span className="font-semibold text-[#5f625d]">Resumo:</span> {run.summary || "Sem resumo registado"}</p></div></article>)}</section>}
      </div>
    </AdminLayout>
  );
}
