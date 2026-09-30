import { useCallback, useEffect, useMemo, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
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
  PUBLISHED: "Aprovado no sistema",
};

const ACTION_LABEL: Record<string, string> = {
  CREATE_POST: "Gerou rascunho",
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

  const [productsLoading, setProductsLoading] = useState(true);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [actionsError, setActionsError] = useState<string | null>(null);
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

  const loadData = useCallback(async () => {
    if (!company) return;

    setProductsLoading(true);
    setActionsLoading(true);
    setProductsError(null);
    setActionsError(null);

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
      setProductsError("Não foi possível carregar os produtos.");
      toast.error("Não foi possível carregar os produtos.");
    } else {
      setProducts((productsResponse.data as Product[]) ?? []);
    }

    if (actionsResponse.error) {
      setActionsError("Não foi possível carregar a atividade dos agentes.");
      toast.error("Não foi possível carregar a atividade dos agentes.");
    } else {
      setLog((actionsResponse.data as Action[]) ?? []);
    }

    setProductsLoading(false);
    setActionsLoading(false);
  }, [company]);

  useEffect(() => {
    if (!company) return;

    loadData();
  }, [company, loadData]);

  useEffect(() => {
    if (!showRunPanel && !selectedAction) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowRunPanel(false);
        setSelectedAction(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAction, showRunPanel]);

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

  const hasActionsData = !actionsLoading && !actionsError;
  const hasProductsData = !productsLoading && !productsError;
  const latestAction = hasActionsData ? log[0] : undefined;

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

              <h1 className="font-serif text-[clamp(2rem,4vw,2.8rem)] font-medium leading-[1.04] tracking-[-0.045em] text-[#202522]">
                Agentes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#747b73]">
                Execute o Marketing Agent manualmente sobre o catálogo e
                reveja os rascunhos por canal. Não há execução contínua.
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

            {hasActionsData && attentionCount > 0 && (
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
                <p className="text-xs text-[#a7aaa2]">Disponíveis</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                1
              </p>
            </div>

            <div className="border-b border-[#ded9d0] px-0 py-5 sm:border-b-0 sm:border-r sm:px-5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-[7px] bg-[#202522]" />
                  <p className="text-xs text-[#a7aaa2]">Automação contínua</p>
              </div>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                Não
              </p>
            </div>

            <div className="px-0 py-5 sm:px-5">
              <p className="text-xs text-[#a7aaa2]">
                Atenção
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                {hasActionsData ? attentionCount : "—"}
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
                          Disponível · manual
                        </span>
                      </div>

                      <h4 className="text-lg font-semibold tracking-[-0.025em]">
                        Marketing Agent
                      </h4>

                      <p className="mt-0.5 text-sm text-[#747b73]">
                        Conteúdo para revisão
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMenu((value) => !value)}
                      aria-label="Mais opções"
                      aria-expanded={showMenu}
                      aria-haspopup="menu"
                      className="grid h-9 w-9 touch-manipulation place-items-center rounded-sm text-[#a7aaa2] transition-colors hover:bg-[#ebe7df] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {showMenu && (
                      <div
                        role="menu"
                        aria-label="Informações do agente"
                        className="absolute right-0 top-10 z-20 w-56 border border-[#ded9d0] bg-[#fffdf9] p-1 shadow-sm"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setShowMenu(false);
                            toast.info("O Marketing Agent é executado manualmente e cria rascunhos para revisão.");
                          }}
                          className="flex min-h-10 w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-medium text-[#5f625d] hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                        >
                          Execução manual e rascunhos
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

                {actionsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#747b73]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    A carregar o resumo da atividade...
                  </div>
                ) : actionsError ? (
                  <p className="text-xs leading-5 text-red-700">
                    Resumo indisponível. Os dados anteriores podem estar desatualizados.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] text-[#a7aaa2]">Hoje</p>
                      <p className="mt-1 text-lg font-semibold">{stats.totalToday}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-[#a7aaa2]">Rascunhos</p>
                      <p className="mt-1 text-lg font-semibold">{stats.drafts}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-[#a7aaa2]">Bloqueados</p>
                      <p className="mt-1 text-lg font-semibold">{stats.blocked}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-[#a7aaa2]">Falhas</p>
                      <p className="mt-1 text-lg font-semibold">{stats.failed}</p>
                    </div>
                  </div>
                )}

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

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 bg-[#fffdf9] px-4 py-3.5">
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

                  <div className="flex items-start gap-3 bg-[#fffdf9] px-4 py-3.5">
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

                  <div className="flex items-start gap-3 bg-[#fffdf9] px-4 py-3.5">
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

                  <div className="flex items-start gap-3 bg-[#fffdf9] px-4 py-3.5">
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
            <div className="bg-[#f1eee7] p-5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#747b73]" />
                <h4 className="text-sm font-semibold">
                  Conhecimento
                </h4>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-[#747b73]">
                    Produtos
                  </span>
                  <span className="text-xs font-medium text-[#202522]">
                    {productsLoading ? "…" : productsError ? "Indisponível" : products.length}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-[#747b73]">
                    Informações da loja
                  </span>
                  <span className="text-xs font-medium text-[#202522]">
                    No contexto
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#747b73]">
                    Preços e stock
                  </span>
                  <span className="text-xs font-medium text-[#202522]">
                    No contexto
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#f1eee7] p-5">
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

            <div className="bg-[#f1eee7] p-5">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#747b73]" />
                <h4 className="text-sm font-semibold">
                  Execução
                </h4>
              </div>

              <div className="mt-4">
                <p className="text-sm leading-6 text-[#747b73]">
                  O agente é executado manualmente nesta fase. Cada
                  execução usa o produto e os canais escolhidos e cria
                  rascunhos para revisão; não existe automação contínua.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ATTENTION */}
        {hasActionsData && attentionCount > 0 && (
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
                        "flex min-h-14 w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e36c3f]",
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
                Atividade
              </h3>

              <p className="mt-1 text-sm text-[#747b73]">
                Amostra das últimas 100 ações registadas; não é o histórico completo.
              </p>
            </div>

            <span className="text-xs text-[#a7aaa2]">
              Amostra: {Math.min(log.length, 100)} de 100 máximas
            </span>
          </div>

          {actionsLoading ? (
            <div className="flex min-h-36 items-center justify-center gap-2 bg-[#f1eee7] px-6 py-10 text-sm text-[#747b73]">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar a amostra de atividade...
            </div>
          ) : actionsError ? (
            <div className="bg-red-50 px-6 py-10 text-center">
              <TriangleAlert className="mx-auto h-5 w-5 text-red-600" />
              <p className="mt-3 text-sm font-medium text-red-800">
                Não foi possível carregar a atividade.
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-red-700">
                O conteúdo anterior pode estar desatualizado. Tente novamente para consultar a amostra real.
              </p>
              <button
                type="button"
                onClick={loadData}
                className="mt-4 inline-flex min-h-10 items-center gap-2 border border-red-200 bg-white px-3 text-xs font-medium text-red-800 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar novamente
              </button>
            </div>
          ) : recentActivity.length === 0 ? (
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
                      "flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e36c3f] sm:px-5",
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
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-panel-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[#ded9d0] bg-[#fffdf9] shadow-xl"
          >
            <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-[#ded9d0] px-5 pt-[env(safe-area-inset-top)]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">
                  Marketing Agent
                </p>

                <h3 id="run-panel-title" className="mt-0.5 text-base font-semibold tracking-[-0.02em]">
                  Executar agente
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowRunPanel(false)}
                aria-label="Fechar"
                className="grid h-10 w-10 touch-manipulation place-items-center rounded-sm text-[#a7aaa2] hover:bg-[#ebe7df] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
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

                  {productsLoading ? (
                    <div className="mt-3 flex min-h-11 items-center gap-2 bg-[#f1eee7] px-3 text-xs text-[#747b73]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      A carregar produtos...
                    </div>
                  ) : productsError ? (
                    <div className="mt-3 bg-red-50 px-3 py-3 text-xs leading-5 text-red-700">
                      <p>Não foi possível consultar o catálogo. A lista anterior pode estar desatualizada.</p>
                      <button
                        type="button"
                        onClick={loadData}
                        className="mt-2 inline-flex min-h-9 items-center gap-1.5 border border-red-200 bg-white px-2.5 font-medium text-red-800 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Tentar novamente
                      </button>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="mt-3 bg-[#f1eee7] px-3 py-3 text-xs leading-5 text-[#747b73]">
                      Nenhum produto disponível para uma execução manual.
                    </div>
                  ) : (
                    <select
                      id="agent-product"
                      value={selectedProductId}
                      onChange={(event) =>
                        setSelectedProductId(event.target.value)
                      }
                      className="mt-3 h-11 w-full rounded-sm border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm text-[#202522] outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                    >
                      <option value="">Escolher produto...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} · stock {product.stock}
                        </option>
                      ))}
                    </select>
                  )}
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

            <div className="shrink-0 border-t border-[#ded9d0] bg-[#fffdf9] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
                  !hasProductsData ||
                  products.length === 0 ||
                  selectedPlatforms.length === 0
                }
                className="flex h-11 w-full items-center justify-center gap-2 bg-[#202522] text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A gerar rascunhos...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar rascunhos
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
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-detail-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-[#ded9d0] bg-[#fffdf9] shadow-xl"
          >
            <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-[#ded9d0] px-5 pt-[env(safe-area-inset-top)]">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  aria-label="Voltar"
                  className="grid h-10 w-10 shrink-0 touch-manipulation place-items-center rounded-sm text-[#747b73] hover:bg-[#ebe7df] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="min-w-0">
                  <p id="action-detail-title" className="truncate text-sm font-semibold">
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

            <div className="shrink-0 border-t border-[#ded9d0] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
