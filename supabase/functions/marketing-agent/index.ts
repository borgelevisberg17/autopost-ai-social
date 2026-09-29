import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PLATFORMS = ["instagram", "facebook", "whatsapp"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const productId = String(body.product_id ?? "");
    const platforms: string[] = (Array.isArray(body.platforms) ? body.platforms : []).filter((p: string) => PLATFORMS.includes(p as never));
    if (!productId || platforms.length === 0) return json({ error: "Escolha um produto e pelo menos uma rede" }, 400);

    // Read product through the user's client: RLS guarantees membership.
    const { data: product } = await userClient.from("products").select("*, companies(id,name,currency,description)").eq("id", productId).maybeSingle();
    if (!product) return json({ error: "Produto não encontrado" }, 404);
    const { data: isMember } = await userClient.rpc("is_company_member", { _company: product.company_id, _user: user.id });
    if (!isMember) return json({ error: "Sem permissão" }, 403);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const log = (rows: Record<string, unknown>[]) => admin.from("agent_actions").insert(rows.map((r) => ({
      company_id: product.company_id, agent: "marketing", product_id: product.id, created_by: user.id, ...r,
    })));

    // Rule checks before the AI is allowed to create content.
    const reasons: string[] = [];
    if (!product.active) reasons.push("Produto inativo");
    if (product.stock <= 0) reasons.push("Sem stock");
    if (!(Number(product.price) > 0)) reasons.push("Preço inválido");
    if (product.promo_price != null && Number(product.promo_price) >= Number(product.price)) reasons.push("Promoção maior ou igual ao preço");
    if (reasons.length) {
      await log(platforms.map((p) => ({ action: "CREATE_POST", platform: p, status: "BLOCKED", reason: reasons.join("; ") })));
      return json({ blocked: true, reasons });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "IA não configurada" }, 500);
    const c = product.companies;
    const facts = {
      loja: c?.name, sobre: c?.description, moeda: c?.currency,
      produto: product.name, descricao: product.description, categoria: product.category,
      preco: Number(product.price), preco_promocional: product.promo_price != null ? Number(product.promo_price) : null,
      stock: product.stock,
    };
    const system = `És o agente de marketing de uma loja. Usa APENAS os dados fornecidos; nunca inventes preços, stock, tamanhos ou características. Escreve em português. Cria um texto diferente e adaptado a cada rede: Instagram (visual, emojis, hashtags, até 150 palavras), Facebook (mais descritivo, até 120 palavras), WhatsApp (curto, direto, convite a responder para encomendar, sem hashtags). Mostra preços com a moeda indicada. Responde só com JSON: {"instagram": "...", "facebook": "...", "whatsapp": "..."} contendo apenas as redes pedidas.`;
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: system,
        input: `Redes pedidas: ${platforms.join(", ")}\nDados: ${JSON.stringify(facts)}`,
      }),
    });
    if (!resp.ok || !resp.body) {
      const status = resp.status;
      console.error("AI error", status, await resp.text());
      const msg = status === 429 ? "Muitos pedidos, tente daqui a pouco." : status === 402 ? "Créditos de IA esgotados." : status === 403 ? "Acesso à IA bloqueado." : "Falha na IA";
      await log(platforms.map((p) => ({ action: "CREATE_POST", platform: p, status: "FAILED", reason: msg })));
      return json({ error: msg }, [402, 403, 429].includes(status) ? status : 500);
    }
    // Consume the SSE stream and collect the output text.
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
        } catch { /* ignore partial */ }
      }
    }
    const match = text.match(/\{[\s\S]*\}/);
    let posts: Record<string, string> = {};
    try { posts = JSON.parse(match?.[0] ?? "{}"); } catch { /* handled below */ }
    const rows = platforms.map((p) => posts[p]
      ? { action: "CREATE_POST", platform: p, status: "DRAFT", content: String(posts[p]).slice(0, 4000) }
      : { action: "CREATE_POST", platform: p, status: "FAILED", reason: "Resposta da IA inválida" });
    await log(rows);
    return json({ posts });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
