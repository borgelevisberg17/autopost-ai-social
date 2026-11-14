import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUp,
  HelpCircle,
  Mail,
  MessageCircle,
  PackageCheck,
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

/**
 * Multicaixa Express official vector logo component.
 * Inlined to guarantee 100% reliable rendering without mask or image sandbox issues.
 */
function MulticaixaExpressLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 42"
      width="100"
      height="18"
      style={{ height: "18px", width: "auto" }}
      className={className || "h-[18px] w-auto max-w-[100px] shrink-0"}
      fill="none"
    >
      {/* MULTICAIXA WORDMARK */}
      <path
        d="M120.589 21.737v-1.378h-7.172v-5.563h-1.39v14.833c0 2.119 1.73 3.84 3.865 3.84h11.738v-1.59h-12.143c-1.119 0-2.07-.757-2.07-2.01v-8.132h7.172zm34.433 11.732v-3.266h-14.758c-.555 0-.931-.328-.931-.887v-10.52c0-.552.331-.925.893-.925h11.68v4.84h3.116v-7.917h-14.649c-2.316.133-4.152 2.043-4.152 4.375v9.916c0 2.42 1.976 4.384 4.415 4.384h14.386zM92.927 14.796v14.833c0 2.119 1.73 3.84 3.864 3.84h11.74v-1.59H96.39c-1.122 0-2.071-.757-2.071-2.01V14.795h-1.39zm-5.095 0v17.29H77.48c-1.121 0-2.069-.755-2.069-2.01v-15.28H73.83v14.833c0 2.121 1.728 3.84 3.865 3.84H89.43V14.796h-1.599zM59.45 33.469h1.599V18.23c0-1.114.762-2.053 2.024-2.053h3.61c1.118 0 2.067.755 2.067 2.01V33.47h1.583V18.631c0-2.12-1.733-3.837-3.866-3.837h-3.151a3.868 3.868 0 00-3.067 1.502 3.864 3.864 0 00-3.064-1.502H54.03c-2.135 0-3.864 1.718-3.864 3.837v14.838h1.599V18.23c0-1.114.76-2.053 2.024-2.053h3.607c1.12 0 2.07.755 2.07 2.01v.087c-.01.12-.017.24-.017.358V33.47zm71.677 0h1.6V14.796h-1.6v18.673zm0-21.437h1.6V8.935h-1.6v3.097zm75.11 2.773h-3.29v3.888c0 .552-.33.925-.891.925h-10.59c-.559 0-.933-.328-.933-.887v-3.926h-3.097v3.78c.136 2.301 2.057 4.124 4.405 4.124h9.983c2.437 0 4.413-1.966 4.413-4.385v-3.52zm-18.8 18.664h3.286v-5.58c0-.55.331-.923.894-.923h10.587c.56 0 .936.326.936.885v5.618h3.097v-5.473c-.136-2.3-2.057-4.123-4.405-4.123h-9.985c-2.435 0-4.41 1.964-4.41 4.384v5.212zm-13.438-14.137v14.137h3.321V19.176c0-2.423-1.976-4.382-4.413-4.382h-9.982c-2.349 0-4.268 1.822-4.404 4.122v10.178c0 2.33 1.834 4.242 4.15 4.375h9.914v-3.086l-10.06.009c-.069 0-.136-.005-.2-.016-.44-.08-.695-.425-.695-.912v-1.617l-.011-9.075c0-.56.375-.888.931-.888h10.59c.56 0 .892.37.892.926l-.033.522zm51.212 0v14.137h3.322V19.176c0-2.423-1.975-4.382-4.412-4.382h-9.983c-2.348 0-4.266 1.822-4.403 4.122v10.178c0 2.33 1.836 4.242 4.15 4.375h9.914v-3.086l-10.064.009c-.067 0-.134-.005-.196-.016-.44-.08-.695-.425-.695-.912v-1.617l-.013-9.075c0-.56.374-.888.932-.888h10.589c.564 0 .895.37.895.926l-.036.522zm-44.394-7.3h3.12V8.935h-3.12v3.097zm0 21.437h3.12V14.805h-3.12v18.664z"
        fill="#002133"
      />
      {/* ORANGE FLOWER LAYER */}
      <path
        d="M15.088 21.016c0 3.396 2.772 6.15 6.191 6.15 3.42 0 6.192-2.754 6.192-6.15 0-3.398-2.772-6.152-6.192-6.152-3.419 0-6.19 2.754-6.19 6.152m-9.701-1.557c-.62-.625-1.093-1.393-1.316-2.222l-1.258-4.66c-.57-2.112.692-3.823 2.817-3.823h5.523c.006-.878.219-1.753.65-2.498l2.43-4.177c1.098-1.893 3.209-2.218 4.71-.724l3.907 3.879c.629-.617 1.402-1.086 2.236-1.31L29.78 2.677c2.125-.566 3.848.687 3.848 2.798v5.486c.884.008 1.765.217 2.513.647l4.206 2.412c1.906 1.092 2.232 3.189.73 4.682l-3.81 3.784c.637.633 1.124 1.414 1.352 2.258l1.258 4.662c.568 2.11-.694 3.82-2.818 3.82h-5.387c0 .897-.213 1.79-.652 2.549l-2.429 4.178c-1.1 1.893-3.21 2.217-4.711.724l-3.811-3.785c-.637.634-1.423 1.117-2.273 1.343l-4.693 1.25c-2.124.565-3.846-.688-3.846-2.8v-5.612c-.991.048-1.998-.16-2.838-.64l-4.206-2.413c-1.905-1.092-2.231-3.189-.728-4.68l3.904-3.88"
        fill="#FF7C00"
      />
      {/* RED PETALS LAYER */}
      <path
        d="M13.339 13.156h-7.63l-.2-.764c-.132-.498.124-.79.62-.79h5.62l1.59 1.554zm7.945-.597a8.624 8.624 0 00-3.698.856l-3.79-3.765c-.355-.352-.389-.854-.131-1.295l1.622-2.767 6.002 5.96-.005 1.011zm.018-2.674l-5.386-5.368.394-.672c.26-.444.65-.471 1-.122l3.974 3.946.018 2.216zm6.043 5.16a8.565 8.565 0 00-3.223-1.994V7.726c0-.495.334-.877.829-1.006l3.116-.818v8.43l-.722.713zm1.918-1.88V5.586l.77-.198c.499-.131.795.122.795.615v5.583l-1.565 1.579zm.6 7.894a8.498 8.498 0 00-.861-3.674l3.79-3.766c.354-.351.86-.386 1.303-.129l2.786 1.612-6.001 5.96-1.018-.003zm2.693.018l5.404-5.35.676.39c.446.259.474.646.123.994l-3.973 3.948-2.23.018zm-5.194 6.002a8.51 8.51 0 002.006-3.202h5.36c.5 0 .883.332 1.013.823l.823 3.098h-8.486l-.716-.719zm1.892 1.905l7.628.012.2.753c.133.496-.125.788-.619.788h-5.62l-1.59-1.553zm-7.947.597a8.633 8.633 0 003.7-.856l3.789 3.766c.353.35.39.854.13 1.294l-1.622 2.767-6.001-5.96.004-1.011zm-.017 2.675l5.385 5.367-.394.673c-.26.444-.649.471-1 .124l-3.974-3.95-.017-2.214zm-6.043-5.16a8.568 8.568 0 003.224 1.993v5.326c0 .496-.335.876-.83 1.007l-3.118.816v-8.43l.724-.711zm-1.917 1.88v7.578l-.771.198c-.499.132-.794-.122-.794-.616v-5.581l1.565-1.58zm-.602-7.895a8.483 8.483 0 00.861 3.675L9.8 28.52c-.353.351-.86.386-1.302.13L5.71 27.037l6.002-5.96 1.016.003zm-2.692-.017l-5.403 5.351-.677-.393c-.447-.259-.475-.645-.124-.993l3.973-3.948 2.231-.017zm5.194-6.004a8.526 8.526 0 00-2.007 3.203h-5.36c-.5 0-.883-.33-1.013-.824l-.823-3.095h8.486l.717.716z"
        fill="#F00041"
      />
      {/* EXPRESS BADGE */}
      <g transform="translate(230, 8)">
        <rect x="0" y="3" width="46" height="22" rx="4" fill="#F00041" />
        <text
          x="23"
          y="18"
          fontFamily="-apple-system, BlinkMacSystemFont, Arial, sans-serif"
          fontSize="10"
          fontWeight="900"
          fontStyle="italic"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          EXPRESS
        </text>
      </g>
    </svg>
  );
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
    <footer id="contacto" className="bg-[#0b0c10] text-white mt-12 sm:mt-20">
      {/* 1. NATURAL FISCAL & INSTITUTIONAL NOTICE (NO CARD, NO EYEBROW, NO TAGS) */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl space-y-3.5 text-xs sm:text-sm text-neutral-400 leading-relaxed">
          <p>
            A <strong className="text-white font-semibold">{company.name}</strong> opera em rigorosa conformidade com o regime comercial e tributário da República de Angola, assegurando faturação fiscal certificada perante a <strong className="text-white">AGT</strong> em todas as transações, com emissão de fatura/recibo e inclusão facultativa de NIF singular ou coletivo. Todos os produtos apresentados no catálogo beneficiam de garantia de autenticidade e reserva imediata de stock no momento da finalização do pedido.
          </p>
          <p>
            As expedições para Luanda e restantes províncias são processadas via operadores logísticos certificados, cumprindo prazos rigorosos com acompanhamento em tempo real. Asseguramos o direito legal de troca ou devolução no prazo de até 7 dias corridos após a receção, salvaguardando a integridade do artigo e da embalagem original. O apoio ao cliente e pós-venda é prestado de forma direta e dedicada através dos nossos canais oficiais de WhatsApp.
          </p>
        </div>
      </div>

      {/* 2. NEWSLETTER VIP CLUB ROW WITH SNEAKER BACKGROUND IMAGE */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          {/* Background image & dark ambient vignette */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=80"
              alt="Footwear VIP Club"
              className="h-full w-full object-cover object-center filter brightness-[0.25] contrast-[1.1] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/90 to-[#0b0c10]/70" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0b0c10]/80" />
          </div>

          {/* Foreground content */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl text-left space-y-2">
              <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                CLUBE VIP · {company.name.toUpperCase()}
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                Fique por dentro dos lançamentos e drops exclusivos
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-lg">
                Subscreva para receber acesso prioritário a reposições, descontos privados e lançamentos da loja.
              </p>
            </div>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-md w-full"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Insira o seu melhor e-mail..."
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white outline-none placeholder:text-neutral-400 focus:border-white focus:bg-white/15 transition"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-6 rounded-full bg-white hover:bg-neutral-200 text-[#0c0d11] font-bold text-xs sm:text-sm active:scale-95 transition shrink-0 flex items-center justify-center gap-2 shadow-lg"
              >
                Subscrever <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION COLUMNS - Responsive 2-col on mobile */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand Info (Full width on mobile, col-span-4 on desktop) */}
          <div className="col-span-2 lg:col-span-4 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white text-black font-extrabold text-lg sm:text-xl flex items-center justify-center tracking-tight">
                {company.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                {company.name}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
              {company.description ||
                "A sua referência em calçados, sneakers e estilo urbano. Curadoria selecionada para oferecer estilo, durabilidade e conforto em cada passo."}
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Loja online ativa em Angola</span>
            </div>

            {whatsappNumber && (
              <div className="pt-1.5">
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

          {/* Categories (Col 1 on mobile, col-span-3 on desktop) */}
          <div className="col-span-1 lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Categorias
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-300">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.name}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.name)}
                      className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1.5 text-left"
                    >
                      <ArrowRight className="h-3 w-3 text-neutral-500 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Sneakers")}
                      className="hover:text-white transition"
                    >
                      Sneakers & Ténis
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Casual")}
                      className="hover:text-white transition"
                    >
                      Casual & Urbano
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Sociais")}
                      className="hover:text-white transition"
                    >
                      Sapatos Sociais
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Chinelos")}
                      className="hover:text-white transition"
                    >
                      Chinelos & Slides
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("Acessórios")}
                      className="hover:text-white transition"
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
                  className="text-neutral-300 hover:text-white hover:underline font-semibold text-xs sm:text-sm text-left"
                >
                  Ver todos →
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Help (Col 2 on mobile, col-span-3 on desktop) */}
          <div className="col-span-1 lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Ajuda & Suporte
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("faq")}
                  className="hover:text-white text-neutral-300 font-semibold transition flex items-center gap-1.5 text-left"
                >
                  <HelpCircle className="h-3 w-3 text-neutral-300 shrink-0" />
                  <span className="truncate">Perguntas Frequentes (FAQ)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("produtos")}
                  className="hover:text-white transition flex items-center gap-1.5 text-left"
                >
                  <PackageCheck className="h-3 w-3 text-neutral-500 shrink-0" />
                  <span className="truncate">Como encomendar</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("sobre")}
                  className="hover:text-white transition text-left"
                >
                  Prazos e envio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("sobre")}
                  className="hover:text-white transition text-left"
                >
                  Trocas e Devoluções
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("produtos")}
                  className="hover:text-white transition text-left"
                >
                  Guia de Tamanhos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.("pedidos")}
                  className="hover:text-white transition text-left"
                >
                  Consultar pedidos
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Hours (Full width on mobile, col-span-2 on desktop) */}
          <div className="col-span-2 lg:col-span-2 space-y-2.5 pt-2 lg:pt-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Contacto Direto
            </h4>
            <div className="space-y-1.5 text-xs text-neutral-300">
              <p className="text-neutral-400">Fale connosco:</p>
              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-bold text-white hover:text-white transition"
                >
                  +{whatsappNumber}
                </a>
              ) : (
                <p className="font-semibold text-white">Suporte via WhatsApp</p>
              )}
              <div className="pt-2 text-neutral-400 space-y-0.5">
                <p className="font-medium text-white">Atendimento:</p>
                <p>Segunda a Sábado</p>
                <p>08:00 às 19:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PAYMENT BADGES & BOTTOM COPYRIGHT BAR */}
      <div className="bg-black/30 pt-6 sm:pt-8 pb-28 sm:pb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Payment methods: Label on top row, logos on row below (no hover effect) */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                Formas de Pagamento
              </span>
              <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
                {/* Multicaixa Express (Official vector logo) */}
                <div
                  title="Multicaixa Express"
                  className="h-8 min-w-[95px] px-2.5 py-1 bg-white rounded-md flex items-center justify-center shadow-xs shrink-0 select-none"
                >
                  <MulticaixaExpressLogo className="h-[18px] w-auto max-w-[100px] shrink-0" />
                </div>

                {/* Transferência Bancária (IBAN) - Robust React DOM Emblem */}
                <div
                  title="Transferência Bancária (IBAN)"
                  className="h-8 px-2.5 py-1 bg-white rounded-md flex items-center gap-1.5 shadow-xs shrink-0 select-none"
                >
                  <svg
                    viewBox="0 0 28 28"
                    width="18"
                    height="18"
                    style={{ width: "18px", height: "18px" }}
                    className="w-[18px] h-[18px] text-[#002133] shrink-0"
                    fill="currentColor"
                  >
                    <polygon points="14,2 1,9 27,9" />
                    <rect x="2" y="10" width="24" height="2" rx="0.5" />
                    <rect x="4" y="13" width="3" height="8" rx="0.5" />
                    <rect x="10" y="13" width="3" height="8" rx="0.5" />
                    <rect x="15" y="13" width="3" height="8" rx="0.5" />
                    <rect x="21" y="13" width="3" height="8" rx="0.5" />
                    <rect x="1" y="22" width="26" height="2.5" rx="0.5" />
                    <rect x="3" y="25" width="22" height="1.5" rx="0.5" />
                  </svg>
                  <div className="flex flex-col justify-center leading-none">
                    <span className="font-black text-[11px] text-[#002133] tracking-wider leading-none">
                      IBAN
                    </span>
                    <span className="font-bold text-[7px] text-[#0070BA] tracking-tight leading-none mt-0.5 uppercase">
                      Transferência
                    </span>
                  </div>
                </div>

                {/* Visa */}
                <div
                  title="Cartão Visa"
                  className="h-8 px-2.5 py-1 bg-white rounded-md flex items-center justify-center shadow-xs shrink-0 select-none"
                >
                  <img
                    src="/media/payments/visa.svg"
                    alt="Visa"
                    width="38"
                    height="13"
                    style={{ height: "13px", width: "auto" }}
                    className="h-[13px] w-auto max-w-[42px] object-contain shrink-0"
                  />
                </div>

                {/* Mastercard */}
                <div
                  title="Cartão Mastercard"
                  className="h-8 px-2.5 py-1 bg-white rounded-md flex items-center justify-center shadow-xs shrink-0 select-none"
                >
                  <img
                    src="/media/payments/mastercard.svg"
                    alt="Mastercard"
                    width="28"
                    height="18"
                    style={{ height: "18px", width: "auto" }}
                    className="h-[18px] w-auto max-w-[34px] object-contain shrink-0"
                  />
                </div>

                {/* PayPal */}
                <div
                  title="PayPal"
                  className="h-8 px-2.5 py-1 bg-white rounded-md flex items-center justify-center shadow-xs shrink-0 select-none"
                >
                  <img
                    src="/media/payments/paypal.svg"
                    alt="PayPal"
                    width="56"
                    height="15"
                    style={{ height: "15px", width: "auto" }}
                    className="h-[15px] w-auto max-w-[62px] object-contain shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Copyright and Back to Top */}
            <div className="flex items-center justify-between md:justify-end gap-4 text-xs text-neutral-400 pt-2 md:pt-0">
              <span>
                © {new Date().getFullYear()} {company.name}. Todos os direitos reservados.
              </span>
              <button
                type="button"
                onClick={scrollToTop}
                className="hover:text-white flex items-center gap-1.5 font-semibold text-xs py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition"
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
