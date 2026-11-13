import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export type Entitlement = { plan: string; name: string; status: string; company_status: string; base_plan: string; features: string[]; product_limit: number; monthly_ai_limit: number; ai_used: number; grant_expires_at: string | null };
export function SubscriptionPanel({ companyId }: { companyId: string }) {
  const [value, setValue] = useState<Entitlement | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setValue(null); void supabase.rpc("company_entitlement", { _company: companyId }).then(({ data, error }) => { if (error) toast.error(error.message); else setValue(data as unknown as Entitlement); }); }, [companyId]);
  async function redeem() {
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_company_coupon", { _company: companyId, _code: code });
    setBusy(false);
    if (error) toast.error(error.message);
    else { const result = data as { percent_off?: number }; toast.success(`Cupão reservado: ${result.percent_off}% de desconto. O acesso só muda após ativação do plano.`); setCode(""); }
  }
  return <section className="border-y border-border py-5 space-y-4" aria-label="Limites da subscrição">
    <h2 className="font-serif text-xl">Subscrição da empresa</h2>
    {value ? <><p className="font-semibold">{value.name} · {value.status} · Loja {value.company_status}</p><div className="flex flex-wrap gap-5 text-sm"><span>Produtos: até {value.product_limit}</span><span>IA este mês: {value.ai_used} / {value.monthly_ai_limit}</span></div><p className="text-sm text-muted-foreground">{value.features.join(" · ") || "Acesso suspenso"}</p>{value.grant_expires_at && <p className="text-sm">Concessão até {new Date(value.grant_expires_at).toLocaleDateString("pt-PT")} · Plano de origem: {value.base_plan}</p>}</> : <p>A carregar plano…</p>}
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void redeem(); }}><Input className="max-w-xs" aria-label="Código do cupão" placeholder="Código do cupão" value={code} onChange={e => setCode(e.target.value)} required /><Button disabled={busy}>Aplicar cupão</Button></form>
  </section>;
}