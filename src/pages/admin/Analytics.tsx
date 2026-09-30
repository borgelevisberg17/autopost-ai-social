import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  channel: string;
  customer_name: string;
};

type SalesPoint = {
  key: string;
  label: string;
  receita: number;
  pedidos: number;
};

const CHANNEL_COLORS: Record<string, string> = {
  Website: "#243b53",
  WhatsApp: "#2f6f5e",
  Instagram: "#a23e5c",
  Facebook: "#3d5a80",
  Outros: "#7c6f64",
};

function DataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid h-full min-h-32 place-items-center px-4 text-center" role="alert">
      <div>
        <AlertCircle className="mx-auto h-5 w-5 text-[#b94e37]" />
        <p className="mt-2 text-xs font-semibold text-[#202522]">Não foi possível carregar estes dados.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-11 items-center justify-center border border-[#ded9d0] bg-[#fffdf9] px-4 text-xs font-semibold text-[#202522] transition hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

function LoadingBlock({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse bg-[#ebe7df]", className)} aria-label="A carregar" />;
}

export default function Analytics() {
  const { company } = useCompany();

  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!company) return;

    setLoading(true);
    setError(null);
    // A failed refresh must not leave the previous company's data looking current.
    setOrders([]);

    const { data, error: queryError } = await supabase
      .from("orders")
      .select("id, total, status, created_at, channel, customer_name")
      .eq("company_id", company.id)
      .order("created_at", { ascending: true });

    if (queryError) {
      setError("Não foi possível carregar os dados de vendas agora.");
      setLoading(false);
      return;
    }

    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const currency = company?.currency ?? "AOA";
  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat("pt-PT", { style: "currency", currency });
    } catch {
      return null;
    }
  }, [currency]);
  const formatCurrency = (value: number | string) =>
    currencyFormatter?.format(Number(value)) ?? formatMoney(value, currency);

  const stats = useMemo(() => {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodStart = new Date(today);
    periodStart.setDate(today.getDate() - (days - 1));
    const periodEnd = new Date(today);
    periodEnd.setDate(today.getDate() + 1);

    const validOrders = orders.filter((order) => {
      const createdAt = new Date(order.created_at);
      return order.status !== "cancelled" && createdAt >= periodStart && createdAt < periodEnd;
    });

    const totalRevenue = validOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const avgOrder = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    const dateKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dateLabel = new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
    const chartMap = new Map<string, SalesPoint>();

    for (let index = 0; index < days; index += 1) {
      const date = new Date(periodStart);
      date.setDate(periodStart.getDate() + index);
      const key = dateKey(date);
      chartMap.set(key, { key, label: dateLabel.format(date), receita: 0, pedidos: 0 });
    }

    validOrders.forEach((order) => {
      const key = dateKey(new Date(order.created_at));
      const entry = chartMap.get(key);
      if (entry) {
        entry.receita += Number(order.total);
        entry.pedidos += 1;
      }
    });

    const channelMap = new Map<string, { channel: string; revenue: number; count: number }>();
    validOrders.forEach((order) => {
      const channel = order.channel === "website" || order.channel === "store" ? "Website" : order.channel || "Website";
      const formattedChannel = channel.charAt(0).toUpperCase() + channel.slice(1);
      const existing = channelMap.get(formattedChannel) ?? { channel: formattedChannel, revenue: 0, count: 0 };
      existing.revenue += Number(order.total);
      existing.count += 1;
      channelMap.set(formattedChannel, existing);
    });

    const buyerMap = new Map<string, { name: string; spent: number; orders: number }>();
    validOrders.forEach((order) => {
      const existing = buyerMap.get(order.customer_name) ?? { name: order.customer_name, spent: 0, orders: 0 };
      existing.spent += Number(order.total);
      existing.orders += 1;
      buyerMap.set(order.customer_name, existing);
    });

    return {
      totalRevenue,
      totalOrders: validOrders.length,
      avgOrder,
      salesTrend: Array.from(chartMap.values()),
      channelBreakdown: Array.from(channelMap.values()),
      topBuyers: Array.from(buyerMap.values()).sort((a, b) => b.spent - a.spent).slice(0, 5),
    };
  }, [orders, period]);

  if (!company) {
    return (
      <AdminLayout title="Analytics">
        <div />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-10">
        <section className="flex flex-col justify-between gap-5 pb-2 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#a7aaa2]">Desempenho Comercial</p>
            <h1 className="font-serif text-[clamp(2rem,4vw,2.8rem)] font-medium leading-[1.04] tracking-[-0.045em] text-[#202522]">Analytics &amp; Vendas</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#747b73]">
              Análise detalhada de vendas, receita, canais de aquisição e perfil dos compradores.
            </p>
          </div>

          <div className="flex w-fit border border-[#ded9d0] bg-[#fffdf9]" aria-label="Período de análise">
            {(
              [
                ["7d", "7 dias"],
                ["30d", "30 dias"],
                ["90d", "90 dias"],
              ] as [Period, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                aria-pressed={period === value}
                className={cn(
                  "min-h-11 px-3.5 text-xs font-medium transition",
                  period === value ? "bg-[#202522] text-white" : "text-[#747b73] hover:bg-[#f1eee7] hover:text-[#202522]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="flex flex-col gap-3 border border-[#e3b9ad] bg-[#fff8f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <div>
              <p className="text-sm font-semibold text-[#202522]">Não foi possível atualizar os dados</p>
              <p className="mt-1 text-xs text-[#747b73]">{error}</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex min-h-11 shrink-0 items-center justify-center border border-[#ded9d0] bg-[#fffdf9] px-4 text-xs font-semibold text-[#202522] hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <section className="grid gap-px border-y border-[#ded9d0] bg-[#ded9d0] sm:grid-cols-3">
          <div className="min-w-0 bg-[#fffdf9] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 text-[#a7aaa2]">
              <span className="text-xs font-semibold uppercase leading-5 tracking-wider">Receita total</span>
              <Wallet className="h-4 w-4 shrink-0" />
            </div>
            {loading ? <LoadingBlock className="mt-3 h-8 w-32" /> : <p className="mt-2 text-2xl font-semibold text-[#202522]">{error ? "—" : formatCurrency(stats.totalRevenue)}</p>}
          </div>
          <div className="min-w-0 bg-[#fffdf9] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 text-[#a7aaa2]">
              <span className="text-xs font-semibold uppercase leading-5 tracking-wider">Total de pedidos</span>
              <ShoppingBag className="h-4 w-4 shrink-0" />
            </div>
            {loading ? <LoadingBlock className="mt-3 h-8 w-20" /> : <p className="mt-2 text-2xl font-semibold text-[#202522]">{error ? "—" : stats.totalOrders}</p>}
          </div>
          <div className="min-w-0 bg-[#fffdf9] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 text-[#a7aaa2]">
              <span className="text-xs font-semibold uppercase leading-5 tracking-wider">Ticket médio</span>
              <TrendingUp className="h-4 w-4 shrink-0" />
            </div>
            {loading ? <LoadingBlock className="mt-3 h-8 w-28" /> : <p className="mt-2 text-2xl font-semibold text-[#202522]">{error ? "—" : formatCurrency(stats.avgOrder)}</p>}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-3">
          <div className="border border-[#ded9d0] bg-[#fffdf9] p-5 sm:p-6 lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-[#202522]">Receita por dia</h3>
              <p className="text-xs leading-5 text-[#a7aaa2]">Receita diária e contagem de pedidos no período selecionado.</p>
            </div>
            <div className="h-[280px] w-full">
              {loading ? (
                <LoadingBlock className="h-full w-full" />
              ) : error ? (
                <DataError onRetry={loadData} />
              ) : stats.salesTrend.length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-[#a7aaa2]">Sem dados no período.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesTrend} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      interval={period === "7d" ? 0 : period === "30d" ? 4 : 14}
                      tick={{ fontSize: 10, fill: "#737373" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#737373" }}
                      tickFormatter={formatCurrency}
                      width={76}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as SalesPoint;
                        return (
                          <div className="border border-[#ded9d0] bg-[#fffdf9] px-3 py-2 text-xs shadow-[0_8px_20px_rgba(32,37,34,0.08)]">
                            <p className="font-semibold text-[#202522]">{label}</p>
                            <p className="mt-1 text-[#5f625d]">Receita: {formatCurrency(point.receita)}</p>
                            <p className="text-[#5f625d]">Pedidos: {point.pedidos}</p>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="receita" stroke="#243b53" strokeWidth={2} fill="#e6ecef" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="border border-[#ded9d0] bg-[#fffdf9] p-5 sm:p-6">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-[#202522]">Origem por canal</h3>
              <p className="text-xs leading-5 text-[#a7aaa2]">Receita e pedidos por canal de venda.</p>
            </div>
            <div className="h-[220px] w-full">
              {loading ? (
                <LoadingBlock className="h-full w-full" />
              ) : error ? (
                <DataError onRetry={loadData} />
              ) : stats.channelBreakdown.length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-[#a7aaa2]">Sem vendas no período.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.channelBreakdown} dataKey="revenue" nameKey="channel" innerRadius={50} outerRadius={80}>
                      {stats.channelBreakdown.map((entry) => (
                        <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] || CHANNEL_COLORS.Outros} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, _name, item) => [formatCurrency(value), `${item?.payload?.count ?? 0} pedidos`]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {!loading && !error && stats.channelBreakdown.length > 0 && (
              <div className="mt-4 space-y-3">
                {stats.channelBreakdown.map((channel) => (
                  <div key={channel.channel} className="flex items-start justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-start gap-2">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0" style={{ background: CHANNEL_COLORS[channel.channel] || CHANNEL_COLORS.Outros }} />
                      <span className="font-medium leading-5 text-[#303732]">{channel.channel}</span>
                    </span>
                    <span className="shrink-0 text-right font-semibold leading-5 text-[#202522]">
                      {formatCurrency(channel.revenue)}
                      <span className="block font-normal text-[#a7aaa2]">{channel.count} {channel.count === 1 ? "pedido" : "pedidos"}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border border-[#ded9d0] bg-[#fffdf9] p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[#202522]">Maiores compradores</h3>
              <p className="text-xs leading-5 text-[#a7aaa2]">Clientes com maior volume de compras no período.</p>
            </div>
            <Users className="h-4 w-4 shrink-0 text-[#a7aaa2]" />
          </div>
          {loading ? (
            <div className="space-y-3" aria-label="A carregar compradores">
              {Array.from({ length: 3 }).map((_, index) => <LoadingBlock key={index} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <DataError onRetry={loadData} />
          ) : stats.topBuyers.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#a7aaa2]">Sem dados de compradores.</p>
          ) : (
            <div className="space-y-1">
              {stats.topBuyers.map((buyer, index) => (
                <div key={buyer.name} className="flex items-center justify-between gap-4 border-t border-[#ebe7df] py-3 text-sm first:border-t-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-[#a7aaa2]">#{index + 1}</span>
                    <span className="break-words font-medium text-[#202522]">{buyer.name}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-[#202522]">{formatCurrency(buyer.spent)}</p>
                    <p className="text-[10px] text-[#a7aaa2]">{buyer.orders} {buyer.orders === 1 ? "pedido" : "pedidos"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
