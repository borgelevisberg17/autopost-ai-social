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
    <AdminLayout title="Audit log">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Sistema / Segurança"
          title="Audit log"
          description="Histórico das ações realizadas na operação."
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
          <LoadingState label="A carregar registos" />
        ) : error ? (
          <ErrorState description={error} onRetry={() => load(true)} />
        ) : entries.length === 0 ? (
          <EmptyState
            title="Ainda não existem registos"
            description="As ações importantes da operação aparecerão aqui quando forem registadas pelo backend."
          />
        ) : (
          <section aria-label="Cronologia do audit log" className="border-y border-[#ded9d0]">
            <div className="space-y-9 py-5">
              {groups.map((group) => (
                <section key={group.key} aria-labelledby={`audit-${group.key}`}>
                  <div className="flex items-baseline justify-between gap-4 px-4 pb-3 sm:px-5">
                    <h2 id={`audit-${group.key}`} className="font-serif text-lg font-medium capitalize tracking-[-0.025em] text-[#202522]">
                      {group.label}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#979c95]">{group.entries.length} registos</span>
                  </div>
                  <ol className="relative ml-5 border-l border-[#ded9d0] sm:ml-7">
                    {group.entries.map((entry) => (
                      <li key={entry.id} className="relative grid gap-3 py-4 pl-5 pr-4 first:pt-2 last:pb-2 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:items-start sm:pl-6 sm:pr-5">
                        <span className="absolute -left-[5px] top-6 h-2 w-2 rounded-full bg-[#2c6457] ring-4 ring-[#fffdf9]" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="font-serif text-[15px] font-semibold text-[#202522]">{entry.action}</p>
                          <p className="mt-1 text-xs leading-5 text-[#747b73]">
                            {entry.target_type || "Operação"}
                            {entry.target_id && (
                              <span
                                className="ml-1 font-mono text-[10px] text-[#5f625d]"
                                title={`ID completo: ${entry.target_id}`}
                                aria-label={`ID completo: ${entry.target_id}`}
                              >
                                · {targetId(entry.target_id)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-xs text-[#5f625d]">
                          <span>{entry.actor_name}</span>
                          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-[#979c95]">{entry.actor_type}</span>
                        </div>
                        <time className="text-[10px] text-[#747b73] sm:text-right">{formatDate(entry.created_at)}</time>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
