import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  HelpCircle,
  MessageCircle,
  Package,
  PackageCheck,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS, formatMoney } from "@/lib/format";
import {
  rememberOrder,
  getCachedOrderItems,
} from "@/lib/myOrders";
import { PaymentPanel } from "@/components/store/PaymentPanel";
import { StoreFooter } from "@/components/store/StoreFooter";

type Order = {
  id?: string;
  status: string;
  total: number;
  created_at: string;
  customer_name?: string | null;
  payment_status?: string;
  payment_method?: string | null;
  payment_submitted_at?: string | null;
};

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  image?: string;
  size?: string;
  color?: string;
};

type Company = {
  id?: string;
  name: string;
  slug: string;
  currency?: string;
  description?: string | null;
  whatsapp?: string | null;
  payment_iban?: string | null;
  payment_iban_holder?: string | null;
  payment_express_number?: string | null;
};

const STATUS_STEPS = [
  {
    key: "pending",
    step: 1,
    label: "Recebido",
    title: "Pedido Recebido",
    desc: "Aguardando confirmação",
    icon: Clock3,
  },
  {
    key: "confirmed",
    step: 2,
    label: "Confirmado",
    title: "Confirmado",
    desc: "Stock reservado e em preparação",
    icon: CheckCircle2,
  },
  {
    key: "shipped",
    step: 3,
    label: "A caminho",
    title: "Em Transporte",
    desc: "Expedido para entrega",
    icon: Truck,
  },
  {
    key: "completed",
    step: 4,
    label: "Concluído",
    title: "Entregue",
    desc: "Pedido finalizado com sucesso",
    icon: PackageCheck,
  },
];

function getStatusIndex(status: string) {
  return STATUS_STEPS.findIndex((item) => item.key === status);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "Aguardando Pagamento",
        bg: "bg-amber-50 text-amber-800 border-amber-200/80",
        dot: "bg-amber-500",
      };
    case "confirmed":
      return {
        label: "Confirmado & Em Preparação",
        bg: "bg-blue-50 text-blue-800 border-blue-200/80",
        dot: "bg-blue-600",
      };
    case "shipped":
      return {
        label: "A Caminho / Em Transporte",
        bg: "bg-purple-50 text-purple-800 border-purple-200/80",
        dot: "bg-purple-600",
      };
    case "completed":
      return {
        label: "Entregue & Concluído",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
        dot: "bg-emerald-600",
      };
    case "cancelled":
      return {
        label: "Pedido Cancelado",
        bg: "bg-red-50 text-red-800 border-red-200/80",
        dot: "bg-red-600",
      };
    default:
      return {
        label: ORDER_STATUS[status] ?? status,
        bg: "bg-neutral-100 text-neutral-800 border-neutral-200",
        dot: "bg-neutral-500",
      };
  }
}

function getStatusMessage(status: string, storeName: string) {
  switch (status) {
    case "pending":
      return `Recebemos o seu pedido na ${storeName}. Conclua o pagamento para reservarmos o seu stock e avançarmos com a preparação.`;
    case "confirmed":
      return `O seu pagamento foi confirmado com sucesso! A equipa da ${storeName} está neste momento a separar e embalar os seus artigos.`;
    case "shipped":
      return `A sua encomenda já foi expedida pela ${storeName} e está a caminho da morada acordada.`;
    case "completed":
      return `A sua encomenda foi entregue com sucesso! Muito obrigado pela sua preferência na ${storeName}.`;
    case "cancelled":
      return "Este pedido foi cancelado e nenhuma cobrança adicional será efetuada.";
    default:
      return `Estamos a acompanhar o seu pedido na ${storeName}.`;
  }
}

function formatOrderDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatShortDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function OrderStatus() {
  const { slug = "", id = "" } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      if (reload === 0) setLoading(true);

      const [{ data: orderData }, { data: companyData }] = await Promise.all([
        supabase.rpc("get_order_status", { _order: id }),
        supabase
          .from("companies")
          .select(
            "id,name,slug,currency,description,whatsapp,payment_iban,payment_iban_holder,payment_express_number",
          )
          .eq("slug", slug)
          .maybeSingle(),
      ]);

      if (!active) return;

      const row = (orderData as unknown as (Order & { items: OrderItem[] })[] | null)?.[0] ?? null;
      setOrder(row);
      setItems(row?.items ?? []);
      if (companyData) setCompany(companyData as Company);
      if (row) rememberOrder(slug, id);
      setLoading(false);
    }

    load();
    const t = window.setInterval(load, 25000);

    return () => {
      active = false;
      window.clearInterval(t);
    };
  }, [id, slug, reload]);

  const currentIndex = useMemo(
    () => (order ? getStatusIndex(order.status) : -1),
    [order],
  );

  const isCancelled = order?.status === "cancelled";
  const orderNumber = order?.id || id;
  const currency = company?.currency || "AOA";
  const storeName = company?.name || "Loja";

  // Check cached items if RPC returns empty items list
  const displayedItems: OrderItem[] = useMemo(() => {
    if (items && items.length > 0) return items;
    const cached = getCachedOrderItems(id);
    if (cached && cached.length > 0) {
      return cached.map((c) => ({
        product_name: c.product_name,
        quantity: c.quantity,
        unit_price: c.unit_price,
        image: c.image,
        size: c.size,
        color: c.color,
      }));
    }
    return [];
  }, [items, id]);

  const calculatedSubtotal = useMemo(() => {
    if (displayedItems.length > 0) {
      return displayedItems.reduce(
        (total, item) => total + Number(item.unit_price) * Number(item.quantity),
        0,
      );
    }
    return order?.total ?? 0;
  }, [displayedItems, order?.total]);

  const copyOrderId = async () => {
    if (!orderNumber) return;
    try {
      await navigator.clipboard?.writeText(orderNumber);
      setCopied(true);
      toast.success("Número do pedido copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const cleanWhatsapp = company?.whatsapp?.replace(/\D/g, "") || "";
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
        `Olá! Gostaria de informações sobre o meu pedido #${orderNumber} na loja ${storeName}.`,
      )}`
    : null;

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-neutral-900 flex flex-col justify-between selection:bg-black selection:text-white">
      {/* STICKY LUXURY HEADER */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to={`/loja/${slug}`}
            className="group flex min-w-0 items-center gap-3 transition"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#111216] text-white shadow-xs group-hover:scale-105 transition">
              <span className="text-sm font-black tracking-tight">
                {company?.name?.charAt(0).toUpperCase() || "L"}
              </span>
            </div>

            <div className="min-w-0">
              <span className="truncate text-sm font-bold tracking-tight text-neutral-900 group-hover:text-black">
                {storeName}
              </span>
              <p className="text-[11px] font-medium text-neutral-400">
                Acompanhamento Oficial
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Apoio WhatsApp</span>
              </a>
            )}

            <Link
              to={`/loja/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 shadow-2xs transition hover:border-black hover:bg-neutral-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar à loja</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {loading ? (
          /* LOADING SKELETON */
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-3xl bg-white border border-neutral-200/80 p-8">
              <div className="h-4 w-32 rounded bg-neutral-200" />
              <div className="mt-4 h-8 w-72 rounded bg-neutral-200" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-neutral-100" />
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <div className="h-64 rounded-3xl bg-white border border-neutral-200/80" />
                <div className="h-48 rounded-3xl bg-white border border-neutral-200/80" />
              </div>
              <div className="h-80 rounded-3xl bg-white border border-neutral-200/80" />
            </div>
          </div>
        ) : !order ? (
          /* NOT FOUND STATE */
          <div className="mx-auto max-w-md rounded-3xl border border-neutral-200/80 bg-white p-8 text-center shadow-xs sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
              <XCircle className="h-8 w-8 text-neutral-500" />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight text-neutral-900">
              Pedido não encontrado
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              O pedido procurado não existe ou o link pode ter expirado. Verifique o código ou consulte a loja diretamente.
            </p>
            <div className="mt-8 flex flex-col gap-2.5">
              <Link
                to={`/loja/${slug}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#111216] px-5 text-sm font-bold text-white shadow-md transition hover:bg-black"
              >
                Voltar à página inicial
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* HERO STATUS CARD */}
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      Acompanhamento em Tempo Real
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-xs font-semibold text-neutral-500">
                      {formatShortDate(order.created_at)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
                      Pedido #{orderNumber.slice(0, 8).toUpperCase()}
                    </h1>

                    <button
                      type="button"
                      onClick={copyOrderId}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition border ${
                        copied
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-black hover:text-black"
                      }`}
                      aria-label="Copiar ID do pedido"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-neutral-400" />
                          <span>Copiar ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-neutral-500 max-w-2xl leading-relaxed">
                    {getStatusMessage(order.status, storeName)}
                  </p>
                </div>

                {/* STATUS BADGE */}
                <div>
                  {(() => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-2xs ${badge.bg}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${badge.dot} ${
                            !isCancelled && order.status !== "completed"
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                        <span>{badge.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* TIMELINE PROGRESS TRACKER */}
              {!isCancelled ? (
                <div className="mt-8 pt-2">
                  {/* DESKTOP STEPPER */}
                  <div className="hidden sm:block">
                    <div className="relative">
                      {/* Base Track */}
                      <div className="absolute left-[5%] right-[5%] top-5 h-1 -translate-y-1/2 rounded-full bg-neutral-100" />
                      {/* Active Progress Fill */}
                      <div
                        className="absolute left-[5%] top-5 h-1 -translate-y-1/2 rounded-full bg-[#111216] transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, (currentIndex / (STATUS_STEPS.length - 1)) * 90),
                          )}%`,
                        }}
                      />

                      {/* Step Points */}
                      <div className="relative flex justify-between">
                        {STATUS_STEPS.map((step, idx) => {
                          const Icon = step.icon;
                          const isDone = idx < currentIndex;
                          const isCurrent = idx === currentIndex;
                          const isPending = idx > currentIndex;

                          return (
                            <div
                              key={step.key}
                              className="flex flex-col items-center text-center max-w-[140px]"
                            >
                              <div
                                className={`grid h-10 w-10 place-items-center rounded-2xl transition duration-300 ${
                                  isDone
                                    ? "bg-[#111216] text-white shadow-xs"
                                    : isCurrent
                                    ? "bg-[#111216] text-white shadow-md ring-4 ring-neutral-200"
                                    : "bg-white text-neutral-300 border-2 border-neutral-200"
                                }`}
                              >
                                {isDone ? (
                                  <Check className="h-4 w-4 stroke-[3]" />
                                ) : (
                                  <Icon className="h-4 w-4" />
                                )}
                              </div>

                              <p
                                className={`mt-3 text-xs font-bold ${
                                  isCurrent
                                    ? "text-neutral-900"
                                    : isDone
                                    ? "text-neutral-700"
                                    : "text-neutral-400"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-neutral-400 leading-tight">
                                {step.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* MOBILE STEPPER */}
                  <div className="sm:hidden space-y-4 pt-1">
                    {STATUS_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isDone = idx < currentIndex;
                      const isCurrent = idx === currentIndex;
                      const isPending = idx > currentIndex;
                      const isLast = idx === STATUS_STEPS.length - 1;

                      return (
                        <div key={step.key} className="relative flex items-start gap-3.5">
                          {!isLast && (
                            <div
                              className={`absolute left-4.5 top-9 bottom-0 w-0.5 -ml-px ${
                                idx < currentIndex
                                  ? "bg-[#111216]"
                                  : "bg-neutral-200"
                              }`}
                            />
                          )}

                          <div
                            className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                              isDone
                                ? "bg-[#111216] text-white shadow-2xs"
                                : isCurrent
                                ? "bg-[#111216] text-white shadow-xs ring-4 ring-neutral-200"
                                : "bg-white text-neutral-300 border-2 border-neutral-200"
                            }`}
                          >
                            {isDone ? (
                              <Check className="h-4 w-4 stroke-[3]" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>

                          <div className="pb-5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-bold ${
                                  isCurrent
                                    ? "text-neutral-900"
                                    : isDone
                                    ? "text-neutral-700"
                                    : "text-neutral-400"
                                }`}
                              >
                                {step.title}
                              </p>
                              {isCurrent && (
                                <span className="inline-flex rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                  Estado Atual
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* CANCELLED NOTICE */
                <div className="mt-6 flex items-start gap-4 rounded-2xl bg-red-50 p-4 border border-red-200/80 text-red-900">
                  <XCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Este pedido foi cancelado</p>
                    <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                      Não é necessário qualquer pagamento ou ação adicional. Se tiver alguma dúvida ou pretender reativar a encomenda, contacte a loja via WhatsApp.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* TWO-COLUMN DETAILS GRID */}
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* LEFT COLUMN: PAYMENT PANEL & ORDER ITEMS */}
              <div className="space-y-8 min-w-0">
                {/* PAYMENT SECTION */}
                {!isCancelled && (
                  <PaymentPanel
                    orderId={id}
                    total={Number(order.total)}
                    currency={currency}
                    paymentStatus={order.payment_status ?? "pending"}
                    submittedAt={order.payment_submitted_at ?? null}
                    info={{
                      payment_iban: company?.payment_iban ?? null,
                      payment_iban_holder: company?.payment_iban_holder ?? null,
                      payment_express_number: company?.payment_express_number ?? null,
                    }}
                    onSubmitted={() => setReload((n) => n + 1)}
                  />
                )}

                {/* ORDER ITEMS CARD */}
                <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-neutral-900">
                          Artigos do Pedido
                        </h2>
                        <p className="text-xs text-neutral-400">
                          {displayedItems.length > 0
                            ? `${displayedItems.length} ${
                                displayedItems.length === 1 ? "artigo" : "artigos"
                              } no seu pedido`
                            : "Resumo da encomenda"}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-neutral-400">
                      Stock Garantido
                    </span>
                  </div>

                  {/* ITEMS LIST */}
                  {displayedItems.length > 0 ? (
                    <div className="divide-y divide-neutral-100">
                      {displayedItems.map((item, index) => {
                        const lineTotal =
                          Number(item.unit_price) * Number(item.quantity);

                        return (
                          <div
                            key={`${item.product_name}-${index}`}
                            className="flex items-start gap-4 py-5 first:pt-4 last:pb-2"
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/60">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.product_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-neutral-400">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-neutral-900">
                                {item.product_name}
                              </p>

                              {(item.size || item.color) && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {item.size && (
                                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                                      Tam: {item.size}
                                    </span>
                                  )}
                                  {item.color && (
                                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                                      Cor: {item.color}
                                    </span>
                                  )}
                                </div>
                              )}

                              <p className="mt-1.5 text-xs text-neutral-400">
                                {item.quantity} ×{" "}
                                <span className="font-semibold text-neutral-700">
                                  {formatMoney(item.unit_price, currency)}
                                </span>
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-black tabular-nums text-neutral-900">
                              {formatMoney(lineTotal, currency)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-neutral-500">
                      <p className="text-sm">
                        O resumo dos artigos foi registado no sistema da loja.
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        O valor total deste pedido é de{" "}
                        <strong className="text-neutral-800">
                          {formatMoney(order.total, currency)}
                        </strong>
                        .
                      </p>
                    </div>
                  )}

                  {/* FINANCIAL TOTAL BREAKDOWN */}
                  <div className="mt-6 border-t border-neutral-100 pt-5 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between text-neutral-600">
                      <span>Subtotal dos Artigos</span>
                      <span className="font-semibold tabular-nums text-neutral-900">
                        {formatMoney(calculatedSubtotal, currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-600">
                      <span>Entrega</span>
                      <span className="font-semibold text-emerald-600">
                        Grátis / A combinar
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                      <span className="text-base font-bold text-neutral-900">
                        Total Final
                      </span>
                      <span className="text-2xl font-black tracking-tight tabular-nums text-neutral-900">
                        {formatMoney(order.total, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: STICKY ORDER SUMMARY & ACTIONS */}
              <aside className="space-y-6 lg:sticky lg:top-24 self-start">
                <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                      Resumo do Pedido
                    </h3>
                    <Receipt className="h-4 w-4 text-neutral-400" />
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Nº do Pedido</span>
                      <span className="font-mono font-bold text-neutral-800">
                        #{orderNumber.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Data de Registo</span>
                      <span className="font-semibold text-neutral-800">
                        {formatOrderDate(order.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Estado</span>
                      <span className="font-bold text-neutral-900">
                        {ORDER_STATUS[order.status] ?? order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                      <span className="text-sm font-bold text-neutral-700">
                        Total a Liquidar
                      </span>
                      <span className="text-lg font-black text-neutral-900">
                        {formatMoney(order.total, currency)}
                      </span>
                    </div>
                  </div>

                  {/* QUICK ACTIONS */}
                  <div className="space-y-2.5 pt-2">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.99]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Falar com a loja no WhatsApp</span>
                      </a>
                    )}

                    <Link
                      to={`/loja/${slug}`}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-sm font-bold text-neutral-800 shadow-2xs transition hover:border-black hover:bg-neutral-50"
                    >
                      <span>Continuar a Comprar</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* TRUST & GUARANTEE NOTE */}
                  <div className="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70 text-[11px] text-neutral-500 leading-relaxed flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-700 mt-0.5" />
                    <span>
                      Garantia de conformidade fiscal e stock real. O seu comprovativo é validado diretamente pela loja.
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* FULL LUXURY FOOTER */}
      {company && (
        <StoreFooter
          company={company}
        />
      )}
    </div>
  );
}
