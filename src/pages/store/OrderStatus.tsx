import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS, formatMoney } from "@/lib/format";

type Order = {
  id?: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string;
};

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
};

type Company = {
  name: string;
  currency: string;
};

const STATUS_FLOW = [
  {
    key: "pending",
    label: "Recebido",
    description: "Pedido recebido",
    icon: Clock3,
  },
  {
    key: "confirmed",
    label: "Confirmado",
    description: "Pedido confirmado",
    icon: CheckCircle2,
  },
  {
    key: "shipped",
    label: "A caminho",
    description: "Pedido enviado",
    icon: Truck,
  },
  {
    key: "completed",
    label: "Concluído",
    description: "Pedido concluído",
    icon: PackageCheck,
  },
];

function getStatusIndex(status: string) {
  return STATUS_FLOW.findIndex((item) => item.key === status);
}

function getStatusMessage(status: string) {
  switch (status) {
    case "pending":
      return "Recebemos o teu pedido e estamos a processá-lo.";

    case "confirmed":
      return "O teu pedido foi confirmado e está a ser preparado.";

    case "shipped":
      return "O teu pedido está a caminho.";

    case "completed":
      return "O teu pedido foi concluído.";

    case "cancelled":
      return "Este pedido foi cancelado.";

    default:
      return "Estamos a acompanhar o teu pedido.";
  }
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function OrderStatus() {
  const { slug = "", id = "" } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [
        { data: orderData },
        { data: companyData },
        { data: itemsData },
      ] = await Promise.all([
        supabase.rpc("get_order_status", {
          _order: id,
        }),

        supabase
          .from("companies")
          .select("name,currency")
          .eq("slug", slug)
          .maybeSingle(),

        supabase
          .from("order_items")
          .select("product_name,quantity,unit_price")
          .eq("order_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (!active) return;

      setOrder(orderData?.[0] ?? null);
      setItems((itemsData as OrderItem[]) ?? []);

      if (companyData) {
        setCompany(companyData as Company);
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [id, slug]);

  const currentIndex = useMemo(
    () => (order ? getStatusIndex(order.status) : -1),
    [order],
  );

  const isCancelled = order?.status === "cancelled";

  const orderNumber = order?.id || id;

  const currency = company?.currency || "AOA";

  const calculatedItemsTotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.unit_price) * Number(item.quantity),
      0,
    );
  }, [items]);

  const copyOrderId = async () => {
    if (!orderNumber) return;

    try {
      await navigator.clipboard?.writeText(orderNumber);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#202522]">
      {/* HEADER */}

      <header className="border-b border-[#ded9d0] bg-[#fffdf9]">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link
            to={`/loja/${slug}`}
            className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] bg-black text-white">
              <span className="text-sm font-bold">
                {company?.name?.charAt(0).toUpperCase() || "L"}
              </span>
            </div>

            <span className="max-w-[220px] truncate text-sm font-semibold tracking-tight">
              {company?.name || "Loja"}
            </span>
          </Link>

          <Link
            to={`/loja/${slug}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-[7px] border border-[#c9c3b8] px-4 text-sm font-semibold transition hover:border-neutral-500 hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:inline">
              Voltar à loja
            </span>

            <span className="sm:hidden">
              Loja
            </span>
          </Link>
        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto w-full max-w-[1120px] px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        {/* LOADING */}

        {loading ? (
          <div className="animate-pulse">
            <div className="h-3 w-32 rounded bg-[#e7e2d9]" />

            <div className="mt-5 h-12 w-[420px] max-w-full rounded bg-[#e7e2d9]" />

            <div className="mt-4 h-5 w-[520px] max-w-full rounded bg-[#ebe7df]" />

            <div className="mt-12 border-t border-[#ded9d0] pt-10">
              <div className="h-4 w-24 rounded bg-[#e7e2d9]" />

              <div className="mt-8 grid gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded bg-[#ebe7df]"
                  />
                ))}
              </div>

              <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <div className="h-4 w-24 rounded bg-[#e7e2d9]" />
                  <div className="h-20 rounded bg-[#ebe7df]" />
                  <div className="h-20 rounded bg-[#ebe7df]" />
                  <div className="h-20 rounded bg-[#ebe7df]" />
                </div>

                <div className="h-48 rounded bg-[#ebe7df]" />
              </div>
            </div>
          </div>
        ) : !order ? (
          /* NOT FOUND */

          <section className="mx-auto max-w-xl py-12 text-center sm:py-20">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-[7px] bg-[#ebe7df]">
              <XCircle className="h-6 w-6 text-[#5f625d]" />
            </div>

            <h1 className="mt-7 text-2xl font-bold tracking-tight sm:text-3xl">
              Pedido não encontrado
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747b73]">
              O pedido pode ter sido removido ou o link pode
              estar incorreto.
            </p>

            <Link
              to={`/loja/${slug}`}
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[7px] bg-black px-6 text-sm font-bold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
            >
              Voltar à loja
            </Link>
          </section>
        ) : (
          <>
            {/* INTRO */}

            <section>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#747b73]">
                  Acompanhamento
                </p>

                <span className="h-1 w-1 rounded-[7px] bg-neutral-300" />

                <p className="text-xs font-medium text-[#747b73]">
                  {formatShortDate(order.created_at)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-[2.4rem] font-bold leading-none tracking-[-0.055em] sm:text-5xl">
                  Pedido #{orderNumber}
                </h1>

                <button
                  type="button"
                  onClick={copyOrderId}
                  className="inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-[#c9c3b8] px-3 text-xs font-semibold text-[#5f625d] transition hover:border-neutral-500 hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                  aria-label="Copiar número do pedido"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#747b73]">
                Olá,{" "}
                <span className="font-semibold text-[#202522]">
                  {order.customer_name}
                </span>
                . {getStatusMessage(order.status)}
              </p>
            </section>

            {/* STATUS */}

            <section className="mt-12 border-y border-[#ded9d0] py-8 sm:mt-14 sm:py-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#747b73]">
                    Estado do pedido
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight">
                    {isCancelled
                      ? "Pedido cancelado"
                      : ORDER_STATUS[order.status] ?? order.status}
                  </h2>
                </div>

                {!isCancelled && (
                  <div className="inline-flex items-center gap-2 rounded-[7px] bg-[#ebe7df] px-3 py-1.5 text-xs font-bold text-[#303732]">
                    <span className="h-1.5 w-1.5 rounded-[7px] bg-black" />
                    Em acompanhamento
                  </div>
                )}
              </div>

              {isCancelled ? (
                <div className="mt-8 flex items-start gap-4 border-t border-[#ded9d0] pt-7">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[7px] bg-[#ebe7df]">
                    <XCircle className="h-5 w-5 text-[#5f625d]" />
                  </div>

                  <div>
                    <p className="font-semibold">
                      Este pedido foi cancelado.
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#747b73]">
                      Não é necessário realizar mais nenhuma ação
                      neste pedido.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-9">
                  {/* DESKTOP TIMELINE */}

                  <div className="hidden sm:grid sm:grid-cols-4">
                    {STATUS_FLOW.map((step, index) => {
                      const Icon = step.icon;

                      const active = index <= currentIndex;
                      const current = index === currentIndex;

                      return (
                        <div
                          key={step.key}
                          className="relative"
                        >
                          {index < STATUS_FLOW.length - 1 && (
                            <span
                              className={`absolute left-[34px] right-0 top-4 h-px ${
                                index < currentIndex
                                  ? "bg-black"
                                  : "bg-[#e7e2d9]"
                              }`}
                              aria-hidden="true"
                            />
                          )}

                          <div className="relative">
                            <div
                              className={`grid h-8 w-8 place-items-center rounded-[7px] border ${
                                active
                                  ? "border-black bg-black text-white"
                                  : "border-[#c9c3b8] bg-[#fffdf9] text-[#a7aaa2]"
                              } ${
                                current
                                  ? "ring-4 ring-neutral-100"
                                  : ""
                              }`}
                            >
                              {active ? (
                                <Icon className="h-3.5 w-3.5" />
                              ) : (
                                <span className="h-2 w-2 rounded-[7px] bg-neutral-300" />
                              )}
                            </div>

                            <p
                              className={`mt-4 text-sm font-bold ${
                                active
                                  ? "text-[#202522]"
                                  : "text-[#747b73]"
                              }`}
                            >
                              {step.label}
                            </p>

                            <p className="mt-1 text-xs text-[#747b73]">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* MOBILE TIMELINE */}

                  <div className="sm:hidden">
                    {STATUS_FLOW.map((step, index) => {
                      const Icon = step.icon;

                      const active = index <= currentIndex;
                      const current = index === currentIndex;
                      const last = index === STATUS_FLOW.length - 1;

                      return (
                        <div
                          key={step.key}
                          className="relative flex gap-4"
                        >
                          {!last && (
                            <span
                              className={`absolute left-4 top-8 h-[calc(100%-8px)] w-px ${
                                index < currentIndex
                                  ? "bg-black"
                                  : "bg-[#e7e2d9]"
                              }`}
                              aria-hidden="true"
                            />
                          )}

                          <div
                            className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-[7px] border ${
                              active
                                ? "border-black bg-black text-white"
                                : "border-[#c9c3b8] bg-[#fffdf9] text-[#a7aaa2]"
                            } ${
                              current
                                ? "ring-4 ring-neutral-100"
                                : ""
                            }`}
                          >
                            {active ? (
                              <Icon className="h-3.5 w-3.5" />
                            ) : (
                              <span className="h-2 w-2 rounded-[7px] bg-neutral-300" />
                            )}
                          </div>

                          <div className="pb-8">
                            <p
                              className={`text-sm font-bold ${
                                active
                                  ? "text-[#202522]"
                                  : "text-[#747b73]"
                              }`}
                            >
                              {step.label}
                            </p>

                            <p className="mt-1 text-sm text-[#747b73]">
                              {step.description}
                            </p>

                            {current && (
                              <span className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-[0.15em] text-[#747b73]">
                                Estado atual
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ORDER DETAILS */}

            <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20">
              {/* ITEMS */}

              <section>
                <div className="flex items-end justify-between border-b border-[#ded9d0] pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#747b73]">
                      Pedido
                    </p>

                    <h2 className="mt-2 text-xl font-bold tracking-tight">
                      {items.length > 0
                        ? `${items.length} ${
                            items.length === 1
                              ? "item"
                              : "itens"
                          }`
                        : "Resumo do pedido"}
                    </h2>
                  </div>
                </div>

                {items.length > 0 ? (
                  <div className="divide-y divide-neutral-200">
                    {items.map((item, index) => {
                      const lineTotal =
                        Number(item.unit_price) *
                        Number(item.quantity);

                      return (
                        <div
                          key={`${item.product_name}-${index}`}
                          className="flex gap-4 py-6"
                        >
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#ebe7df] text-xs font-bold text-[#747b73]">
                            {String(item.quantity).padStart(2, "0")}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#202522]">
                              {item.product_name}
                            </p>

                            <p className="mt-1 text-sm text-[#747b73]">
                              {item.quantity} ×{" "}
                              {formatMoney(
                                item.unit_price,
                                currency,
                              )}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-[#202522]">
                            {formatMoney(
                              lineTotal,
                              currency,
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-sm text-[#747b73]">
                    Os itens deste pedido não estão disponíveis
                    para visualização.
                  </div>
                )}

                <div className="border-t border-[#ded9d0] pt-5">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-sm text-[#747b73]">
                      Total
                    </span>

                    <span className="text-lg font-bold tracking-tight">
                      {formatMoney(
                        order.total,
                        currency,
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* SUMMARY */}

              <aside className="self-start lg:sticky lg:top-8">
                <div className="border-t-2 border-black pt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#747b73]">
                    Resumo
                  </p>

                  <div className="mt-7 space-y-5">
                    <div className="flex items-center justify-between gap-5">
                      <span className="text-sm text-[#747b73]">
                        Estado
                      </span>

                      <span className="text-sm font-semibold">
                        {ORDER_STATUS[order.status] ??
                          order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-5">
                      <span className="text-sm text-[#747b73]">
                        Data
                      </span>

                      <span className="text-right text-sm font-semibold">
                        {formatShortDate(order.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-7 border-y border-[#ded9d0] py-6">
                    <div className="flex items-end justify-between gap-5">
                      <span className="text-sm font-medium text-[#747b73]">
                        Total do pedido
                      </span>

                      <span className="text-xl font-bold tracking-tight">
                        {formatMoney(
                          order.total,
                          currency,
                        )}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/loja/${slug}`}
                    className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-[7px] bg-black px-5 text-sm font-bold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                  >
                    Continuar a comprar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </div>

            {/* FOOT NOTE */}

            <div className="mt-12 border-t border-[#ded9d0] pt-6">
              <p className="text-xs leading-5 text-[#747b73]">
                Pedido realizado em{" "}
                <span className="font-medium text-[#5f625d]">
                  {formatOrderDate(order.created_at)}
                </span>
                .
              </p>
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}

      <footer className="mt-8 border-t border-[#ded9d0] bg-[#f5f5f2]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-tight text-[#202522]">
            {company?.name || "Loja"}
          </p>

          <p className="text-xs font-medium text-[#747b73]">
            © {new Date().getFullYear()}{" "}
            {company?.name || "Loja"}
          </p>
        </div>
      </footer>
    </main>
  );
}
