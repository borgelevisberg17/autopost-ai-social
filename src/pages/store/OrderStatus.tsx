import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
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

const STATUS_FLOW = [
  {
    key: "pending",
    label: "Pedido recebido",
    icon: Clock3,
  },
  {
    key: "confirmed",
    label: "Pedido confirmado",
    icon: CheckCircle2,
  },
  {
    key: "shipped",
    label: "A caminho",
    icon: Truck,
  },
  {
    key: "completed",
    label: "Concluído",
    icon: PackageCheck,
  },
];

function getStatusIndex(status: string) {
  return STATUS_FLOW.findIndex((item) => item.key === status);
}

export default function OrderStatus() {
  const { slug = "", id = "" } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [currency, setCurrency] = useState("AOA");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [{ data: orderData }, { data: companyData }] = await Promise.all([
        supabase.rpc("get_order_status", {
          _order: id,
        }),

        supabase
          .from("companies")
          .select("currency")
          .eq("slug", slug)
          .maybeSingle(),
      ]);

      if (!active) return;

      setOrder(orderData?.[0] ?? null);

      if (companyData?.currency) {
        setCurrency(companyData.currency);
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

  const copyOrderId = async () => {
    const value = order?.id || id;

    if (!value) return;

    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-6 sm:px-8 sm:py-10">
        {/* Header */}
        <header className="mb-8">
          <Link
            to={`/loja/${slug}`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Link>
        </header>

        {/* Loading */}
        {loading ? (
          <section className="animate-pulse">
            <div className="mb-3 h-3 w-28 rounded bg-muted" />

            <div className="h-9 w-72 max-w-full rounded bg-muted" />

            <div className="mt-3 h-5 w-64 max-w-full rounded bg-muted" />

            <div className="mt-10 h-72 rounded-2xl border bg-card" />
          </section>
        ) : !order ? (
          /* Not found */
          <section className="rounded-2xl border bg-card p-7 sm:p-9">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <XCircle className="h-6 w-6 text-muted-foreground" />
            </div>

            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Pedido não encontrado
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              O pedido pode ter sido removido ou o link pode estar incorreto.
            </p>

            <Link
              to={`/loja/${slug}`}
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Voltar à loja
            </Link>
          </section>
        ) : (
          <>
            {/* Page heading */}
            <section className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Acompanhamento do pedido
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Pedido em acompanhamento
                </h1>

                <button
                  type="button"
                  onClick={copyOrderId}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Copiar número do pedido"
                >
                  <span>
                    #{order.id || id.slice(0, 8)}
                  </span>

                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Olá, {order.customer_name}. Aqui podes acompanhar o estado
                do teu pedido.
              </p>
            </section>

            {/* Cancelled */}
            {isCancelled ? (
              <section className="rounded-2xl border border-destructive/20 bg-card p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Pedido cancelado
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Este pedido não está mais em processamento.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              /* Status timeline */
              <section className="rounded-2xl border bg-card p-6 sm:p-7">
                <div className="mb-7 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Estado atual
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      {ORDER_STATUS[order.status] ?? order.status}
                    </h2>
                  </div>

                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="relative">
                  {STATUS_FLOW.map((step, index) => {
                    const Icon = step.icon;

                    const active = index <= currentIndex;
                    const current = index === currentIndex;
                    const last = index === STATUS_FLOW.length - 1;

                    return (
                      <div
                        key={step.key}
                        className="relative flex min-h-16 gap-4"
                      >
                        {!last && (
                          <span
                            className={`absolute left-[11px] top-7 h-full w-px ${
                              index < currentIndex
                                ? "bg-foreground"
                                : "bg-border"
                            }`}
                            aria-hidden="true"
                          />
                        )}

                        <div
                          className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          {active ? (
                            <Icon className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-2.5 w-2.5 fill-current" />
                          )}
                        </div>

                        <div className="-mt-0.5 pb-5">
                          <p
                            className={`text-sm font-medium ${
                              current
                                ? "text-foreground"
                                : active
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>

                          {current && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Estado atual do pedido
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Order summary */}
            <section className="mt-4 rounded-2xl border bg-card p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Resumo
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Pedido realizado em{" "}
                    {new Date(order.created_at).toLocaleString("pt-PT")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Total
                  </p>

                  <p className="mt-1 text-lg font-semibold tracking-tight">
                    {formatMoney(order.total, currency)}
                  </p>
                </div>
              </div>
            </section>

            {/* Footer action */}
            <footer className="mt-8 pb-6">
              <Link
                to={`/loja/${slug}`}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Continuar a comprar
              </Link>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
