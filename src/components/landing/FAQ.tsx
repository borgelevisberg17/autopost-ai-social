import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como a IA sabe o que escrever para meu negócio?",
    answer: "Ao criar sua conta, você preenche um perfil do seu negócio incluindo tipo, público-alvo e tom de voz. A IA usa essas informações para gerar conteúdo personalizado."
  },
  {
    question: "Posso editar os posts gerados?",
    answer: "Sim! Todos os posts são editáveis. Ajuste o texto, adicione emojis, mude hashtags antes de publicar."
  },
  {
    question: "Quais redes sociais são suportadas?",
    answer: "Instagram, Facebook, LinkedIn e Twitter/X. Novas integrações são adicionadas regularmente."
  },
  {
    question: "A publicação automática é segura?",
    answer: "Sim! Usamos APIs oficiais com autenticação OAuth2. Você pode revogar o acesso a qualquer momento."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sem fidelidade. Cancele quando quiser e continue usando até o fim do período pago."
  },
  {
    question: "Vocês oferecem reembolso?",
    answer: "Garantia de 7 dias. Se não estiver satisfeito, devolvemos 100% sem perguntas."
  }
];

export const FAQ = () => {
  return (
    <section id="faq" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-secondary/30" />
      
      <div className="relative w-full edge-padding">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Perguntas{" "}
              <span className="gradient-text">Frequentes</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Tudo sobre o AutoPost
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card rounded-2xl border-border/50 px-6 data-[state=open]:shadow-soft data-[state=open]:border-primary/30 transition-all duration-300"
              >
                <AccordionTrigger className="text-left font-display font-semibold hover:no-underline py-5 text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
