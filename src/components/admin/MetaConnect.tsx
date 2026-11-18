import { useEffect, useRef, useState } from "react";
import { Facebook, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { loadFacebookSdk, parseEmbeddedSignupMessage } from "@/lib/facebookSdk";

type Config = { app_id: string | null; whatsapp_config_id: string | null; social_config_id: string | null };

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("meta-connect", { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const details = ctx ? await ctx.json().catch(() => null) : null;
    throw new Error(details?.error ?? "Não foi possível concluir a ligação");
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

/** One-click connection: the shop logs in with Facebook and picks its number/Page; Vendora configures the rest. */
export function MetaConnect({ companyId, kind, onConnected }: { companyId: string; kind: "whatsapp" | "social"; onConnected?: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = useRef<{ waba_id: string; phone_number_id: string } | null>(null);

  useEffect(() => { void call({ action: "config" }).then(setConfig).catch(() => setConfig({ app_id: null, whatsapp_config_id: null, social_config_id: null })); }, []);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => { const r = parseEmbeddedSignupMessage(e.origin, e.data); if (r && r !== "cancelled") signup.current = r; };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const configId = kind === "whatsapp" ? config?.whatsapp_config_id : config?.social_config_id;
  const ready = !!config?.app_id && !!configId;

  async function start() {
    if (!config?.app_id || !configId) return;
    setBusy(true); signup.current = null;
    try {
      const fb = await loadFacebookSdk(config.app_id);
      fb.login(async (res) => {
        const code = res.authResponse?.code;
        if (!code) { setBusy(false); return toast.info("Ligação cancelada"); }
        try {
          if (kind === "whatsapp") {
            await new Promise(r => setTimeout(r, 800));
            if (!signup.current) throw new Error("Escolha um número de WhatsApp na janela da Meta para concluir");
            const r = await call({ action: "complete_whatsapp", company_id: companyId, code, ...signup.current });
            toast.success(`WhatsApp ${r.display_phone} ligado`);
          } else {
            const r = await call({ action: "complete_social", company_id: companyId, code });
            toast.success(`Página ${r.page} ligada${r.instagram ? ` e Instagram @${r.instagram}` : ""}`);
          }
          onConnected?.();
        } catch (e) { toast.error((e as Error).message); }
        finally { setBusy(false); }
      }, { config_id: configId, response_type: "code", override_default_response_type: true, ...(kind === "whatsapp" ? { extras: { setup: {}, featureType: "", sessionInfoVersion: "3" } } : {}) });
    } catch (e) { toast.error((e as Error).message); setBusy(false); }
  }

  const Icon = kind === "whatsapp" ? MessageCircle : Facebook;
  return (
    <div className="space-y-2">
      <Button type="button" onClick={start} disabled={!ready || busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        {kind === "whatsapp" ? "Ligar WhatsApp com o Facebook" : "Ligar Facebook e Instagram"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {ready ? (kind === "whatsapp" ? "Entre com o Facebook, escolha ou crie a conta Business e confirme o número. A Vendora trata do resto." : "Entre com o Facebook e escolha a Página (e o Instagram ligado). A Vendora trata do resto.")
          : config ? "A ligação automática ainda não foi ativada pela plataforma." : "A verificar…"}
      </p>
    </div>
  );
}
