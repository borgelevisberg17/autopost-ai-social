import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
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

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  images?: string[];
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
    desc: "Aguardando pagamento",
    icon: Clock3,
  },
  {
    key: "confirmed",
    step: 2,
    label: "Confirmado",
    title: "Confirmado",
    desc: "Stock reservado",
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
    desc: "Pedido finalizado",
    icon: PackageCheck,
  },
];

function getStatusIndex(status: string) {
  return STATUS_STEPS.findIndex((item) => item.key === status);
}

function getStatusBadge(status: string, hasSubmittedProof = false) {
  if (hasSubmittedProof && status === "pending") {
    return {
      label: "Comprovativo em Conferência",
      bg: "bg-amber-50 text-amber-900 border-amber-300",
      dot: "bg-amber-500",
    };
  }

  switch (status) {
    case "pending":
      return {
        label: "Aguardando Pagamento",
        bg: "bg-neutral-100 text-neutral-800 border-neutral-200",
        dot: "bg-neutral-400",
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

function getStatusMessage(status: string, storeName: string, hasSubmittedProof = false) {
  if (hasSubmittedProof && status === "pending") {
    return `Recebemos o seu comprovativo com sucesso! A equipa da ${storeName} está a conferir a transação bancária para avançar imediatamente com a preparação do seu pedido.`;
  }

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
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);

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

      if (companyData) {
        setCompany(companyData as Company);

        // Fetch products to match product images for ordered items
        const { data: prods } = await supabase
          .from("products")
          .select("id,name,price,images")
          .eq("company_id", companyData.id)
          .eq("active", true);

        if (active && prods) {
          setCatalogProducts(prods as CatalogProduct[]);
        }
      }

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
  const hasSubmittedProof = Boolean(
    order?.payment_submitted_at &&
      order?.payment_status !== "failed" &&
      order?.payment_status !== "paid",
  );
  const orderNumber = order?.id || id;
  const currency = company?.currency || "AOA";
  const storeName = company?.name || "Loja";

  // Build items list with images resolved from catalog or cache
  const displayedItems: OrderItem[] = useMemo(() => {
    let rawItems: OrderItem[] = [];
    if (items && items.length > 0) {
      rawItems = items;
    } else {
      const cached = getCachedOrderItems(id);
      if (cached && cached.length > 0) {
        rawItems = cached.map((c) => ({
          product_name: c.product_name,
          quantity: c.quantity,
          unit_price: c.unit_price,
          image: c.image,
          size: c.size,
          color: c.color,
        }));
      }
    }

    // Enrich with catalog images if missing
    return rawItems.map((item) => {
      if (!item.image && catalogProducts.length > 0) {
        const match = catalogProducts.find(
          (p) =>
            p.name.trim().toLowerCase() === item.product_name.trim().toLowerCase(),
        );
        if (match?.images?.[0]) {
          return { ...item, image: match.images[0] };
        }
      }
      return item;
    });
  }, [items, id, catalogProducts]);

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
    <div className="min-h-screen bg-[#fafafb] text-[#101114] flex flex-col justify-between selection:bg-black selection:text-white font-sans">
      {/* STICKY STORE HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e9e9eb] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to={`/loja/${slug}`}
            className="group flex min-w-0 items-center gap-3 transition"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#101114] text-white shadow-xs group-hover:scale-105 transition">
              <span className="text-sm font-black tracking-tight">
                {company?.name?.charAt(0).toUpperCase() || "L"}
              </span>
            </div>

            <div className="min-w-0">
              <span className="truncate text-sm font-bold tracking-tight text-[#101114] group-hover:text-black">
                {storeName}
              </span>
              <p className="text-[11px] font-medium text-neutral-400">
                Acompanhamento de Encomenda
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Apoio WhatsApp</span>
              </a>
            )}

            <Link
              to={`/loja/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-800 shadow-2xs transition hover:border-black hover:bg-neutral-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar à loja</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {loading ? (
          /* LOADING SKELETON */
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-3xl bg-white border border-[#e9e9eb] p-8">
              <div className="h-4 w-32 rounded bg-neutral-200" />
              <div className="mt-4 h-8 w-72 rounded bg-neutral-200" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-neutral-100" />
            </div>
            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <div className="h-96 rounded-3xl bg-white border border-[#e9e9eb]" />
              <div className="h-80 rounded-3xl bg-white border border-[#e9e9eb]" />
            </div>
          </div>
        ) : !order ? (
          /* NOT FOUND */
          <div className="mx-auto max-w-md rounded-3xl border border-[#e9e9eb] bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
              <XCircle className="h-8 w-8 text-neutral-500" />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight text-[#101114]">
              Pedido não encontrado
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              O pedido procurado não existe ou o link pode ter expirado. Verifique o código ou consulte a loja diretamente.
            </p>
            <div className="mt-8">
              <Link
                to={`/loja/${slug}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#101114] px-5 text-sm font-bold text-white shadow-md transition hover:bg-black"
              >
                Voltar à página inicial
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] items-start">
            {/* LEFT COLUMN: STATUS & PAYMENT */}
            <div className="space-y-8 min-w-0">
              {/* HERO STATUS CARD */}
              <div className="rounded-3xl border border-[#e9e9eb] bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e9e9eb] pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                        Acompanhamento
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-xs font-semibold text-neutral-500">
                        {formatShortDate(order.created_at)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#101114]">
                        Pedido #{orderNumber.slice(0, 8).toUpperCase()}
                      </h1>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.03 }}
                        onClick={copyOrderId}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition border cursor-pointer select-none ${
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
                      </motion.button>
                    </div>
                  </div>

                  {/* STATUS BADGE */}
                  <div>
                    {(() => {
                      const badge = getStatusBadge(order.status, hasSubmittedProof);
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
                  <div className="pt-2">
                    {/* DESKTOP STEPPER */}
                    <div className="hidden sm:block">
                      <div className="relative">
                        {/* Base Track */}
                        <div className="absolute left-[12%] right-[12%] top-5 h-[2px] -translate-y-1/2 rounded-full bg-neutral-200" />
                        {/* Active Progress Fill */}
                        <div
                          className="absolute left-[12%] top-5 h-[2px] -translate-y-1/2 rounded-full bg-[#101114] transition-all duration-500"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                76,
                                hasSubmittedProof && currentIndex === 0
                                  ? 16
                                  : (currentIndex / (STATUS_STEPS.length - 1)) * 76,
                              ),
                            )}%`,
                          }}
                        />

                        {/* Step Points */}
                        <div className="relative flex justify-between">
                          {STATUS_STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isDone = idx < currentIndex || (idx === 0 && hasSubmittedProof);
                            const isCurrent = idx === currentIndex && (!hasSubmittedProof || currentIndex > 0);
                            const isVerifying = idx === 1 && hasSubmittedProof && currentIndex === 0;

                            return (
                              <div
                                key={step.key}
                                className="flex flex-col items-center text-center max-w-[130px]"
                              >
                                <div
                                  className={`grid h-10 w-10 place-items-center rounded-2xl transition duration-300 ${
                                    isDone
                                      ? "bg-[#101114] text-white shadow-xs"
                                      : isVerifying
                                      ? "bg-amber-50 border-2 border-amber-500 text-amber-700 shadow-sm ring-4 ring-amber-100 animate-pulse"
                                      : isCurrent
                                      ? "bg-[#101114] text-white shadow-md ring-4 ring-neutral-200"
                                      : "bg-white text-neutral-300 border-2 border-neutral-200"
                                  }`}
                                >
                                  {isDone ? (
                                    <Check className="h-4 w-4 stroke-[3]" />
                                  ) : isVerifying ? (
                                    <Clock3 className="h-4 w-4" />
                                  ) : (
                                    <Icon className="h-4 w-4" />
                                  )}
                                </div>

                                <p
                                  className={`mt-3 text-xs font-bold ${
                                    isVerifying
                                      ? "text-amber-800"
                                      : isCurrent
                                      ? "text-[#101114]"
                                      : isDone
                                      ? "text-neutral-700"
                                      : "text-neutral-400"
                                  }`}
                                >
                                  {isVerifying ? "Em Conferência" : step.label}
                                </p>
                                <p className="mt-0.5 text-[11px] text-neutral-400 leading-tight">
                                  {isVerifying ? "Validação bancária" : step.desc}
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
                        const isDone = idx < currentIndex || (idx === 0 && hasSubmittedProof);
                        const isCurrent = idx === currentIndex && (!hasSubmittedProof || currentIndex > 0);
                        const isVerifying = idx === 1 && hasSubmittedProof && currentIndex === 0;
                        const isLast = idx === STATUS_STEPS.length - 1;

                        return (
                          <div key={step.key} className="relative flex items-start gap-3.5">
                            {!isLast && (
                              <div
                                className={`absolute left-4.5 top-9 bottom-0 w-0.5 -ml-px ${
                                  idx < currentIndex || (idx === 0 && hasSubmittedProof)
                                    ? "bg-[#101114]"
                                    : "bg-neutral-200"
                                }`}
                              />
                            )}

                            <div
                              className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                                isDone
                                  ? "bg-[#101114] text-white shadow-2xs"
                                  : isVerifying
                                  ? "bg-amber-50 border-2 border-amber-500 text-amber-700 shadow-xs ring-4 ring-amber-100"
                                  : isCurrent
                                  ? "bg-[#101114] text-white shadow-xs ring-4 ring-neutral-200"
                                  : "bg-white text-neutral-300 border-2 border-neutral-200"
                              }`}
                            >
                              {isDone ? (
                                <Check className="h-4 w-4 stroke-[3]" />
                              ) : isVerifying ? (
                                <Clock3 className="h-4 w-4" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>

                            <div className="pb-5 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-sm font-bold ${
                                    isVerifying
                                      ? "text-amber-800"
                                      : isCurrent
                                      ? "text-[#101114]"
                                      : isDone
                                      ? "text-neutral-700"
                                      : "text-neutral-400"
                                  }`}
                                >
                                  {isVerifying ? "Em Conferência Financeira" : step.title}
                                </p>
                                {isVerifying ? (
                                  <span className="inline-flex rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                                    A Validar
                                  </span>
                                ) : isCurrent ? (
                                  <span className="inline-flex rounded-full bg-[#101114] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                    Atual
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-0.5 text-xs text-neutral-500">
                                {isVerifying
                                  ? "A equipa da loja está a conferir o comprovativo enviado"
                                  : step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CONTEXTUAL STATUS BANNER */}
                    <div className="mt-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 p-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      {getStatusMessage(order.status, storeName, hasSubmittedProof)}
                    </div>
                  </div>
                ) : (
                  /* CANCELLED NOTICE */
                  <div className="rounded-2xl bg-red-50 p-4 border border-red-200/80 text-red-900 flex items-start gap-3.5">
                    <XCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold">Este pedido foi cancelado</p>
                      <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                        Não é necessário qualquer pagamento ou ação adicional. Se pretender reativar a encomenda, contacte a loja pelo WhatsApp.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* PAYMENT PANEL */}
              {!isCancelled && (
                <PaymentPanel
                  orderId={id}
                  total={Number(order.total)}
                  currency={currency}
                  paymentStatus={order.payment_status ?? "pending"}
                  submittedAt={order.payment_submitted_at ?? null}
                  whatsappNumber={company?.whatsapp ?? null}
                  storeName={storeName}
                  info={{
                    payment_iban: company?.payment_iban ?? null,
                    payment_iban_holder: company?.payment_iban_holder ?? null,
                    payment_express_number: company?.payment_express_number ?? null,
                  }}
                  onSubmitted={() => setReload((n) => n + 1)}
                />
              )}
            </div>

            {/* RIGHT COLUMN: STICKY UNIFIED ORDER & ITEMS SUMMARY */}
            <aside className="lg:sticky lg:top-24 space-y-6">
              <div className="rounded-3xl border border-[#e9e9eb] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-[#e9e9eb] pb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#101114]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#101114]">
                      Resumo da Encomenda
                    </h2>
                  </div>
                  {displayedItems.length > 0 && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
                      {displayedItems.length}{" "}
                      {displayedItems.length === 1 ? "artigo" : "artigos"}
                    </span>
                  )}
                </div>

                {/* ITEMS LIST */}
                {displayedItems.length > 0 ? (
                  <div className="divide-y divide-neutral-100 max-h-[360px] overflow-y-auto pr-1">
                    {displayedItems.map((item, index) => {
                      const lineTotal =
                        Number(item.unit_price) * Number(item.quantity);

                      return (
                        <div
                          key={`${item.product_name}-${index}`}
                          className="flex items-center gap-3.5 py-3.5 first:pt-1 last:pb-1"
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100 border border-neutral-200/60">
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
                            <p className="truncate text-xs font-bold text-[#101114]">
                              {item.product_name}
                            </p>

                            {(item.size || item.color) && (
                              <p className="mt-0.5 text-[11px] text-neutral-400 font-medium">
                                {item.size && `Tam: ${item.size}`}{" "}
                                {item.color && `• Cor: ${item.color}`}
                              </p>
                            )}

                            <p className="mt-1 text-[11px] text-neutral-500 font-medium">
                              Qtd: {item.quantity} × {formatMoney(item.unit_price, currency)}
                            </p>
                          </div>

                          <p className="shrink-0 text-xs font-bold tabular-nums text-[#101114]">
                            {formatMoney(lineTotal, currency)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-neutral-500">
                    Detalhes dos artigos registados no sistema da loja.
                  </div>
                )}

                {/* FINANCIAL TOTALS */}
                <div className="border-t border-[#e9e9eb] pt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span className="font-semibold tabular-nums text-[#101114]">
                      {formatMoney(calculatedSubtotal, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-500">
                    <span>Entrega</span>
                    <span className="font-semibold text-emerald-600">
                      Grátis / A combinar
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                    <span className="text-sm font-bold text-[#101114]">
                      Total
                    </span>
                    <span className="text-xl font-black tabular-nums text-[#101114]">
                      {formatMoney(order.total, currency)}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="space-y-2.5 pt-2">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.99]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Falar no WhatsApp</span>
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

                {/* TRUST BADGE */}
                <div className="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70 text-[11px] text-neutral-500 leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-700 mt-0.5" />
                  <span>
                    Garantia de conformidade fiscal e stock real. O seu comprovativo é validado diretamente pela loja.
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* FOOTER */}
      {company && <StoreFooter company={company} />}
    </div>
  );
}
