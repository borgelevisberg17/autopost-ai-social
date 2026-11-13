import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

type Plan = { id: string; name: string; monthly_price: number | null; currency: string; product_limit: number; monthly_ai_limit: number; features: string[] };

export function PlansSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => { void supabase.from("subscription_plans").select("*").eq("enabled", true).order("product_limit").then(({ data, error }) => { setPlans(data ?? []); setError(Boolean(error)); }); }, []);
  const names: Record<string, string> = { marketing: "Agente de marketing", analytics: "Agente de análise", sales: "Agente de vendas", whatsapp: "WhatsApp" };
  return <section id="plans" className="border-y border-border bg-secondary"><div className="mx-auto max-w-6xl px-5 py-16 space-y-8"><h2 className="font-serif text-3xl text-foreground">Planos Vendora</h2>{error && <p role="alert">Não foi possível carregar os planos.</p>}<div className="grid gap-4 lg:grid-cols-3">{plans.map(plan => <article key={plan.id} className="rounded border border-border bg-card text-card-foreground p-6 flex flex-col gap-5"><h3 className="text-xl font-semibold">{plan.name}</h3><p className="text-2xl font-semibold tabular-nums">{plan.monthly_price === null ? "Preço por definir" : formatMoney(plan.monthly_price, plan.currency)}<span className="text-sm font-normal text-muted-foreground"> / mês</span></p><ul className="flex-1 space-y-3 text-sm"><li>Até {plan.product_limit} produtos</li><li>{plan.monthly_ai_limit} pedidos de IA por mês</li>{plan.features.map(f => <li className="flex gap-2" key={f}><Check className="h-4 w-4 text-primary" />{names[f] ?? f}</li>)}</ul><Button asChild variant="outline"><Link to="/signup">Criar empresa<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></article>)}</div></div></section>;
}
