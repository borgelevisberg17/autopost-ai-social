import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const VALID_PRESETS = [
  "minimal",
  "majestic",
  "nook",
  "carrara",
  "boutique",
  "street",
  "manara",
  "tech",
  "hiper",
  "memorando",
  "mercado",
  "evervale",
];

const VALID_FONTS = [
  "dm-sans",
  "fraunces-work",
  "playfair-lato",
  "space-grotesk",
  "bebas-barlow",
  "cormorant-karla",
  "outfit",
  "syne-jakarta",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const companyId = String(body.company_id ?? "");
    const prompt = String(body.prompt ?? "").trim();
    const mode = body.mode === "generate" ? "generate" : "refine";
    const currentTheme = body.current_theme ?? {};

    if (!companyId || !prompt) {
      return json({ error: "Indique a empresa e o que pretende criar ou ajustar." }, 400);
    }

    const { data: isMember } = await userClient.rpc("is_company_member", {
      _company: companyId,
      _user: user.id,
    });
    if (!isMember) return json({ error: "Sem permissão" }, 403);

    // Read company & real catalog through caller session (RLS)
    const [{ data: company }, { data: products }] = await Promise.all([
      userClient
        .from("companies")
        .select("id, name, slug, currency, description")
        .eq("id", companyId)
        .maybeSingle(),
      userClient
        .from("products")
        .select("name, category, price, promo_price")
        .eq("company_id", companyId)
        .eq("active", true)
        .limit(12),
    ]);

    if (!company) return json({ error: "Empresa não encontrada" }, 404);

    const { error: quotaError } = await userClient.rpc("consume_company_ai", {
      _company: companyId,
      _feature: "marketing",
    });
    if (quotaError) return json({ error: quotaError.message }, 403);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const logAction = (status: string, content?: string, reason?: string) =>
      admin.from("agent_actions").insert({
        company_id: companyId,
        agent: "store_builder",
        action: mode === "generate" ? "GENERATE_THEME" : "REFINE_THEME",
        status,
        content: content?.slice(0, 4000) ?? null,
        reason: reason ?? null,
        created_by: user.id,
      });

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      await logAction("FAILED", prompt, "LOVABLE_API_KEY não configurada");
      return json({ error: "IA não configurada" }, 500);
    }

    const catalogContext = {
      loja: company.name,
      descricao: company.description,
      moeda: company.currency,
      categorias: [...new Set((products ?? []).map((p) => p.category).filter(Boolean))],
      produtos_amostra: (products ?? []).map((p) => ({
        nome: p.name,
        categoria: p.category,
        preco: p.price,
      })),
    };

    const instructions = `És o arquiteto de e-commerce IA da Vendora (inspirado na Aria do Wix e nos temas da Shopify).
O teu papel é gerar ou refinar a configuração visual e textual de uma loja online em português com base nos dados REAIS da empresa e do catálogo.
Regras estritas:
- Nunca inventes produtos, preços ou URLs de imagens. NÃO incluas imageUrl nem logoUrl no JSON (mantém as imagens existentes ou do preset).
- Usa apenas presets válidos: ${VALID_PRESETS.join(", ")}.
- Usa apenas fontes válidas: ${VALID_FONTS.join(", ")}.
- Usa apenas radius válidos: "square", "soft", "round".
- Todas as cores devem ser hexadecimais válidas de 6 dígitos (#RRGGBB) com bom contraste entre "background" e "text".
- Responde APENAS com um objeto JSON válido com esta estrutura (no modo "refine", inclui apenas as chaves que fazem sentido alterar para o pedido; no modo "generate", preenche todas):
{
  "summary": "Explicação curta e clara em português do que foi criado ou ajustado",
  "preset": "minimal",
  "colors": { "primary": "#...", "background": "#...", "text": "#...", "muted": "#...", "accent": "#...", "line": "#..." },
  "fonts": "dm-sans",
  "radius": "soft",
  "announcement": { "enabled": true, "text": "..." },
  "hero": { "eyebrow": "...", "title": "...", "subtitle": "...", "cta": "..." },
  "banner": { "title": "...", "subtitle": "...", "cta": "..." },
  "testimonials": [{ "name": "...", "quote": "..." }],
  "textBlock": { "title": "...", "body": "..." },
  "footer": { "about": "..." },
  "seo": { "title": "...", "description": "..." }
}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions,
        input: `Modo: ${mode}\nPedido do comerciante: ${prompt}\nContexto real da loja: ${JSON.stringify(catalogContext)}\nTema atual (resumo): ${JSON.stringify({
          preset: currentTheme?.preset,
          colors: currentTheme?.colors,
          fonts: currentTheme?.fonts,
          radius: currentTheme?.radius,
          hero: { title: currentTheme?.hero?.title, subtitle: currentTheme?.hero?.subtitle },
        })}`,
      }),
    });

    if (!resp.ok || !resp.body) {
      const status = resp.status;
      const msg =
        status === 429
          ? "Muitos pedidos, tente daqui a pouco."
          : status === 402
          ? "Créditos de IA esgotados."
          : status === 403
          ? "Acesso à IA bloqueado."
          : "Falha na geração com IA";
      await logAction("FAILED", prompt, msg);
      return json({ error: msg }, [402, 403, 429].includes(status) ? status : 500);
    }

    let text = "";
    const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const ev = JSON.parse(data);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        } catch {
          // ignore partial JSON frames
        }
      }
    }

    const match = text.match(/\{[\s\S]*\}/);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(match?.[0] ?? "{}");
    } catch {
      await logAction("FAILED", prompt, "JSON inválido da IA");
      return json({ error: "A IA devolveu uma resposta inválida. Tente novamente." }, 500);
    }

    const summary = String(
      parsed.summary ?? "Alterações aplicadas ao tema da loja."
    );
    const { summary: _s, ...patch } = parsed;

    await logAction("APPLIED", `${prompt} -> ${summary}`);
    return json({ summary, patch });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
