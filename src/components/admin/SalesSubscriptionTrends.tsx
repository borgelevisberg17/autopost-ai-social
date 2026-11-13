import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Building2, CreditCard, Loader2, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";

type MonthlySale = { month_start: string; revenue: number; orders_count: number };
type PlatformMonth = {
  month_start: string;
  subscriptions_added: number;
  active_subscriptions: number;
  paid_subscriptions: number;
  total_companies: number;
};
type Subscription = { plan: string; status: string; current_period_end: string | null };
type SubscriptionEvent = { plan: string; status: string; event_type: string; recorded_at: string };

const planNames: Record<string, string> = { free: "Free", basic: "Básico", pro: "Pro" };
const statusNames: Record<string, string> = {
  active: "Ativa",
  trialing: "Em avaliação",
  past_due: "Pagamento em atraso",
  cancelled: "Cancelada",
};

function formatMonth(date: string) {
  return new Intl.DateTimeFormat("pt-PT", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(new Date(`${date.slice(0, 10)}T12:00:00Z`));
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function Change({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span className="text-xs text-muted-foreground">Sem base comparável</span>;
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-primary" : "text-destructive"}`}>
      <Icon className="h-3.5 w-3.5" />{Math.abs(value).toFixed(1)}% {label}
    </span>
  );
}

export function SalesSubscriptionTrends({ companyId, currency }: { companyId: string; currency: string }) {
  const [sales, setSales] = useState<MonthlySale[]>([]);
  const [platform, setPlatform] = useState<PlatformMonth[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const [salesResult, subResult, eventsResult, platformResult] = await Promise.all([
      supabase.rpc("get_company_monthly_sales", { _company: companyId }),
      supabase.from("company_subscriptions").select("plan,status,current_period_end").eq("company_id", companyId).maybeSingle(),
      supabase.from("company_subscription_events").select("plan,status,event_type,recorded_at").eq("company_id", companyId).order("recorded_at", { ascending: false }).limit(12),
      supabase.rpc("get_platform_subscription_metrics"),
    ]);
    if (salesResult.error || subResult.error || eventsResult.error) setError(true);
    setSales((salesResult.data as MonthlySale[] | null) ?? []);
    setSubscription(subResult.data as Subscription | null);
    setEvents((eventsResult.data as SubscriptionEvent[] | null) ?? []);
    // The protected RPC returns data only to platform administrators. A denial hides this section for normal store accounts.
    setPlatform(platformResult.error ? [] : (platformResult.data as PlatformMonth[] | null) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { void load(); }, [load]);

  const salesChart = useMemo(() => sales.map((item) => ({
    ...item,
    label: formatMonth(item.month_start),
    revenue: Number(item.revenue),
    orders_count: Number(item.orders_count),
  })), [sales]);
  const recentSales = salesChart.slice(-2);
  const salesGrowth = recentSales.length === 2
    ? percentChange(recentSales[1].revenue, recentSales[0].revenue)
    : null;
  const platformChart = useMemo(() => platform.map((item) => ({
    ...item,
    label: formatMonth(item.month_start),
    subscriptions_added: Number(item.subscriptions_added),
    active_subscriptions: Number(item.active_subscriptions),
    paid_subscriptions: Number(item.paid_subscriptions),
    total_companies: Number(item.total_companies),
  })), [platform]);
  const recentPlatform = platformChart.slice(-2);
  const subscriptionGrowth = recentPlatform.length === 2
    ? percentChange(recentPlatform[1].active_subscriptions, recentPlatform[0].active_subscriptions)
    : null;
  const latest = platformChart[platformChart.length - 1];
  const latestSale = salesChart[salesChart.length - 1];

  return (
    <section className="space-y-6" aria-label="Crescimento de vendas e subscrições">
      <div className="border-y border-border py-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Últimos 12 meses</p>
            <h2 className="mt-1 font-serif text-xl font-semibold">Crescimento das vendas</h2>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            <Change value={salesGrowth} label="vs. mês anterior" />
          </div>
        </div>
        {error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>Não foi possível atualizar as métricas desta loja.</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>Tentar novamente</Button>
          </div>
        ) : loading ? (
          <div className="grid h-56 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={72} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--card-foreground))" }}
                  formatter={(value: number, name: string, item) => name === "revenue"
                    ? [formatMoney(value, currency), "Vendas"]
                    : [item.payload.orders_count, "Pedidos"]}
                />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.12)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span>{latestSale?.orders_count ?? 0} pedidos no mês atual</span>
          <span>{formatMoney(latestSale?.revenue ?? 0, currency)} em vendas registadas</span>
        </div>
      </div>

      <div className="border-y border-border py-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Plano da loja</p>
            <h2 className="mt-1 font-serif text-xl font-semibold">Subscrição e crescimento</h2>
          </div>
          {subscription && (
            <div className="flex min-w-48 items-center gap-3 border-l border-border pl-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{planNames[subscription.plan] ?? subscription.plan}</p>
                <p className="text-xs text-muted-foreground">{statusNames[subscription.status] ?? subscription.status}</p>
              </div>
            </div>
          )}
        </div>

        {platformChart.length > 0 && latest ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.75fr)]">
            <div>
              <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground"><Building2 className="h-3.5 w-3.5" />Subscrições ativas em todas as lojas</span>
                <Change value={subscriptionGrowth} label="vs. mês anterior" />
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformChart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} width={36} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--card-foreground))" }} />
                    <Bar dataKey="active_subscriptions" name="Subscrições ativas" fill="hsl(var(--primary))" maxBarSize={30} />
                    <Bar dataKey="subscriptions_added" name="Novas lojas" fill="hsl(var(--accent))" maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="border-l-2 border-primary pl-3">
                <p className="text-xs text-muted-foreground">Lojas cadastradas</p>
                <p className="mt-1 text-xl font-semibold">{latest.total_companies}</p>
              </div>
              <div className="border-l-2 border-primary pl-3">
                <p className="text-xs text-muted-foreground">Subscrições ativas</p>
                <p className="mt-1 text-xl font-semibold">{latest.active_subscriptions}</p>
              </div>
              <div className="border-l-2 border-accent pl-3">
                <p className="text-xs text-muted-foreground">Planos pagos ativos</p>
                <p className="mt-1 text-xl font-semibold">{latest.paid_subscriptions}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-h-36 border border-border p-4">
              <p className="text-sm font-medium">Histórico desta loja</p>
              <div className="mt-3 space-y-2">
                {events.length === 0 ? <p className="text-xs text-muted-foreground">Ainda sem alterações de plano registadas.</p> : events.slice(0, 5).map((event, index) => (
                  <div key={`${event.recorded_at}-${index}`} className="flex justify-between gap-3 text-xs">
                    <span>{planNames[event.plan] ?? event.plan} · {statusNames[event.status] ?? event.status}</span>
                    <time className="shrink-0 text-muted-foreground">{new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(event.recorded_at))}</time>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-h-36 border border-border p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Crescimento global</p>
              <p className="mt-2">Disponível apenas para a conta administradora da plataforma.</p>
            </div>
          </div>
        )}
        {platformChart.length > 0 && events.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium">Histórico desta loja</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((event, index) => (
                <div key={`${event.recorded_at}-${index}`} className="flex justify-between gap-3 text-xs">
                  <span>{planNames[event.plan] ?? event.plan} · {statusNames[event.status] ?? event.status}</span>
                  <time className="shrink-0 text-muted-foreground">{new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(event.recorded_at))}</time>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}