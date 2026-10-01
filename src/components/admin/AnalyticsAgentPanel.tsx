import { useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Suggestion = { titulo: string; detalhe: string; prioridade?: string; area?: string };
type Insights = { resumo?: string; destaques?: string[]; sugestoes?: Suggestion[] };

export function AnalyticsAgentPanel({ companyId, days }: { companyId: string; days: number }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [empty, setEmpty] = useState(false);

  const run = async () => {
    setLoading(true);
    setEmpty(false);
    const { data, error } = await supabase.functions.invoke("analytics-agent", {
      body: { company_id: companyId, days },
    });
    setLoading(false);
    if (error) {
      let msg = "Não foi possível analisar agora.";
      if (error instanceof FunctionsHttpError) {
        const b = await error.context.json().catch(() => null);
        if (b?.error) msg = b.error;
      }
      toast.error(msg);
      return;
    }
    if (data?.empty) { setEmpty(true); setInsights(null); return; }
    setInsights(data?.insights ?? null);
  };

  return (
    <section className="rounded border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Agente de análise</h2>
            <p className="text-sm text-muted-foreground">
              Sugestões baseadas nas suas vendas reais e nos posts gerados ({days} dias).
            </p>
          </div>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {insights ? "Analisar de novo" : "Analisar"}
        </Button>
      </div>

      {empty && (
        <p className="mt-4 text-sm text-muted-foreground">
          Ainda não há vendas nem posts neste período — não há dados reais para analisar.
        </p>
      )}

      {insights && (
        <div className="mt-4 space-y-4">
          {insights.resumo && <p className="text-sm">{insights.resumo}</p>}
          {!!insights.destaques?.length && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {insights.destaques.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {insights.sugestoes?.map((s, i) => (
              <div key={i} className="rounded border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{s.titulo}</p>
                  {s.prioridade && (
                    <span className="rounded border border-border px-2 py-0.5 text-xs uppercase text-muted-foreground">
                      {s.prioridade}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.detalhe}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
