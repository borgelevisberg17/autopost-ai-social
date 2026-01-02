import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como a IA sabe o que escrever para meu negócio?",
    answer: "Ao criar sua conta, você preenche um perfil completo do seu negócio incluindo tipo, público-alvo, tom de voz e objetivos. A IA usa essas informações para gerar conteúdo 100% personalizado para sua marca."
  },
  {
    question: "Posso editar os posts gerados pela IA?",
    answer: "Sim! Todos os posts são totalmente editáveis. Você pode ajustar o texto, adicionar emojis, mudar hashtags e personalizar como quiser antes de publicar."
  },
  {
    question: "Quais redes sociais são suportadas?",
    answer: "Atualmente suportamos Instagram, Facebook, LinkedIn e Twitter/X. Estamos constantemente adicionando novas integrações baseado no feedback dos usuários."
  },
  {
    question: "A publicação automática é segura?",
    answer: "Sim! Usamos APIs oficiais de cada plataforma com autenticação OAuth2. Você pode revogar o acesso a qualquer momento nas configurações."
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Absolutamente! Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento e continuar usando até o fim do período pago."
  },
  {
    question: "Vocês oferecem reembolso?",
    answer: "Sim, oferecemos garantia de 7 dias. Se não estiver satisfeito, devolvemos 100% do valor sem perguntas."
  }
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Perguntas{" "}
            <span className="gradient-text">Frequentes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Tudo que você precisa saber sobre o AutoPost.AI
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border/50 px-6 data-[state=open]:shadow-soft data-[state=open]:border-primary/20 transition-all duration-300"
              >
                <AccordionTrigger className="text-left font-display font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
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
