import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { metaCredentials } from "../_shared/credentials.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const token = (await metaCredentials()).access_token;
    if (!url || !anonKey) return json({ error: "Serviço indisponível" }, 500);
    if (!token) return json({ error: "Token da Meta ainda não configurado" }, 503);

    const userDb = createClient(url, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userDb.auth.getUser();
    if (!user) return json({ error: "Inicie sessão para validar o número." }, 401);

    const body = await req.json().catch(() => null);
    const companyId = typeof body?.company_id === "string" ? body.company_id : "";
    const phoneNumber = typeof body?.phone_number === "string" ? body.phone_number.trim() : "";
    const phoneNumberId = typeof body?.phone_number_id === "string" ? body.phone_number_id.trim() : "";
    const wabaId = typeof body?.waba_id === "string" ? body.waba_id.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companyId)) {
      return json({ error: "Empresa inválida." }, 400);
    }
    if (!/^\+?[\d\s().-]{7,25}$/.test(phoneNumber)) return json({ error: "Introduza um número de telefone válido." }, 400);
    if (!/^\d{5,30}$/.test(phoneNumberId)) return json({ error: "ID do número inválido." }, 400);
    if (!/^\d{5,30}$/.test(wabaId)) return json({ error: "ID da conta Business obrigatório." }, 400);

    const { data: isAdmin, error: permissionError } = await userDb.rpc("is_company_admin", {
      _company: companyId,
      _user: user.id,
    });
    if (permissionError || !isAdmin) return json({ error: "Só administradores da loja podem ligar o número." }, 403);
    const { data: entitlement, error: accessError } = await userDb.rpc("company_entitlement", { _company: companyId });
    if (accessError || !entitlement?.features?.includes("whatsapp")) return json({ error: "O plano não permite WhatsApp" }, 403);

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const metaMessage = typeof result?.error?.message === "string" ? result.error.message : "A Meta recusou este número.";
      return json({ error: `Não foi possível validar o número na Meta: ${metaMessage.slice(0, 240)}` }, 502);
    }

    const submittedDigits = phoneNumber.replace(/\D/g, "");
    const verifiedDigits = String(result.display_phone_number ?? "").replace(/\D/g, "");
    if (!verifiedDigits || submittedDigits !== verifiedDigits) return json({ error: "O número informado não corresponde ao número verificado pela Meta. Confirme o número e o Phone Number ID." }, 400);

    const ownership = await fetch(`https://graph.facebook.com/v25.0/${encodeURIComponent(wabaId)}/phone_numbers?fields=id&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
    const owned = await ownership.json().catch(() => null);
    if (!ownership.ok || !owned?.data?.some((number: { id: string }) => number.id === phoneNumberId)) return json({ error: "O número não foi confirmado nesta conta Business." }, 400);
    const { data: existing } = await userDb.from("whatsapp_accounts").select("id").eq("company_id", companyId).maybeSingle();
    const row = { company_id: companyId, phone_number_id: phoneNumberId, waba_id: wabaId, display_phone: result.display_phone_number ?? null };
    const { error: saveError } = existing ? await userDb.from("whatsapp_accounts").update(row).eq("id", existing.id) : await userDb.from("whatsapp_accounts").insert(row);
    if (saveError) return json({ error: "Não foi possível guardar o número; pode já estar ligado a outra loja." }, 409);
    // Save routing before subscribing: events arriving immediately must find their tenant.
    const subscribe = await fetch(`https://graph.facebook.com/v25.0/${encodeURIComponent(wabaId)}/subscribed_apps`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" });
    const subscribed = await subscribe.json().catch(() => null);
    if (!subscribe.ok || subscribed?.success !== true) return json({ error: "Número guardado, mas a Meta recusou a subscrição da conta Business. Verifique permissões e tente novamente." }, 502);

    return json({
      ok: true,
      subscribed: true,
      display_phone: typeof result.display_phone_number === "string" ? result.display_phone_number : null,
      verified_name: typeof result.verified_name === "string" ? result.verified_name : null,
      quality_rating: typeof result.quality_rating === "string" ? result.quality_rating : null,
    });
  } catch (error) {
    console.error("WhatsApp number validation failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Não foi possível validar o número agora." }, 500);
  }
});