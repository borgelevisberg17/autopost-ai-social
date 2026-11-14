import { useEffect, useState } from "react";
import {
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Facebook,
  FileCheck2,
  Instagram,
  MessageCircle,
  Megaphone,
  X,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DraftAction = {
  id: string;
  agent: string;
  action: string;
  platform: string | null;
  content: string | null;
  status: string;
  reason: string | null;
  created_at: string;
  product_id: string | null;
  product_name?: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeStyle: "short",
});

function readableAction(action: string) {
  return action
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Approvals() {
  const { company } = useCompany();

  const [drafts, setDrafts] = useState<DraftAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const setProcessing = (id: string, processing: boolean) => {
    setProcessingIds((current) => {
      const next = new Set(current);
      if (processing) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const loadDrafts = async () => {
    if (!company) return;

    setLoading(true);
    setError(null);
    // Do not present a previous response as current while a fresh query is pending.
    setDrafts([]);

    const [actionsRes, productsRes] = await Promise.all([
      supabase
        .from("agent_actions")
        .select("*")
        .eq("company_id", company.id)
        .eq("status", "DRAFT")
        .order("created_at", { ascending: false }),

      supabase
        .from("products")
        .select("id, name")
        .eq("company_id", company.id),
    ]);

    const queryError = actionsRes.error ?? productsRes.error;
    if (queryError) {
      setError("Não foi possível carregar os rascunhos agora.");
      setLoading(false);
      return;
    }

    const pMap = new Map((productsRes.data ?? []).map((p) => [p.id, p.name]));
    const list = (actionsRes.data as DraftAction[]).map((draft) => ({
      ...draft,
      product_name: draft.product_id ? pMap.get(draft.product_id) ?? "Produto" : "Geral",
    }));

    setDrafts(list);
    setLoading(false);
  };

  useEffect(() => {
    loadDrafts();
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (draft: DraftAction) => {
    setProcessing(draft.id, true);

    const { error: updateError } = await supabase
      .from("agent_actions")
      .update({ status: "PUBLISHED" })
      .eq("id", draft.id);

    setProcessing(draft.id, false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success("Rascunho aprovado. Estado guardado.");
    setDrafts((current) => current.filter((item) => item.id !== draft.id));
  };

  const handleReject = async (draft: DraftAction) => {
    setProcessing(draft.id, true);

    const { error: updateError } = await supabase
      .from("agent_actions")
      .update({ status: "BLOCKED", reason: "Bloqueado pelo utilizador na Central de Aprovações" })
      .eq("id", draft.id);

    setProcessing(draft.id, false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.info("Rascunho bloqueado. Estado guardado.");
    setDrafts((current) => current.filter((item) => item.id !== draft.id));
  };

  const copyContent = async (text: string | null) => {
    try {
      await navigator.clipboard.writeText(text ?? "");
      toast.success("Texto copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  if (!company) {
    return (
      <AdminLayout title="Aprovações">
        <div />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Aprovações">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-800 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              CONTROLO DE QUALIDADE
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Central de Aprovações
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Reveja e aprove o conteúdo sugerido pelos agentes antes da publicação nas redes sociais.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <Megaphone className="h-3.5 w-3.5 text-slate-400" />
            {drafts.length} {drafts.length === 1 ? "rascunho pendente" : "rascunhos pendentes"}
          </span>
        </section>

        <section className="space-y-4">
          {loading ? (
            <div className="space-y-4" aria-label="A carregar rascunhos">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-44 w-full animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-8 text-center" role="alert">
              <FileCheck2 className="mx-auto h-8 w-8 text-rose-500" />
              <p className="mt-2 text-sm font-bold text-rose-900">Não foi possível carregar a fila</p>
              <p className="mt-1 text-xs text-rose-600">{error}</p>
              <button
                type="button"
                onClick={loadDrafts}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
              >
                Tentar novamente
              </button>
            </div>
          ) : drafts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-xs">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
              <p className="mt-3 font-sans text-base font-bold text-slate-900">Tudo em dia! Nenhum rascunho a aguardar</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Quando os agentes gerarem novos textos ou publicações promocionais, elas aparecerão aqui para validação da equipa.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => {
                const isProcessing = processingIds.has(draft.id);
                return (
                  <article
                    key={draft.id}
                    aria-busy={isProcessing}
                    className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-slate-300"
                  >
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)] lg:gap-8">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-900">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-700" aria-hidden="true">
                            {draft.platform === "instagram" ? (
                              <Instagram className="h-4 w-4 text-pink-600" />
                            ) : draft.platform === "facebook" ? (
                              <Facebook className="h-4 w-4 text-blue-600" />
                            ) : (
                              <MessageCircle className="h-4 w-4 text-emerald-600" />
                            )}
                          </span>
                          <span className="capitalize">{draft.platform || "Rede Social"}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 font-normal">{draft.product_name}</span>
                        </div>

                        <div className="relative mt-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 pr-12 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                          {draft.content || "Sem texto disponível."}
                          <button
                            type="button"
                            onClick={() => copyContent(draft.content)}
                            className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-none"
                            aria-label={`Copiar texto`}
                            title="Copiar texto"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <dl className="grid content-start gap-3 border-t border-slate-100 pt-4 text-xs lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                        <div className="flex items-start gap-2.5">
                          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Agente</dt>
                            <dd className="mt-0.5 font-semibold text-slate-900">{draft.agent || "Agente não identificado"}</dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ação</dt>
                            <dd className="mt-0.5 font-semibold text-slate-900">{readableAction(draft.action)}</dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Gerado a</dt>
                            <dd className="mt-0.5 font-medium text-slate-600">{dateFormatter.format(new Date(draft.created_at))}</dd>
                          </div>
                        </div>
                        {draft.reason && (
                          <div className="flex items-start gap-2.5">
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                            <div>
                              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Contexto</dt>
                              <dd className="mt-0.5 leading-relaxed text-slate-600">{draft.reason}</dd>
                            </div>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="mt-5 flex flex-col gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReject(draft)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        {isProcessing ? "A guardar…" : "Bloquear"}
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(draft)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isProcessing ? "A guardar…" : "Aprovar Rascunho"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
