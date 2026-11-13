import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { encryptCredentials, metaCredentials, readCredentials, serviceDb } from "../_shared/credentials.ts";
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const schema = z.object({ action: z.enum(["status", "save", "activate_meta"]), company_id: z.string().uuid().optional(), provider: z.enum(["stripe", "meta"]).optional(), credentials: z.record(z.string().max(8000)).optional() });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) return json({ error: "Serviço indisponível" }, 503);
    const db = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await db.auth.getUser();
    if (!user) return json({ error: "Inicie sessão" }, 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Dados inválidos" }, 400);
    const body = parsed.data;
    const company = body.company_id;
    const { data: allowed } = company ? await db.rpc("is_company_admin", { _company: company, _user: user.id }) : await db.rpc("has_platform_admin", { _user: user.id });
    if (!allowed || company && body.provider === "meta") return json({ error: "Sem permissão" }, 403);
    const scope = company ?? "platform";
    if (body.action === "status") {
      const { data, error } = await serviceDb().from("integration_credentials").select("provider,updated_at").eq("scope_key", scope);
      if (error) return json({ error: "Não foi possível verificar ligações" }, 500);
      const meta = company ? null : await metaCredentials();
      return json({ stripe: data?.some(r => r.provider === "stripe") ?? false, paypal: false, meta: !!meta?.access_token && !!meta?.app_secret && !!meta?.verify_token, meta_app: !!meta?.app_id, updated_at: data?.map(r => ({ provider: r.provider, updated_at: r.updated_at })) ?? [] });
    }
    if (body.action === "activate_meta") {
      if (company) return json({ error: "Reservado à plataforma" }, 403);
      const meta = await metaCredentials();
      if (!meta.app_id || !meta.access_token || !meta.app_secret || !meta.verify_token) return json({ error: "Preencha os quatro campos da Meta antes de ativar" }, 400);
      // Never return the token or the verify request to the browser.
      const origin = new URL(url).origin;
      const callback = `${origin}/functions/v1/whatsapp-webhook`;
      const request = new URLSearchParams({ object: "whatsapp_business_account", callback_url: callback, verify_token: meta.verify_token, fields: "messages" });
      const response = await fetch(`https://graph.facebook.com/v25.0/${encodeURIComponent(meta.app_id)}/subscriptions`, { method: "POST", headers: { Authorization: `Bearer ${meta.app_id}|${meta.app_secret}`, "Content-Type": "application/x-www-form-urlencoded" }, body: request });
      if (!response.ok) return json({ error: "A Meta recusou a ativação. Verifique a aplicação, as permissões e o modo publicado na Meta.", status: response.status }, 502);
      const result = await response.json();
      if (result.success !== true) return json({ error: "A Meta não confirmou a subscrição" }, 502);
      return json({ ok: true, message: "Callback subscrito. Ligue o número Business de cada loja em Conversas." });
    }
    const values = body.credentials ?? {};
    if (body.provider === "stripe") {
      if (!/^sk_(test|live)_\S+$/.test(values.secret_key ?? "")) return json({ error: "Chave Stripe inválida" }, 400);
      const check = await fetch("https://api.stripe.com/v1/account", { headers: { Authorization: `Bearer ${values.secret_key}` } });
      if (!check.ok) return json({ error: "O Stripe recusou a chave. Verifique a conta e as permissões.", status: check.status }, 400);
    } else if (body.provider === "meta") {
      if (!/^\d{5,30}$/.test(values.app_id ?? "") || !values.access_token || !values.app_secret || !values.verify_token) return json({ error: "Preencha ID da aplicação, token, segredo e código de verificação" }, 400);
    } else return json({ error: "Fornecedor inválido" }, 400);
    const safeValues = body.provider === "stripe" ? { secret_key: values.secret_key } : { app_id: values.app_id, access_token: values.access_token, app_secret: values.app_secret, verify_token: values.verify_token };
    const ciphertext = await encryptCredentials(safeValues, scope, body.provider);
    const { error } = await serviceDb().from("integration_credentials").upsert({ scope_key: scope, company_id: company ?? null, provider: body.provider, ciphertext, updated_at: new Date().toISOString() }, { onConflict: "scope_key,provider" });
    if (error) return json({ error: "Não foi possível guardar a ligação" }, 500);
    if (!company) await serviceDb().from("platform_audit").insert({ actor_id: user.id, action: "integration_saved", details: { provider: body.provider } });
    return json({ ok: true });
  } catch {
    return json({ error: "Não foi possível concluir a configuração" }, 500);
  }
});