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
  return <main className="min-h-screen bg-slate-50/50 text-slate-900 px-4 py-8 sm:px-8">
    <header className="mx-auto max-w-7xl border-b border-slate-200/80 pb-6 flex flex-wrap justify-between items-end gap-4">
      <div>
        <Link className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1.5 mb-2" to="/dashboard">
          ← Voltar à loja
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-purple-800 mb-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          PLATAFORMA GLOBAL
        </div>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Administração Vendora
        </h1>
      </div>
      <Button aria-label="Atualizar plataforma" variant="outline" className="h-9 gap-2 rounded-lg border-slate-200 bg-white text-xs font-semibold shadow-xs" onClick={() => void load()}>
        <RefreshCw className="h-3.5 w-3.5" />
        Atualizar
      </Button>
    </header>

    {error ? (
      <div role="alert" className="mx-auto max-w-7xl mt-6 rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-sm font-semibold text-rose-800">
        {error}
      </div>
    ) : !data ? (
      <p className="mx-auto max-w-7xl py-12 text-sm text-slate-500">A carregar plataforma…</p>
    ) : (
      <div className="mx-auto max-w-7xl py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Empresas Criadas", data.companies.length, "text-slate-900"],
            ["Lojas Ativas", data.companies.filter(c => c.status === "active").length, "text-emerald-600"],
            ["Lojas Suspensas", data.companies.filter(c => c.status === "suspended").length, "text-amber-600"],
            ["Planos Pagos Ativos", data.companies.filter(c => c.status === "active" && c.entitlement.plan !== "free").length, "text-purple-600"]
          ].map(([label, value, colorClass]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`mt-2 font-sans text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${colorClass}`}>{value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="companies">
          <TabsList className="flex flex-wrap h-auto justify-start bg-slate-100/80 p-1 rounded-xl gap-1">
            <TabsTrigger value="companies" className="rounded-lg text-xs font-semibold">Empresas</TabsTrigger>
            <TabsTrigger value="plans" className="rounded-lg text-xs font-semibold">Planos</TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-lg text-xs font-semibold">Cupões</TabsTrigger>
            <TabsTrigger value="growth" className="rounded-lg text-xs font-semibold">Crescimento</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg text-xs font-semibold">Auditoria</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg text-xs font-semibold">Definições</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="mt-6 space-y-6">
            <IntegrationSettings />
            <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="font-sans text-lg font-bold text-slate-900 mb-4">Preços e Limites das Subscrições</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                {plans.map(p => <PlanEditor key={`${p.id}-${p.monthly_price}-${p.product_limit}-${p.monthly_ai_limit}`} plan={p} save={save} />)}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="companies" className="mt-6 space-y-5">
            <Input aria-label="Pesquisar empresas" className="h-10 rounded-lg border-slate-200 bg-white shadow-xs text-xs font-medium" placeholder="Pesquisar empresa por nome, endereço ou proprietário..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {companies.map(c => (
                <article key={c.id} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3 transition hover:border-slate-300">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-sans text-base font-bold text-slate-900 flex gap-2 items-center">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {c.name}
                    </h2>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 break-all">{c.owner || "Sem perfil associado"}</p>
                  <p className="text-xs font-semibold text-slate-700">Plano: {c.entitlement.name}</p>
                  <p className="text-xs text-slate-500">{c.products} produtos · {c.orders} pedidos · {c.members} membros</p>
                  <Button variant="outline" className="w-full h-8 text-xs font-semibold rounded-lg border-slate-200" onClick={() => setSelected(c)}>Ver detalhes</Button>
                </article>
              ))}
            </div>

            {selected && (
              <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold font-sans text-slate-900">{selected.name}</h2>
                    <p className="text-xs text-slate-400">{selected.slug} · Criada a {new Date(selected.created_at).toLocaleDateString("pt-PT")}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2 bg-slate-50 p-3 rounded-lg">
                  <p><span className="font-semibold text-slate-900">Total Pago:</span> {selected.paid_total} {selected.currency}</p>
                  <p><span className="font-semibold text-slate-900">Base:</span> {selected.entitlement.base_plan} · IA usada: {selected.entitlement.ai_used}/{selected.entitlement.monthly_ai_limit}</p>
                </div>
                <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); void save("grant", { company_id: selected.id, plan_id: grant, expires_at: new Date(expiry).toISOString() }); }}>
                  <label className="text-xs font-semibold text-slate-700">
                    Conceder plano
                    <select className={`${selectClass} block mt-1`} value={grant} onChange={e => setGrant(e.target.value)}>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Validade
                    <Input required type="datetime-local" className="h-10 mt-1 rounded-lg border-slate-200 text-xs" value={expiry} onChange={e => setExpiry(e.target.value)} />
                  </label>
                  <Button disabled={busy} className="h-10 text-xs font-semibold rounded-lg">Conceder acesso</Button>
                  <Button type="button" variant="outline" className="h-10 text-xs font-semibold rounded-lg" disabled={busy} onClick={() => void save("revoke_grant", { company_id: selected.id })}>Revogar concessão</Button>
                </form>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {["active", "suspended", "removed"].map((s, i) => (
                    <Button key={s} disabled={busy} size="sm" variant={s === "removed" ? "destructive" : "outline"} className="text-xs font-semibold rounded-lg" onClick={() => { if (window.confirm(`${["Ativar", "Suspender", "Remover do serviço preservando o histórico"][i]} ${selected.name}?`)) void save("company_status", { company_id: selected.id, status: s }); }}>
                      {["Ativar", "Suspender", "Remover"][i]}
                    </Button>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {plans.map(p => <PlanEditor key={p.id} plan={p} save={save} />)}
            </div>
          </TabsContent>

          <TabsContent value="coupons" className="mt-6 space-y-5">
            <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs" onSubmit={e => { e.preventDefault(); void save("coupon", { ...coupon, expires_at: new Date(coupon.expires_at).toISOString() }); }}>
              <label className="text-xs font-semibold text-slate-700">Código<Input required className="mt-1 h-9 rounded-lg text-xs" value={coupon.code} onChange={e => setCoupon({ ...coupon, code: e.target.value })} /></label>
              <label className="text-xs font-semibold text-slate-700">Plano<select className={`${selectClass} w-full mt-1 h-9 text-xs`} value={coupon.plan_id} onChange={e => setCoupon({ ...coupon, plan_id: e.target.value })}>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-700">Desconto (%)<Input required type="number" min="1" max="100" className="mt-1 h-9 rounded-lg text-xs" value={coupon.percent_off} onChange={e => setCoupon({ ...coupon, percent_off: Number(e.target.value) })} /></label>
              <label className="text-xs font-semibold text-slate-700">Usos Máximos<Input required type="number" min="1" className="mt-1 h-9 rounded-lg text-xs" value={coupon.max_uses} onChange={e => setCoupon({ ...coupon, max_uses: Number(e.target.value) })} /></label>
              <Button disabled={busy} className="h-9 text-xs font-semibold rounded-lg">Criar cupão</Button>
            </form>
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
              {data.coupons.map(c => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="font-mono text-xs font-bold text-slate-900">{c.code} · {c.percent_off}% off · {c.plan_id} ({c.uses}/{c.max_uses} usos)</span>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" disabled={!c.enabled || busy} onClick={() => void save("disable_coupon", { id: c.id })}>{c.enabled ? "Desativar" : "Inativo"}</Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="growth" className="mt-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h2 className="font-sans text-base font-bold text-slate-900 mb-4">Subscrições nos últimos 12 meses</h2>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={metrics.map(m => ({ ...m, month: m.month_start.slice(0, 7) }))}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="active_subscriptions" name="Ativas" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="subscriptions_added" name="Novas" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-6 rounded-xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
            {data.audit.length === 0 ? (
              <p className="p-8 text-xs text-slate-400 text-center">Sem alterações administrativas registadas.</p>
            ) : data.audit.map(a => (
              <div key={a.id} className="p-4 text-xs">
                <p className="font-sans font-bold text-slate-900">{a.action}</p>
                <p className="text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString("pt-PT")} · {a.actor_id} · {a.company_id}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    )}
  </main>;
}