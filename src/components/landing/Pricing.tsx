import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "R$0",
    period: "/mês",
    description: "Para começar",
    features: [
      "3 posts por semana",
      "1 rede social",
      "Templates básicos",
      "Suporte por email"
    ],
    cta: "Começar Grátis",
    popular: false
  },
  {
    name: "Pro",
    price: "R$59",
    period: "/mês",
    description: "Automação completa",
    features: [
      "Posts ilimitados",
      "Todas as redes",
      "Agendamento automático",
      "Publicação automática",
      "Analytics avançado",
      "Suporte 24/7"
    ],
    cta: "Assinar Pro",
    popular: true
  },
  {
    name: "Básico",
    price: "R$29",
    period: "/mês",
    description: "Para criadores",
    features: [
      "Posts diários ilimitados",
      "3 redes sociais",
      "Todos os templates",
      "Histórico de posts",
      "Analytics básico"
    ],
    cta: "Assinar Básico",
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="w-full edge-padding">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Planos{" "}
              <span className="gradient-text">simples</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Comece grátis e escale conforme cresce.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative glass-card rounded-3xl p-6 lg:p-8 transition-all duration-300 animate-fade-up ${
                  plan.popular
                    ? "border-primary/50 shadow-glow md:scale-105 md:-translate-y-2"
                    : "hover:shadow-soft hover:border-primary/20"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-medium shadow-soft">
                    <Sparkles className="w-3.5 h-3.5" />
                    Mais Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="font-display font-semibold text-xl mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display text-4xl lg:text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
