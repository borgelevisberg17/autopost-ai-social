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
  if (value === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  if (value === "running") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function triggerLabel(trigger: string | null) {
  if (!trigger?.trim()) return "Sem gatilho registado";
  if (trigger.toLowerCase() === "manual") return "Manual";
  return `Gatilho · ${trigger}`;
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
        <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-800 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              SISTEMA & AUTOMAÇÕES
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Automações & Execuções
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Acompanhamento de rotinas e execuções autónomas dos agentes da sua loja.
            </p>
          </div>
          <Link
            to="/admin/agentes"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            Gerir agentes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        {/* METRICS */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Carregadas
            </span>
            <p className="mt-2 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {summary.total}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Em Execução
            </span>
            <p className="mt-2 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-amber-600">
              {summary.running}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Concluídas
            </span>
            <p className="mt-2 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600">
              {summary.success}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Falharam
            </span>
            <p className="mt-2 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-rose-600">
              {summary.failed}
            </p>
          </div>
        </section>

        {/* TOOLBAR */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Histórico de Execuções Recentes</p>
            <p className="mt-0.5 text-xs text-slate-400">Últimas 50 execuções registadas pelo motor de IA.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="run-status-filter">Filtrar por estado</label>
            <select
              id="run-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            >
              <option value="all">Todos os estados</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value === "__empty__" ? "Sem estado registado" : statusLabel(value)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        </div>

        {/* LIST / EMPTY / ERROR */}
        {loading ? (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              A carregar execuções...
            </div>
          </div>
        ) : error ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-6 text-center">
            <p className="text-sm font-bold text-rose-800">Não foi possível carregar as execuções</p>
            <p className="mt-1 text-xs text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </section>
        ) : filteredRuns.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
            <Activity className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-sans text-base font-bold text-slate-900">Nenhuma execução registada</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Quando os agentes forem acionados, o progresso detalhado de cada execução surgirá nesta secção.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
            {filteredRuns.map((run) => (
              <article key={run.id} className="p-4 sm:p-5 transition hover:bg-slate-50/60">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-sans text-sm font-bold text-slate-900">
                        {run.agent_name || "Agente Autónomo"}
                      </p>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusClass(run.status))}>
                        {statusLabel(run.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {triggerLabel(run.trigger)} · início a {date(run.started_at)}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] font-medium text-slate-400" title={run.id}>
                    ID: #{run.id.slice(0, 8)}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-2">
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-900">Conclusão:</span> {date(run.completed_at)}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-900">Resumo:</span> {run.summary || "Sem notas adicionais"}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
