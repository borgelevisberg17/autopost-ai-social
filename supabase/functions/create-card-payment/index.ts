import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function paypalToken(base: string, id: string, secret: string) {
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`PayPal auth [${r.status}]: ${await r.text()}`);
  return (await r.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { order_id, provider, return_url } = await req.json().catch(() => ({}));
    if (!UUID.test(String(order_id ?? ""))) return json({ error: "Pedido inválido" }, 400);
    if (!["stripe", "paypal"].includes(provider)) return json({ error: "Método inválido" }, 400);
    if (typeof return_url !== "string" || !/^https?:\/\//.test(return_url)) return json({ error: "Endereço de retorno inválido" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: o } = await admin.from("orders").select("id,company_id,total,customer_name,payment_status").eq("id", order_id).maybeSingle();
    if (!o) return json({ error: "Pedido não encontrado" }, 404);
    if (o.payment_status === "paid") return json({ error: "Este pedido já está pago" }, 409);
    const { data: c } = await admin.from("companies").select("currency,name").eq("id", o.company_id).single();
    const currency = String(c?.currency ?? "AOA").toUpperCase();

    if (provider === "stripe") {
      const key = Deno.env.get("STRIPE_SECRET_KEY");
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
      });
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const d = await r.json();
      if (!r.ok) { console.error(d); return json({ error: "O Stripe recusou o pagamento. Tente outro método." }, 502); }
      return json({ url: d.url });
    }

    // PayPal
    const id = Deno.env.get("PAYPAL_CLIENT_ID");
    const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    if (!id || !secret) return json({ error: "A loja ainda não configurou o PayPal." }, 503);
    const base = Deno.env.get("PAYPAL_ENV") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    const token = await paypalToken(base, id, secret);
    const r = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: o.id,
          description: `Pedido ${String(o.id).slice(0, 8).toUpperCase()} — ${c?.name ?? "Loja"}`,
          amount: { currency_code: currency, value: Number(o.total).toFixed(2) },
        }],
        application_context: { return_url: `${return_url}?payment=paypal`, cancel_url: return_url },
      }),
    });
    const d = await r.json();
    if (!r.ok) { console.error(d); return json({ error: "O PayPal recusou o pagamento. Tente outro método." }, 502); }
    const url = (d.links ?? []).find((l: { rel: string }) => l.rel === "approve")?.href;
    if (!url) return json({ error: "Resposta inesperada do PayPal" }, 502);
    return json({ url });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro inesperado" }, 500);
  }
});
