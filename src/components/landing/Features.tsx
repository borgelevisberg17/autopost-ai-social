import { Bot, Calendar, BarChart3, Zap, Share2, Palette, Target, Clock } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "IA Personalizada",
    description: "Conteúdo baseado no seu negócio, público e tom de voz."
  },
  {
    icon: Calendar,
    title: "Agendamento Smart",
    description: "Posts no melhor horário de engajamento de cada rede."
  },
  {
    icon: Share2,
    title: "Multi-plataforma",
    description: "Publique no Instagram, Facebook, LinkedIn e Twitter."
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Métricas de desempenho e otimização de estratégia."
  },
  {
    icon: Palette,
    title: "Templates",
    description: "Biblioteca para diferentes nichos e ocasiões."
  },
  {
    icon: Target,
    title: "CTAs Otimizados",
    description: "Call-to-action que convertem baseados no seu objetivo."
  },
  {
    icon: Zap,
    title: "Instantâneo",
    description: "Dezenas de variações de posts em segundos."
  },
  {
    icon: Clock,
    title: "Economize Tempo",
    description: "Horas de trabalho em minutos de revisão."
  }
];

export const Features = () => {
  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-secondary/30" />
      
      <div className="relative w-full edge-padding">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Tudo para{" "}
              <span className="gradient-text">dominar</span>{" "}
              as redes
            </h2>
            <p className="text-muted-foreground text-lg">
              Ferramentas que transformam seu marketing em piloto automático.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group glass-card rounded-2xl lg:rounded-3xl p-5 lg:p-6 hover:shadow-soft hover:border-primary/30 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow duration-300">
                  <feature.icon className="w-5 h-5 lg:w-6 lg:h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-base lg:text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
