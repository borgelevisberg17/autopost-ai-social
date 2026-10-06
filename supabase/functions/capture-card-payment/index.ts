import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { order_id, provider, token } = await req.json().catch(() => ({}));
    if (!UUID.test(String(order_id ?? ""))) return json({ error: "Pedido inválido" }, 400);
    if (!["stripe", "paypal"].includes(provider)) return json({ error: "Método inválido" }, 400);
    if (typeof token !== "string" || token.length < 6 || token.length > 200) return json({ error: "Sessão inválida" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: o } = await admin.from("orders").select("id,company_id,total,customer_name,payment_status").eq("id", order_id).maybeSingle();
    if (!o) return json({ error: "Pedido não encontrado" }, 404);
    if (o.payment_status === "paid") return json({ ok: true, already: true });

    let paid = false;
    if (provider === "stripe") {
      const key = Deno.env.get("STRIPE_SECRET_KEY");
      if (!key) return json({ error: "Pagamento com cartão não configurado" }, 503);
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(token)}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const d = await r.json();
      if (!r.ok) { console.error(d); return json({ error: "Não foi possível verificar o pagamento" }, 502); }
      paid = d.payment_status === "paid" && d.metadata?.order_id === order_id;
    } else {
      const id = Deno.env.get("PAYPAL_CLIENT_ID");
      const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
      if (!id || !secret) return json({ error: "PayPal não configurado" }, 503);
      const base = Deno.env.get("PAYPAL_ENV") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
      const t = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      });
      if (!t.ok) { console.error(await t.text()); return json({ error: "Não foi possível verificar o pagamento" }, 502); }
      const { access_token } = await t.json();
      const r = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      });
      const d = await r.json();
      if (!r.ok && d?.name !== "ORDER_ALREADY_CAPTURED") { console.error(d); return json({ error: "O PayPal não confirmou o pagamento" }, 502); }
      const unit = d?.purchase_units?.[0];
      paid = (d.status === "COMPLETED" || d?.name === "ORDER_ALREADY_CAPTURED") && unit?.reference_id === order_id;
    }

    if (!paid) return json({ error: "O pagamento ainda não foi concluído." }, 402);

    await admin.from("orders").update({
      payment_status: "paid", payment_method: provider,
      payment_reference: token, payment_submitted_at: new Date().toISOString(),
    }).eq("id", order_id).neq("payment_status", "paid");
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
