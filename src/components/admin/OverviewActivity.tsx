import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  FileClock,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ActivityEntry = {
  id: string;
  title: string;
  detail: string;
  status: string;
  created_at: string;
  source: "agent" | "action" | "notice" | "audit";
};

type RunRow = {
  id: string;
  agent_name: string;
  status: string;
  summary: string | null;
  started_at: string;
};

type ActionRow = {
  id: string;
  action_type: string | null;
  status: string | null;
  created_at: string;
};

type NoticeRow = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

type AuditRow = {
  id: string;
  actor_type: string;
  actor_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    completed: "Concluído",
    succeeded: "Concluído",
    success: "Concluído",
    failed: "Falhou",
    error: "Falhou",
    running: "A decorrer",
    pending: "Pendente",
    read: "Lida",
    unread: "Nova",
    new: "Nova",
  };

  const normalized = value.toLowerCase();
  return labels[normalized] ?? value.replace(/_/g, " ");
}

function SourceIcon({ source }: { source: ActivityEntry["source"] }) {
  const Icon =
    source === "agent"
      ? Bot
      : source === "action"
        ? Zap
        : source === "notice"
          ? Bell
          : FileClock;

  return <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />;
}

export function OverviewActivity() {
  const { company } = useCompany();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const companyId = company?.id;
    if (!companyId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setUnavailable(false);

      const [runs, actions, notices, audits] = await Promise.all([
        supabase
          .from("agent_runs")
          .select("id,agent_name,status,summary,started_at")
          .eq("company_id", companyId)
          .order("started_at", { ascending: false })
          .limit(5),
        supabase
          .from("agent_actions")
          .select("id,action_type:action,status,created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("notifications")
          .select("id,title,message,read,created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("audit_logs")
          .select(
            "id,actor_type,actor_name,action,target_type,target_id,created_at",
          )
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (cancelled) return;

      const sources = [runs, actions, notices, audits];
      const next: ActivityEntry[] = [
        ...((runs.data as RunRow[] | null) ?? []).map((item) => ({
          id: `run-${item.id}`,
          title: item.agent_name,
          detail: item.summary || "Execução de agente",
          status: statusLabel(item.status),
          created_at: item.started_at,
          source: "agent" as const,
        })),
        ...((actions.data as ActionRow[] | null) ?? []).map((item) => ({
          id: `action-${item.id}`,
          title: item.action_type || "Ação registada",
          detail: "Ação registada pelo sistema",
          status: statusLabel(item.status || "registada"),
          created_at: item.created_at,
          source: "action" as const,
        })),
        ...((notices.data as NoticeRow[] | null) ?? []).map((item) => ({
          id: `notice-${item.id}`,
          title: item.title,
          detail: item.message,
          status: item.read ? "Lida" : "Nova",
          created_at: item.created_at,
          source: "notice" as const,
        })),
        ...((audits.data as AuditRow[] | null) ?? []).map((item) => ({
          id: `audit-${item.id}`,
          title: item.action,
          detail: [
            item.actor_name,
            item.target_type || "Operação",
            item.target_id,
          ]
            .filter(Boolean)
            .join(" · "),
          status: item.actor_type || "sistema",
          created_at: item.created_at,
          source: "audit" as const,
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5);

      setEntries(next);
      setUnavailable(sources.every((result) => result.error));
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [company?.id]);

  return (
    <section className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-[#ece8df] pb-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7f897e]">
            Operação / Sistema
          </p>
          <h2 className="mt-1 font-serif text-base font-semibold tracking-[-0.03em] text-[#202522] sm:text-lg">
            Atividade e auditoria
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/admin/atividade"
            className="group inline-flex items-center gap-1 text-[11px] font-medium text-[#687168] transition hover:text-[#202522]"
          >
            Atividade
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/admin/auditoria"
            aria-label="Abrir auditoria"
            className="grid h-7 w-7 place-items-center border border-[#e4e0d7] text-[#687168] transition hover:border-[#b9c6b7] hover:text-[#202522]"
          >
            <FileClock aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2" aria-label="A carregar atividade">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 border-b border-[#f0ede6] py-3 last:border-0"
            >
              <span className="h-8 w-8 animate-pulse bg-[#f0efe9]" />
              <span className="min-w-0 flex-1 space-y-2">
                <span className="block h-3 w-2/5 animate-pulse bg-[#f0efe9]" />
                <span className="block h-2.5 w-3/5 animate-pulse bg-[#f0efe9]" />
              </span>
            </div>
          ))}
        </div>
      ) : unavailable ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center px-4 text-center">
          <RefreshCw
            aria-hidden="true"
            className="mb-3 h-4 w-4 text-[#aaa99f]"
          />
          <p className="text-sm font-medium text-[#525c54]">
            Atividade indisponível
          </p>
          <p className="mt-1 text-xs leading-5 text-[#858c83]">
            As fontes de atividade não responderam. Pode consultar cada registo
            nas páginas do sistema.
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center px-4 text-center">
          <Activity
            aria-hidden="true"
            className="mb-3 h-5 w-5 text-[#a7ada2]"
          />
          <p className="text-sm font-medium text-[#525c54]">
            Ainda sem atividade
          </p>
          <p className="mt-1 text-xs leading-5 text-[#858c83]">
            As ações de pessoas e agentes aparecerão aqui quando forem
            registadas.
          </p>
        </div>
      ) : (
        <div>
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "grid grid-cols-[34px_minmax(0,1fr)] gap-x-3 py-3 sm:grid-cols-[34px_66px_minmax(0,1fr)_auto] sm:items-center",
                index < entries.length - 1 && "border-b border-[#f0ede6]",
              )}
            >
              <span className="relative grid h-8 w-8 place-items-center border border-[#e4e0d7] bg-[#faf9f4] text-[#546454]">
                <SourceIcon source={entry.source} />
                {index < entries.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[14px] left-1/2 h-3.5 w-px bg-[#e4e0d7]"
                  />
                )}
              </span>
              <time className="col-start-2 row-start-1 font-mono text-[10px] text-[#858c83] sm:col-start-2 sm:row-auto">
                {formatTime(entry.created_at)}
              </time>
              <div className="col-start-2 min-w-0 pl-0.5 sm:col-start-3 sm:row-auto sm:pl-0">
                <p className="truncate font-serif text-[13px] font-semibold text-[#202522]">
                  {entry.title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-[#737a72]">
                  {entry.detail}
                </p>
              </div>
              <span className="col-start-2 mt-1 w-fit border border-[#e7e4da] bg-[#f8f7f1] px-2 py-0.5 text-[9px] text-[#657064] sm:col-start-4 sm:row-auto sm:mt-0">
                {entry.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
