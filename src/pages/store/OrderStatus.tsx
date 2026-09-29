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

type Company = {
  name: string;
  currency: string;
};

const STATUS_FLOW = [
  {
    key: "pending",
    label: "Pedido recebido",
    description: "Recebemos o teu pedido.",
    icon: Clock3,
  },
  {
    key: "confirmed",
    label: "Pedido confirmado",
    description: "A loja confirmou o pedido.",
    icon: CheckCircle2,
  },
  {
    key: "shipped",
    label: "A caminho",
    description: "O pedido está a caminho.",
    icon: Truck,
  },
  {
    key: "completed",
    label: "Concluído",
    description: "O pedido foi concluído.",
    icon: PackageCheck,
  },
];

function getStatusIndex(status: string) {
  return STATUS_FLOW.findIndex(
    (item) => item.key === status,
  );
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

export default function OrderStatus() {
  const { slug = "", id = "" } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [{ data: orderData }, { data: companyData }] =
        await Promise.all([
          supabase.rpc("get_order_status", {
            _order: id,
          }),

          supabase
            .from("companies")
            .select("name,currency")
            .eq("slug", slug)
            .maybeSingle(),
        ]);

      if (!active) return;

      setOrder(orderData?.[0] ?? null);

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

  const orderNumber =
    order?.id || id;

  const copyOrderId = async () => {
    if (!orderNumber) return;

    try {
      await navigator.clipboard?.writeText(
        orderNumber,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      {/* STORE HEADER */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link
            to={`/loja/${slug}`}
            className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white">
              <span className="text-sm font-bold">
                {company?.name
                  ?.charAt(0)
                  .toUpperCase() || "L"}
              </span>
            </div>

            <span className="max-w-[220px] truncate text-sm font-semibold tracking-tight text-neutral-950">
              {company?.name || "Loja"}
            </span>
          </Link>

          <Link
            to={`/loja/${slug}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm font-semibold text-neutral-950 transition hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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

      <div className="mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        {/* LOADING */}

        {loading ? (
          <div className="animate-pulse">
            <div className="h-3 w-32 rounded bg-neutral-200" />

            <div className="mt-5 h-10 w-80 max-w-full rounded bg-neutral-200" />

            <div className="mt-4 h-5 w-96 max-w-full rounded bg-neutral-100" />

            <div className="mt-14 border-t border-neutral-200">
              <div className="grid gap-12 py-10 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="h-4 w-24 rounded bg-neutral-200" />
                  <div className="mt-8 space-y-7">
                    <div className="h-16 rounded bg-neutral-100" />
                    <div className="h-16 rounded bg-neutral-100" />
                    <div className="h-16 rounded bg-neutral-100" />
                    <div className="h-16 rounded bg-neutral-100" />
                  </div>
                </div>

                <div className="h-48 rounded bg-neutral-100" />
              </div>
            </div>
          </div>
        ) : !order ? (
          /* NOT FOUND */

          <section className="mx-auto max-w-xl py-12 text-center sm:py-20">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral-100">
              <XCircle className="h-6 w-6 text-neutral-700" />
            </div>

            <h1 className="mt-7 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Pedido não encontrado
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
              O pedido pode ter sido removido ou o link
              pode estar incorreto.
            </p>

            <Link
              to={`/loja/${slug}`}
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Voltar à loja
            </Link>
          </section>
        ) : (
          <>
            {/* INTRO */}

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-600">
                Acompanhamento do pedido
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-[2.5rem] font-bold leading-none tracking-[-0.055em] text-neutral-950 sm:text-5xl">
                  Pedido{" "}
                  {orderNumber
                    ? `#${orderNumber}`
                    : ""}
                </h1>

                <button
                  type="button"
                  onClick={copyOrderId}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-neutral-300 px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-500 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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

              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600">
                Olá,{" "}
                <span className="font-semibold text-neutral-950">
                  {order.customer_name}
                </span>
                . {getStatusMessage(order.status)}
              </p>
            </section>

            {/* MAIN CONTENT */}

            <div className="mt-14 grid gap-14 border-t border-neutral-200 pt-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20">
              {/* STATUS */}

              <section>
                <div className="flex items-end justify-between gap-6 border-b border-neutral-200 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-600">
                      Estado
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
                      {isCancelled
                        ? "Pedido cancelado"
                        : ORDER_STATUS[
                            order.status
                          ] ??
                          order.status}
                    </h2>
                  </div>

                  {!isCancelled && (
                    <CheckCircle2 className="hidden h-6 w-6 text-neutral-950 sm:block" />
                  )}
                </div>

                {isCancelled ? (
                  <div className="flex items-start gap-4 border-b border-neutral-200 py-7">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100">
                      <XCircle className="h-5 w-5 text-neutral-700" />
                    </div>

                    <div>
                      <p className="font-semibold text-neutral-950">
                        Este pedido foi cancelado.
                      </p>

                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        Não é necessário realizar mais
                        nenhuma ação neste pedido.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-7">
                    {STATUS_FLOW.map(
                      (step, index) => {
                        const Icon =
                          step.icon;

                        const active =
                          index <=
                          currentIndex;

                        const current =
                          index ===
                          currentIndex;

                        const last =
                          index ===
                          STATUS_FLOW.length -
                            1;

                        return (
                          <div
                            key={step.key}
                            className="relative flex min-h-[76px] gap-4"
                          >
                            {!last && (
                              <span
                                className={`absolute left-[15px] top-9 h-[calc(100%-12px)] w-px ${
                                  index <
                                  currentIndex
                                    ? "bg-black"
                                    : "bg-neutral-200"
                                }`}
                                aria-hidden="true"
                              />
                            )}

                            <div
                              className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
                                active
                                  ? "border-black bg-black text-white"
                                  : "border-neutral-300 bg-white text-neutral-400"
                              } ${
                                current
                                  ? "ring-4 ring-neutral-100"
                                  : ""
                              }`}
                            >
                              {active ? (
                                <Icon className="h-3.5 w-3.5" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-neutral-300" />
                              )}
                            </div>

                            <div className="min-w-0 pb-7">
                              <p
                                className={`text-sm font-bold ${
                                  current ||
                                  active
                                    ? "text-neutral-950"
                                    : "text-neutral-500"
                                }`}
                              >
                                {
                                  step.label
                                }
                              </p>

                              <p
                                className={`mt-1 text-sm leading-6 ${
                                  current
                                    ? "text-neutral-600"
                                    : "text-neutral-500"
                                }`}
                              >
                                {
                                  step.description
                                }
                              </p>

                              {current && (
                                <span className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                                  Estado atual
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}

                {/* DATE */}

                <div className="border-t border-neutral-200 pt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                    Pedido realizado
                  </p>

                  <p className="mt-2 text-sm font-medium text-neutral-700">
                    {formatOrderDate(
                      order.created_at,
                    )}
                  </p>
                </div>
              </section>

              {/* SUMMARY */}

              <aside className="self-start lg:sticky lg:top-8">
                <div className="border-t-2 border-black pt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-600">
                    Resumo
                  </p>

                  <div className="mt-7 flex items-end justify-between gap-6 border-b border-neutral-200 pb-6">
                    <span className="text-sm font-medium text-neutral-600">
                      Total do pedido
                    </span>

                    <span className="text-xl font-bold tracking-tight text-neutral-950">
                      {formatMoney(
                        order.total,
                        company?.currency ||
                          "AOA",
                      )}
                    </span>
                  </div>

                  <div className="border-b border-neutral-200 py-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                      Estado
                    </p>

                    <p className="mt-2 text-sm font-semibold text-neutral-950">
                      {ORDER_STATUS[
                        order.status
                      ] ??
                        order.status}
                    </p>
                  </div>

                  <Link
                    to={`/loja/${slug}`}
                    className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-bold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    Continuar a comprar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}

      <footer className="border-t border-neutral-200 bg-[#f5f5f2]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-tight text-neutral-950">
            {company?.name || "Loja"}
          </p>

          <p className="text-xs font-medium text-neutral-500">
            © {new Date().getFullYear()}{" "}
            {company?.name || "Loja"}
          </p>
        </div>
      </footer>
    </main>
  );
}
