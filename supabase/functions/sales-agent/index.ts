import { createClient } from "npm:@supabase/supabase-js@2";
import { salesReply } from "../_shared/sales-brain.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await db.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);
    const body = await req.json().catch(() => ({}));
    const companyId = String(body.company_id ?? "");
    const message = String(body.message ?? "").trim().slice(0, 1000);
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    if (!companyId || !message) return json({ error: "Mensagem em falta" }, 400);
    const { data: isMember } = await db.rpc("is_company_member", { _company: companyId, _user: user.id });
    if (!isMember) return json({ error: "Sem permissão" }, 403);

    const r = await salesReply(db, companyId, message, history);
    await db.from("agent_runs").insert({
      company_id: companyId, agent_name: "sales", status: r.error ? "failed" : "success", trigger: "whatsapp_test",
      completed_at: new Date().toISOString(), summary: (r.reply ?? r.error ?? "").slice(0, 500),
      metadata: { pergunta: message, resposta: r.reply ?? null, pedido_consultado: r.code ?? null },
    });
    if (r.error) return json({ error: r.error }, r.status);
    return json({ reply: r.reply, handoff: r.handoff });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
