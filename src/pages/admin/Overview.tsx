import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, ORDER_STATUS } from "@/lib/format";
import { AlertTriangle, TrendingUp, ShoppingBag, Wallet, Package } from "lucide-react";

type Order = { id: string; total: number; status: string; created_at: string; customer_name: string };
type Item = { product_name: string; quantity: number; unit_price: number; order_id: string };
type Product = { id: string; name: string; stock: number };

export default function Overview() {
  const { company } = useCompany();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const { data: o } = await supabase.from("orders").select("id,total,status,created_at,customer_name").eq("company_id", company.id).order("created_at", { ascending: false }).limit(1000);
      const list = (o as Order[]) ?? [];
      setOrders(list);
      const valid = list.filter((x) => x.status !== "cancelled").map((x) => x.id);
      if (valid.length) {
        const { data: it } = await supabase.from("order_items").select("product_name,quantity,unit_price,order_id").in("order_id", valid.slice(0, 500));
        setItems((it as Item[]) ?? []);
      } else setItems([]);
      const { data: p } = await supabase.from("products").select("id,name,stock").eq("company_id", company.id).eq("active", true).lte("stock", 5).order("stock").limit(8);
      setLowStock((p as Product[]) ?? []);
    })();
  }, [company]);

  const stats = useMemo(() => {
    const now = new Date();
    const valid = orders.filter((o) => o.status !== "cancelled");
    const sum = (f: (d: Date) => boolean) => valid.filter((o) => f(new Date(o.created_at))).reduce((a, o) => a + Number(o.total), 0);
    const sameDay = (d: Date) => d.toDateString() === now.toDateString();
    const sameMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const sameYear = (d: Date) => d.getFullYear() === now.getFullYear();
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (29 - i));
      return { dia: `${d.getDate()}/${d.getMonth() + 1}`, receita: valid.filter((o) => new Date(o.created_at).toDateString() === d.toDateString()).reduce((a, o) => a + Number(o.total), 0) };
    });
    const byStatus = Object.keys(ORDER_STATUS).map((s) => ({ s, n: orders.filter((o) => o.status === s).length }));
    const top = Object.values(items.reduce<Record<string, { name: string; qty: number }>>((acc, i) => {
      acc[i.product_name] ??= { name: i.product_name, qty: 0 }; acc[i.product_name].qty += i.quantity; return acc;
    }, {})).sort((a, b) => b.qty - a.qty).slice(0, 5);
    return { today: sum(sameDay), month: sum(sameMonth), year: sum(sameYear), days, byStatus, top, pending: orders.filter((o) => o.status === "pending").length };
  }, [orders, items]);

  if (!company) return <AdminLayout title="Painel"><div /></AdminLayout>;
  const cur = company.currency;
  const cards = [
    { label: "Hoje", value: formatMoney(stats.today, cur), icon: Wallet },
    { label: "Este mês", value: formatMoney(stats.month, cur), icon: TrendingUp },
    { label: "Este ano", value: formatMoney(stats.year, cur), icon: TrendingUp },
    { label: "Pedidos pendentes", value: String(stats.pending), icon: ShoppingBag },
  ];

  return (
    <AdminLayout title="Painel de vendas">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-4">
            <c.icon className="w-4 h-4 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="font-display text-lg lg:text-2xl font-bold truncate">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 lg:col-span-2">
          <h2 className="font-display font-semibold mb-4">Receita — últimos 30 dias</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.days}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={4} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={60} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: number) => formatMoney(v, cur)} />
                <Area dataKey="receita" stroke="hsl(var(--primary))" fill="url(#g)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent" />Stock baixo</h2>
          {lowStock.length === 0 ? <p className="text-sm text-muted-foreground">Tudo com stock suficiente.</p> : (
            <ul className="space-y-2">{lowStock.map((p) => (
              <li key={p.id} className="flex justify-between text-sm"><span className="truncate">{p.name}</span><span className={p.stock === 0 ? "text-destructive font-semibold" : "text-accent"}>{p.stock} un.</span></li>
            ))}</ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-primary" />Mais vendidos</h2>
          {stats.top.length === 0 ? <p className="text-sm text-muted-foreground">Ainda sem vendas.</p> : (
            <ol className="space-y-2">{stats.top.map((t, i) => <li key={t.name} className="flex justify-between text-sm"><span className="truncate">{i + 1}. {t.name}</span><span className="text-muted-foreground">{t.qty} vendidos</span></li>)}</ol>
          )}
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h2 className="font-display font-semibold mb-4">Pedidos por estado</h2>
          <ul className="space-y-2">{stats.byStatus.map((b) => <li key={b.s} className="flex justify-between text-sm"><span>{ORDER_STATUS[b.s]}</span><span className="font-semibold">{b.n}</span></li>)}</ul>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex justify-between mb-4"><h2 className="font-display font-semibold">Últimos pedidos</h2><Link to="/admin/pedidos" className="text-sm text-primary">Ver todos</Link></div>
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">Partilhe a sua loja para receber pedidos.</p> : (
            <ul className="space-y-2">{orders.slice(0, 5).map((o) => <li key={o.id} className="flex justify-between text-sm gap-2"><span className="truncate">{o.customer_name}</span><span>{formatMoney(o.total, cur)}</span></li>)}</ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
