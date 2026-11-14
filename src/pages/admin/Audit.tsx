import { useCallback, useEffect, useMemo, useState } from "react";
import { FileClock, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";

type AuditEntry = {
  id: string;
  actor_type: string;
  actor_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

type AuditGroup = { key: string; label: string; entries: AuditEntry[] };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function targetId(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

export default function Audit() {
  const { company } = useCompany();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!company) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: auditError } = await supabase
      .from("audit_logs")
      .select("id,actor_type,actor_name,action,target_type,target_id,created_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (auditError) {
      setEntries([]);
      setError("Não foi possível carregar o audit log. Verifique a ligação e tente novamente.");
    } else {
      setEntries((data as AuditEntry[]) ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [company]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo<AuditGroup[]>(() => {
    const grouped = new Map<string, AuditGroup>();
    entries.forEach((entry) => {
      const date = new Date(entry.created_at);
      const key = new Intl.DateTimeFormat("en-CA").format(date);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          label: new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date),
          entries: [],
        });
      }
      grouped.get(key)?.entries.push(entry);
    });
    return Array.from(grouped.values());
  }, [entries]);

  return (
    <AdminLayout title="Audit Log">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Sistema & Segurança"
          title="Registo de Auditoria"
          description="Histórico rastreável e imutável de todas as ações administrativas realizadas na loja."
          actions={
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading || refreshing}
              aria-busy={refreshing}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              {refreshing ? "A atualizar..." : "Atualizar"}
            </button>
          }
        />

        {loading ? (
          <LoadingState label="A carregar registos de auditoria..." />
        ) : error ? (
          <ErrorState description={error} onRetry={() => load(true)} />
        ) : entries.length === 0 ? (
          <EmptyState
            title="Ainda não existem registos"
            description="As ações da loja aparecerão aqui quando forem registadas pela plataforma."
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`audit-${group.key}`} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <h2 id={`audit-${group.key}`} className="font-sans text-sm font-bold capitalize text-slate-900">
                    {group.label}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                    {group.entries.length} {group.entries.length === 1 ? "evento" : "eventos"}
                  </span>
                </div>
                <ol className="relative ml-3 border-l border-slate-200 mt-4 space-y-4">
                  {group.entries.map((entry) => (
                    <li key={entry.id} className="relative grid gap-2 pl-6 sm:grid-cols-[minmax(0,1fr)_160px_140px] sm:items-start">
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-bold text-slate-900">{entry.action}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {entry.target_type || "Operação"}
                          {entry.target_id && (
                            <span
                              className="ml-1 font-mono text-[10px] text-slate-400 font-medium"
                              title={`ID: ${entry.target_id}`}
                            >
                              · {targetId(entry.target_id)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-900">{entry.actor_name}</span>
                        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-slate-400">{entry.actor_type}</span>
                      </div>
                      <time className="text-xs text-slate-400 sm:text-right font-medium">{formatDate(entry.created_at)}</time>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
