import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check, Instagram, Linkedin, Twitter, RefreshCw } from "lucide-react";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const demoContents = [
  {
    platform: "Instagram",
    icon: Instagram,
    topic: "Lançamento de Produto",
    content: `🚀 NOVIDADE CHEGANDO! 

Você pediu, a gente ouviu! Apresentamos nossa nova coleção que vai transformar seu dia a dia.

✨ Design exclusivo
✨ Qualidade premium
✨ Feito para você

👉 Link na bio para garantir o seu!

#Lançamento #Novidade #MarcaQueVocêAma #Inovação`,
  },
  {
    platform: "LinkedIn",
    icon: Linkedin,
    topic: "Dica Profissional",
    content: `A diferença entre profissionais medianos e excepcionais? Consistência.

Li recentemente que 80% do sucesso vem de simplesmente aparecer. E isso me fez refletir sobre nossa jornada empreendedora.

Não são as grandes decisões que nos definem, mas os pequenos hábitos diários:
→ Responder clientes com agilidade
→ Entregar mais do que prometemos
→ Aprender algo novo toda semana

Qual hábito você pratica consistentemente?

#Empreendedorismo #Liderança #Crescimento`,
  },
  {
    platform: "Twitter",
    icon: Twitter,
    topic: "Engajamento",
    content: `Acabei de descobrir que 73% das pessoas não leem o texto do post até o final.

Se você chegou aqui, você é especial 🫶

RT se você é do time que lê tudo!`,
  },
];

export const DemoModal = ({ open, onOpenChange }: DemoModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [displayedContent, setDisplayedContent] = useState("");
  const [copied, setCopied] = useState(false);

  const currentDemo = demoContents[currentIndex];
  const Icon = currentDemo.icon;

  const simulateGeneration = () => {
    setIsGenerating(true);
    setDisplayedContent("");
    
    const content = currentDemo.content;
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < content.length) {
        setDisplayedContent(content.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 20);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (open) {
      simulateGeneration();
    }
  }, [open, currentIndex]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDemo.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextDemo = () => {
    setCurrentIndex((prev) => (prev + 1) % demoContents.length);
  };

  const handleRegenerate = () => {
    simulateGeneration();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Demonstração - Geração de Conteúdo com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform & Topic */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{currentDemo.platform}</p>
                <p className="text-sm text-muted-foreground">{currentDemo.topic}</p>
              </div>
            </div>
            <Badge variant="secondary" className="animate-pulse">
              {isGenerating ? "Gerando..." : "Pronto!"}
            </Badge>
          </div>

          {/* Generated Content */}
          <div className="relative">
            <div className="min-h-[200px] p-4 rounded-lg bg-muted/50 border border-border whitespace-pre-wrap font-mono text-sm">
              {displayedContent}
              {isGenerating && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={isGenerating}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <Button onClick={handleNextDemo} disabled={isGenerating}>
              Próximo exemplo
            </Button>
          </div>

          {/* Demo indicators */}
          <div className="flex justify-center gap-2 pt-2">
            {demoContents.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Gostou? Crie conteúdo personalizado para o seu negócio!
            </p>
            <Button variant="gradient" asChild>
              <a href="/signup">Começar Grátis</a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
