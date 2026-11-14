import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";

export type StoreFAQCompany = {
  name: string;
  whatsapp?: string | null;
};

interface StoreFAQProps {
  company: StoreFAQCompany;
  onContactClick?: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function StoreFAQ({ company, onContactClick }: StoreFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const whatsappNumber = company.whatsapp?.replace(/\D/g, "") || "";

  const faqs: FAQItem[] = [
    {
      question: "Como funcionam as entregas em Luanda e nas restantes províncias de Angola?",
      answer:
        "Realizamos entregas ao domicílio em toda a província de Luanda no prazo de 24h a 48h úteis após a confirmação do pedido. Para as restantes províncias de Angola (Benguela, Huambo, Huíla, Cabinda, Namibe, etc.), os envios são despachados através de transportadoras parceiras e serviços de carga expresso de confiança, com prazos habituais de 2 a 5 dias úteis. Disponibilizamos código ou guia de rastreio para acompanhar a sua encomenda em tempo real.",
    },
    {
      question: "Quais são as formas de pagamento aceites e como é confirmada a compra?",
      answer:
        "Aceitamos os principais métodos oficiais de pagamento: Multicaixa Express (MCX), Transferência Bancária imediata por IBAN, cartões de crédito/débito (Visa e Mastercard) e PayPal. Ao concluir o pedido na loja, o stock do artigo fica imediatamente reservado para si. As coordenadas bancárias e a referência para liquidação são apresentadas no ecrã e enviadas diretamente para o seu WhatsApp.",
    },
    {
      question: "Qual é a política de trocas de tamanho ou devoluções?",
      answer:
        "Tem até 7 (sete) dias corridos após a receção do produto para solicitar a troca de tamanho, cor ou modelo. Para isso, o calçado deve estar sem marcas de uso, com a sola limpa, etiquetas originais afixadas e na caixa de origem. Em caso de eventual defeito de fabrico comprovado, garantimos a substituição prioritária imediata ou o reembolso integral do valor pago.",
    },
    {
      question: "Os pedidos incluem fatura para efeitos fiscais e contabilidade?",
      answer:
        "Sim. A nossa loja opera em total conformidade com a legislação comercial e fiscal em vigor na República de Angola (AGT). Todas as compras dão origem à emissão de fatura/recibo com descrição detalhada dos artigos e, caso pretenda, com a inclusão do NIF pessoal ou empresarial, bastando indicá-lo no ato da encomenda ou ao nosso suporte.",
    },
    {
      question: "Como posso acompanhar o estado do meu pedido ou falar com um consultor?",
      answer:
        "Assim que fecha o pedido, recebe um link direto para a página de acompanhamento com atualizações em tempo real (Pendente, Confirmado, Em Envio e Entregue). A nossa equipa de apoio ao cliente também realiza o acompanhamento dedicado via WhatsApp oficial para esclarecer qualquer dúvida de segunda a sábado, das 08:00 às 19:00.",
    },
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="my-14 sm:my-20" aria-label="Perguntas Frequentes">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER - CLEAN & DIRECT, NO EYEBROW */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-neutral-200/70">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900">
              Perguntas Frequentes
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 leading-relaxed">
              Tudo o que precisa de saber sobre métodos de pagamento, prazos de expedição em Angola, política de trocas e garantias fiscais.
            </p>
          </div>

          {/* Quick Help Button */}
          <div className="flex items-center gap-3 shrink-0">
            {whatsappNumber ? (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  "Olá! Tenho uma dúvida sobre uma compra na loja online."
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com Consultor
              </a>
            ) : onContactClick ? (
              <button
                type="button"
                onClick={onContactClick}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm transition"
              >
                <HelpCircle className="h-4 w-4" />
                Apoio ao Cliente
              </button>
            ) : null}
          </div>
        </div>

        {/* ACCORDION FAQ LIST - NO CATEGORY EYEBROWS */}
        <div className="divide-y divide-neutral-200/80">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className="py-5 sm:py-6 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between gap-4 text-left group focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition pr-2">
                    {faq.question}
                  </h3>

                  <span
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isOpen
                        ? "bg-neutral-900 text-white rotate-180"
                        : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>

                {isOpen && (
                  <div className="pt-3 sm:pt-4 pr-6 sm:pr-12 text-xs sm:text-sm text-neutral-600 leading-relaxed animate-in fade-in-50 duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
