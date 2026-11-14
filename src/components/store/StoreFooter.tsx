import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUp,
  CreditCard,
  Headphones,
  Mail,
  MessageCircle,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

export type StoreFooterCompany = {
  id: string;
  name: string;
  slug: string;
  currency?: string;
  description?: string | null;
  whatsapp?: string | null;
};

interface StoreFooterProps {
  company: StoreFooterCompany;
  categories?: { name: string }[];
  onCategoryClick?: (name: string) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export function StoreFooter({
  company,
  categories = [],
  onCategoryClick,
  onNavigateSection,
}: StoreFooterProps) {
  const [email, setEmail] = useState("");
  const whatsappNumber = company.whatsapp?.replace(/\D/g, "") || "";

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }
    toast.success("Obrigado por subscrever! Ficará a par dos lançamentos exclusivos.");
    setEmail("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryClick = (name: string) => {
    if (onCategoryClick) {
      onCategoryClick(name);
    } else if (onNavigateSection) {
      onNavigateSection("produtos");
    }
  };

  return (
    <footer id="contacto" className="bg-[#0b0c10] text-white border-t border-white/10 mt-20">
      {/* 1. TRUST PILLARS ROW */}
      <div className="border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Entrega para todo Angola</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Envios rápidos e seguros para Luanda e todas as províncias.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Compra 100% Segura</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Confirmação em tempo real e stock garantido ao fechar o pedido.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white">
                <RefreshCcw className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Trocas Facilitadas</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Até 7 dias para solicitar troca com suporte direto e descomplicado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white">
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Apoio ao Cliente 24/7</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Atendimento ágil e acompanhamento personalizado no WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NEWSLETTER VIP CLUB ROW */}
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                CLUBE VIP · {company.name.toUpperCase()}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-1">
                Fique por dentro dos lançamentos e drops exclusivos
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1.5">
                Subscreva para receber reposições, novidades em primeira mão e ofertas especiais.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail..."
                  className="w-full bg-white/5 border border-white/15 focus:border-blue-500 rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white outline-none placeholder:text-neutral-500 transition"
                />
              </div>
              <button
                type="submit"
                className="bg-white hover:bg-neutral-200 text-[#0c0d11] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shrink-0 transition"
              >
                Subscrever
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION COLUMNS */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Info (col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white text-black font-extrabold text-xl flex items-center justify-center tracking-tight">
                {company.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                {company.name}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
              {company.description ||
                "A sua referência em calçados, sneakers e estilo urbano. Curadoria selecionada para oferecer estilo, durabilidade e conforto em cada passo."}
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Loja online ativa em Angola</span>
            </div>

            {whatsappNumber && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Atendimento WhatsApp Oficial
                </a>
              </div>
            )}
          </div>

          {/* Categories (col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Coleções & Categorias
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-300">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.name}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.name)}
                      className="hover:text-blue-400 hover:translate-x-0.5 transition flex items-center gap-1.5"
                    >
                      <ArrowRight className="h-3 w-3 text-neutral-500" />
                      {cat.name}
                    </button>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Sneakers")}
                      className="hover:text-blue-400 transition"
                    >
                      Sneakers & Ténis
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Casual")}
                      className="hover:text-blue-400 transition"
                    >
                      Casual & Urbano
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Sociais")}
                      className="hover:text-blue-400 transition"
                    >
                      Sapatos Sociais
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Chinelos")}
                      className="hover:text-blue-400 transition"
                    >
                      Chinelos & Slides
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Acessórios")}
                      className="hover:text-blue-400 transition"
                    >
                      Acessórios
                    </button>
                  </li>
                </>
              )}
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("produtos")}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Ver todos os produtos →
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Help (col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Ajuda & Suporte
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("produtos")}
                  className="hover:text-white transition flex items-center gap-1.5"
                >
                  <PackageCheck className="h-3 w-3 text-neutral-500" />
                  Como encomendar
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("sobre")}
                  className="hover:text-white transition"
                >
                  Prazos e custos de envio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("sobre")}
                  className="hover:text-white transition"
                >
                  Trocas e Devoluções
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("produtos")}
                  className="hover:text-white transition"
                >
                  Tabela e Guia de Tamanhos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("pedidos")}
                  className="hover:text-white transition"
                >
                  Consultar meus pedidos
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Hours (col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Contacto Direto
            </h4>
            <div className="space-y-2 text-xs text-neutral-300">
              <p className="text-neutral-400">Fale com a nossa equipa:</p>
              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-bold text-white hover:text-blue-400 transition"
                >
                  +{whatsappNumber}
                </a>
              ) : (
                <p className="font-semibold text-white">Suporte via WhatsApp</p>
              )}
              <div className="pt-2 text-neutral-400 space-y-1">
                <p className="font-medium text-white">Horário de Atendimento:</p>
                <p>Segunda a Sábado</p>
                <p>08:00 às 19:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PAYMENT BADGES & BOTTOM COPYRIGHT BAR */}
      <div className="border-t border-white/10 bg-black/40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
            {/* Payment methods */}
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="text-[11px] font-semibold text-neutral-400">Formas de Pagamento:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/10 text-white font-bold text-[11px]">
                <CreditCard className="h-3 w-3" />
                Multicaixa Express
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/10 text-white font-bold text-[11px]">
                Transferência Bancária (IBAN)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/10 text-white font-bold text-[11px]">
                Cartão
              </span>
            </div>

            {/* Copyright and Back to Top */}
            <div className="flex items-center gap-4">
              <span>
                © {new Date().getFullYear()} {company.name}. Todos os direitos reservados.
              </span>
              <button
                type="button"
                onClick={scrollToTop}
                className="hover:text-white flex items-center gap-1 font-semibold transition"
              >
                Topo <ArrowUp className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
