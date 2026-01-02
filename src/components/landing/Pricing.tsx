import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "R$0",
    period: "/mês",
    description: "Perfeito para começar",
    features: [
      "3 posts por semana",
      "1 rede social",
      "Templates básicos",
      "Geração manual",
      "Suporte por email"
    ],
    cta: "Começar Grátis",
    popular: false
  },
  {
    name: "Básico",
    price: "R$29",
    period: "/mês",
    description: "Para criadores regulares",
    features: [
      "Posts diários ilimitados",
      "3 redes sociais",
      "Todos os templates",
      "Histórico de posts",
      "Analytics básico",
      "Suporte prioritário"
    ],
    cta: "Assinar Básico",
    popular: false
  },
  {
    name: "Pro",
    price: "R$59",
    period: "/mês",
    description: "Automação completa",
    features: [
      "Tudo do Básico",
      "Redes ilimitadas",
      "Agendamento automático",
      "Publicação automática",
      "Analytics avançado",
      "API access",
      "Suporte 24/7"
    ],
    cta: "Assinar Pro",
    popular: true
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Planos para{" "}
            <span className="gradient-text">cada necessidade</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Comece grátis e escale conforme seu negócio cresce.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 border transition-all duration-300 animate-fade-up ${
                plan.popular
                  ? "border-primary shadow-glow scale-105"
                  : "border-border/50 shadow-card hover:shadow-soft hover:border-primary/20"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-primary-foreground text-sm font-medium">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="font-display font-semibold text-xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
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
    </section>
  );
};
