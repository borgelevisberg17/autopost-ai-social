import { useEffect, useMemo, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Facebook,
  FileText,
  Instagram,
  Loader2,
  Megaphone,
  MoreHorizontal,
  Package,
  Play,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  stock: number;
};

type Action = {
  id: string;
  agent: string;
  action: string;
  platform: string | null;
  content: string | null;
  status: string;
  reason: string | null;
  created_at: string;
  product_id: string | null;
};

type Platform = "instagram" | "facebook" | "whatsapp";

const PLATFORMS: {
  id: Platform;
  label: string;
}[] = [
  {
    id: "instagram",
    label: "Instagram",
  },
  {
    id: "facebook",
    label: "Facebook",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
  },
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  BLOCKED: "Bloqueado",
  FAILED: "Falhou",
  PUBLISHED: "Publicado",
};

const ACTION_LABEL: Record<string, string> = {
  CREATE_POST: "Gerou publicação",
};

const platformLabel = (platform: string | null) => {
  if (!platform) return "—";

  return (
    PLATFORMS.find((item) => item.id === platform)?.label ??
    platform
  );
};

const platformIcon = (platform: string | null) => {
  if (platform === "instagram") return Instagram;
  if (platform === "facebook") return Facebook;

  return ShoppingBag;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeDate = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "ontem";

  return `há ${days} dias`;
};

const actionStatusClass = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "border-[#ded9d0] bg-[#f1eee7] text-[#5f625d]";

    case "PUBLISHED":
      return "border-[#ded9d0] bg-[#202522] text-white";

    case "BLOCKED":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-[#ded9d0] bg-[#fffdf9] text-[#747b73]";
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case "DRAFT":
      return FileText;

    case "PUBLISHED":
      return CheckCircle2;

    case "BLOCKED":
      return ShieldCheck;

    case "FAILED":
      return XCircle;

    default:
      return Activity;
  }
};

export default function Agents() {
  const { company } = useCompany();

  const [products, setProducts] = useState<Product[]>([]);
  const [log, setLog] = useState<Action[]>([]);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "instagram",
    "facebook",
    "whatsapp",
  ]);

  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const loadData = async () => {
    if (!company) return;

    setLoading(true);

    const [productsResponse, actionsResponse] = await Promise.all([
      supabase
        .from("products")
        .select("id,name,stock")
        .eq("company_id", company.id)
        .order("name"),

      supabase
        .from("agent_actions")
        .select(
          "id,agent,action,platform,content,status,reason,created_at,product_id",
        )
        .eq("company_id", company.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(100),
    ]);

    if (productsResponse.error) {
      toast.error("Não foi possível carregar os produtos.");
    }

    if (actionsResponse.error) {
      toast.error("Não foi possível carregar a atividade dos agentes.");
    }

    setProducts((productsResponse.data as Product[]) ?? []);
    setLog((actionsResponse.data as Action[]) ?? []);

    setLoading(false);
  };

  useEffect(() => {
    if (!company) return;

    loadData();
  }, [company]);

  const productName = (id: string | null) => {
    if (!id) return "Sem produto";

    return products.find((product) => product.id === id)?.name ?? "Produto";
  };

  const stats = useMemo(() => {
    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const today = log.filter(
      (item) => new Date(item.created_at).getTime() >= todayStart.getTime(),
    );

    return {
      totalToday: today.length,

      drafts: today.filter((item) => item.status === "DRAFT").length,

      blocked: today.filter((item) => item.status === "BLOCKED").length,

      failed: today.filter((item) => item.status === "FAILED").length,

      published: today.filter((item) => item.status === "PUBLISHED").length,
    };
  }, [log]);

  const attentionCount = useMemo(() => {
    return log.filter(
      (item) =>
        item.status === "FAILED" ||
        item.status === "BLOCKED",
    ).length;
  }, [log]);

  const latestAction = log[0];

  const recentActivity = log.slice(0, 8);

  const run = async () => {
    if (!selectedProductId) {
      toast.error("Escolha um produto.");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Escolha pelo menos uma rede.");
      return;
    }

    setRunning(true);

    const { data, error } = await supabase.functions.invoke(
      "marketing-agent",
      {
        body: {
          product_id: selectedProductId,
          platforms: selectedPlatforms,
        },
      },
    );

    setRunning(false);

    if (error) {
      const details =
        error instanceof FunctionsHttpError
          ? await error.context.json().catch(() => null)
          : null;

      toast.error(details?.error ?? "O agente falhou.");
      await loadData();
      return;
    }

    if (data?.blocked) {
      toast.warning(
        `Publicação bloqueada: ${data.reasons?.join(", ") ?? "regras do sistema"}`,
      );
    } else {
      toast.success("Publicações criadas como rascunho.");
    }

    setShowRunPanel(false);

    await loadData();
  };

  const copyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Conteúdo copiado.");
    } catch {
      toast.error("Não foi possível copiar o conteúdo.");
    }
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Agentes">
        <div className="grid min-h-[420px] place-items-center">
          <div className="flex items-center gap-3 text-sm text-[#747b73]">
            <Loader2 className="h-4 w-4 animate-spin" />
            A carregar agentes...
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Agentes"
      actions={
        <button
          type="button"
          onClick={() => setShowRunPanel(true)}
          className="inline-flex h-9 items-center gap-2 rounded-sm bg-[#202522] px-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
        >
          <Play className="h-3.5 w-3.5" />
          Executar agente
        </button>
      }
    >
      <div className="space-y-10">
        {/* PAGE INTRO */}
        <section>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#a7aaa2]">
                Automação
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.045em] text-[#202522]">
                AI workforce
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#747b73]">
                Gerencie os agentes que trabalham sobre o catálogo,
                conteúdo e canais da sua loja.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-sm border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm font-medium text-[#5f625d] transition-colors hover:border-[#c9c3b8] hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        </section>

        {/* WORKFORCE */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aaa2]">
              Workforce
            </h3>

            {attentionCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {attentionCount}{" "}
                {attentionCount === 1
                  ? "ação requer atenção"
                  : "ações requerem atenção"}
              </span>
            )}
          </div>

          <div className="grid border-y border-[#ded9d0] sm:grid-cols-3">
            <div className="border-b border-[#ded9d0] px-0 py-5 sm:border-b-0 sm:border-r sm:px-5">
              <p className="text-xs text-[#a7aaa2]">Agentes</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                1
              </p>
            </div>

            <div className="border-b border-[#ded9d0] px-0 py-5 sm:border-b-0 sm:border-r sm:px-5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-[7px] bg-[#202522]" />
                <p className="text-xs text-[#a7aaa2]">Ativo</p>
              </div>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                1
              </p>
            </div>

            <div className="px-0 py-5 sm:px-5">
              <p className="text-xs text-[#a7aaa2]">
                Atenção
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                {attentionCount}
              </p>
            </div>
          </div>
        </section>

        {/* AGENTS */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.025em]">
                Seus agentes
              </h3>

              <p className="mt-1 text-sm text-[#747b73]">
                Agentes atualmente disponíveis na sua operação.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {/* MARKETING AGENT */}
            <article className="group border border-[#ded9d0] bg-[#fffdf9] transition-colors hover:border-[#c9c3b8]">
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center border border-[#ded9d0] bg-[#f1eee7]">
                      <Megaphone
                        className="h-[19px] w-[19px] text-[#303732]"
                        strokeWidth={1.7}
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-[7px] bg-[#202522]" />

                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#747b73]">
                          Ativo
                        </span>
                      </div>

                      <h4 className="text-lg font-semibold tracking-[-0.025em]">
                        Marketing Agent
                      </h4>

                      <p className="mt-0.5 text-sm text-[#747b73]">
                        Content & Publishing
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMenu((value) => !value)}
                      aria-label="Mais opções"
                      className="grid h-8 w-8 place-items-center rounded-sm text-[#a7aaa2] transition-colors hover:bg-[#ebe7df] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 top-9 z-20 w-44 border border-[#ded9d0] bg-[#fffdf9] p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            toast.info(
                              "Configurações avançadas estarão disponíveis quando os agentes configuráveis forem ativados.",
                            );
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-medium text-[#5f625d] hover:bg-[#f1eee7]"
                        >
                          Configurações
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            toast.info(
                              "O agente atualmente é controlado pelo sistema.",
                            );
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-medium text-[#5f625d] hover:bg-[#f1eee7]"
                        >
                          Ver regras
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {PLATFORMS.map((platform) => (
                    <span
                      key={platform.id}
                      className="inline-flex items-center gap-1.5 border border-[#ded9d0] px-2.5 py-1 text-[11px] font-medium text-[#747b73]"
                    >
                      {platform.id === "instagram" ? (
                        <Instagram className="h-3 w-3" />
                      ) : platform.id === "facebook" ? (
                        <Facebook className="h-3 w-3" />
                      ) : (
                        <ShoppingBag className="h-3 w-3" />
                      )}

                      {platform.label}
                    </span>
                  ))}
                </div>

                <div className="my-5 border-t border-[#ded9d0]" />

                <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-[#a7aaa2]">
                      Hoje
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {stats.totalToday}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#a7aaa2]">
                      Rascunhos
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {stats.drafts}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#a7aaa2]">
                      Bloqueados
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {stats.blocked}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#a7aaa2]">
                      Falhas
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {stats.failed}
                    </p>
                  </div>
                </div>

                {latestAction && (
                  <>
                    <div className="my-5 border-t border-[#ded9d0]" />

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#a7aaa2]">
                        Última atividade
                      </p>

                      <div className="mt-2 flex items-start gap-2.5">
                        <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-[7px] bg-[#202522]" />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#303732]">
                            {ACTION_LABEL[latestAction.action] ??
                              latestAction.action}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-[#747b73]">
                            {platformLabel(latestAction.platform)}
                            {" · "}
                            {productName(latestAction.product_id)}
                            {" · "}
                            {formatRelativeDate(
                              latestAction.created_at,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setShowRunPanel(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 bg-[#202522] px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Executar agente
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const element =
                        document.getElementById(
                          "agent-activity",
                        );

                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 border border-[#ded9d0] px-4 text-sm font-medium text-[#5f625d] transition-colors hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                  >
                    Ver atividade
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>

            {/* CURRENT CAPABILITIES */}
            <article className="border border-[#ded9d0] bg-[#f1eee7]">
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-3.5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center border border-[#ded9d0] bg-[#fffdf9]">
                    <ShieldCheck
                      className="h-[19px] w-[19px] text-[#303732]"
                      strokeWidth={1.7}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">
                      Guardrails
                    </p>

                    <h4 className="text-lg font-semibold tracking-[-0.025em]">
                      Operação controlada
                    </h4>

                    <p className="mt-1 text-sm leading-5 text-[#747b73]">
                      O agente trabalha apenas com dados disponíveis
                      no sistema e passa pelas regras antes de gerar
                      qualquer publicação.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-0 border-y border-[#ded9d0] bg-[#fffdf9]">
                  <div className="flex items-center gap-3 border-b border-[#ded9d0] px-4 py-3.5">
                    <Check className="h-4 w-4 shrink-0 text-[#303732]" />

                    <div>
                      <p className="text-sm font-medium">
                        Produtos
                      </p>
                      <p className="text-xs text-[#747b73]">
                        Consulta dados reais do catálogo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-b border-[#ded9d0] px-4 py-3.5">
                    <Check className="h-4 w-4 shrink-0 text-[#303732]" />

                    <div>
                      <p className="text-sm font-medium">
                        Stock e preços
                      </p>
                      <p className="text-xs text-[#747b73]">
                        Não inventa disponibilidade ou valores.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-b border-[#ded9d0] px-4 py-3.5">
                    <Check className="h-4 w-4 shrink-0 text-[#303732]" />

                    <div>
                      <p className="text-sm font-medium">
                        Promoções
                      </p>
                      <p className="text-xs text-[#747b73]">
                        Valida a promoção antes da geração.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <Check className="h-4 w-4 shrink-0 text-[#303732]" />

                    <div>
                      <p className="text-sm font-medium">
                        Conteúdo por canal
                      </p>
                      <p className="text-xs text-[#747b73]">
                        Adapta o texto para cada plataforma.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#747b73]">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                  <p>
                    A publicação direta nas redes ainda não está
                    ativa. Atualmente os conteúdos são criados como
                    rascunhos para revisão e cópia.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* AGENT DETAIL / CAPABILITIES */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold tracking-[-0.025em]">
              Marketing Agent
            </h3>

            <p className="mt-1 text-sm text-[#747b73]">
              O que este agente pode consultar e executar atualmente.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="border border-[#ded9d0] bg-[#fffdf9] p-5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#747b73]" />
                <h4 className="text-sm font-semibold">
                  Conhecimento
                </h4>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#ebe7df] pb-3">
                  <span className="text-sm text-[#747b73]">
                    Produtos
                  </span>
                  <span className="text-xs font-medium text-[#202522]">
                    {products.length}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#ebe7df] pb-3">
                  <span className="text-sm text-[#747b73]">
                    Informações da loja
                  </span>
                  <span className="text-xs font-medium text-[#202522]">
                    Ligado
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#747b73]">
                    Preços e stock
                  </span>
                  <span className="text-xs font-medium text-[#202522]">
                    Ligado
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-[#ded9d0] bg-[#fffdf9] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#747b73]" />
                <h4 className="text-sm font-semibold">
                  Permissões
                </h4>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  ["Consultar produtos", true],
                  ["Consultar stock", true],
                  ["Consultar preços", true],
                  ["Gerar conteúdo", true],
                  ["Alterar preços", false],
                  ["Alterar stock", false],
                ].map(([label, enabled]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-[#747b73]">
                      {label}
                    </span>

                    {enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-[#303732]" />
                    ) : (
                      <span className="text-xs text-[#a7aaa2]">
                        Não
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#ded9d0] bg-[#fffdf9] p-5">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#747b73]" />
                <h4 className="text-sm font-semibold">
                  Execução
                </h4>
              </div>

              <div className="mt-4">
                <p className="text-sm leading-6 text-[#747b73]">
                  O agente é executado manualmente nesta fase.
                  Agendamento automático será adicionado quando o
                  scheduler fizer parte da infraestrutura dos agentes.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      "Agendamento automático será disponibilizado numa próxima fase.",
                    )
                  }
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#202522] underline underline-offset-4"
                >
                  Configurar quando disponível
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ATTENTION */}
        {attentionCount > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.025em]">
                  Atenção
                </h3>

                <p className="mt-1 text-sm text-[#747b73]">
                  Eventos que exigiram intervenção ou foram
                  bloqueados pelas regras do sistema.
                </p>
              </div>
            </div>

            <div className="border border-[#ded9d0] bg-[#fffdf9]">
              {log
                .filter(
                  (item) =>
                    item.status === "FAILED" ||
                    item.status === "BLOCKED",
                )
                .slice(0, 5)
                .map((item, index, array) => {
                  const Icon =
                    item.status === "FAILED"
                      ? XCircle
                      : ShieldCheck;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedAction(item)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-[#f1eee7]",
                        index < array.length - 1 &&
                          "border-b border-[#ded9d0]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          item.status === "FAILED"
                            ? "text-red-600"
                            : "text-amber-600",
                        )}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {ACTION_LABEL[item.action] ??
                              item.action}
                          </p>

                          <span className="text-xs text-[#a7aaa2]">
                            {platformLabel(item.platform)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#747b73]">
                          {item.reason ?? "Sem motivo registado"}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-[#a7aaa2]">
                        {formatRelativeDate(item.created_at)}
                      </span>
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {/* ACTIVITY */}
        <section id="agent-activity">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.025em]">
                Activity
              </h3>

              <p className="mt-1 text-sm text-[#747b73]">
                Histórico recente das ações executadas pelo agente.
              </p>
            </div>

            <span className="text-xs text-[#a7aaa2]">
              Últimas {Math.min(log.length, 100)} ações
            </span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="border border-dashed border-[#c9c3b8] px-6 py-14 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center border border-[#ded9d0]">
                <Activity className="h-4 w-4 text-[#747b73]" />
              </div>

              <p className="mt-4 text-sm font-medium">
                Nenhuma atividade ainda
              </p>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#747b73]">
                Execute o Marketing Agent para começar a registrar
                as ações nesta área.
              </p>
            </div>
          ) : (
            <div className="border-y border-[#ded9d0] bg-[#fffdf9]">
              {recentActivity.map((item, index) => {
                const StatusIcon = statusIcon(item.status);
                const PlatformIcon = platformIcon(item.platform);

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedAction(item)}
                    className={cn(
                      "flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-[#f1eee7] sm:px-5",
                      index < recentActivity.length - 1 &&
                        "border-b border-[#ded9d0]",
                    )}
                  >
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-[#ded9d0] bg-[#fffdf9]">
                      <StatusIcon
                        className="h-3.5 w-3.5 text-[#747b73]"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[#202522]">
                          {ACTION_LABEL[item.action] ??
                            item.action}
                        </p>

                        <span
                          className={cn(
                            "inline-flex items-center rounded-[7px] border px-2 py-0.5 text-[10px] font-medium",
                            actionStatusClass(item.status),
                          )}
                        >
                          {STATUS_LABEL[item.status] ??
                            item.status}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#747b73]">
                        <span className="inline-flex items-center gap-1">
                          <PlatformIcon className="h-3 w-3" />
                          {platformLabel(item.platform)}
                        </span>

                        <span>·</span>

                        <span>{productName(item.product_id)}</span>

                        <span>·</span>

                        <span>
                          {formatRelativeDate(item.created_at)}
                        </span>
                      </div>

                      {item.reason && (
                        <p className="mt-2 line-clamp-1 text-xs text-[#747b73]">
                          {item.reason}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#c9c3b8]" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* RUN PANEL */}
      {showRunPanel && (
        <div
          className="fixed inset-0 z-[70] bg-black/30"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRunPanel(false);
            }
          }}
        >
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[#ded9d0] bg-[#fffdf9] shadow-xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#ded9d0] px-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">
                  Marketing Agent
                </p>

                <h3 className="mt-0.5 text-base font-semibold tracking-[-0.02em]">
                  Executar agente
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowRunPanel(false)}
                aria-label="Fechar"
                className="grid h-8 w-8 place-items-center rounded-sm text-[#a7aaa2] hover:bg-[#ebe7df] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <div className="space-y-7">
                <div>
                  <label
                    htmlFor="agent-product"
                    className="text-sm font-medium text-[#202522]"
                  >
                    Produto
                  </label>

                  <p className="mt-1 text-xs leading-5 text-[#747b73]">
                    O agente vai usar somente os dados reais deste
                    produto.
                  </p>

                  <select
                    id="agent-product"
                    value={selectedProductId}
                    onChange={(event) =>
                      setSelectedProductId(event.target.value)
                    }
                    className="mt-3 h-11 w-full rounded-sm border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm text-[#202522] outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="">
                      Escolher produto...
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} · stock {product.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#202522]">
                    Canais
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#747b73]">
                    Será criado um conteúdo adaptado para cada rede
                    selecionada.
                  </p>

                  <div className="mt-3 space-y-2">
                    {PLATFORMS.map((platform) => {
                      const checked = selectedPlatforms.includes(
                        platform.id,
                      );

                      const Icon =
                        platform.id === "instagram"
                          ? Instagram
                          : platform.id === "facebook"
                            ? Facebook
                            : ShoppingBag;

                      return (
                        <label
                          key={platform.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 border px-3.5 py-3 transition-colors",
                            checked
                              ? "border-neutral-900 bg-[#f1eee7]"
                              : "border-[#ded9d0] hover:bg-[#f1eee7]",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              togglePlatform(platform.id)
                            }
                            className="h-4 w-4 accent-black"
                          />

                          <Icon className="h-4 w-4 text-[#747b73]" />

                          <span className="text-sm font-medium">
                            {platform.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-[#ded9d0] bg-[#f1eee7] p-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#5f625d]" />

                    <div>
                      <p className="text-xs font-semibold text-[#202522]">
                        Regras aplicadas automaticamente
                      </p>

                      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#747b73]">
                        <li>
                          O produto precisa estar ativo.
                        </li>
                        <li>
                          O stock precisa ser superior a zero.
                        </li>
                        <li>
                          O preço precisa ser válido.
                        </li>
                        <li>
                          A promoção não pode ser igual ou superior
                          ao preço normal.
                        </li>
                        <li>
                          A IA só recebe dados existentes no sistema.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-[#ded9d0] bg-[#fffdf9] p-5">
              <div className="mb-3 flex items-center justify-between text-xs text-[#747b73]">
                <span>
                  {selectedPlatforms.length}{" "}
                  {selectedPlatforms.length === 1
                    ? "canal"
                    : "canais"}
                </span>

                <span>
                  {selectedProductId
                    ? productName(selectedProductId)
                    : "Nenhum produto"}
                </span>
              </div>

              <button
                type="button"
                onClick={run}
                disabled={
                  running ||
                  !selectedProductId ||
                  selectedPlatforms.length === 0
                }
                className="flex h-11 w-full items-center justify-center gap-2 bg-[#202522] text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A gerar publicações...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar publicações
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ACTION DETAIL */}
      {selectedAction && (
        <div
          className="fixed inset-0 z-[80] bg-black/30"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAction(null);
            }
          }}
        >
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-[#ded9d0] bg-[#fffdf9] shadow-xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#ded9d0] px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  aria-label="Voltar"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-[#747b73] hover:bg-[#ebe7df] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {ACTION_LABEL[selectedAction.action] ??
                      selectedAction.action}
                  </p>

                  <p className="truncate text-xs text-[#747b73]">
                    {formatDate(selectedAction.created_at)}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex shrink-0 rounded-[7px] border px-2.5 py-1 text-[10px] font-semibold",
                  actionStatusClass(selectedAction.status),
                )}
              >
                {STATUS_LABEL[selectedAction.status] ??
                  selectedAction.status}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <div className="space-y-7">
                <div className="grid grid-cols-2 border-y border-[#ded9d0]">
                  <div className="border-r border-[#ded9d0] py-4">
                    <p className="text-[11px] text-[#a7aaa2]">
                      Canal
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {platformLabel(selectedAction.platform)}
                    </p>
                  </div>

                  <div className="py-4 pl-4">
                    <p className="text-[11px] text-[#a7aaa2]">
                      Produto
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {productName(selectedAction.product_id)}
                    </p>
                  </div>
                </div>

                {selectedAction.reason && (
                  <div className="border border-[#ded9d0] bg-[#f1eee7] p-4">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#747b73]" />

                      <div>
                        <p className="text-xs font-semibold">
                          Motivo
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[#747b73]">
                          {selectedAction.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAction.content ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">
                          Conteúdo gerado
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {platformLabel(selectedAction.platform)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyContent(selectedAction.content!)
                        }
                        className="inline-flex h-8 items-center gap-1.5 border border-[#ded9d0] px-2.5 text-xs font-medium text-[#5f625d] hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar
                      </button>
                    </div>

                    <div className="border border-[#ded9d0] bg-[#f1eee7] p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[#5f625d]">
                        {selectedAction.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#c9c3b8] px-5 py-10 text-center">
                    <p className="text-sm font-medium">
                      Nenhum conteúdo disponível
                    </p>

                    <p className="mt-1 text-xs text-[#747b73]">
                      Esta ação não possui texto associado.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-[#ded9d0] px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="h-10 w-full border border-[#ded9d0] text-sm font-medium text-[#5f625d] hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
              >
                Fechar
              </button>
            </div>
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}
