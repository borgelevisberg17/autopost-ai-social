import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Facebook,
  Instagram,
  MessageCircle,
  Megaphone,
  X,
  XCircle,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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

export default function Approvals() {
  const { company } = useCompany();

  const [drafts, setDrafts] = useState<DraftAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadDrafts = async () => {
    if (!company) return;

    setLoading(true);

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

    if (!actionsRes.error && actionsRes.data) {
      const pMap = new Map((productsRes.data ?? []).map((p) => [p.id, p.name]));

      const list = (actionsRes.data as DraftAction[]).map((d) => ({
        ...d,
        product_name: d.product_id ? pMap.get(d.product_id) ?? "Produto" : "Geral",
      }));

      setDrafts(list);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDrafts();
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (draft: DraftAction) => {
    setProcessingId(draft.id);

    const { error } = await supabase
      .from("agent_actions")
      .update({ status: "PUBLISHED" })
      .eq("id", draft.id);

    setProcessingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Conteúdo aprovado e publicado!");
    setDrafts((curr) => curr.filter((d) => d.id !== draft.id));
  };

  const handleReject = async (draft: DraftAction) => {
    setProcessingId(draft.id);

    const { error } = await supabase
      .from("agent_actions")
      .update({ status: "BLOCKED", reason: "Rejeitado pelo utilizador no Approval Center" })
      .eq("id", draft.id);

    setProcessingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.info("Conteúdo rejeitado.");
    setDrafts((curr) => curr.filter((d) => d.id !== draft.id));
  };

  const copyContent = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
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
    <AdminLayout title="Approval Center">
      <div className="space-y-8">
        {/* HEADER */}
        <section className="flex flex-col gap-5 border-b border-[#ded9d0] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a7aaa2]">
              Controlo de Qualidade
            </p>

            <h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
              Central de Aprovações
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#747b73]">
              Reveja, edite ou aprove as publicações geradas pelos agentes de IA antes da publicação.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 border border-[#ded9d0] bg-[#f1eee7] px-3 py-1.5 text-xs font-semibold text-[#5f625d]">
              <Megaphone className="h-3.5 w-3.5 text-[#747b73]" />
              {drafts.length} {drafts.length === 1 ? "rascunho pendente" : "rascunhos pendentes"}
            </span>
          </div>
        </section>

        {/* DRAFTS LIST */}
        <section className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 w-full animate-pulse bg-[#ebe7df] rounded-sm" />
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <div className="py-20 text-center border-y border-[#ded9d0] bg-[#fffdf9]">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#c9c3b8]" />
              <p className="mt-3 text-sm font-semibold text-[#202522]">Nenhum rascunho a aguardar revisão</p>
              <p className="mt-1 text-xs text-[#a7aaa2]">
                Quando os agentes gerarem novos conteúdos, eles aparecerão aqui para aprovação.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {drafts.map((draft) => (
                <article
                  key={draft.id}
                  className="flex flex-col justify-between border border-[#ded9d0] bg-[#fffdf9] p-6 shadow-sm"
                >
                  <div className="space-y-4">
                    {/* TOP META */}
                    <div className="flex items-center justify-between border-b border-[#ebe7df] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-[#ebe7df] text-[#5f625d]">
                          {draft.platform === "instagram" ? (
                            <Instagram className="h-3.5 w-3.5" />
                          ) : draft.platform === "facebook" ? (
                            <Facebook className="h-3.5 w-3.5" />
                          ) : (
                            <MessageCircle className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="text-xs font-semibold capitalize text-[#202522]">
                          {draft.platform || "Rede Social"}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-[#a7aaa2]">
                        {draft.product_name}
                      </span>
                    </div>

                    {/* CONTENT BODY */}
                    <div className="relative border border-[#ebe7df] bg-[#f1eee7]/50 p-4 text-xs leading-6 text-[#303732] font-sans whitespace-pre-wrap">
                      {draft.content}

                      <button
                        type="button"
                        onClick={() => copyContent(draft.content || "")}
                        className="absolute right-2 top-2 p-1 text-[#a7aaa2] hover:text-[#202522]"
                        title="Copiar texto"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#ebe7df] pt-4">
                    <button
                      type="button"
                      disabled={processingId === draft.id}
                      onClick={() => handleReject(draft)}
                      className="inline-flex h-9 items-center gap-1.5 border border-[#ded9d0] px-3 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Rejeitar
                    </button>

                    <button
                      type="button"
                      disabled={processingId === draft.id}
                      onClick={() => handleApprove(draft)}
                      className="inline-flex h-9 items-center gap-1.5 bg-black px-4 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Aprovar & Publicar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
