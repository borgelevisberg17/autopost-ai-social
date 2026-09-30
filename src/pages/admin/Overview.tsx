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
      return "bg-[#ebe7df] text-[#5f625d]";
    case "shipped":
      return "bg-[#ebe7df] text-[#5f625d]";
    case "completed":
      return "bg-[#202522] text-white";
    case "cancelled":
      return "bg-[#ebe7df] text-[#a7aaa2]";
    default:
      return "bg-[#f5f5f2] text-[#5f625d]";
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
            <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#718071]">
              Painel de controlo
            </p>

            <h1 className="font-serif text-[30px] font-medium leading-tight tracking-[-0.045em] text-[#202522] sm:text-[38px]">
              Olá, {company.name}.
            </h1>

            <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#697168] sm:text-sm sm:leading-6">
              Aqui está o estado atual da sua operação e o que merece atenção.
            </p>
          </div>

          <div className="font-mono text-[11px] text-[#858c83]">
            {new Intl.DateTimeFormat("pt-PT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
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
          <div className="min-w-0 rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
            <div className="mb-3 flex flex-col justify-between gap-3 border-b border-[#ece8df] pb-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#a7aaa2]">
                  Desempenho
                </p>

                <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.03em] text-[#202522]">
                  Receita por dia
                </h2>
              </div>

              <div className="flex w-fit border border-[#e4e0d7] bg-[#faf9f4]">
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
                      "min-h-9 px-3 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-inset",
                      period === value
                        ? "bg-black text-white"
                        : "text-[#747b73] hover:bg-[#f1eee7] hover:text-[#202522]",
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
          <div className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
            <div className="mb-3 border-b border-[#ece8df] pb-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#9d684d]">
                Atenção
              </p>

              <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.03em] text-[#202522]">
                O que precisa de si
              </h2>
            </div>

            <div className="divide-y divide-[#eeeae2]">
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
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7f897e]">
                  Vendas / Origem
                </p>
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
    <div className="min-w-0 rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[#858c83]">
          {label}
        </p>

        <Icon
          className={cn(
            "h-4 w-4",
            warning ? "text-[#bd592f]" : "text-[#95a092]",
          )}
          strokeWidth={1.7}
        />
      </div>

      {loading ? (
        <div className="mt-3 h-7 w-28 animate-pulse bg-[#ebe7df]" />
      ) : (
        <p className="mt-2 truncate font-serif text-[25px] font-normal tracking-[-0.03em] text-[#202522] sm:text-[29px]">
          {value}
        </p>
      )}

      {change !== undefined && !loading && (
        <div className="mt-2 flex items-center gap-1 text-[11px]">
          {change === null ? (
            <span className="text-[#a7aaa2]">sem base comparável</span>
          ) : (
            <>
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span
                className={cn(
                  "font-semibold",
                  positive ? "text-[#2c6457]" : "text-[#bd592f]",
                )}
              >
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-[#a7aaa2]">vs. período anterior</span>
            </>
          )}
        </div>
      )}

      {warning && !loading && (
        <p className="mt-2 text-[11px] font-medium text-[#747b73]">
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
      className="group flex items-start gap-3 border-b border-[#ebe7df] py-4 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-inset"
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          danger ? "text-[#bd592f]" : "text-[#7d8c7d]",
        )}
        strokeWidth={1.8}
      />

      <div className="min-w-0 flex-1">
        <p className="font-serif text-[15px] font-medium group-hover:underline group-hover:underline-offset-2">
          {title}
        </p>

        <p className="mt-1 text-xs text-[#a7aaa2]">{description}</p>
      </div>

      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#c9c3b8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5f625d]" />
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
    <div className="flex min-h-[150px] items-center gap-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] bg-[#ebe7df]">
        <Icon className="h-4 w-4 text-[#a7aaa2]" />
      </div>

      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-[#a7aaa2]">{description}</p>
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
    <div className="flex min-w-0 items-center gap-3 rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)]">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[7px] bg-[#ebe7df]">
        <Icon
          className={cn(
            "h-4 w-4",
            warning ? "text-[#202522]" : "text-[#747b73]",
          )}
          strokeWidth={1.7}
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-[#a7aaa2]">{label}</p>
        <p className="mt-0.5 truncate font-serif text-base font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}
