import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { readCredentials, serviceDb } from "../_shared/credentials.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { order_id, provider, return_url } = await req.json().catch(() => ({}));
    if (!UUID.test(String(order_id ?? ""))) return json({ error: "Pedido inválido" }, 400);
    if (!["stripe", "paypal"].includes(provider)) return json({ error: "Método inválido" }, 400);
    if (provider === "paypal") return json({ error: "A loja ainda precisa autorizar a sua própria conta PayPal Business." }, 503);
    if (typeof return_url !== "string" || !/^https?:\/\//.test(return_url)) return json({ error: "Endereço de retorno inválido" }, 400);
    const redirect = new URL(return_url);
    if (redirect.origin !== req.headers.get("Origin") || redirect.search || redirect.hash) return json({ error: "Endereço de retorno inválido" }, 400);

    const admin = serviceDb();
    const { data: o } = await admin.from("orders").select("id,company_id,total,customer_name,payment_status").eq("id", order_id).maybeSingle();
    if (!o) return json({ error: "Pedido não encontrado" }, 404);
    if (o.payment_status === "paid") return json({ error: "Este pedido já está pago" }, 409);
    const { data: c } = await admin.from("companies").select("currency,name,slug,platform_status").eq("id", o.company_id).single();
    if (c?.platform_status !== "active") return json({ error: "Loja indisponível" }, 403);
    if (redirect.pathname !== `/loja/${c.slug}/pedido/${o.id}`) return json({ error: "Endereço do pedido inválido" }, 400);
    const currency = String(c?.currency ?? "AOA").toUpperCase();

    if (provider === "stripe") {
      const key = (await readCredentials(o.company_id, "stripe"))?.secret_key;
      if (!key) return json({ error: "A loja ainda não configurou o pagamento com cartão." }, 503);
      const body = new URLSearchParams({
        mode: "payment",
        success_url: `${return_url}?payment=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: return_url,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": String(Math.round(Number(o.total) * 100)),
        "line_items[0][price_data][product_data][name]": `Pedido ${String(o.id).slice(0, 8).toUpperCase()} — ${c?.name ?? "Loja"}`,
        "metadata[order_id]": o.id,
        "metadata[company_id]": o.company_id,
      });
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `order-${o.id}-${Math.floor(Date.now() / 1800000)}` },
        body,
      });
      const d = await r.json();
      if (!r.ok) { console.error(d); return json({ error: "O Stripe recusou o pagamento. Tente outro método." }, 502); }
      return json({ url: d.url });
    }

    return json({ error: "Método indisponível" }, 503);
  } catch (e) {
    console.error(e);
    return json({ error: "Erro inesperado" }, 500);
  }
});
