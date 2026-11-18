// One-click Meta onboarding for shops (Embedded Signup / Facebook Login for Business).
// The shop authorizes Vendora's Meta app; we exchange the code server-side and store a per-company token.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { encryptCredentials, metaCredentials, serviceDb } from "../_shared/credentials.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const GRAPH = "https://graph.facebook.com/v21.0";
const Body = z.object({
  action: z.enum(["config", "complete_whatsapp", "complete_social"]),
  company_id: z.string().uuid().optional(),
  code: z.string().min(10).max(2000).optional(),
  waba_id: z.string().regex(/^\d{5,30}$/).optional(),
  phone_number_id: z.string().regex(/^\d{5,30}$/).optional(),
  page_id: z.string().regex(/^\d{5,30}$/).optional(),
});

async function graph(path: string, token: string, init?: RequestInit) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${GRAPH}/${path}${init ? "" : `${sep}access_token=${encodeURIComponent(token)}`}`, init ? { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } } : undefined);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message ?? `Meta ${r.status}`);
  return j;
}

async function exchange(code: string, appId: string, secret: string) {
  const r = await fetch(`${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${encodeURIComponent(secret)}&code=${encodeURIComponent(code)}`);
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error(j?.error?.message ?? "A Meta recusou a autorização");
  return j.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Dados inválidos" }, 400);
    const b = parsed.data;
    const userDb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await userDb.auth.getUser();
    if (!user) return json({ error: "Inicie sessão" }, 401);
    const meta = await metaCredentials();
    if (b.action === "config") {
      // Only public identifiers are returned.
      return json({ app_id: meta.app_id || null, whatsapp_config_id: meta.whatsapp_config_id || null, social_config_id: meta.social_config_id || null });
    }
    if (!b.company_id || !b.code) return json({ error: "Dados em falta" }, 400);
    const { data: admin } = await userDb.rpc("is_company_admin", { _company: b.company_id, _user: user.id });
    if (!admin) return json({ error: "Sem permissão" }, 403);
    if (!meta.app_id || !meta.app_secret) return json({ error: "A ligação automática ainda não está ativa na plataforma" }, 503);
    const token = await exchange(b.code, meta.app_id, meta.app_secret);
    const db = serviceDb();

    if (b.action === "complete_whatsapp") {
      if (!b.waba_id || !b.phone_number_id) return json({ error: "A Meta não devolveu o número escolhido" }, 400);
      const numbers = await graph(`${b.waba_id}/phone_numbers?fields=id,display_phone_number,verified_name`, token);
      const number = (numbers.data ?? []).find((n: { id: string }) => n.id === b.phone_number_id);
      if (!number) return json({ error: "O número não pertence à conta autorizada" }, 400);
      const { data: taken } = await db.from("whatsapp_accounts").select("company_id").eq("phone_number_id", b.phone_number_id).maybeSingle();
      if (taken && taken.company_id !== b.company_id) return json({ error: "Este número já está ligado a outra loja" }, 409);
      await db.from("integration_credentials").upsert({ scope_key: b.company_id, company_id: b.company_id, provider: "whatsapp_business", ciphertext: await encryptCredentials({ access_token: token, waba_id: b.waba_id }, b.company_id, "whatsapp_business"), updated_at: new Date().toISOString() }, { onConflict: "scope_key,provider" });
      const row = { company_id: b.company_id, phone_number_id: b.phone_number_id, waba_id: b.waba_id, display_phone: number.display_phone_number, status: "pending" };
      if (taken) await db.from("whatsapp_accounts").update(row).eq("phone_number_id", b.phone_number_id);
      else { await db.from("whatsapp_accounts").delete().eq("company_id", b.company_id); await db.from("whatsapp_accounts").insert(row); }
      await graph(`${b.waba_id}/subscribed_apps`, token, { method: "POST", body: "{}" });
      // Register for Cloud API; already-registered numbers return an error we can ignore.
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      await graph(`${b.phone_number_id}/register`, token, { method: "POST", body: JSON.stringify({ messaging_product: "whatsapp", pin }) }).catch(() => null);
      await db.from("audit_logs").insert({ company_id: b.company_id, actor_type: "user", actor_name: user.email ?? user.id, action: "whatsapp_connected", target_type: "whatsapp_account", target_id: b.phone_number_id });
      return json({ ok: true, display_phone: number.display_phone_number, name: number.verified_name });
    }

    // Facebook Page + Instagram
    const long = await graph(`oauth/access_token?grant_type=fb_exchange_token&client_id=${meta.app_id}&client_secret=${encodeURIComponent(meta.app_secret)}&fb_exchange_token=${encodeURIComponent(token)}`, token).catch(() => ({ access_token: token }));
    const pages = await graph("me/accounts?fields=id,name,access_token,instagram_business_account{id,username}", long.access_token);
    const list = pages.data ?? [];
    if (!list.length) return json({ error: "Nenhuma Página do Facebook foi autorizada" }, 400);
    const page = b.page_id ? list.find((p: { id: string }) => p.id === b.page_id) : list[0];
    if (!page) return json({ error: "Página não autorizada" }, 400);
    await db.from("integration_credentials").upsert({ scope_key: b.company_id, company_id: b.company_id, provider: "social", ciphertext: await encryptCredentials({ page_id: page.id, ig_user_id: page.instagram_business_account?.id ?? "", page_token: page.access_token }, b.company_id, "social"), updated_at: new Date().toISOString() }, { onConflict: "scope_key,provider" });
    await db.from("social_connections").delete().eq("company_id", b.company_id).in("provider", ["facebook", "instagram"]);
    await db.from("social_connections").insert([{ company_id: b.company_id, provider: "facebook", account_id: page.id, account_name: page.name, status: "connected" }, ...(page.instagram_business_account ? [{ company_id: b.company_id, provider: "instagram", account_id: page.instagram_business_account.id, account_name: page.instagram_business_account.username ?? page.name, status: "connected" }] : [])]);
    return json({ ok: true, page: page.name, instagram: page.instagram_business_account?.username ?? null, pages: list.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message.slice(0, 300) }, 502);
  }
});
