import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, RefreshCw, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Entitlement } from "@/components/admin/SubscriptionPanel";
import { IntegrationSettings } from "@/components/admin/IntegrationSettings";

type Plan = { id: string; name: string; monthly_price: number | null; currency: string; product_limit: number; monthly_ai_limit: number; features: string[]; enabled: boolean };
type Company = { id: string; name: string; slug: string; currency: string; status: string; owner: string; created_at: string; members: number; products: number; orders: number; paid_total: number; entitlement: Entitlement };
type Coupon = { id: string; code: string; plan_id: string; percent_off: number; uses: number; max_uses: number; expires_at: string; enabled: boolean };
type Audit = { id: string; action: string; company_id: string; created_at: string; actor_id: string };
type Overview = { companies: Company[]; coupons: Coupon[]; audit: Audit[] };
const selectClass = "h-10 rounded border border-input bg-background px-3 text-sm";

function PlanEditor({ plan, save }: { plan: Plan; save: (action: string, data: Record<string, unknown>) => Promise<boolean> }) {
  const [p, setP] = useState(plan);
  return <form onSubmit={e => { e.preventDefault(); void save("plan", { ...p, price: p.monthly_price }); }} className="border border-border rounded p-5 space-y-4">
    <h2 className="font-serif text-xl">{plan.name}</h2>
    <label className="block text-sm">Nome<Input value={p.name} required onChange={e => setP({ ...p, name: e.target.value })} /></label>
    <div className="grid grid-cols-2 gap-3"><label className="text-sm">Preço mensal<Input type="number" min="0" step="0.01" value={p.monthly_price ?? ""} placeholder="Por definir" onChange={e => setP({ ...p, monthly_price: e.target.value === "" ? null : Number(e.target.value) })} /></label><label className="text-sm">Moeda<Input required maxLength={3} value={p.currency} onChange={e => setP({ ...p, currency: e.target.value })} /></label></div>
    <label className="block text-sm">Limite de produtos<Input required type="number" min="0" value={p.product_limit} onChange={e => setP({ ...p, product_limit: Number(e.target.value) })} /></label>
    <label className="block text-sm">Pedidos de IA por mês<Input required type="number" min="0" value={p.monthly_ai_limit} onChange={e => setP({ ...p, monthly_ai_limit: Number(e.target.value) })} /></label>
    <div className="flex flex-wrap gap-3">{["marketing", "analytics", "sales", "whatsapp"].map(f => <label key={f} className="flex items-center gap-2 text-sm"><Checkbox checked={p.features.includes(f)} onCheckedChange={v => setP({ ...p, features: v ? [...p.features, f] : p.features.filter(x => x !== f) })} />{f}</label>)}</div>
    <label className="flex items-center gap-2 text-sm"><Checkbox checked={p.enabled} onCheckedChange={v => setP({ ...p, enabled: v === true })} />Plano disponível</label><Button type="submit">Guardar plano</Button>
  </form>;
}

export default function Platform() {
  const [data, setData] = useState<Overview | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [metrics, setMetrics] = useState<{ month_start: string; active_subscriptions: number; subscriptions_added: number }[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Company | null>(null);
  const [grant, setGrant] = useState("pro");
  const [expiry, setExpiry] = useState("");
  const [coupon, setCoupon] = useState({ code: "", plan_id: "basic", percent_off: 10, max_uses: 1, expires_at: "" });
  const [busy, setBusy] = useState(false);
  async function load() {
    const [o, p, m] = await Promise.all([supabase.rpc("platform_overview"), supabase.from("subscription_plans").select("*"), supabase.rpc("get_platform_subscription_metrics")]);
    if (o.error) { setError("Acesso reservado à administração da plataforma."); return; }
    const overview = o.data as unknown as Overview;
    setError(""); setData(overview); setSelected(current => current ? overview.companies.find(c => c.id === current.id) ?? null : null); setPlans(p.data ?? []); setMetrics(m.data ?? []);
  }
  useEffect(() => { void load(); }, []);
  async function save(action: string, values: Record<string, unknown>) {
    setBusy(true);
    const { error: failure } = await supabase.rpc("platform_manage", { _action: action, _data: values as never });
    setBusy(false);
    if (failure) { toast.error(failure.message); return false; }
    toast.success("Alteração guardada"); await load(); return true;
  }
  const companies = data?.companies.filter(c => `${c.name} ${c.slug} ${c.owner}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  return <main className="min-h-screen bg-background text-foreground px-4 py-8 sm:px-8">
    <header className="mx-auto max-w-7xl border-b border-border pb-6 flex flex-wrap justify-between gap-4"><div><Link className="text-sm text-primary" to="/dashboard">← Voltar à loja</Link><h1 className="mt-3 font-serif text-3xl flex items-center gap-3"><ShieldCheck className="h-7 w-7" />Administração Vendora</h1></div><Button aria-label="Atualizar plataforma" variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button></header>
    {error ? <p role="alert" className="mx-auto max-w-7xl py-8 text-destructive">{error}</p> : !data ? <p className="py-8">A carregar plataforma…</p> : <div className="mx-auto max-w-7xl py-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border pb-6">{[["Empresas", data.companies.length], ["Ativas", data.companies.filter(c => c.status === "active").length], ["Suspensas", data.companies.filter(c => c.status === "suspended").length], ["Planos pagos ativos", data.companies.filter(c => c.status === "active" && c.entitlement.plan !== "free").length]].map(([label, value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-semibold tabular-nums">{value}</p></div>)}</div>
      <Tabs defaultValue="companies"><TabsList className="flex flex-wrap h-auto justify-start"><TabsTrigger value="companies">Empresas</TabsTrigger><TabsTrigger value="plans">Planos</TabsTrigger><TabsTrigger value="coupons">Cupões</TabsTrigger><TabsTrigger value="growth">Crescimento</TabsTrigger><TabsTrigger value="audit">Auditoria</TabsTrigger><TabsTrigger value="settings">Definições</TabsTrigger></TabsList>
        <TabsContent value="settings" className="space-y-6"><IntegrationSettings /><section className="border-t border-border pt-5"><h2 className="font-serif text-xl mb-4">Preços e limites das subscrições</h2><div className="grid gap-4 lg:grid-cols-3">{plans.map(p => <PlanEditor key={`${p.id}-${p.monthly_price}-${p.product_limit}-${p.monthly_ai_limit}`} plan={p} save={save} />)}</div></section></TabsContent>
        <TabsContent value="companies" className="space-y-5"><Input aria-label="Pesquisar empresas" placeholder="Empresa, endereço ou proprietário" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{companies.map(c => <article key={c.id} className="border border-border rounded p-4 space-y-2"><h2 className="font-semibold flex gap-2 items-center"><Building2 className="h-4 w-4" />{c.name}</h2><p className="text-sm text-muted-foreground break-all">{c.owner || "Sem perfil"}</p><p className="text-sm">{c.entitlement.name} · {c.status}</p><p className="text-sm">{c.products} produtos · {c.orders} pedidos · {c.members} membros</p><Button variant="outline" onClick={() => setSelected(c)}>Ver detalhes</Button></article>)}</div>
          {selected && <section className="border-y border-border py-5 space-y-4"><div className="flex justify-between"><h2 className="text-xl font-serif">{selected.name}</h2><Button variant="ghost" onClick={() => setSelected(null)}>Fechar</Button></div><p className="break-all">{selected.slug} · Criada em {new Date(selected.created_at).toLocaleDateString("pt-PT")}</p><p>Recebido: {selected.paid_total} {selected.currency}</p><p>Plano de origem: {selected.entitlement.base_plan} · IA usada: {selected.entitlement.ai_used}/{selected.entitlement.monthly_ai_limit}</p>
            <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); void save("grant", { company_id: selected.id, plan_id: grant, expires_at: new Date(expiry).toISOString() }); }}><label className="text-sm">Conceder plano<select className={`${selectClass} block`} value={grant} onChange={e => setGrant(e.target.value)}>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="text-sm">Até<Input required type="datetime-local" value={expiry} onChange={e => setExpiry(e.target.value)} /></label><Button disabled={busy}>Conceder acesso temporário</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void save("revoke_grant", { company_id: selected.id })}>Revogar concessão</Button></form>
            <div className="flex flex-wrap gap-2">{["active", "suspended", "removed"].map((s, i) => <Button key={s} disabled={busy} variant={s === "removed" ? "destructive" : "outline"} onClick={() => { if (window.confirm(`${["Ativar", "Suspender", "Remover do serviço preservando o histórico"][i]} ${selected.name}?`)) void save("company_status", { company_id: selected.id, status: s }); }}>{["Ativar", "Suspender", "Remover"][i]}</Button>)}</div>
          </section>}
        </TabsContent>
        <TabsContent value="plans"><div className="grid gap-4 lg:grid-cols-3">{plans.map(p => <PlanEditor key={p.id} plan={p} save={save} />)}</div></TabsContent>
        <TabsContent value="coupons" className="space-y-5"><form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end border-b border-border py-5" onSubmit={e => { e.preventDefault(); void save("coupon", { ...coupon, expires_at: new Date(coupon.expires_at).toISOString() }); }}><label className="text-sm">Código<Input required value={coupon.code} onChange={e => setCoupon({ ...coupon, code: e.target.value })} /></label><label className="text-sm">Plano<select className={`${selectClass} w-full`} value={coupon.plan_id} onChange={e => setCoupon({ ...coupon, plan_id: e.target.value })}>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="text-sm">Desconto (%)<Input required type="number" min="1" max="100" value={coupon.percent_off} onChange={e => setCoupon({ ...coupon, percent_off: Number(e.target.value) })} /></label><label className="text-sm">Utilizações máximas<Input required type="number" min="1" value={coupon.max_uses} onChange={e => setCoupon({ ...coupon, max_uses: Number(e.target.value) })} /></label><label className="text-sm">Validade<Input required type="datetime-local" value={coupon.expires_at} onChange={e => setCoupon({ ...coupon, expires_at: e.target.value })} /></label><Button disabled={busy}>Criar cupão</Button></form>{data.coupons.map(c => <div key={c.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-3"><span>{c.code} · {c.percent_off}% · {c.plan_id} · {c.uses}/{c.max_uses} usos · Até {new Date(c.expires_at).toLocaleDateString("pt-PT")}</span><Button variant="outline" disabled={!c.enabled || busy} onClick={() => void save("disable_coupon", { id: c.id })}>{c.enabled ? "Desativar" : "Inativo"}</Button></div>)}</TabsContent>
        <TabsContent value="growth"><h2 className="font-serif text-xl my-5">Subscrições nos últimos 12 meses</h2><div className="h-80"><ResponsiveContainer><BarChart data={metrics.map(m => ({ ...m, month: m.month_start.slice(0, 7) }))}><CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="active_subscriptions" name="Ativas" fill="hsl(var(--primary))" /><Bar dataKey="subscriptions_added" name="Novas" fill="hsl(var(--accent))" /></BarChart></ResponsiveContainer></div></TabsContent>
        <TabsContent value="audit">{data.audit.length === 0 ? <p className="py-6 text-muted-foreground">Sem alterações administrativas registadas.</p> : data.audit.map(a => <div key={a.id} className="border-b border-border py-3 text-sm"><p className="font-semibold">{a.action}</p><p className="break-all text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-PT")} · {a.actor_id} · {a.company_id}</p></div>)}</TabsContent>
      </Tabs>
    </div>}
  </main>;
}