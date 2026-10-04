// deno-lint-ignore-file no-explicit-any
// Shared WhatsApp sales agent: answers only from real catalogue/order data.
type DB = any;

export type Turn = { role: "client" | "agent"; text: string };

export async function salesReply(db: DB, companyId: string, message: string, history: Turn[]) {
  const [{ data: company }, { data: products }] = await Promise.all([
    db.from("companies").select("name,slug,currency,description").eq("id", companyId).single(),
    db.from("products").select("name,description,category,price,promo_price,stock")
      .eq("company_id", companyId).eq("active", true).limit(150),
  ]);

  // Order status only with the full order code — never by name.
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
    produtos: (products ?? []).map((p: any) => ({
      nome: p.name, categoria: p.category, descricao: p.description?.slice(0, 200),
      preco: Number(p.price), promo: p.promo_price != null ? Number(p.promo_price) : null,
      disponivel: p.stock > 0, stock: p.stock,
    })),
    pedido: order,
  };

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { error: "IA não configurada", status: 500, code };
  const convo = history.slice(-10)
    .map((m) => `${m.role === "agent" ? "Assistente" : "Cliente"}: ${String(m.text).slice(0, 500)}`).join("\n");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: `És o assistente de atendimento no WhatsApp da loja "${company?.name}". Responde em português, curto e simpático (máx. 80 palavras), sem markdown. Usa APENAS os dados fornecidos: nunca inventes produtos, preços, stock, prazos ou estados de pedido. Se o produto não estiver na lista, diz que não o tens. Para estado de pedido, só usa o campo "pedido"; se não houver, pede o código completo do pedido. Se não souberes ou o cliente pedir uma pessoa, diz que vais passar a conversa à equipa e termina a resposta com [HUMANO]. Preços na moeda indicada.`,
      input: `Dados: ${JSON.stringify(facts)}\n\nConversa:\n${convo}\nCliente: ${message}`,
    }),
  });
  if (!resp.ok || !resp.body) {
    const s = resp.status;
    console.error("AI error", s, await resp.text());
    const msg = s === 429 ? "Muitos pedidos, tente daqui a pouco." : s === 402 ? "Créditos de IA esgotados." : "Falha na IA";
    return { error: msg, status: [402, 403, 429].includes(s) ? s : 500, code };
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
  if (!reply) return { error: "Sem resposta da IA", status: 500, code };
  return { reply, handoff, code };
}

export async function sendWhatsApp(phoneNumberId: string, to: string, body: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!token) return { ok: false, error: "WhatsApp não configurado" };
  const r = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4000) } }),
  });
  const txt = await r.text();
  if (!r.ok) { console.error("WA send", r.status, txt); return { ok: false, error: `Meta ${r.status}: ${txt.slice(0, 300)}` }; }
  try { return { ok: true, id: JSON.parse(txt).messages?.[0]?.id as string | undefined }; } catch { return { ok: true }; }
}
