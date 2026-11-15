import { SalesAgentTester } from "@/components/admin/SalesAgentTester";
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
import { useEntitlement } from "@/hooks/useEntitlement";
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
      return "border-slate-200 bg-slate-100 text-slate-700";

    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "BLOCKED":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
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
  const { data: entitlement } = useEntitlement();

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
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Executar agente
        </button>
      }
    >
      <div className="space-y-8">
        {company && entitlement?.features.includes("sales") && <SalesAgentTester companyId={company.id} />}
        {/* PAGE INTRO */}
        <section>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                Inteligência Artificial & Automação
              </span>

              <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Agentes IA
              </h1>

              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">
                Execute o Marketing Agent sobre o catálogo e acompanhe os agentes de atendimento da sua loja.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        </section>

        {/* WORKFORCE */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workforce Ativa
            </h3>

            {hasActionsData && attentionCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-xs font-bold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {attentionCount}{" "}
                {attentionCount === 1
                  ? "ação requer atenção"
                  : "ações requerem atenção"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Disponíveis</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                1
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Atendimento WhatsApp</p>
              </div>

              <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600">
                Ativo
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ações com Atenção
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
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Seus agentes
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Agentes atualmente disponíveis na sua operação.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {/* MARKETING AGENT */}
            <article className="group rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:border-slate-300">
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 shadow-2xs">
                      <Megaphone
                        className="h-5 w-5 text-slate-700"
                        strokeWidth={1.75}
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />

                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Disponível · manual
                        </span>
                      </div>

                      <h4 className="text-base font-bold tracking-tight text-slate-900">
                        Marketing Agent
                      </h4>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Conteúdo para revisão e catálogo social
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
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {showMenu && (
                      <div
                        role="menu"
                        aria-label="Informações do agente"
                        className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setShowMenu(false);
                            toast.info("O Marketing Agent é executado manualmente e cria rascunhos para revisão.");
                          }}
                          className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                        >
                          Execução manual e rascunhos
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {PLATFORMS.map((platform) => (
                    <span
                      key={platform.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-600"
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

                <div className="my-5 border-t border-slate-100" />

                {actionsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    A carregar o resumo da atividade...
                  </div>
                ) : actionsError ? (
                  <p className="text-xs leading-5 text-rose-600">
                    Resumo indisponível. Os dados anteriores podem estar desatualizados.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">Hoje</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900">{stats.totalToday}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">Rascunhos</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900">{stats.drafts}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">Bloqueados</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900">{stats.blocked}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">Falhas</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900">{stats.failed}</p>
                    </div>
                  </div>
                )}

                {latestAction && (
                  <>
                    <div className="my-5 border-t border-slate-100" />

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Última atividade
                      </p>

                      <div className="mt-2 flex items-start gap-2.5">
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900">
                            {ACTION_LABEL[latestAction.action] ??
                              latestAction.action}
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
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
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
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
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Ver atividade
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>

            {/* CURRENT CAPABILITIES */}
            <article className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-6 shadow-xs">
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-2xs">
                    <ShieldCheck
                      className="h-5 w-5 text-emerald-600"
                      strokeWidth={1.75}
                    />
                  </div>

                  <div>
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Guardrails
                    </p>

                    <h4 className="text-base font-bold tracking-tight text-slate-900">
                      Operação controlada
                    </h4>

                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                      O agente trabalha apenas com dados do catálogo e regras antes de gerar qualquer conteúdo.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Produtos
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Consulta dados reais do catálogo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Stock e preços
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Não inventa disponibilidade ou valores.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Promoções
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Valida descontos antes de publicar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Por canal
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Formato ideal para cada rede.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>Publicações passam primeiro por aprovação da equipe.</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* AGENT DETAIL / CAPABILITIES */}
        <section>
          <div className="mb-4">
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Marketing Agent
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              O que este agente pode consultar e executar atualmente.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Conhecimento
                </h4>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">
                    Produtos
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {productsLoading ? "…" : productsError ? "Indisponível" : products.length}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">
                    Informações da loja
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    No contexto
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Preços e stock
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    No contexto
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Permissões
                </h4>
              </div>

              <div className="mt-4 space-y-2">
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
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-500">
                      {label}
                    </span>

                    {enabled ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">
                        Não
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Execução
                </h4>
              </div>

              <div className="mt-4">
                <p className="text-xs leading-relaxed text-slate-500">
                  A execução é manual. O agente usa o produto e os canais
                  escolhidos e cria rascunhos para aprovação da equipe.
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
                <h3 className="text-base font-bold tracking-tight text-slate-900">
                  Atenção
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Eventos que exigiram intervenção ou foram bloqueados pelas regras do sistema.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
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
                        "flex min-h-14 w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
                        index < array.length - 1 &&
                          "border-b border-slate-100",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          item.status === "FAILED"
                            ? "text-rose-600"
                            : "text-amber-500",
                        )}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">
                            {ACTION_LABEL[item.action] ??
                              item.action}
                          </p>

                          <span className="text-[11px] text-slate-400">
                            {platformLabel(item.platform)}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.reason ?? "Sem motivo registado"}
                        </p>
                      </div>

                      <span className="shrink-0 text-[11px] text-slate-400">
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
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Atividade
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Amostra das últimas ações registadas.
              </p>
            </div>

            <span className="text-[11px] font-medium text-slate-400">
              Amostra: {Math.min(log.length, 100)} de 100 máximas
            </span>
          </div>

          {actionsLoading ? (
            <div className="flex min-h-36 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-8 text-xs text-slate-500 shadow-xs">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              A carregar histórico de atividade...
            </div>
          ) : actionsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center shadow-xs">
              <TriangleAlert className="mx-auto h-5 w-5 text-rose-600" />
              <p className="mt-2 text-xs font-bold text-rose-900">
                Não foi possível carregar a atividade.
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-rose-700">
                Tente novamente para consultar o registo.
              </p>
              <button
                type="button"
                onClick={loadData}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar novamente
              </button>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400">
                <Activity className="h-4 w-4" />
              </div>

              <p className="mt-3 text-xs font-bold text-slate-900">
                Nenhuma atividade ainda
              </p>

              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                Execute o Marketing Agent para começar a registrar ações nesta área.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              {recentActivity.map((item, index) => {
                const StatusIcon = statusIcon(item.status);
                const PlatformIcon = platformIcon(item.platform);

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedAction(item)}
                    className={cn(
                      "flex w-full items-start gap-3.5 px-5 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
                      index < recentActivity.length - 1 &&
                        "border-b border-slate-100",
                    )}
                  >
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600 shadow-2xs">
                      <StatusIcon
                        className="h-3.5 w-3.5"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          {ACTION_LABEL[item.action] ??
                            item.action}
                        </p>

                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                            actionStatusClass(item.status),
                          )}
                        >
                          {STATUS_LABEL[item.status] ??
                            item.status}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
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
                        <p className="mt-1.5 line-clamp-1 text-xs text-slate-500">
                          {item.reason}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300" />
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
          className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-xs animate-in fade-in-50"
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
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5 pt-[env(safe-area-inset-top)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Marketing Agent
                </p>

                <h3 id="run-panel-title" className="mt-0.5 text-base font-bold tracking-tight text-slate-900">
                  Executar agente
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowRunPanel(false)}
                aria-label="Fechar"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="agent-product"
                    className="text-xs font-bold text-slate-900"
                  >
                    Produto
                  </label>

                  <p className="mt-0.5 text-xs text-slate-500">
                    O agente vai usar somente os dados reais deste produto.
                  </p>

                  {productsLoading ? (
                    <div className="mt-3 flex min-h-10 items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      A carregar produtos...
                    </div>
                  ) : productsError ? (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
                      <p>Não foi possível consultar o catálogo.</p>
                      <button
                        type="button"
                        onClick={loadData}
                        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 font-medium text-rose-800 hover:bg-rose-100 transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Tentar novamente
                      </button>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-500">
                      Nenhum produto disponível para uma execução manual.
                    </div>
                  ) : (
                    <select
                      id="agent-product"
                      value={selectedProductId}
                      onChange={(event) =>
                        setSelectedProductId(event.target.value)
                      }
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
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
                  <p className="text-xs font-bold text-slate-900">
                    Canais
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Será criado um conteúdo adaptado para cada rede selecionada.
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
                            "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
                            checked
                              ? "border-slate-900 bg-slate-50/80 text-slate-900 shadow-2xs"
                              : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              togglePlatform(platform.id)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />

                          <Icon className="h-4 w-4 text-slate-600" />

                          <span className="text-xs font-semibold">
                            {platform.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Regras aplicadas automaticamente
                      </p>

                      <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-slate-600">
                        <li>• O produto precisa estar ativo.</li>
                        <li>• O stock precisa ser superior a zero.</li>
                        <li>• O preço precisa ser válido.</li>
                        <li>• A promoção não pode ser igual ou superior ao preço normal.</li>
                        <li>• A IA só recebe dados existentes no sistema.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {selectedPlatforms.length}{" "}
                  {selectedPlatforms.length === 1
                    ? "canal"
                    : "canais"}
                </span>

                <span className="font-semibold text-slate-900 truncate max-w-[180px]">
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
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
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
          className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-xs animate-in fade-in-50"
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
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5 pt-[env(safe-area-inset-top)]">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  aria-label="Voltar"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="min-w-0">
                  <p id="action-detail-title" className="truncate text-sm font-bold text-slate-900">
                    {ACTION_LABEL[selectedAction.action] ??
                      selectedAction.action}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {formatDate(selectedAction.created_at)}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                  actionStatusClass(selectedAction.status),
                )}
              >
                {STATUS_LABEL[selectedAction.status] ??
                  selectedAction.status}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <div className="border-r border-slate-200/80 pr-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Canal
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-900">
                      {platformLabel(selectedAction.platform)}
                    </p>
                  </div>

                  <div className="pl-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Produto
                    </p>

                    <p className="mt-1 truncate text-xs font-bold text-slate-900">
                      {productName(selectedAction.product_id)}
                    </p>
                  </div>
                </div>

                {selectedAction.reason && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                      <div>
                        <p className="text-xs font-bold text-amber-900">
                          Motivo
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-amber-800">
                          {selectedAction.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAction.content ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Conteúdo gerado
                        </p>

                        <p className="mt-0.5 text-xs font-bold text-slate-900">
                          {platformLabel(selectedAction.platform)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyContent(selectedAction.content!)
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                      <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800">
                        {selectedAction.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center">
                    <p className="text-xs font-semibold text-slate-700">
                      Nenhum conteúdo disponível
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Esta ação não possui texto associado.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 p-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="h-9 w-full rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
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
