// Staff manual reply in a WhatsApp conversation.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsApp } from "../_shared/sales-brain.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const userDb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userDb.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);
    const body = await req.json().catch(() => ({}));
    const conversationId = String(body.conversation_id ?? "");
    const text = String(body.text ?? "").trim();
    if (!conversationId || !text || text.length > 4000) return json({ error: "Mensagem inválida" }, 400);

    // RLS: only members can read the conversation.
    const { data: convo } = await userDb.from("conversations").select("id,company_id,customer_phone,last_inbound_at").eq("id", conversationId).maybeSingle();
    if (!convo) return json({ error: "Conversa não encontrada" }, 404);
    if (!convo.last_inbound_at || Date.now() - new Date(convo.last_inbound_at).getTime() > 24 * 3600e3) {
      return json({ error: "Passaram mais de 24h desde a última mensagem do cliente. A Meta só permite responder com um modelo aprovado." }, 409);
    }
    const { data: account } = await userDb.from("whatsapp_accounts").select("phone_number_id").eq("company_id", convo.company_id).limit(1).maybeSingle();
    if (!account) return json({ error: "Número WhatsApp não ligado" }, 400);

    const sent = await sendWhatsApp(account.phone_number_id, convo.customer_phone, text);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("messages").insert({
      conversation_id: convo.id, company_id: convo.company_id, direction: "out", sender: "staff",
      body: text, external_id: sent.id ?? null, status: sent.ok ? "sent" : "failed", error: sent.error ?? null,
    });
    await admin.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convo.id);
    if (!sent.ok) return json({ error: sent.error }, 502);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
