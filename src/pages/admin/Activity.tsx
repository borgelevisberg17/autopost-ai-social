import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity as ActivityIcon, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";

type ActivitySource = "agent_runs" | "agent_actions" | "notifications";
type ActivityEntry = {
  id: string;
  label: string;
  detail: string;
  status: string;
  created_at: string;
  source: ActivitySource;
  kind: string;
};
type RunRow = { id: string; agent_name: string; status: string; summary: string | null; started_at: string };
type ActionRow = { id: string; action_type: string | null; status: string | null; created_at: string };
type NotificationRow = { id: string; title: string; message: string; read: boolean; created_at: string };

const SOURCE_LABELS: Record<ActivitySource, string> = {
  agent_runs: "Execuções de agentes",
  agent_actions: "Ações de agentes",
  notifications: "Notificações",
};

function date(value: string) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function Activity() {
  const { company } = useCompany();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<ActivitySource | "all">("all");

  const load = useCallback(async (isRefresh = false) => {
    if (!company) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSourceErrors([]);

    // Keep the three source queries and their existing per-source limits intact.
    const [runs, actions, notices] = await Promise.all([
      supabase.from("agent_runs").select("id,agent_name,status,summary,started_at").eq("company_id", company.id).order("started_at", { ascending: false }).limit(30),
      supabase.from("agent_actions").select("id,action_type,status,created_at").eq("company_id", company.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("notifications").select("id,title,message,read,created_at").eq("company_id", company.id).order("created_at", { ascending: false }).limit(30),
    ]);

    const failures = [
      { key: "agent_runs" as ActivitySource, result: runs },
      { key: "agent_actions" as ActivitySource, result: actions },
      { key: "notifications" as ActivitySource, result: notices },
    ].filter(({ result }) => result.error);
    const failedLabels = failures.map(({ key }) => SOURCE_LABELS[key]);
    setSourceErrors(failedLabels);

    if (failures.length === 3) {
      setEntries([]);
      setError("As três fontes de atividade falharam. Verifique a ligação e tente novamente.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const next: ActivityEntry[] = [
      ...((runs.data as RunRow[] | null) ?? []).map((item) => ({
        id: `run-${item.id}`,
        label: item.agent_name,
        detail: item.summary || "Execução de agente",
        status: item.status,
        created_at: item.started_at,
        source: "agent_runs" as const,
        kind: "Execução",
      })),
      ...((actions.data as ActionRow[] | null) ?? []).map((item) => ({
        id: `action-${item.id}`,
        label: item.action_type || "Ação",
        detail: "Ação registada pelo sistema",
        status: item.status || "registada",
        created_at: item.created_at,
        source: "agent_actions" as const,
        kind: "Ação",
      })),
      ...((notices.data as NotificationRow[] | null) ?? []).map((item) => ({
        id: `notice-${item.id}`,
        label: item.title,
        detail: item.message,
        status: item.read ? "lida" : "nova",
        created_at: item.created_at,
        source: "notifications" as const,
        kind: "Notificação",
      })),
    ]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 60);

    setEntries(next);
    setLoading(false);
    setRefreshing(false);
  }, [company]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleEntries = useMemo(
    () => sourceFilter === "all" ? entries : entries.filter((entry) => entry.source === sourceFilter),
    [entries, sourceFilter]
  );

  return (
    <AdminLayout title="Atividade">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Operação / Atividade"
          title="Atividade"
          description="Uma linha do tempo dos agentes, notificações e ações registadas na operação."
          className="[&_h1]:font-serif [&_h1]:font-medium"
          actions={
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading || refreshing}
              aria-busy={refreshing}
              className="inline-flex h-11 items-center gap-2 border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm font-semibold text-[#5f625d] transition hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] disabled:cursor-not-allowed disabled:opacity-60 sm:h-9"
            >
              <RefreshCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              {refreshing ? "A atualizar..." : "Atualizar"}
            </button>
          }
        />

        {loading ? (
          <LoadingState label="A carregar atividade" />
        ) : error ? (
          <ErrorState description={error} onRetry={() => load(true)} />
        ) : (
          <div className="space-y-5">
            {sourceErrors.length > 0 && (
              <div className="border-l-2 border-[#c56749] bg-[#f5e7e2] px-4 py-3 text-sm leading-5 text-[#7e3929]" role="status">
                Não foi possível carregar: <strong>{sourceErrors.join(", ")}</strong>. Os restantes eventos continuam visíveis.
              </div>
            )}
            <div className="flex flex-col gap-3 border-y border-[#ded9d0] py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#747b73]">
                Até 30 por fonte · máximo de 60 eventos visíveis
              </p>
              <label className="flex min-h-11 items-center gap-2 text-xs font-semibold text-[#5f625d] sm:min-h-0">
                <span className="sr-only">Filtrar atividade por origem</span>
                <select
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value as ActivitySource | "all")}
                  className="h-11 border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm font-normal text-[#202522] outline-none transition focus:border-[#202522] focus:ring-2 focus:ring-[#e36c3f] sm:h-9"
                >
                  <option value="all">Todas as origens</option>
                  <option value="agent_runs">Execuções de agentes</option>
                  <option value="agent_actions">Ações de agentes</option>
                  <option value="notifications">Notificações</option>
                </select>
              </label>
            </div>

            {entries.length === 0 ? (
              <EmptyState
                title="Ainda não existe atividade"
                description="As ações da operação aparecerão aqui quando houver pedidos, agentes ou notificações."
              />
            ) : visibleEntries.length === 0 ? (
              <div className="border-y border-[#ded9d0] px-6 py-12 text-center">
                <p className="font-serif text-lg font-medium text-[#202522]">Nenhum evento desta origem</p>
                <p className="mt-2 text-sm text-[#747b73]">Escolha outra origem entre os eventos já carregados.</p>
              </div>
            ) : (
              <section className="border-y border-[#ded9d0]" aria-label="Linha do tempo de atividade">
                <div className="space-y-1 py-2">
                  {visibleEntries.map((entry) => (
                    <article key={entry.id} className="grid gap-3 px-4 py-4 transition hover:bg-[#f1eee7]/70 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:px-5">
                      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center bg-[#e9eee9] text-[#2c6457]" aria-hidden="true">
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                          <span className="font-serif text-[15px] font-semibold text-[#202522]">{entry.label}</span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#2c6457]">{entry.kind}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#747b73]">{entry.detail}</p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#979c95]">Origem: {entry.source}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                        <span className="inline-flex bg-[#f1eee7] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#5f625d]">{entry.status}</span>
                        <time className="block text-[10px] text-[#979c95] sm:mt-2">{date(entry.created_at)}</time>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
