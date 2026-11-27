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

const VALID_SECTIONS = [
  "hero",
  "categories",
  "products",
  "banner",
  "testimonials",
  "text",
  "newsletter",
  "faq",
];

const CURATED_MEDIA: Record<string, string> = {
  minimal_retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
  luxury_interior: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80",
  warm_living: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80",
  architecture_stone: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80",
  fashion_atelier: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80",
  streetwear_sneakers: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1400&q=80",
  artisan_craft: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1400&q=80",
  tech_gadgets: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80",
  shopping_promo: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80",
  desk_workspace: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1400&q=80",
  organic_market: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80",
  botanical_beauty: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80",
};

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
    const selectedSection = body.selected_section ? String(body.selected_section) : null;
    const currentTheme = body.current_theme ?? {};

    if (!companyId || !prompt) {
      return json({ error: "Indique a empresa e o que pretende criar ou ajustar." }, 400);
    }

    const { data: isMember } = await userClient.rpc("is_company_member", {
      _company: companyId,
      _user: user.id,
    });
    if (!isMember) return json({ error: "Sem permissão" }, 403);

    const [{ data: company }, { data: products }] = await Promise.all([
      userClient
        .from("companies")
        .select("id, name, slug, currency, description")
        .eq("id", companyId)
        .maybeSingle(),
      userClient
        .from("products")
        .select("name, category, price, promo_price, images")
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

    const productImageUrls = Array.from(
      new Set(
        (products ?? [])
          .flatMap((p) => (Array.isArray(p.images) ? p.images : []))
          .filter((u): u is string => typeof u === "string" && u.startsWith("https://"))
      )
    ).slice(0, 8);

    const catalogContext = {
      loja: company.name,
      descricao: company.description,
      moeda: company.currency,
      secção_selecionada: selectedSection,
      categorias: [...new Set((products ?? []).map((p) => p.category).filter(Boolean))],
      produtos_amostra: (products ?? []).map((p) => ({
        nome: p.name,
        categoria: p.category,
        preco: p.price,
      })),
      imagens_produtos_reais: productImageUrls,
      galeria_curada_ids: Object.keys(CURATED_MEDIA),
    };

    const instructions = `És o arquiteto-chefe de e-commerce IA da Vendora (ao nível da Aria do Wix e Shopify Magic).
O teu papel é criar, auditar, reordenar e refinar a loja online em português com base nos dados REAIS da empresa e do catálogo.

Regras estritas:
- Nunca inventes produtos, preços ou URLs externos arbitrários.
- Para imagens (hero.imageUrl ou banner.imageUrl), podes escolher uma chave de "galeria_curada_ids" (ex: "hero_media_id": "luxury_interior") OU um URL exato de "imagens_produtos_reais".
- Podes reordenar secções usando "sections_order" (array com subconjunto ou todas de: ${VALID_SECTIONS.join(", ")}) e mostrar/ocultar usando "sections_visibility" (ex: {"testimonials": true, "text": true}).
- Podes indicar "focus_section" (ex: "hero", "banner", "testimonials", "text", "footer") para focar o editor na secção mais relevante após a alteração.
- Presets válidos: ${VALID_PRESETS.join(", ")}.
- Fontes válidas: ${VALID_FONTS.join(", ")}.
- Radius válidos: "square", "soft", "round".
- Todas as cores devem ser hexadecimais de 6 dígitos (#RRGGBB) com contraste WCAG legível entre "background" e "text".

Responde APENAS com JSON válido:
{
  "summary": "Explicação objetiva em português do que foi criado/otimizado",
  "changed_areas": ["Cores", "Hero", "SEO"],
  "focus_section": "hero",
  "preset": "minimal",
  "colors": { "primary": "#...", "background": "#...", "text": "#...", "muted": "#...", "accent": "#...", "line": "#..." },
  "fonts": "dm-sans",
  "radius": "soft",
  "brand": { "displayName": "...", "tagline": "..." },
  "announcement": { "enabled": true, "text": "..." },
  "hero": { "eyebrow": "...", "title": "...", "subtitle": "...", "cta": "...", "imageUrl": "opcional se for de imagens_produtos_reais" },
  "hero_media_id": "opcional: chave de galeria_curada_ids",
  "banner": { "title": "...", "subtitle": "...", "cta": "...", "imageUrl": "opcional se for de imagens_produtos_reais" },
  "banner_media_id": "opcional: chave de galeria_curada_ids",
  "testimonials": [{ "name": "...", "quote": "..." }],
  "textBlock": { "title": "...", "body": "..." },
  "sections_order": ["hero", "categories", "products"],
  "sections_visibility": { "testimonials": true },
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
        input: `Modo: ${mode}\nPedido: ${prompt}\nContexto: ${JSON.stringify(catalogContext)}\nTema atual: ${JSON.stringify({
          preset: currentTheme?.preset,
          colors: currentTheme?.colors,
          fonts: currentTheme?.fonts,
          radius: currentTheme?.radius,
          sections: currentTheme?.sections,
          hero: { title: currentTheme?.hero?.title, subtitle: currentTheme?.hero?.subtitle },
          seo: currentTheme?.seo,
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
          // ignore partial frames
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

    // Resolve curated media IDs safely
    if (typeof parsed.hero_media_id === "string" && CURATED_MEDIA[parsed.hero_media_id]) {
      parsed.hero = {
        ...((parsed.hero as Record<string, unknown>) ?? {}),
        imageUrl: CURATED_MEDIA[parsed.hero_media_id],
      };
    }
    if (typeof parsed.banner_media_id === "string" && CURATED_MEDIA[parsed.banner_media_id]) {
      parsed.banner = {
        ...((parsed.banner as Record<string, unknown>) ?? {}),
        imageUrl: CURATED_MEDIA[parsed.banner_media_id],
      };
    }

    const summary = String(parsed.summary ?? "Alterações aplicadas ao tema da loja.");
    const changedAreas = Array.isArray(parsed.changed_areas)
      ? parsed.changed_areas.map(String).slice(0, 6)
      : [];
    const focusSection =
      typeof parsed.focus_section === "string" ? parsed.focus_section : null;

    const {
      summary: _s,
      changed_areas: _ca,
      focus_section: _fs,
      hero_media_id: _hm,
      banner_media_id: _bm,
      ...patch
    } = parsed;

    await logAction("APPLIED", `${prompt} -> ${summary}`);
    return json({ summary, changedAreas, focusSection, patch });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
