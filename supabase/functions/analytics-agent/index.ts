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
    const url = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await db.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const companyId = String(body.company_id ?? "");
    const days = Math.min(Math.max(Number(body.days) || 30, 7), 365);
    if (!companyId) return json({ error: "Empresa em falta" }, 400);
    const { data: isMember } = await db.rpc("is_company_member", { _company: companyId, _user: user.id });
    if (!isMember) return json({ error: "Sem permissão" }, 403);

    const since = new Date(Date.now() - days * 864e5).toISOString();
    const [{ data: company }, { data: products }, { data: orders }, { data: posts }] = await Promise.all([
      db.from("companies").select("name,currency,description").eq("id", companyId).single(),
      db.from("products").select("id,name,category,price,promo_price,stock,active").eq("company_id", companyId),
      db.from("orders").select("id,status,total,created_at,order_items(product_id,product_name,quantity,unit_price)")
        .eq("company_id", companyId).gte("created_at", since).limit(2000),
      db.from("agent_actions").select("platform,status,product_id,created_at")
        .eq("company_id", companyId).eq("action", "CREATE_POST").gte("created_at", since).limit(2000),
    ]);

    // Aggregate real numbers server-side — the AI only interprets them.
    const valid = (orders ?? []).filter((o) => o.status !== "cancelled");
    const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
    const byProduct = new Map<string, { nome: string; unidades: number; receita: number }>();
    const byHour = new Array(24).fill(0);
    const byCategory = new Map<string, number>();
    const prodMap = new Map((products ?? []).map((p) => [p.id, p]));
    for (const o of valid) {
      byHour[new Date(o.created_at).getUTCHours()]++;
      for (const i of o.order_items ?? []) {
        const k = i.product_id ?? i.product_name;
        const cur = byProduct.get(k) ?? { nome: i.product_name, unidades: 0, receita: 0 };
        cur.unidades += i.quantity; cur.receita += i.quantity * Number(i.unit_price);
        byProduct.set(k, cur);
        const cat = (i.product_id && prodMap.get(i.product_id)?.category) || "Sem categoria";
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + i.quantity * Number(i.unit_price));
      }
    }
    const top = [...byProduct.values()].sort((a, b) => b.receita - a.receita).slice(0, 10);
    const postsByProduct = new Map<string, number>();
    const postsByPlatform: Record<string, number> = {};
    for (const p of posts ?? []) {
      if (p.status !== "DRAFT") continue;
      postsByPlatform[p.platform ?? "?"] = (postsByPlatform[p.platform ?? "?"] ?? 0) + 1;
      if (p.product_id) postsByProduct.set(p.product_id, (postsByProduct.get(p.product_id) ?? 0) + 1);
    }
    const soldIds = new Set([...byProduct.keys()]);
    const parados = (products ?? []).filter((p) => p.active && p.stock > 0 && !soldIds.has(p.id))
      .map((p) => ({ nome: p.name, stock: p.stock, posts: postsByProduct.get(p.id) ?? 0 })).slice(0, 15);
    const promovidosSemVenda = (products ?? []).filter((p) => (postsByProduct.get(p.id) ?? 0) > 0 && !soldIds.has(p.id))
      .map((p) => ({ nome: p.name, posts: postsByProduct.get(p.id) })).slice(0, 10);
    const baixoStock = (products ?? []).filter((p) => p.active && p.stock > 0 && p.stock <= 5)
      .map((p) => ({ nome: p.name, stock: p.stock }));
    const metrics = {
      periodo_dias: days, moeda: company?.currency,
      pedidos: valid.length, cancelados: (orders ?? []).length - valid.length,
      receita: revenue, ticket_medio: valid.length ? revenue / valid.length : 0,
      mais_vendidos: top, receita_por_categoria: Object.fromEntries(byCategory),
      pedidos_por_hora_utc: byHour, produtos_sem_vendas: parados,
      promovidos_sem_vendas: promovidosSemVenda, baixo_stock: baixoStock,
      posts_gerados_por_rede: postsByPlatform,
    };

    const { data: run } = await db.from("agent_runs").insert({
      company_id: companyId, agent_name: "analytics", status: "running", trigger: "manual",
      metadata: { days },
    }).select("id").single();
    const finish = (status: string, summary: string, extra: Record<string, unknown> = {}) =>
      run && db.from("agent_runs").update({
        status, summary: summary.slice(0, 500), completed_at: new Date().toISOString(),
        metadata: { days, metrics, ...extra },
      }).eq("id", run.id);

    if (valid.length === 0 && (posts ?? []).length === 0) {
      await finish("success", "Sem vendas nem posts no período — nada para analisar.");
      return json({ metrics, insights: null, empty: true });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "IA não configurada" }, 500);
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        store: false,
        reasoning: { effort: "low" },
        instructions: `És o agente de análise da loja "${company?.name}". Usa APENAS as métricas fornecidas; nunca inventes números, produtos ou tendências que não estejam nos dados. Se os dados forem poucos, diz isso. Escreve em português, direto e acionável. Responde só com JSON: {"resumo":"2-3 frases","destaques":["..."],"sugestoes":[{"titulo":"...","detalhe":"...","prioridade":"alta|media|baixa","area":"marketing|stock|vendas"}]} com no máximo 5 sugestões. Valores monetários na moeda indicada.`,
        input: JSON.stringify(metrics),
      }),
    });
    if (!resp.ok) {
      const s = resp.status;
      console.error("AI error", s, await resp.text());
      const msg = s === 429 ? "Muitos pedidos, tente daqui a pouco." : s === 402 ? "Créditos de IA esgotados." : "Falha na IA";
      await finish("failed", msg);
      return json({ error: msg, metrics }, [402, 429].includes(s) ? s : 500);
    }
    const data = await resp.json();
    const text: string = data.output_text ??
      (data.output ?? []).flatMap((o: { content?: { text?: string }[] }) => o.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
    let insights: Record<string, unknown> | null = null;
    try { insights = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? ""); } catch { /* below */ }
    if (!insights) { await finish("failed", "Resposta da IA inválida"); return json({ error: "Resposta da IA inválida", metrics }, 500); }
    await finish("success", String(insights.resumo ?? "Análise concluída"), { insights });
    return json({ metrics, insights });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
