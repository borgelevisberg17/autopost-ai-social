import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { readCredentials, serviceDb } from "../_shared/credentials.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { order_id, provider, token } = await req.json().catch(() => ({}));
    if (!UUID.test(String(order_id ?? ""))) return json({ error: "Pedido inválido" }, 400);
    if (!["stripe", "paypal"].includes(provider)) return json({ error: "Método inválido" }, 400);
    if (provider === "paypal") return json({ error: "A loja ainda precisa autorizar a sua própria conta PayPal Business." }, 503);
    if (typeof token !== "string" || token.length < 6 || token.length > 200) return json({ error: "Sessão inválida" }, 400);

    const admin = serviceDb();
    const { data: o } = await admin.from("orders").select("id,company_id,total,customer_name,payment_status,status").eq("id", order_id).maybeSingle();
    if (!o) return json({ error: "Pedido não encontrado" }, 404);
    if (o.payment_status === "paid") return json({ ok: true, already: true });

    let paid = false;
    if (provider === "stripe") {
      const key = (await readCredentials(o.company_id, "stripe"))?.secret_key;
      if (!key) return json({ error: "Pagamento com cartão não configurado" }, 503);
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(token)}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const d = await r.json();
      if (!r.ok) { console.error(d); return json({ error: "Não foi possível verificar o pagamento" }, 502); }
      const { data: company } = await admin.from("companies").select("currency").eq("id", o.company_id).single();
      paid = d.payment_status === "paid" && d.metadata?.order_id === order_id && d.metadata?.company_id === o.company_id && d.amount_total === Math.round(Number(o.total) * 100) && d.currency?.toUpperCase() === company?.currency.toUpperCase();
    }

    if (!paid) return json({ error: "O pagamento ainda não foi concluído." }, 402);

    const { data: changed, error: updateError } = await admin.from("orders").update({
      payment_status: "paid", payment_method: provider,
      payment_reference: token, payment_submitted_at: new Date().toISOString(), paid_at: new Date().toISOString(),
      ...(o.status === "pending" ? { status: "confirmed" } : {}),
    }).eq("id", order_id).neq("payment_status", "paid").select("id").maybeSingle();
    if (updateError) return json({ error: "O pagamento foi confirmado, mas o pedido não pôde ser atualizado. Contacte a loja." }, 500);
    if (!changed) return json({ ok: true, already: true });
    await admin.from("order_events").insert({
      company_id: o.company_id, order_id, type: "payment", actor_type: "system",
      description: `Pagamento confirmado via ${provider === "stripe" ? "cartão (Stripe)" : "PayPal"}`,
    });
    await admin.from("notifications").insert({
      company_id: o.company_id, type: "payment", title: "Pagamento recebido",
      message: `${o.customer_name} pagou por ${provider === "stripe" ? "cartão" : "PayPal"}.`, link: "/admin/pedidos",
    });
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro inesperado" }, 500);
  }
});
