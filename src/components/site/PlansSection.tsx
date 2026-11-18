import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
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

  const names: Record<string, string> = {
    marketing: "Agente de Marketing com IA",
    analytics: "Relatórios & Analytics IA",
    sales: "Agente de Vendas Automatizado",
    whatsapp: "WhatsApp Business Integrado",
  };

  return (
    <section id="plans" className="border-y border-slate-200/80 bg-slate-50/50 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-700 mb-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            Planos & Escalabilidade
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.04em] text-slate-950">
            Estrutura de investimento clara.
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
            Infraestrutura transacional completa sem taxas de instalação ou fidelização.
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
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
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

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const isPopular = index === 1 || plan.name.toLowerCase().includes("pro");
            const price =
              plan.monthly_price === null
                ? null
                : billing === "annual"
                ? Math.round(plan.monthly_price * 0.8)
                : plan.monthly_price;

            return (
              <motion.article
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                key={plan.id}
                data-cursor="ESCOLHER PLANO"
                className={cn(
                  "relative flex flex-col justify-between rounded-3xl border bg-white p-7 transition shadow-xs hover:shadow-xl",
                  isPopular
                    ? "border-slate-900/80 ring-2 ring-slate-900/10 shadow-md lg:-translate-y-2"
                    : "border-slate-200/80 hover:border-slate-300"
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-950 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                    Mais Popular
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                      {price === null ? "Sob consulta" : formatMoney(price, plan.currency)}
                    </span>
                    {price !== null && (
                      <span className="text-xs font-medium text-slate-500">/ mês</span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {billing === "annual" && price !== null
                      ? "Faturado anualmente com 20% de desconto"
                      : "Faturado mensalmente sem fidelização"}
                  </p>

                  <div className="my-6 border-t border-slate-100" />

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <div className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-slate-800 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span>Até <strong>{plan.product_limit}</strong> produtos sincronizados</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-slate-800 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span><strong>{plan.monthly_ai_limit}</strong> pedidos de IA por mês</span>
                    </li>
                    {plan.features.map((f) => (
                      <li className="flex items-center gap-2.5" key={f}>
                        <div className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-slate-800 shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span>{names[f] ?? f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
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
                      Criar conta com este plano
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
