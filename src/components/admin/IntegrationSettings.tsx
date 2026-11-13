import { useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { LockKeyhole, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function IntegrationSettings({ companyId }: { companyId?: string }) {
  const [status, setStatus] = useState<{ stripe: boolean; meta: boolean; meta_app: boolean } | null>(null);
  const [stripe, setStripe] = useState("");
  const [meta, setMeta] = useState({ app_id: "", access_token: "", app_secret: "", verify_token: "" });
  const [busy, setBusy] = useState(false);
  async function invoke(values: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke("integration-settings", { body: { ...values, company_id: companyId } });
    if (error) {
      const details = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
      throw new Error(details?.error ?? "Não foi possível guardar a ligação");
    }
    return data;
  }
  useEffect(() => {
    setStatus(null);
    void invoke({ action: "status" }).then(setStatus).catch(() => setStatus(null));
  }, [companyId]);
  async function save(provider: "stripe" | "meta") {
    setBusy(true);
    try {
      await invoke({ action: "save", provider, credentials: provider === "stripe" ? { secret_key: stripe } : meta });
      setStripe(""); setMeta({ app_id: "", access_token: "", app_secret: "", verify_token: "" });
      setStatus(await invoke({ action: "status" }));
      toast.success("Credenciais guardadas com segurança");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível guardar"); }
    finally { setBusy(false); }
  }
  async function activate() {
    setBusy(true);
    try { const result = await invoke({ action: "activate_meta" }); toast.success(result.message); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível ativar"); }
    finally { setBusy(false); }
  }
  return <section aria-label={companyId ? "Ligações de pagamento da loja" : "Ligações da plataforma"} className="col-span-full space-y-6 py-5 border-y border-border">
    <h2 className="font-serif text-xl flex items-center gap-2"><LockKeyhole className="h-5 w-5" />{companyId ? "Contas de pagamento da loja" : "Contas e aplicação da plataforma"}</h2>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); void save("stripe"); }}>
      <h3 className="font-semibold">Stripe · {status ? status.stripe ? "Configurado" : "Não configurado" : "Estado não verificado"}</h3>
      <label className="block text-sm">Chave secreta<Input aria-label="Chave secreta Stripe" type="password" autoComplete="off" value={stripe} onChange={e => setStripe(e.target.value)} placeholder="sk_live_… ou sk_test_…" required /></label>
      <Button disabled={busy} type="submit">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar Stripe</Button>
    </form>
    <div className="border-t border-border pt-4"><h3 className="font-semibold">PayPal · Ligação pendente</h3><p className="text-sm text-muted-foreground mt-2">A autorização da conta PayPal Business ainda não está disponível nesta loja.</p></div>
    {!companyId && <form className="space-y-3 border-t border-border pt-4" onSubmit={e => { e.preventDefault(); void save("meta"); }}>
      <h3 className="font-semibold">Meta · {status?.meta ? "Credenciais guardadas" : "Estado não verificado"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{([
        ["app_id", "ID da aplicação", "text"], ["access_token", "Token permanente", "password"], ["app_secret", "Segredo da aplicação", "password"], ["verify_token", "Código de verificação do webhook", "password"],
      ] as const).map(([key, label, type]) => <label className="text-sm" key={key}>{label}<Input aria-label={label} required autoComplete="off" type={type} value={meta[key]} onChange={e => setMeta({ ...meta, [key]: e.target.value })} /></label>)}</div>
      <div className="flex flex-wrap gap-2"><Button disabled={busy}>Guardar Meta</Button><Button variant="outline" disabled={busy || !status?.meta_app} type="button" onClick={() => void activate()}>Ativar webhook da Meta</Button></div>
    </form>}
  </section>;
}