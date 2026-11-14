import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { OverviewActivity } from "@/components/admin/OverviewActivity";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, ORDER_STATUS } from "@/lib/format";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  customer_name: string;
  channel: string;
};

type Item = {
  product_name: string;
  quantity: number;
  unit_price: number;
  order_id: string;
};

type Product = {
  id: string;
  name: string;
  stock: number;
  price?: number;
};

type ChartPoint = {
  label: string;
  receita: number;
  pedidos: number;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPeriodDays(period: Period) {
  if (period === "7d") return 7;
  if (period === "90d") return 90;
  return 30;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function statusLabel(status: string) {
  return ORDER_STATUS[status] ?? status;
}

function statusClass(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-sky-50 text-sky-700 border border-sky-200/70 font-semibold rounded-md px-2 py-0.5 text-[11px]";
    case "shipped":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-semibold rounded-md px-2 py-0.5 text-[11px]";
    case "completed":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-semibold rounded-md px-2 py-0.5 text-[11px]";
    case "cancelled":
      return "bg-rose-50 text-rose-700 border border-rose-200/70 font-semibold rounded-md px-2 py-0.5 text-[11px]";
    case "pending":
      return "bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold rounded-md px-2 py-0.5 text-[11px]";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-md px-2 py-0.5 text-[11px]";
  }
}

function channelLabel(channel: string) {
  const value = channel?.toLowerCase();

  if (value === "whatsapp") return "WhatsApp";
  if (value === "instagram") return "Instagram";
  if (value === "facebook") return "Facebook";
  if (value === "website" || value === "store") return "Loja";
  if (!value) return "Loja";

  return channel;
}

export default function Overview() {
  const { company } = useCompany();

  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!company) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setDataError(null);

      const [ordersResult, productsResult] = await Promise.all([
        supabase
          .from("orders")
          .select("id,total,status,created_at,customer_name,channel")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(1000),

        supabase
          .from("products")
          .select("id,name,stock,price")
          .eq("company_id", company.id)
          .eq("active", true)
          .lte("stock", 5)
          .order("stock", { ascending: true })
          .limit(8),
      ]);

      if (cancelled) return;

      if (ordersResult.error || productsResult.error) {
        setDataError("Não foi possível carregar os dados do resumo.");
        setOrders([]);
        setLowStock([]);
        setItems([]);
        setLoading(false);
        return;
      }

      const orderList = (ordersResult.data as Order[]) ?? [];

      setOrders(orderList);
      setLowStock((productsResult.data as Product[]) ?? []);

      const validOrderIds = orderList
        .filter((order) => order.status !== "cancelled")
        .map((order) => order.id)
        .slice(0, 500);

      if (validOrderIds.length > 0) {
        const { data, error } = await supabase
          .from("order_items")
          .select("product_name,quantity,unit_price,order_id")
          .in("order_id", validOrderIds);

        if (error) {
          setDataError("Não foi possível carregar os itens dos pedidos.");
          setLoading(false);
          return;
        }

        if (!cancelled) {
          setItems((data as Item[]) ?? []);
        }
      } else {
        setItems([]);
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [company, refreshKey]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const days = getPeriodDays(period);

    const validOrders = orders.filter((order) => order.status !== "cancelled");

    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - (days - 1));

    const previousStart = new Date(periodStart);
    previousStart.setDate(previousStart.getDate() - days);

    const currentOrders = validOrders.filter(
      (order) => new Date(order.created_at) >= periodStart,
    );

    const previousOrders = validOrders.filter((order) => {
      const date = new Date(order.created_at);
      return date >= previousStart && date < periodStart;
    });

    const revenue = currentOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    const previousRevenue = previousOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    const todayOrders = validOrders.filter(
      (order) =>
        startOfDay(new Date(order.created_at)).getTime() === today.getTime(),
    );

    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    const pendingOrders = orders.filter((order) => order.status === "pending");

    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled",
    );

    const chart: ChartPoint[] = Array.from({ length: days }, (_, index) => {
      const date = new Date(periodStart);
      date.setDate(periodStart.getDate() + index);

      const dayStart = startOfDay(date);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = validOrders.filter((order) => {
        const created = new Date(order.created_at);
        return created >= dayStart && created < nextDay;
      });

      return {
        label:
          days <= 7
            ? new Intl.DateTimeFormat("pt-PT", {
                weekday: "short",
              }).format(date)
            : `${date.getDate()}/${date.getMonth() + 1}`,
        receita: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
        pedidos: dayOrders.length,
      };
    });

    const productSales = Object.values(
      items.reduce<
        Record<
          string,
          {
            name: string;
            quantity: number;
            revenue: number;
          }
        >
      >((acc, item) => {
        const relatedOrder = validOrders.find(
          (order) => order.id === item.order_id,
        );

        if (!relatedOrder) return acc;

        const created = new Date(relatedOrder.created_at);

        if (created < periodStart) return acc;

        if (!acc[item.product_name]) {
          acc[item.product_name] = {
            name: item.product_name,
            quantity: 0,
            revenue: 0,
          };
        }

        acc[item.product_name].quantity += Number(item.quantity);
        acc[item.product_name].revenue +=
          Number(item.quantity) * Number(item.unit_price);

        return acc;
      }, {}),
    )
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const channelSales = Object.values(
      currentOrders.reduce<
        Record<
          string,
          {
            channel: string;
            orders: number;
            revenue: number;
          }
        >
      >((acc, order) => {
        const channel = channelLabel(order.channel);

        if (!acc[channel]) {
          acc[channel] = {
            channel,
            orders: 0,
            revenue: 0,
          };
        }

        acc[channel].orders += 1;
        acc[channel].revenue += Number(order.total);

        return acc;
      }, {}),
    ).sort((a, b) => b.revenue - a.revenue);

    const revenueChange =
      previousRevenue === 0
        ? null
        : ((revenue - previousRevenue) / previousRevenue) * 100;

    const orderChange =
      previousOrders.length === 0
        ? null
        : ((currentOrders.length - previousOrders.length) /
            previousOrders.length) *
          100;

    return {
      revenue,
      revenueChange,
      orders: currentOrders.length,
      orderChange,
      todayRevenue,
      todayOrders: todayOrders.length,
      pendingOrders,
      cancelledOrders,
      chart,
      productSales,
      channelSales,
      averageOrder:
        currentOrders.length > 0 ? revenue / currentOrders.length : 0,
    };
  }, [orders, items, period]);

  if (!company) {
    return (
      <AdminLayout title="Visão geral">
        <div />
      </AdminLayout>
    );
  }

  const currency = company.currency;

  if (dataError) {
    return (
      <AdminLayout title="Visão geral">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
          <p className="text-sm font-medium text-[#5f625d]">{dataError}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="mt-4 text-xs font-semibold text-[#2c6457] underline underline-offset-4 hover:text-[#202522]"
          >
            Tentar novamente
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Visão geral">
      <div className="space-y-5 sm:space-y-6">
        {/* INTRO */}
        <section className="flex flex-col justify-between gap-3 pb-2 sm:flex-row sm:items-end">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              Painel de Controlo
            </span>

            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Olá, {company.name}.
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Aqui está o resumo da sua operação e o que requer atenção hoje.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="capitalize">
              {new Intl.DateTimeFormat("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(new Date())}
            </span>
          </div>
        </section>

        {/* KEY METRICS */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Receita"
            value={formatMoney(stats.revenue, currency)}
            change={stats.revenueChange}
            icon={Wallet}
            loading={loading}
          />

          <Metric
            label="Pedidos"
            value={String(stats.orders)}
            change={stats.orderChange}
            icon={ShoppingBag}
            loading={loading}
          />

          <Metric
            label="Ticket médio"
            value={formatMoney(stats.averageOrder, currency)}
            icon={TrendingUp}
            loading={loading}
          />

          <Metric
            label="Pendentes"
            value={String(stats.pendingOrders.length)}
            icon={Clock3}
            warning={stats.pendingOrders.length > 0}
            loading={loading}
          />
        </section>

        {/* PERFORMANCE + ATTENTION */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
          {/* CHART */}
          <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Desempenho Comercial
                </p>

                <h2 className="mt-0.5 text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Receita por dia
                </h2>
              </div>

              <div className="flex w-fit rounded-lg border border-slate-200/80 bg-slate-100/80 p-0.5 shadow-2xs">
                {(
                  [
                    ["7d", "7 dias"],
                    ["30d", "30 dias"],
                    ["90d", "3 meses"],
                  ] as [Period, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={cn(
                      "min-h-7 rounded-md px-2.5 text-xs font-semibold transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                      period === value
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[270px] w-full sm:h-[310px]">
              {loading ? (
                <div className="grid h-full place-items-center text-sm text-[#a7aaa2]">
                  A carregar dados...
                </div>
              ) : stats.chart.every((item) => item.receita === 0) ? (
                <div className="grid h-full place-items-center px-6 text-center">
                  <div>
                    <TrendingUp className="mx-auto mb-3 h-5 w-5 text-[#c9c3b8]" />
                    <p className="text-sm font-medium text-[#5f625d]">
                      Ainda não existem vendas neste período.
                    </p>
                    <p className="mt-1 text-xs text-[#a7aaa2]">
                      Os dados de vendas aparecerão aqui quando os pedidos forem
                      recebidos.
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.chart}
                    margin={{
                      top: 5,
                      right: 5,
                      left: -15,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="overviewRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2c6457"
                          stopOpacity={0.16}
                        />
                        <stop
                          offset="100%"
                          stopColor="#2c6457"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#737373",
                        fontSize: 11,
                      }}
                      minTickGap={24}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#737373",
                        fontSize: 11,
                      }}
                      width={65}
                      tickFormatter={(value) =>
                        value >= 1000
                          ? `${Math.round(value / 1000)}k`
                          : String(value)
                      }
                    />

                    <Tooltip
                      cursor={{
                        stroke: "#d4d4d4",
                        strokeDasharray: "4 4",
                      }}
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e5e5e5",
                        borderRadius: 2,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      }}
                      labelStyle={{
                        color: "#737373",
                        fontSize: 11,
                        marginBottom: 4,
                      }}
                      formatter={(value: number, name: string) => [
                        name === "receita"
                          ? formatMoney(value, currency)
                          : value,
                        name === "receita" ? "Receita" : "Pedidos",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke="#2c6457"
                      strokeWidth={2.2}
                      fill="url(#overviewRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ATTENTION */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-3.5 border-b border-slate-100 pb-3">
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 border border-amber-200/60">
                Atenção
              </span>

              <h2 className="mt-1 text-base sm:text-lg font-bold tracking-tight text-slate-900">
                O que precisa de si
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {loading && (
                <div className="space-y-3 py-5" aria-label="A carregar tarefas">
                  {[0, 1].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="h-4 w-4 animate-pulse bg-[#f0efe9]" />
                      <span className="flex-1 space-y-2">
                        <span className="block h-3 w-2/3 animate-pulse bg-[#f0efe9]" />
                        <span className="block h-2.5 w-1/3 animate-pulse bg-[#f0efe9]" />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!loading && lowStock.length > 0 && (
                <AttentionItem
                  icon={AlertTriangle}
                  title={`${lowStock.length} produto${
                    lowStock.length > 1 ? "s" : ""
                  } com stock baixo`}
                  description={
                    lowStock.filter((product) => product.stock === 0).length > 0
                      ? `${lowStock.filter((product) => product.stock === 0).length} sem stock`
                      : "Verifique o inventário"
                  }
                  href="/admin/produtos"
                  danger
                />
              )}

              {!loading && stats.pendingOrders.length > 0 && (
                <AttentionItem
                  icon={Clock3}
                  title={`${stats.pendingOrders.length} pedido${
                    stats.pendingOrders.length > 1 ? "s" : ""
                  } pendente${stats.pendingOrders.length > 1 ? "s" : ""}`}
                  description="Aguardam processamento"
                  href="/admin/pedidos"
                />
              )}

              {!loading && stats.cancelledOrders.length > 0 && (
                <AttentionItem
                  icon={XCircle}
                  title={`${stats.cancelledOrders.length} pedido${
                    stats.cancelledOrders.length > 1 ? "s" : ""
                  } cancelado${stats.cancelledOrders.length > 1 ? "s" : ""}`}
                  description="Consulte o histórico"
                  href="/admin/pedidos"
                />
              )}

              {!loading &&
                lowStock.length === 0 &&
                stats.pendingOrders.length === 0 &&
                stats.cancelledOrders.length === 0 && (
                  <div className="flex items-start gap-3 py-5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#5f625d]" />

                    <div>
                      <p className="text-sm font-medium">Tudo em ordem</p>

                      <p className="mt-1 text-xs leading-5 text-[#a7aaa2]">
                        Não há tarefas urgentes neste momento.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </section>

        {/* CHANNELS + ACTIVITY */}
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
            <div className="mb-3 flex items-end justify-between gap-3 border-b border-[#ece8df] pb-3">
              <div>
                <h2 className="mt-1 font-serif text-base font-semibold tracking-[-0.03em] text-[#202522] sm:text-lg">
                  Vendas por origem
                </h2>
              </div>
              <Link
                to="/admin/canais"
                className="group inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-[#687168] transition hover:text-[#202522]"
              >
                Plataformas
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2 py-3" aria-label="A carregar canais">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 border-b border-[#f0ede6] py-4 last:border-0"
                  >
                    <span className="h-3 w-16 animate-pulse bg-[#f0efe9]" />
                    <span className="h-1.5 flex-1 animate-pulse bg-[#f0efe9]" />
                    <span className="h-3 w-20 animate-pulse bg-[#f0efe9]" />
                  </div>
                ))}
              </div>
            ) : stats.channelSales.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-5 text-center">
                <ShoppingBag className="mb-3 h-5 w-5 text-[#a7ada2]" />
                <p className="text-sm font-medium text-[#525c54]">
                  Ainda sem vendas por canal
                </p>
                <p className="mt-1 text-xs leading-5 text-[#858c83]">
                  As origens dos pedidos aparecerão quando houver vendas neste
                  período.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0ede6]">
                {stats.channelSales.map((channel) => {
                  const totalRevenue = stats.channelSales.reduce(
                    (sum, item) => sum + item.revenue,
                    0,
                  );
                  const percentage =
                    totalRevenue > 0
                      ? (channel.revenue / totalRevenue) * 100
                      : 0;

                  return (
                    <div
                      key={channel.channel}
                      className="grid grid-cols-[minmax(72px,0.7fr)_minmax(42px,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[minmax(100px,0.7fr)_minmax(60px,1fr)_auto] sm:gap-4"
                    >
                      <span className="truncate text-xs font-medium text-[#39423a]">
                        {channel.channel}
                      </span>
                      <div className="h-1.5 overflow-hidden bg-[#eeeae2]">
                        <div
                          className="h-full bg-[#2c6457] transition-all"
                          style={{
                            width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-right">
                        <p className="whitespace-nowrap text-xs font-semibold text-[#202522]">
                          {formatMoney(channel.revenue, currency)}
                        </p>
                        <p className="mt-0.5 whitespace-nowrap text-[10px] text-[#858c83]">
                          {channel.orders} pedido
                          {channel.orders !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <OverviewActivity />
        </section>

        {/* PRODUCTS + ORDERS */}
        <section className="grid gap-4 xl:grid-cols-2">
          {/* TOP PRODUCTS */}
          <div className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#a7aaa2]">
                  Produtos
                </p>

                <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.03em] text-[#202522]">
                  Mais vendidos
                </h2>
              </div>

              <Link
                to="/admin/produtos"
                className="group flex shrink-0 items-center gap-1 text-xs font-medium text-[#747b73] hover:text-[#202522]"
              >
                Ver produtos
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="border-y border-[#ded9d0]">
              {loading ? (
                <div
                  className="space-y-3 py-6"
                  aria-label="A carregar produtos"
                >
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="flex items-center gap-4 py-2">
                      <span className="h-3 w-5 animate-pulse bg-[#f0efe9]" />
                      <span className="flex-1 space-y-2">
                        <span className="block h-3 w-2/3 animate-pulse bg-[#f0efe9]" />
                        <span className="block h-2.5 w-1/3 animate-pulse bg-[#f0efe9]" />
                      </span>
                      <span className="h-3 w-16 animate-pulse bg-[#f0efe9]" />
                    </div>
                  ))}
                </div>
              ) : stats.productSales.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Ainda sem vendas"
                  description="Os produtos vendidos aparecerão aqui."
                />
              ) : (
                stats.productSales.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-4 border-b border-[#ebe7df] py-4 last:border-b-0"
                  >
                    <span className="w-5 text-xs text-[#a7aaa2]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-[15px] font-medium text-[#202522]">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-xs text-[#a7aaa2]">
                        {product.quantity} unidade
                        {product.quantity !== 1 ? "s" : ""} vendida
                        {product.quantity !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <p className="text-right text-sm font-semibold">
                      {formatMoney(product.revenue, currency)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RECENT ORDERS */}
          <div className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#a7aaa2]">
                  Operação
                </p>

                <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.03em] text-[#202522]">
                  Pedidos recentes
                </h2>
              </div>

              <Link
                to="/admin/pedidos"
                className="group flex shrink-0 items-center gap-1 text-xs font-medium text-[#747b73] hover:text-[#202522]"
              >
                Ver todos
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="border-y border-[#ded9d0]">
              {loading ? (
                <div className="space-y-3 py-6" aria-label="A carregar pedidos">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="flex items-center gap-4 py-2">
                      <span className="h-9 w-9 animate-pulse bg-[#f0efe9]" />
                      <span className="flex-1 space-y-2">
                        <span className="block h-3 w-2/3 animate-pulse bg-[#f0efe9]" />
                        <span className="block h-2.5 w-1/3 animate-pulse bg-[#f0efe9]" />
                      </span>
                      <span className="h-3 w-16 animate-pulse bg-[#f0efe9]" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="Ainda sem pedidos"
                  description="Quando receber pedidos, eles aparecerão aqui."
                />
              ) : (
                orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 border-b border-[#ebe7df] py-4 last:border-b-0"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] bg-[#e9eee9]">
                      <ShoppingBag className="h-3.5 w-3.5 text-[#747b73]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {order.customer_name}
                      </p>

                      <p className="mt-0.5 text-xs text-[#a7aaa2]">
                        {formatDate(order.created_at)} ·{" "}
                        {channelLabel(order.channel)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-serif text-[15px] font-semibold text-[#202522]">
                        {formatMoney(order.total, currency)}
                      </p>

                      <span
                        className={cn(
                          "mt-1 inline-flex px-1.5 py-0.5 text-[10px] font-medium",
                          statusClass(order.status),
                        )}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </div>
    </AdminLayout>
  );
}

function Metric({
  label,
  value,
  change,
  icon: Icon,
  loading,
  warning,
}: {
  label: string;
  value: string;
  change?: number | null;
  icon: typeof Wallet;
  loading: boolean;
  warning?: boolean;
}) {
  const positive = change !== undefined && change !== null && change >= 0;

  return (
    <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <div
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg border",
            warning
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-100 bg-slate-50 text-slate-600",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-28 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className="mt-2 truncate font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      )}

      {change !== undefined && !loading && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          {change === null ? (
            <span className="text-slate-400">Sem base comparável</span>
          ) : (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  positive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-rose-50 text-rose-700 border border-rose-200/60",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-slate-400">vs. período anterior</span>
            </>
          )}
        </div>
      )}

      {warning && !loading && (
        <p className="mt-2.5 text-xs font-semibold text-amber-700 flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          Requer atenção
        </p>
      )}
    </div>
  );
}

function AttentionItem({
  icon: Icon,
  title,
  description,
  href,
  danger,
}: {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  href: string;
  danger?: boolean;
}) {
  return (
    <Link
      to={href}
      className="group flex items-start gap-3 rounded-lg p-3 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm mt-0.5",
          danger
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-amber-200 bg-amber-50 text-amber-700",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>

      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Package;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[150px] items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white border border-slate-200 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function StoreStat({
  label,
  value,
  icon: Icon,
  warning,
  loading,
}: {
  label: string;
  value: string;
  icon: typeof Package;
  warning?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
        <Icon
          className={cn(
            "h-4 w-4",
            warning ? "text-amber-600" : "text-slate-600",
          )}
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="mt-0.5 truncate text-base font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}
