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
      <div className="space-y-8">
        <section className="flex flex-col gap-5 pb-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a7aaa2]">
              Controlo de Qualidade
            </p>
            <h1 className="font-serif text-[clamp(2rem,4vw,2.8rem)] font-medium leading-[1.04] tracking-[-0.045em] text-[#202522]">
              Central de Aprovações
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#747b73]">
              Reveja os rascunhos gerados pelos agentes e escolha quais ficam aprovados ou bloqueados.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 border border-[#ded9d0] bg-[#f1eee7] px-3 py-2 text-xs font-semibold text-[#5f625d]">
            <Megaphone className="h-3.5 w-3.5 text-[#747b73]" />
            {drafts.length} {drafts.length === 1 ? "rascunho pendente" : "rascunhos pendentes"}
          </span>
        </section>

        <section className="space-y-5">
          {loading ? (
            <div className="space-y-4" aria-label="A carregar rascunhos">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-56 w-full animate-pulse bg-[#ebe7df]" />
              ))}
            </div>
          ) : error ? (
            <div className="border border-[#e3b9ad] bg-[#fff8f5] px-6 py-10 text-center" role="alert">
              <FileCheck2 className="mx-auto h-8 w-8 text-[#b94e37]" />
              <p className="mt-3 text-sm font-semibold text-[#202522]">Não foi possível carregar a fila</p>
              <p className="mt-1 text-xs leading-5 text-[#747b73]">{error}</p>
              <button
                type="button"
                onClick={loadDrafts}
                className="mt-5 inline-flex min-h-11 items-center justify-center border border-[#ded9d0] bg-[#fffdf9] px-4 text-xs font-semibold text-[#202522] transition hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
              >
                Tentar novamente
              </button>
            </div>
          ) : drafts.length === 0 ? (
            <div className="border-y border-[#ded9d0] bg-[#fffdf9] py-20 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#c9c3b8]" />
              <p className="mt-3 text-sm font-semibold text-[#202522]">Nenhum rascunho a aguardar revisão</p>
              <p className="mt-1 text-xs text-[#a7aaa2]">
                Quando os agentes gerarem novos conteúdos, eles aparecerão aqui para aprovação.
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
                    className="border-l-2 border-[#2f4f4a] bg-[#fffdf9] px-5 py-6 shadow-[0_8px_24px_rgba(32,37,34,0.04)] sm:px-7"
                  >
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)] lg:gap-10">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#202522]">
                          <span className="grid h-7 w-7 place-items-center bg-[#e9eee9] text-[#2f4f4a]" aria-hidden="true">
                            {draft.platform === "instagram" ? (
                              <Instagram className="h-3.5 w-3.5" />
                            ) : draft.platform === "facebook" ? (
                              <Facebook className="h-3.5 w-3.5" />
                            ) : (
                              <MessageCircle className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className="capitalize">{draft.platform || "Rede Social"}</span>
                          <span className="text-[#a7aaa2]">·</span>
                          <span className="font-normal text-[#747b73]">{draft.product_name}</span>
                        </div>

                        <div className="relative mt-5 bg-[#f1eee7]/65 px-5 py-5 pr-14 text-center font-sans text-sm leading-7 text-[#303732] whitespace-pre-wrap">
                          {draft.content || "Sem texto disponível."}
                          <button
                            type="button"
                            onClick={() => copyContent(draft.content)}
                            className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center text-[#747b73] transition hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                            aria-label={`Copiar texto do rascunho de ${draft.product_name || "produto"}`}
                            title="Copiar texto"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <dl className="grid content-start gap-4 border-t border-[#ebe7df] pt-5 text-sm lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                        <div className="flex items-start gap-3">
                          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#747b73]" aria-hidden="true" />
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">Agente</dt>
                            <dd className="mt-1 font-medium text-[#202522]">{draft.agent || "Agente não identificado"}</dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#747b73]" aria-hidden="true" />
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">Ação</dt>
                            <dd className="mt-1 font-medium text-[#202522]">{readableAction(draft.action)}</dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#747b73]" aria-hidden="true" />
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">Data</dt>
                            <dd className="mt-1 font-medium text-[#202522]">{dateFormatter.format(new Date(draft.created_at))}</dd>
                          </div>
                        </div>
                        {draft.reason && (
                          <div className="flex items-start gap-3">
                            <span className="mt-1 h-2 w-2 shrink-0 bg-[#c9c3b8]" aria-hidden="true" />
                            <div>
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">Motivo</dt>
                              <dd className="mt-1 leading-5 text-[#5f625d]">{draft.reason}</dd>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <span className="mt-1 h-2 w-2 shrink-0 bg-[#2f4f4a]" aria-hidden="true" />
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">Produto</dt>
                            <dd className="mt-1 font-medium text-[#202522]">{draft.product_name}</dd>
                          </div>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-[#ebe7df] pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReject(draft)}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-[#ded9d0] px-4 text-xs font-semibold text-[#a23e3e] transition hover:bg-[#fff1ef] disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                      >
                        <X className="h-3.5 w-3.5" />
                        {isProcessing ? "A guardar…" : "Bloquear"}
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(draft)}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 bg-[#202522] px-5 text-xs font-semibold text-white transition hover:bg-[#2f4f4a] disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isProcessing ? "A guardar…" : "Aprovar"}
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
