import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Staff: get a short-lived link to view a proof
    if ((req.headers.get("content-type") ?? "").includes("application/json")) {
      const { order_id } = await req.json().catch(() => ({}));
      if (!UUID.test(String(order_id ?? ""))) return json({ error: "Pedido inválido" }, 400);
      const userDb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      });
      const { data: { user } } = await userDb.auth.getUser();
      if (!user) return json({ error: "Não autenticado" }, 401);
      const { data: o } = await admin.from("orders").select("company_id,payment_proof_path").eq("id", order_id).maybeSingle();
      if (!o) return json({ error: "Pedido não encontrado" }, 404);
      const { data: ok } = await userDb.rpc("is_company_member", { _company: o.company_id, _user: user.id });
      if (!ok) return json({ error: "Sem permissão" }, 403);
      if (!o.payment_proof_path) return json({ error: "Sem comprovativo" }, 404);
      const { data: s, error } = await admin.storage.from("payment-proofs").createSignedUrl(o.payment_proof_path, 300);
      if (error) return json({ error: "Não foi possível abrir" }, 500);
      return json({ url: s.signedUrl });
    }

    // Customer: submit proof
    const form = await req.formData();
    const orderId = String(form.get("order_id") ?? "");
    const method = String(form.get("method") ?? "");
    const reference = String(form.get("reference") ?? "").trim().slice(0, 120);
    const file = form.get("file");
    if (!UUID.test(orderId)) return json({ error: "Pedido inválido" }, 400);
    if (!["iban", "express"].includes(method)) return json({ error: "Método inválido" }, 400);
    if (!(file instanceof File)) return json({ error: "Anexe o comprovativo" }, 400);
    const ext = TYPES[file.type];
    if (!ext) return json({ error: "Use imagem (JPG, PNG, WEBP) ou PDF" }, 400);
    if (file.size > 5 * 1024 * 1024) return json({ error: "Ficheiro maior que 5 MB" }, 400);

    const { data: o } = await admin.from("orders").select("id,company_id,payment_status,customer_name,total").eq("id", orderId).maybeSingle();
    if (!o) return json({ error: "Pedido não encontrado" }, 404);
    if (o.payment_status === "paid") return json({ error: "Este pedido já está pago" }, 409);

    const path = `${o.company_id}/${orderId}/${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
    if (upErr) { console.error(upErr); return json({ error: "Falha ao enviar o ficheiro" }, 500); }

    await admin.from("orders").update({
      payment_method: method, payment_reference: reference || null, payment_proof_path: path,
      payment_submitted_at: new Date().toISOString(), payment_status: "pending",
    }).eq("id", orderId);
    await admin.from("order_events").insert({
      company_id: o.company_id, order_id: orderId, type: "payment_proof", actor_type: "customer",
      description: `Comprovativo enviado (${method === "iban" ? "transferência IBAN" : "Multicaixa Express"})`,
    });
    await admin.from("notifications").insert({
      company_id: o.company_id, type: "payment", title: "Comprovativo recebido",
      message: `${o.customer_name} enviou o comprovativo de pagamento.`, link: "/admin/pagamentos",
    });
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro inesperado" }, 500);
  }
});
