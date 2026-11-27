import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type Entitlement = {
  plan: string;
  name: string;
  status: string;
  company_status: string;
  base_plan: string;
  features: string[];
  product_limit: number;
  monthly_ai_limit: number;
  ai_used: number;
  grant_expires_at: string | null;
};

const FEATURE_LABELS: Record<string, string> = {
  marketing: "Marketing IA",
  analytics: "Analytics & Editor Pro",
  sales: "Agente de Vendas",
  whatsapp: "WhatsApp Cloud API",
};

export function SubscriptionPanel({ companyId }: { companyId: string }) {
  const [value, setValue] = useState<Entitlement | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(null);
    const load = () => {
      void supabase
        .rpc("company_entitlement", { _company: companyId })
        .then(({ data, error }) => {
          if (error) toast.error(error.message);
          else setValue(data as unknown as Entitlement);
        });
    };
    load();
    window.addEventListener("subscription-usage-changed", load);
    return () => window.removeEventListener("subscription-usage-changed", load);
  }, [companyId]);

  async function redeem() {
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_company_coupon", {
      _company: companyId,
      _code: code,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      const result = data as { percent_off?: number };
      toast.success(
        `Cupão reservado: ${result.percent_off}% de desconto. O acesso só muda após ativação do plano.`
      );
      setCode("");
    }
  }

  const aiPercent =
    value && value.monthly_ai_limit > 0
      ? Math.min(100, Math.round((value.ai_used / value.monthly_ai_limit) * 100))
      : 0;

  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-5 shadow-xs"
      aria-label="Limites da subscrição"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Subscrição da empresa
          </h2>
          <p className="text-xs text-slate-500">
            Plano ativo, consumo de IA e limites operacionais.
          </p>
        </div>
        {value && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {value.name} · {value.status}
          </span>
        )}
      </div>

      {value ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Catálogo permitido
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                Até {value.product_limit.toLocaleString("pt-PT")} produtos
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Estado da loja: <strong className="text-slate-700">{value.company_status}</strong>
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Quota IA este mês</span>
                <span className="tabular-nums text-slate-700">
                  {value.ai_used.toLocaleString("pt-PT")} /{" "}
                  {value.monthly_ai_limit.toLocaleString("pt-PT")}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    aiPercent >= 90
                      ? "bg-rose-500"
                      : aiPercent >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                  style={{ width: `${aiPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {aiPercent}% consumido no ciclo atual
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {value.features.length > 0 ? (
              value.features.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                >
                  {FEATURE_LABELS[f] ?? f}
                </span>
              ))
            ) : (
              <span className="text-xs font-semibold text-rose-600">
                Acesso suspenso
              </span>
            )}
          </div>

          {value.grant_expires_at && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Concessão ativa até{" "}
              <strong>
                {new Date(value.grant_expires_at).toLocaleDateString("pt-PT")}
              </strong>{" "}
              · Plano de origem: {value.base_plan}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">A carregar plano…</p>
      )}

      <form
        className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void redeem();
        }}
      >
        <Input
          className="max-w-xs h-9 text-xs"
          aria-label="Código do cupão"
          placeholder="Código do cupão promocional"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <Button disabled={busy} size="sm" className="h-9 text-xs font-semibold">
          Aplicar cupão
        </Button>
      </form>
    </section>
  );
}
