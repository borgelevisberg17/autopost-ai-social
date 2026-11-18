import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { companyWhatsAppToken, serviceDb } from "../_shared/credentials.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const GRAPH_VERSION = "v25.0";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list"), company_id: z.string().uuid() }),
  z.object({
    action: z.literal("create"),
    company_id: z.string().uuid(),
    name: z.string().regex(/^[a-z0-9_]{1,512}$/),
    language: z.string().regex(/^[a-z]{2,3}_[A-Z]{2}$/),
    category: z.enum(["UTILITY", "MARKETING", "AUTHENTICATION"]),
    body: z.string().min(1).max(1024),
    body_examples: z.array(z.string().min(1).max(256)).max(10).optional(),
    allow_category_change: z.boolean().default(true),
  }),
  z.object({ action: z.literal("delete"), company_id: z.string().uuid(), name: z.string().regex(/^[a-z0-9_]{1,512}$/) }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Dados inválidos", details: parsed.error.flatten() }, 400);
    const input = parsed.data;
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) return json({ error: "Serviço indisponível" }, 503);

    const userDb = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userDb.auth.getUser();
    if (!user) return json({ error: "Inicie sessão" }, 401);

    const { data: allowed, error: permissionError } = await userDb.rpc("is_company_admin", {
      _company: input.company_id,
      _user: user.id,
    });
    if (permissionError || !allowed) return json({ error: "Sem permissão para gerir o WhatsApp desta loja" }, 403);

    const { data: account, error: accountError } = await serviceDb()
      .from("whatsapp_accounts")
      .select("waba_id,phone_number_id")
      .eq("company_id", input.company_id)
      .maybeSingle();
    if (accountError) return json({ error: "Não foi possível consultar a conta WhatsApp" }, 500);
    if (!account?.waba_id) return json({ error: "Esta loja ainda não tem uma WhatsApp Business Account ligada" }, 409);

    const token = await companyWhatsAppToken(input.company_id);
    if (!token) return json({ error: "Credenciais WhatsApp não configuradas" }, 503);

    const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(account.waba_id)}/message_templates`;
    let response: Response;
    if (input.action === "list") {
      response = await fetch(`${endpoint}?limit=100&fields=id,name,status,category,language,components,quality_score`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else if (input.action === "create") {
      const variableCount = [...input.body.matchAll(/\\{\\{\\d+\\}\\}/g)].length;
      if (variableCount > 0 && (!input.body_examples || input.body_examples.length !== variableCount)) {
        return json({ error: `Indica ${variableCount} exemplo(s), um para cada variável do corpo.` }, 400);
      }
      response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          language: input.language,
          category: input.category,
          allow_category_change: input.allow_category_change,
          components: [{ type: "BODY", text: input.body, ...(variableCount ? { example: { body_text: [input.body_examples] } } : {}) }],
        }),
      });
    } else {
      const params = new URLSearchParams({ name: input.name });
      response = await fetch(`${endpoint}?${params.toString()}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = result?.error?.message ?? "A Meta recusou a operação de gestão de modelos";
      const code = result?.error?.code;
      return json({ error: message, meta_code: code ?? null }, response.status >= 400 && response.status < 500 ? 400 : 502);
    }
    return json({ ok: true, ...result });
  } catch (error) {
    console.error("whatsapp-templates:", error);
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
