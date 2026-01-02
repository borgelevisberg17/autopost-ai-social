import { Bot, Calendar, BarChart3, Zap, Share2, Palette, Target, Clock } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "IA Personalizada",
    description: "Gera conteúdo baseado no seu tipo de negócio, público e tom de voz ideal."
  },
  {
    icon: Calendar,
    title: "Agendamento Inteligente",
    description: "Programe posts para o melhor horário de engajamento de cada rede social."
  },
  {
    icon: Share2,
    title: "Multi-plataforma",
    description: "Publique automaticamente no Instagram, Facebook, LinkedIn e Twitter."
  },
  {
    icon: BarChart3,
    title: "Analytics Completo",
    description: "Acompanhe métricas de desempenho e otimize sua estratégia de conteúdo."
  },
  {
    icon: Palette,
    title: "Templates Prontos",
    description: "Biblioteca de templates para diferentes nichos e ocasiões especiais."
  },
  {
    icon: Target,
    title: "CTAs Otimizados",
    description: "Sugestões de call-to-action que convertem baseadas no seu objetivo."
  },
  {
    icon: Zap,
    title: "Geração Instantânea",
    description: "Crie dezenas de variações de posts em segundos com um clique."
  },
  {
    icon: Clock,
    title: "Economize Tempo",
    description: "Reduza horas de trabalho manual para minutos de revisão."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Tudo que você precisa para{" "}
            <span className="gradient-text">dominar as redes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Ferramentas poderosas que transformam seu marketing digital em piloto automático.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-soft hover:border-primary/20 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow duration-300">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
