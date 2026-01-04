import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Zap, Bot, Instagram, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { DemoModal } from "./DemoModal";

export const Hero = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="w-full edge-padding pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Powered by AI</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                Crie conteúdo{" "}
                <span className="gradient-text">viral</span>{" "}
                em segundos
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 animate-fade-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
                IA que entende seu negócio e gera posts, anúncios e legendas. 
                Agende e publique automaticamente em todas as redes.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
                  <Link to="/signup">
                    Começar Grátis
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="glass" size="xl" className="w-full sm:w-auto" onClick={() => setDemoOpen(true)}>
                  <Play className="w-5 h-5" />
                  Ver Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-center">
                  <div className="font-display text-2xl sm:text-3xl font-bold">10k+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Usuários</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="font-display text-2xl sm:text-3xl font-bold">500k+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="font-display text-2xl sm:text-3xl font-bold">4.9★</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Avaliação</div>
                </div>
              </div>
            </div>

            {/* Right Content - App Preview */}
            <div className="relative animate-fade-up lg:animate-none" style={{ animationDelay: '0.3s' }}>
              <div className="relative">
                {/* Main preview card */}
                <div className="glass-card rounded-3xl p-6 lg:p-8 shadow-card">
                  {/* Mock app header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-display font-semibold">AutoPost AI</div>
                      <div className="text-xs text-muted-foreground">Gerando conteúdo...</div>
                    </div>
                  </div>

                  {/* Mock content */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Instagram className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Instagram</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        ✨ Transforme sua rotina com nosso novo produto! 
                        Milhares de clientes já descobriram...
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Linkedin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">LinkedIn</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        🚀 3 lições que aprendi ao escalar minha startup de 0 a 1M de usuários...
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Twitter className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Twitter</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Thread sobre como aumentei meu engajamento 10x usando IA 🧵
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -left-4 top-1/4 animate-float hidden lg:block">
                  <div className="glass-card rounded-2xl p-3 shadow-card">
                    <Zap className="w-6 h-6 text-accent" />
                  </div>
                </div>
                <div className="absolute -right-4 bottom-1/4 animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
                  <div className="glass-card rounded-2xl p-3 shadow-card">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};
