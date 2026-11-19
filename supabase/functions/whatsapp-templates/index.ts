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

const Component = z.object({
  type: z.enum(["HEADER", "BODY", "FOOTER", "BUTTONS"]),
}).passthrough();
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list"), company_id: z.string().uuid() }),
  z.object({
    action: z.literal("create"),
    company_id: z.string().uuid(),
    name: z.string().regex(/^[a-z0-9_]{1,512}$/),
    language: z.string().regex(/^[a-z]{2,3}_[A-Z]{2}$/),
    category: z.enum(["UTILITY", "MARKETING", "AUTHENTICATION"]),
    components: z.array(Component).min(1).max(4),
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
      const bodyComponent = input.components.find(c => c.type === "BODY");
      if (!bodyComponent || typeof bodyComponent.text !== "string" || !bodyComponent.text.trim()) {
        return json({ error: "O modelo precisa de um componente BODY com texto." }, 400);
      }
      const bodyText = bodyComponent.text as string;
      const variables = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)].map(m => Number(m[1]));
      if (variables.length) {
        const expected = Array.from({ length: variables.length }, (_, i) => i + 1);
        if (JSON.stringify([...new Set(variables)].sort((a,b)=>a-b)) !== JSON.stringify(expected)) {
          return json({ error: "As variáveis devem ser sequenciais: {{1}}, {{2}}, {{3}}..." }, 400);
        }
        const examples = (bodyComponent.example as { body_text?: string[][] } | undefined)?.body_text?.[0];
        if (!examples || examples.length !== variables.length || examples.some(v => !v?.trim())) {
          return json({ error: "Indica um exemplo para cada variável do corpo." }, 400);
        }
      }
      const header = input.components.find(c => c.type === "HEADER");
      if (header && ["IMAGE", "VIDEO", "DOCUMENT"].includes(String(header.format))) {
        const handle = (header.example as { header_handle?: string[] } | undefined)?.header_handle?.[0];
        if (!handle) return json({ error: "O cabeçalho multimédia precisa de um media handle válido da Meta." }, 400);
      }
      response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          language: input.language,
          category: input.category,
          allow_category_change: input.allow_category_change,
          components: input.components,
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
      const metaError = result?.error ?? {};
      const message = metaError.message ?? "A Meta recusou a operação de gestão de modelos";
      return json({ error: message, meta_code: metaError.code ?? null, meta_subcode: metaError.error_subcode ?? null, meta_type: metaError.type ?? null, meta_user_title: metaError.error_user_title ?? null, meta_user_message: metaError.error_user_msg ?? null }, response.status >= 400 && response.status < 500 ? 400 : 502);
    }
    return json({ ok: true, ...result });
  } catch (error) {
    console.error("whatsapp-templates:", error);
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
