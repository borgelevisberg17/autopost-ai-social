import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  monthly_price: number | null;
  currency: string;
  product_limit: number;
  monthly_ai_limit: number;
  features: string[];
};

const PLAN_TAGLINES: Record<string, string> = {
  free: "Ideal para montar a sua loja e validar os primeiros produtos.",
  basic: "Para marcas em crescimento com loja personalizada e analytics.",
  pro: "Operação autónoma completa com WhatsApp IA e vendas 24/7.",
  enterprise: "Infraestrutura dedicada para grandes catálogos e alto volume.",
};

const FEATURE_LABELS: Record<string, string> = {
  marketing: "Agente de Marketing & Conteúdo IA",
  analytics: "Analytics IA & Editor Visual Pro (fontes e secções)",
  sales: "Agente de Vendas IA & Histórico de Versões",
  whatsapp: "WhatsApp Cloud API & Conversas em Tempo Real",
};

const COMPARISON_ROWS: Array<{
  label: string;
  values: Record<string, string | boolean>;
}> = [
  {
    label: "Loja Pública + Checkout Nativo",
    values: { free: true, basic: true, pro: true, enterprise: true },
  },
  {
    label: "Editor Visual estilo Shopify + 12 Templates",
    values: { free: "Base", basic: "Completo", pro: "Completo + Versões", enterprise: "Completo + Versões" },
  },
  {
    label: "Motor IA da Loja (Copiloto)",
    values: { free: "15/mês", basic: "400/mês", pro: "3.000/mês", enterprise: "15.000/mês" },
  },
  {
    label: "Analytics & Relatórios IA",
    values: { free: false, basic: true, pro: true, enterprise: true },
  },
  {
    label: "WhatsApp Cloud API + Agente de Vendas 24/7",
    values: { free: false, basic: false, pro: true, enterprise: true },
  },
  {
    label: "Estoque Atómico & Auditoria",
    values: { free: true, basic: true, pro: true, enterprise: true },
  },
];

export function PlansSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    void supabase
      .from("subscription_plans")
      .select("*")
      .eq("enabled", true)
      .order("product_limit")
      .then(({ data, error }) => {
        setPlans(data ?? []);
        setError(Boolean(error));
      });
  }, []);

  const gridColsClass =
    plans.length >= 4
      ? "grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      : "grid gap-6 lg:grid-cols-3";

  return (
    <section
      id="plans"
      className="border-y border-slate-200/80 bg-slate-50/50 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-700 mb-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Planos & Escalabilidade
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.04em] text-slate-950">
            Estrutura de investimento clara.
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
            Loja online, editor visual e agentes de IA numa única plataforma — sem taxas escondidas nem fidelização.
          </p>

          {/* Billing Toggle */}
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                billing === "monthly"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition",
                billing === "annual"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Anual
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                −20%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-rose-600">
            Não foi possível carregar os planos da loja.
          </p>
        )}

        <div className={gridColsClass}>
          {plans.map((plan) => {
            const isPopular = plan.id === "pro" || plan.name.toLowerCase().includes("pro");
            const isEnterprise = plan.monthly_price === null;
            const price =
              plan.monthly_price === null
                ? null
                : billing === "annual"
                ? Math.round(plan.monthly_price * 0.8)
                : plan.monthly_price;

            const tagline =
              PLAN_TAGLINES[plan.id] ??
              "Infraestrutura transacional e catálogo sincronizado.";

            return (
              <motion.article
                whileHover={{ scale: 1.015 }}
                transition={{ type: "spring", stiffness: 300 }}
                key={plan.id}
                data-cursor="ESCOLHER PLANO"
                className={cn(
                  "relative flex flex-col justify-between rounded-3xl border bg-white p-6 sm:p-7 transition shadow-xs hover:shadow-xl",
                  isPopular
                    ? "border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-md xl:-translate-y-1.5"
                    : "border-slate-200/80 hover:border-slate-300"
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs whitespace-nowrap">
                    Mais Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 min-h-[32px]">
                    {tagline}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                      {price === null ? "Sob consulta" : formatMoney(price, plan.currency)}
                    </span>
                    {price !== null && (
                      <span className="text-xs font-medium text-slate-500">/ mês</span>
                    )}
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {isEnterprise
                      ? "Limites e SLA adaptados à sua operação"
                      : price === 0
                      ? "Sem cartão de crédito necessário"
                      : billing === "annual"
                      ? "Faturado anualmente com 20% de desconto"
                      : "Faturado mensalmente sem fidelização"}
                  </p>

                  <div className="my-5 border-t border-slate-100" />

                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <div className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>
                        Até <strong>{plan.product_limit.toLocaleString("pt-PT")}</strong> produtos sincronizados
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>
                        <strong>{plan.monthly_ai_limit.toLocaleString("pt-PT")}</strong> pedidos de IA por mês
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>Loja Pública + Editor Visual & Templates</span>
                    </li>
                    {plan.features.map((f) => (
                      <li className="flex items-start gap-2.5" key={f}>
                        <div className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span>{FEATURE_LABELS[f] ?? f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7">
                  <Button
                    asChild
                    className={cn(
                      "w-full rounded-xl py-5 text-xs font-bold transition shadow-xs",
                      isPopular
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                    )}
                  >
                    <Link to="/signup">
                      {isEnterprise ? "Falar com a equipa" : "Começar com este plano"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Comparison Table */}
        {plans.length > 0 && (
          <div className="mt-14 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="border-b border-slate-200/80 px-6 py-4 bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900">
                Comparação rápida de capacidades
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="px-6 py-3.5 font-semibold">Capacidade</th>
                    {plans.map((p) => (
                      <th
                        key={p.id}
                        className={cn(
                          "px-4 py-3.5 text-center font-bold",
                          p.id === "pro" ? "text-emerald-700" : "text-slate-900"
                        )}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 font-medium text-slate-700">
                        {row.label}
                      </td>
                      {plans.map((p) => {
                        const val = row.values[p.id];
                        return (
                          <td key={p.id} className="px-4 py-3.5 text-center">
                            {val === true ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : val === false || val === undefined ? (
                              <Minus className="mx-auto h-4 w-4 text-slate-300" />
                            ) : (
                              <span className="font-semibold text-slate-800">
                                {val}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
