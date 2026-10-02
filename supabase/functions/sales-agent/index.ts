import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await db.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const companyId = String(body.company_id ?? "");
    const message = String(body.message ?? "").trim().slice(0, 1000);
    const history = (Array.isArray(body.history) ? body.history : []).slice(-10)
      .map((m: { role?: string; text?: string }) => `${m.role === "agent" ? "Assistente" : "Cliente"}: ${String(m.text ?? "").slice(0, 500)}`);
    if (!companyId || !message) return json({ error: "Mensagem em falta" }, 400);
    const { data: isMember } = await db.rpc("is_company_member", { _company: companyId, _user: user.id });
    if (!isMember) return json({ error: "Sem permissão" }, 403);

    const [{ data: company }, { data: products }] = await Promise.all([
      db.from("companies").select("name,slug,currency,whatsapp,description").eq("id", companyId).single(),
      db.from("products").select("id,name,description,category,price,promo_price,stock")
        .eq("company_id", companyId).eq("active", true).limit(150),
    ]);

    // Order lookup only with the full order code (UUID) — never by name.
    let order: Record<string, unknown> | null = null;
    const code = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
    if (code) {
      const { data } = await db.from("orders")
        .select("status,payment_status,fulfillment_status,total,created_at,order_items(product_name,quantity)")
        .eq("company_id", companyId).eq("id", code).maybeSingle();
      order = data ? { codigo: code, ...data } : { codigo: code, encontrado: false };
    }

    const facts = {
      loja: company?.name, moeda: company?.currency, sobre: company?.description,
      link_loja: company?.slug ? `/loja/${company.slug}` : null,
      produtos: (products ?? []).map((p) => ({
        nome: p.name, categoria: p.category, descricao: p.description?.slice(0, 200),
        preco: Number(p.price), promo: p.promo_price != null ? Number(p.promo_price) : null,
        disponivel: p.stock > 0, stock: p.stock,
      })),
      pedido: order,
    };

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "IA não configurada" }, 500);
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: `És o assistente de atendimento no WhatsApp da loja "${company?.name}". Responde em português, curto e simpático (máx. 80 palavras), sem markdown. Usa APENAS os dados fornecidos: nunca inventes produtos, preços, stock, prazos ou estados de pedido. Se o produto não estiver na lista, diz que não o tens. Para estado de pedido, só usa o campo "pedido"; se não houver, pede o código completo do pedido. Se não souberes ou o cliente pedir uma pessoa, diz que vais passar a conversa à equipa e termina a resposta com [HUMANO]. Preços na moeda indicada.`,
        input: `Dados: ${JSON.stringify(facts)}\n\nConversa:\n${history.join("\n")}\nCliente: ${message}`,
      }),
    });
    const log = (status: string, content?: string, reason?: string) =>
      db.from("agent_runs").insert({
        company_id: companyId, agent_name: "sales", status, trigger: "whatsapp_test",
        completed_at: new Date().toISOString(), summary: (content ?? reason ?? "").slice(0, 500),
        metadata: { pergunta: message, resposta: content ?? null, pedido_consultado: code ?? null },
      });
    if (!resp.ok || !resp.body) {
      const s = resp.status;
      console.error("AI error", s, await resp.text());
      const msg = s === 429 ? "Muitos pedidos, tente daqui a pouco." : s === 402 ? "Créditos de IA esgotados." : "Falha na IA";
      await log("failed", undefined, msg);
      return json({ error: msg }, [402, 403, 429].includes(s) ? s : 500);
    }
    let text = "", buf = "";
    const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(line.slice(5).trim());
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        } catch { /* partial */ }
      }
    }
    const handoff = text.includes("[HUMANO]");
    const reply = text.replace("[HUMANO]", "").trim();
    if (!reply) { await log("failed", undefined, "Resposta vazia"); return json({ error: "Sem resposta da IA" }, 500); }
    await log("success", reply);
    return json({ reply, handoff });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
