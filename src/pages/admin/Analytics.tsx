import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Globe2,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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

const CHANNEL_COLORS: Record<string, string> = {
  Website: "#0a0a0a",
  WhatsApp: "#16a34a",
  Instagram: "#e11d48",
  Facebook: "#2563eb",
  Outros: "#737373",
};

export default function Analytics() {
  const { company } = useCompany();

  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;

    async function loadData() {
      setLoading(true);

      const { data } = await supabase
        .from("orders")
        .select("id, total, status, created_at, channel, customer_name")
        .eq("company_id", company.id)
        .order("created_at", { ascending: true });

      setOrders((data as Order[]) ?? []);
      setLoading(false);
    }

    loadData();
  }, [company?.id]);

  const stats = useMemo(() => {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - days);

    const validOrders = orders.filter(
      (o) => o.status !== "cancelled" && new Date(o.created_at) >= periodStart
    );

    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const avgOrder = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // Daily Sales Chart Data
    const chartMap = new Map<string, { label: string; receita: number; pedidos: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(periodStart);
      d.setDate(periodStart.getDate() + i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      chartMap.set(label, { label, receita: 0, pedidos: 0 });
    }

    validOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const entry = chartMap.get(label);
      if (entry) {
        entry.receita += Number(o.total);
        entry.pedidos += 1;
      }
    });

    const salesTrend = Array.from(chartMap.values());

    // Channels Breakdown
    const channelMap = new Map<string, { channel: string; revenue: number; count: number }>();

    validOrders.forEach((o) => {
      const ch = o.channel === "website" || o.channel === "store" ? "Website" : o.channel || "Website";
      const formattedCh = ch.charAt(0).toUpperCase() + ch.slice(1);
      const existing = channelMap.get(formattedCh) ?? { channel: formattedCh, revenue: 0, count: 0 };
      existing.revenue += Number(o.total);
      existing.count += 1;
      channelMap.set(formattedCh, existing);
    });

    const channelBreakdown = Array.from(channelMap.values());

    // Top Buyers
    const buyerMap = new Map<string, { name: string; spent: number; orders: number }>();
    validOrders.forEach((o) => {
      const existing = buyerMap.get(o.customer_name) ?? { name: o.customer_name, spent: 0, orders: 0 };
      existing.spent += Number(o.total);
      existing.orders += 1;
      buyerMap.set(o.customer_name, existing);
    });

    const topBuyers = Array.from(buyerMap.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: validOrders.length,
      avgOrder,
      salesTrend,
      channelBreakdown,
      topBuyers,
    };
  }, [orders, period]);

  if (!company) {
    return (
      <AdminLayout title="Analytics">
        <div />
      </AdminLayout>
    );
  }

  const currency = company.currency;

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-10">
        {/* INTRO */}
        <section className="flex flex-col justify-between gap-5 border-b border-neutral-200 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
              Desempenho Comercial
            </p>

            <h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
              Analytics & Vendas
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Análise detalhada de vendas, receita, canais de aquisição e perfil dos compradores.
            </p>
          </div>

          <div className="flex w-fit border border-neutral-200 bg-white">
            {(
              [
                ["7d", "7 dias"],
                ["30d", "30 dias"],
                ["90d", "90 dias"],
              ] as [Period, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPeriod(val)}
                className={cn(
                  "min-h-9 px-3.5 text-xs font-medium transition",
                  period === val ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-50 hover:text-black"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* METRICS */}
        <section className="grid border-y border-neutral-200 sm:grid-cols-3">
          <div className="border-b border-neutral-200 p-5 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Receita Total</span>
              <Wallet className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {formatMoney(stats.totalRevenue, currency)}
            </p>
          </div>

          <div className="border-b border-neutral-200 p-5 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total de Pedidos</span>
              <ShoppingBag className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{stats.totalOrders}</p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Ticket Médio</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {formatMoney(stats.avgOrder, currency)}
            </p>
          </div>
        </section>

        {/* CHARTS SECTION */}
        <section className="grid gap-8 lg:grid-cols-3">
          {/* REVENUE OVER TIME */}
          <div className="lg:col-span-2 border border-neutral-200 bg-white p-6">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-neutral-950">Evolução de Receita</h3>
              <p className="text-xs text-neutral-400">Vendas acumuladas por dia no período selecionado.</p>
            </div>

            <div className="h-[280px] w-full">
              {loading ? (
                <div className="grid h-full place-items-center text-xs text-neutral-400">A carregar gráfico...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesTrend}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} width={60} />
                    <Tooltip
                      formatter={(val: number) => [formatMoney(val, currency), "Receita"]}
                      contentStyle={{ background: "#ffffff", border: "1px solid #e5e5e5" }}
                    />
                    <Area type="monotone" dataKey="receita" stroke="#0a0a0a" strokeWidth={2} fill="#f5f5f2" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* CHANNELS PIE / BAR */}
          <div className="border border-neutral-200 bg-white p-6">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-neutral-950">Origem por Canal</h3>
              <p className="text-xs text-neutral-400">Receita por canal de venda.</p>
            </div>

            <div className="h-[220px] w-full">
              {stats.channelBreakdown.length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-neutral-400">Sem vendas no período.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.channelBreakdown} dataKey="revenue" nameKey="channel" innerRadius={50} outerRadius={80}>
                      {stats.channelBreakdown.map((entry) => (
                        <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] || "#737373"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatMoney(val, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {stats.channelBreakdown.map((ch) => (
                <div key={ch.channel} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHANNEL_COLORS[ch.channel] || "#737373" }} />
                    <span className="font-medium text-neutral-800">{ch.channel}</span>
                  </span>
                  <span className="font-semibold text-neutral-950">{formatMoney(ch.revenue, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TOP BUYERS */}
        <section className="border border-neutral-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">Maiores Compradores</h3>
              <p className="text-xs text-neutral-400">Clientes com maior volume de compras no período.</p>
            </div>
            <Users className="h-4 w-4 text-neutral-400" />
          </div>

          <div className="divide-y divide-neutral-100">
            {stats.topBuyers.length === 0 ? (
              <p className="py-6 text-center text-xs text-neutral-400">Sem dados de compradores.</p>
            ) : (
              stats.topBuyers.map((buyer, index) => (
                <div key={buyer.name} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-neutral-400">#{index + 1}</span>
                    <span className="font-medium text-neutral-950">{buyer.name}</span>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-neutral-950">{formatMoney(buyer.spent, currency)}</p>
                    <p className="text-[10px] text-neutral-400">{buyer.orders} {buyer.orders === 1 ? "pedido" : "pedidos"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
