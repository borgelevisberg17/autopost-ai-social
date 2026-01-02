import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Zap, Bot } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by AI • Geração Inteligente</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Crie conteúdo para{" "}
            <span className="gradient-text">redes sociais</span>{" "}
            em segundos
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            IA que entende seu negócio e gera posts, anúncios e legendas personalizadas. 
            Agende e publique automaticamente em todas as suas redes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                Começar Grátis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl">
              <Play className="w-5 h-5" />
              Ver Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="font-display text-3xl font-bold gradient-text">10k+</div>
              <div className="text-sm text-muted-foreground">Usuários</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold gradient-text">500k+</div>
              <div className="text-sm text-muted-foreground">Posts Criados</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold gradient-text">4.9★</div>
              <div className="text-sm text-muted-foreground">Avaliação</div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="hidden lg:block">
          <div className="absolute left-10 top-1/2 -translate-y-1/2 animate-float">
            <div className="glass rounded-2xl p-4 shadow-card">
              <Bot className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="absolute right-10 top-1/3 animate-float" style={{ animationDelay: '1s' }}>
            <div className="glass rounded-2xl p-4 shadow-card">
              <Zap className="w-8 h-8 text-accent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
