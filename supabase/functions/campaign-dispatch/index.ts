import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { metaCredentials, readCredentials, serviceDb } from "../_shared/credentials.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { buildStepContent, channelFeature, stepWindowOpen } from "../_shared/campaign-rules.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const Body = z.object({ action: z.enum(["launch", "pause", "approve", "run_due", "preview"]), campaign_id: z.string().uuid().optional(), step_id: z.string().uuid().optional() });
const GRAPH = "https://graph.facebook.com/v21.0";

// deno-lint-ignore no-explicit-any
type Db = any;

async function loadProducts(db: Db, campaign: { company_id: string; product_ids: string[]; auto_products: boolean }) {
  let q = db.from("products").select("id,name,price,promo_price,stock,images,created_at").eq("company_id", campaign.company_id).eq("active", true).gt("stock", 0);
  if (!campaign.auto_products && campaign.product_ids.length) q = q.in("id", campaign.product_ids);
  const { data } = await q.order("created_at", { ascending: false }).limit(20);
  return data ?? [];
}

// deno-lint-ignore no-explicit-any
async function processStep(db: Db, step: any) {
  const { data: campaign } = await db.from("campaigns").select("*").eq("id", step.campaign_id).single();
  const { data: company } = await db.from("companies").select("id,name,slug,currency,platform_status").eq("id", step.company_id).single();
  if (!campaign || campaign.status !== "running" || company?.platform_status !== "active") return;
  if (!stepWindowOpen(step, new Date())) return;
  if (step.requires_approval && !step.approved) { await db.from("campaign_steps").update({ status: "awaiting_approval" }).eq("id", step.id); return; }
  const { data: ent } = await db.rpc("company_entitlement", { _company: step.company_id });
  const finish = async (status: string, result: Record<string, unknown>, content?: string) => {
    await db.from("campaign_steps").update({ status, result, processed_at: new Date().toISOString(), ...(content ? { content } : {}) }).eq("id", step.id);
    await db.from("agent_actions").insert({ company_id: step.company_id, agent: "distribution", action: `campaign_${step.channel}`, platform: step.channel, content: content?.slice(0, 2000) ?? null, status, reason: String(result.message ?? "") });
  };
  const products = await loadProducts(db, campaign);
  if (!products.length) return finish("skipped", { message: "Sem produtos ativos com stock" });
  const origin = Deno.env.get("PUBLIC_SITE_URL") ?? "https://autopost-ai-social.lovable.app";
  const content = step.content || buildStepContent(step.channel, company, products, `${origin}/loja/${company.slug}`);
  const need = channelFeature(step.channel);
  if (!need.every((f: string) => (ent?.features ?? []).includes(f))) return finish("awaiting_connection", { message: "O plano atual não permite envio automático neste canal. Copie o texto e publique manualmente." }, content);
  await db.from("campaign_steps").update({ status: "sending", content }).eq("id", step.id);

  if (step.channel === "facebook" || step.channel === "instagram") {
    const social = await readCredentials(step.company_id, "social");
    if (!social?.page_token || (step.channel === "facebook" ? !social.page_id : !social.ig_user_id)) return finish("awaiting_connection", { message: "Aguarda ligação do canal nas Definições da loja" }, content);
    const image = products[0].images?.[0];
    let r: Response;
    if (step.channel === "facebook") {
      r = await fetch(`${GRAPH}/${social.page_id}/${image ? "photos" : "feed"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(image ? { url: image, caption: content, access_token: social.page_token } : { message: content, access_token: social.page_token }) });
    } else {
      if (!image) return finish("failed", { message: "Instagram exige imagem no produto" }, content);
      const c = await fetch(`${GRAPH}/${social.ig_user_id}/media`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image_url: image, caption: content, access_token: social.page_token }) });
      const cj = await c.json();
      if (!c.ok) return finish("failed", { message: cj?.error?.message ?? "Instagram recusou" }, content);
      r = await fetch(`${GRAPH}/${social.ig_user_id}/media_publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creation_id: cj.id, access_token: social.page_token }) });
    }
    const j = await r.json();
    await db.from("campaign_deliveries").upsert({ company_id: step.company_id, step_id: step.id, recipient: step.channel, status: r.ok ? "sent" : "failed", external_id: j?.id ?? j?.post_id ?? null, error: r.ok ? null : j?.error?.message ?? "erro" }, { onConflict: "step_id,recipient" });
    return finish(r.ok ? "sent" : "failed", { message: r.ok ? "Publicado" : j?.error?.message ?? "A Meta recusou a publicação" }, content);
  }

  if (step.channel === "whatsapp") {
    const meta = await metaCredentials();
    const { data: acc } = await db.from("whatsapp_accounts").select("phone_number_id").eq("company_id", step.company_id).maybeSingle();
    const { data: contacts } = await db.from("conversations").select("customer_phone,last_inbound_at").eq("company_id", step.company_id).eq("channel", "whatsapp");
    if (!meta?.access_token || !acc?.phone_number_id) return finish("awaiting_connection", { message: "Aguarda ligação do número WhatsApp Business", contacts: contacts?.length ?? 0 }, content);
    let sent = 0, waiting = 0, failed = 0;
    for (const c of contacts ?? []) {
      const { error: dup } = await db.from("campaign_deliveries").insert({ company_id: step.company_id, step_id: step.id, recipient: c.customer_phone });
      if (dup) continue;
      // Meta só permite mensagem livre até 24h após a última mensagem do cliente.
      if (!c.last_inbound_at || Date.now() - new Date(c.last_inbound_at).getTime() > 86400000) {
        waiting++; await db.from("campaign_deliveries").update({ status: "awaiting_template" }).eq("step_id", step.id).eq("recipient", c.customer_phone); continue;
      }
      const r = await fetch(`${GRAPH}/${acc.phone_number_id}/messages`, { method: "POST", headers: { Authorization: `Bearer ${meta.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: c.customer_phone, type: "text", text: { body: content } }) });
      const j = await r.json();
      r.ok ? sent++ : failed++;
      await db.from("campaign_deliveries").update({ status: r.ok ? "sent" : "failed", external_id: j?.messages?.[0]?.id ?? null, error: r.ok ? null : j?.error?.message ?? "erro" }).eq("step_id", step.id).eq("recipient", c.customer_phone);
    }
    return finish(failed && !sent ? "failed" : "sent", { message: `Enviadas ${sent}, aguardam modelo aprovado ${waiting}, falhas ${failed}`, sent, waiting, failed }, content);
  }

  // email
  const { count } = await db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("company_id", step.company_id).eq("status", "active");
  const mail = await readCredentials("platform", "marketing_email");
  if (!mail?.api_key) return finish("awaiting_connection", { message: "Aguarda serviço de email marketing nas Definições da plataforma", subscribers: count ?? 0 }, content);
  return finish("awaiting_connection", { message: "Serviço de email marketing guardado; envio em massa ativa após validação do fornecedor", subscribers: count ?? 0 }, content);
}

async function runDue(db: Db, companyId?: string) {
  let q = db.from("campaign_steps").select("*").in("status", ["pending", "awaiting_approval"]).lte("due_at", new Date().toISOString()).order("due_at").limit(50);
  if (companyId) q = q.eq("company_id", companyId);
  const { data: steps } = await q;
  for (const s of steps ?? []) {
    const { data: claimed } = await db.from("campaign_steps").update({ status: "sending" }).eq("id", s.id).eq("status", s.status).select("id").maybeSingle();
    if (!claimed) continue;
    await db.from("campaign_steps").update({ status: s.status }).eq("id", s.id);
    try { await processStep(db, s); } catch (e) { await db.from("campaign_steps").update({ status: "failed", result: { message: String(e).slice(0, 300) } }).eq("id", s.id); }
  }
  const { data: running } = await db.from("campaigns").select("id").eq("status", "running");
  for (const c of running ?? []) {
    const { count } = await db.from("campaign_steps").select("id", { count: "exact", head: true }).eq("campaign_id", c.id).in("status", ["pending", "awaiting_approval", "sending"]);
    if (!count) await db.from("campaigns").update({ status: "completed" }).eq("id", c.id);
  }
  return steps?.length ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Dados inválidos" }, 400);
    const body = parsed.data;
    const svc = serviceDb();
    const auth = req.headers.get("Authorization") ?? "";
    if (body.action === "run_due") { const fail = authenticateCronRequest(req); if (fail) return fail; return json({ processed: await runDue(svc) }); }
    const user = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user: u } } = await user.auth.getUser();
    if (!u) return json({ error: "Inicie sessão" }, 401);
    if (!body.campaign_id) return json({ error: "Campanha em falta" }, 400);
    const { data: campaign } = await user.from("campaigns").select("*").eq("id", body.campaign_id).maybeSingle();
    if (!campaign) return json({ error: "Campanha não encontrada" }, 404);
    if (body.action === "pause") { await svc.from("campaigns").update({ status: "paused" }).eq("id", campaign.id); return json({ ok: true }); }
    if (body.action === "approve" && body.step_id) {
      await svc.from("campaign_steps").update({ approved: true, status: "pending" }).eq("id", body.step_id).eq("campaign_id", campaign.id);
      return json({ processed: await runDue(svc, campaign.company_id) });
    }
    if (body.action === "preview") {
      const { data: company } = await svc.from("companies").select("name,slug,currency").eq("id", campaign.company_id).single();
      const products = await loadProducts(svc, campaign);
      const { data: steps } = await svc.from("campaign_steps").select("id,channel,content").eq("campaign_id", campaign.id);
      const origin = req.headers.get("origin") ?? "";
      for (const s of steps ?? []) if (!s.content) await svc.from("campaign_steps").update({ content: buildStepContent(s.channel, company, products, `${origin}/loja/${company?.slug}`) }).eq("id", s.id);
      return json({ ok: true, products: products.length });
    }
    if (body.action === "launch") {
      const { data: steps } = await svc.from("campaign_steps").select("id,delay_minutes,status").eq("campaign_id", campaign.id).order("position");
      if (!steps?.length) return json({ error: "Adicione pelo menos uma etapa" }, 400);
      let at = Math.max(Date.now(), new Date(campaign.starts_at).getTime());
      for (const s of steps) {
        at += s.delay_minutes * 60000;
        if (["pending", "awaiting_connection", "failed", "awaiting_approval"].includes(s.status)) await svc.from("campaign_steps").update({ due_at: new Date(at).toISOString(), status: "pending", processed_at: null }).eq("id", s.id);
      }
      await svc.from("campaigns").update({ status: "running" }).eq("id", campaign.id);
      return json({ processed: await runDue(svc, campaign.company_id) });
    }
    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Não foi possível processar a campanha" }, 500);
  }
});
