import { useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { LockKeyhole, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function IntegrationSettings({ companyId }: { companyId?: string }) {
  const [status, setStatus] = useState<{ stripe: boolean; meta: boolean; meta_app: boolean; numbers: { company_id: string; display_phone: string | null; status: string; last_event_at: string | null }[] } | null>(null);
  const [diagnostic, setDiagnostic] = useState("");
  const [stripe, setStripe] = useState("");
  const [meta, setMeta] = useState({ app_id: "", access_token: "", app_secret: "", verify_token: "" });
  const [busy, setBusy] = useState(false);
  const [whatsapp, setWhatsapp] = useState({ phone_number: "", phone_number_id: "", waba_id: "" });
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
  async function connectWhatsApp() {
    if (!companyId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-verify-number", {
        body: {
          company_id: companyId,
          phone_number: whatsapp.phone_number.trim(),
          phone_number_id: whatsapp.phone_number_id.trim(),
          waba_id: whatsapp.waba_id.trim(),
        },
      });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
        throw new Error(details?.error ?? "Não foi possível associar o número WhatsApp");
      }
      if (data?.error) throw new Error(data.error);
      setWhatsapp({ phone_number: "", phone_number_id: "", waba_id: "" });
      setDiagnostic(`Número ${data?.display_phone ?? whatsapp.phone_number} associado e subscrito com sucesso.`);
      setStatus(await invoke({ action: "status" }));
      toast.success("Número WhatsApp associado à loja");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível associar o número");
    } finally {
      setBusy(false);
    }
  }
  async function activate() {
    setBusy(true);
    try { const result = await invoke({ action: "activate_meta" }); setDiagnostic(result.message); toast.success(result.message); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível ativar"); }
    finally { setBusy(false); }
  }
  async function checkMeta() {
    setBusy(true);
    try { const result = await invoke({ action: "check_meta" }); setDiagnostic(`${result.message} Números ligados: ${result.number_count}.`); }
    catch (e) { setDiagnostic(e instanceof Error ? e.message : "Verificação indisponível"); }
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
    {companyId && <form className="space-y-3 border-t border-border pt-4" onSubmit={e => { e.preventDefault(); void connectWhatsApp(); }}>
      <h3 className="font-semibold">WhatsApp Business · {status?.numbers?.length ? "Número associado" : "Associar número da loja"}</h3>
      <p className="text-sm text-muted-foreground">Introduza os dados do número registado na Meta. O número será validado na conta WhatsApp Business antes de ser associado a esta loja.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Número de telefone visível<Input aria-label="Número de telefone WhatsApp" type="tel" autoComplete="tel" value={whatsapp.phone_number} placeholder="+244 9XX XXX XXX" onChange={e => setWhatsapp({ ...whatsapp, phone_number: e.target.value })} required /></label>
        <label className="text-sm">Phone Number ID<Input aria-label="Phone Number ID" inputMode="numeric" value={whatsapp.phone_number_id} placeholder="ID do número na Meta" onChange={e => setWhatsapp({ ...whatsapp, phone_number_id: e.target.value })} required /></label>
        <label className="text-sm sm:col-span-2">WhatsApp Business Account ID (WABA ID)<Input aria-label="WhatsApp Business Account ID" inputMode="numeric" value={whatsapp.waba_id} placeholder="ID da conta WhatsApp Business" onChange={e => setWhatsapp({ ...whatsapp, waba_id: e.target.value })} required /></label>
      </div>
      <Button disabled={busy || !status?.meta} type="submit">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Verificar e associar número</Button>
      {!status?.meta && <p className="text-xs text-muted-foreground">A plataforma ainda não configurou as credenciais Meta. Contacte o administrador da plataforma.</p>}
      {diagnostic && <p role="status" className="text-sm border-l-2 border-primary pl-3">{diagnostic}</p>}
      {status?.numbers?.map(number => <p key={number.company_id} className="text-sm">{number.display_phone ?? "Número Business"} · {number.status} · Último evento: {number.last_event_at ? new Date(number.last_event_at).toLocaleString("pt-PT") : "Ainda não recebido"}</p>)}
    </form>}
    {!companyId && <form className="space-y-3 border-t border-border pt-4" onSubmit={e => { e.preventDefault(); void save("meta"); }}>
      <h3 className="font-semibold">Meta · {status?.meta ? "Credenciais guardadas" : "Estado não verificado"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{([
        ["app_id", "ID da aplicação", "text"], ["access_token", "Token permanente", "password"], ["app_secret", "Segredo da aplicação", "password"], ["verify_token", "Código de verificação do webhook", "password"],
      ] as const).map(([key, label, type]) => <label className="text-sm" key={key}>{label}<Input aria-label={label} autoComplete="off" type={type} value={meta[key]} placeholder={key === "app_id" ? "ID da aplicação Vendora" : "Manter credencial guardada"} onChange={e => setMeta({ ...meta, [key]: e.target.value })} /></label>)}</div>
      <div className="flex flex-wrap gap-2"><Button disabled={busy}>Guardar Meta</Button><Button variant="outline" disabled={busy} type="button" onClick={() => void checkMeta()}>Verificar ligação Meta</Button><Button variant="outline" disabled={busy || !status?.meta_app} type="button" onClick={() => void activate()}>Ativar webhook da Meta</Button></div>
      {diagnostic && <p role="status" className="text-sm border-l-2 border-primary pl-3">{diagnostic}</p>}
      <dl className="grid gap-3 sm:grid-cols-2 text-sm border-t border-border pt-4"><div><dt className="font-semibold">Mensagens individuais</dt><dd className="text-muted-foreground">{status?.numbers.length ? `${status.numbers.length} número(s) ligado(s)` : "Falta ligar um número Business à loja"}</dd></div><div><dt className="font-semibold">Grupos</dt><dd className="text-muted-foreground">Elegibilidade não verificada · Conta oficial Meta necessária</dd></div><div><dt className="font-semibold">Facebook e Instagram</dt><dd className="text-muted-foreground">Publicação pendente de contas e permissões autorizadas</dd></div><div><dt className="font-semibold">Resposta da IA</dt><dd className="text-muted-foreground">Teste real pendente de mensagem recebida</dd></div></dl>
      {status?.numbers.map(number => <p key={number.company_id} className="text-sm">{number.display_phone ?? "Número Business"} · {number.status} · Último evento: {number.last_event_at ? new Date(number.last_event_at).toLocaleString("pt-PT") : "Ainda não recebido"}</p>)}
    </form>}
  </section>;
}