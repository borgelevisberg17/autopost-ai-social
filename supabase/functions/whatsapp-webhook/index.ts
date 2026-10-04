// Public receiver for Meta WhatsApp Cloud API webhooks.
import { createClient } from "npm:@supabase/supabase-js@2";
import { salesReply, sendWhatsApp } from "../_shared/sales-brain.ts";

const enc = new TextEncoder();

async function validSignature(raw: string, header: string | null) {
  const secret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!secret || !header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(raw)));
  const expected = Array.from(sig).map((b) => b.toString(16).padStart(2, "0")).join("");
  const got = header.slice(7).toLowerCase();
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// deno-lint-ignore no-explicit-any
async function handleMessage(db: any, account: any, contactName: string | undefined, msg: any) {
  const text: string = msg.type === "text" ? String(msg.text?.body ?? "") :
    msg.type === "button" ? String(msg.button?.text ?? "") :
    msg.type === "interactive" ? String(msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? "") :
    `[${msg.type}]`;
  const from = String(msg.from ?? "").replace(/\D/g, "");
  if (!from) return;
  const now = new Date().toISOString();

  const { data: convo } = await db.from("conversations").upsert({
    company_id: account.company_id, channel: "whatsapp", customer_phone: from,
    customer_name: contactName ?? null, last_inbound_at: now, last_message_at: now,
  }, { onConflict: "company_id,channel,customer_phone" }).select("id,status").single();
  if (!convo) return;

  // Idempotency: Meta retries deliveries — a duplicate external_id is ignored.
  const { error: dup } = await db.from("messages").insert({
    conversation_id: convo.id, company_id: account.company_id, direction: "in",
    sender: "customer", body: text.slice(0, 4000), external_id: msg.id, status: "received",
  });
  if (dup) return;

  if (!account.auto_reply || convo.status !== "open" || msg.type !== "text" || !text.trim()) return;

  const { data: past } = await db.from("messages").select("direction,body")
    .eq("conversation_id", convo.id).order("created_at", { ascending: false }).limit(11);
  const history = (past ?? []).slice(1).reverse()
    .map((m: { direction: string; body: string }) => ({ role: m.direction === "in" ? "client" : "agent", text: m.body }));

  const r = await salesReply(db, account.company_id, text.slice(0, 1000), history);
  if (r.error || !r.reply) {
    await db.from("agent_runs").insert({ company_id: account.company_id, agent_name: "sales", status: "failed",
      trigger: "whatsapp", completed_at: now, summary: r.error, metadata: { pergunta: text, conversa: convo.id } });
    return;
  }
  const sent = await sendWhatsApp(account.phone_number_id, from, r.reply);
  await db.from("messages").insert({
    conversation_id: convo.id, company_id: account.company_id, direction: "out", sender: "agent",
    body: r.reply, external_id: sent.id ?? null, status: sent.ok ? "sent" : "failed", error: sent.error ?? null,
  });
  if (r.handoff) await db.from("conversations").update({ status: "handoff" }).eq("id", convo.id);
  await db.from("agent_runs").insert({
    company_id: account.company_id, agent_name: "sales", status: sent.ok ? "success" : "failed", trigger: "whatsapp",
    completed_at: new Date().toISOString(), summary: r.reply.slice(0, 500),
    metadata: { pergunta: text, resposta: r.reply, conversa: convo.id, passou_equipa: r.handoff, pedido_consultado: r.code ?? null, erro_envio: sent.error ?? null },
  });
  if (r.handoff) {
    await db.from("notifications").insert({ company_id: account.company_id, type: "handoff",
      title: "Cliente pede atendimento", message: `${contactName ?? from} precisa de uma pessoa no WhatsApp.`, link: "/admin/conversas" });
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const ok = url.searchParams.get("hub.mode") === "subscribe" &&
      !!Deno.env.get("WHATSAPP_VERIFY_TOKEN") &&
      url.searchParams.get("hub.verify_token") === Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    return ok ? new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 }) : new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  if (!(await validSignature(raw, req.headers.get("x-hub-signature-256")))) return new Response("Invalid signature", { status: 401 });
  let payload;
  try { payload = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const work = (async () => {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const v = change.value ?? {};
        const pnid = v.metadata?.phone_number_id;
        if (!pnid) continue;
        const { data: account } = await db.from("whatsapp_accounts").select("*").eq("phone_number_id", String(pnid)).maybeSingle();
        if (!account) { console.warn("Unknown phone_number_id", pnid); continue; }
        await db.from("whatsapp_accounts").update({ status: "active", last_event_at: new Date().toISOString() }).eq("id", account.id);
        for (const s of v.statuses ?? []) {
          await db.from("messages").update({ status: String(s.status) }).eq("external_id", String(s.id)).eq("company_id", account.company_id);
        }
        const names = new Map((v.contacts ?? []).map((c: { wa_id: string; profile?: { name?: string } }) => [c.wa_id, c.profile?.name]));
        for (const m of v.messages ?? []) {
          try { await handleMessage(db, account, names.get(m.from) as string | undefined, m); } catch (e) { console.error("handle", e); }
        }
      }
    }
  })();
  // Answer Meta fast; keep processing in the background.
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(work); else await work;
  return new Response("OK", { status: 200 });
});
