import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const url = z.string().url().refine(v => v.startsWith("https://"), "Use um link https").or(z.literal(""));
const text = (n: number) => z.string().max(n);

export const SECTION_IDS = ["hero", "categories", "products", "banner", "testimonials", "text", "newsletter", "faq"] as const;
export type SectionId = typeof SECTION_IDS[number];
export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Banner principal", categories: "Categorias", products: "Produtos", banner: "Promoção / Sobre",
  testimonials: "Testemunhos", text: "Texto livre", newsletter: "Newsletter", faq: "Perguntas frequentes",
};

export const FONT_PAIRS = {
  "dm-sans": { label: "Moderna", heading: "DM Sans", body: "DM Sans" },
  "fraunces-work": { label: "Editorial", heading: "Fraunces", body: "Work Sans" },
  "playfair-lato": { label: "Elegante", heading: "Playfair Display", body: "Lato" },
  "space-grotesk": { label: "Tecnológica", heading: "Space Grotesk", body: "Inter Tight" },
  "bebas-barlow": { label: "Impacto", heading: "Bebas Neue", body: "Barlow" },
  "cormorant-karla": { label: "Boutique", heading: "Cormorant Garamond", body: "Karla" },
  "outfit": { label: "Amigável", heading: "Outfit", body: "Outfit" },
  "syne-jakarta": { label: "Criativa", heading: "Syne", body: "Plus Jakarta Sans" },
} as const;
export type FontPairId = keyof typeof FONT_PAIRS;

export const themeSchema = z.object({
  preset: z.string().max(40).default("minimal"),
  colors: z.object({ primary: hex, background: hex, text: hex, muted: hex, accent: hex, line: hex }),
  radius: z.enum(["square", "soft", "round"]).default("soft"),
  fonts: z.enum(Object.keys(FONT_PAIRS) as [FontPairId, ...FontPairId[]]).optional(),
  brand: z.object({ displayName: text(80), logoUrl: url, tagline: text(140) }),
  announcement: z.object({ enabled: z.boolean(), text: text(160) }),
  hero: z.object({ eyebrow: text(60), title: text(80), subtitle: text(240), cta: text(40), imageUrl: url }),
  banner: z.object({ title: text(80), subtitle: text(200), cta: text(40), imageUrl: url }),
  testimonials: z.array(z.object({ name: text(60), quote: text(280) })).max(8),
  textBlock: z.object({ title: text(80), body: text(1500) }),
  sections: z.array(z.object({ id: z.enum(SECTION_IDS), visible: z.boolean() })).max(SECTION_IDS.length).optional(),
  footer: z.object({ about: text(400), instagram: url, facebook: url, tiktok: url }),
  seo: z.object({ title: text(70), description: text(160), imageUrl: url }),
});
export type StoreTheme = z.infer<typeof themeSchema>;

const baseSections = SECTION_IDS.map(id => ({ id, visible: !["testimonials", "text"].includes(id) }));
const base: StoreTheme = {
  preset: "minimal",
  colors: { primary: "#4169f5", background: "#ffffff", text: "#101114", muted: "#73757b", accent: "#0b0c0e", line: "#e9e9eb" },
  radius: "soft", fonts: "dm-sans",
  brand: { displayName: "", logoUrl: "", tagline: "" },
  announcement: { enabled: true, text: "Entrega rápida · Compra segura e confiável" },
  hero: { eyebrow: "", title: "Produtos que fazem sentido", subtitle: "", cta: "Explorar produtos", imageUrl: "" },
  banner: { title: "Estilo em cada passo.", subtitle: "Qualidade, conforto e muito mais.", cta: "Explorar produtos", imageUrl: "" },
  testimonials: [],
  textBlock: { title: "A nossa história", body: "" },
  sections: baseSections,
  footer: { about: "", instagram: "", facebook: "", tiktok: "" },
  seo: { title: "", description: "", imageUrl: "" },
};

export type PresetCategory = "Geral" | "Moda" | "Casa" | "Luxo" | "Tecnologia" | "Alimentação";

export type PresetDefinition = {
  label: string;
  category: PresetCategory;
  description: string;
  previewImage: string;
  theme: Partial<StoreTheme>;
};

export const PRESET_CATEGORIES: PresetCategory[] = [
  "Geral",
  "Moda",
  "Casa",
  "Luxo",
  "Tecnologia",
  "Alimentação",
];

export const PRESETS: Record<string, PresetDefinition> = {
  minimal: {
    label: "Dawn Minimal",
    category: "Geral",
    description: "Limpo, versátil e focado no catálogo (estilo Shopify Dawn)",
    previewImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "soft",
      fonts: "dm-sans",
      colors: { primary: "#121212", background: "#ffffff", text: "#121212", muted: "#6b7280", accent: "#121212", line: "#e5e7eb" },
      announcement: { enabled: true, text: "Bem-vindo à nossa loja · Envio grátis acima de 50.000 Kz" },
      hero: { eyebrow: "Nova Coleção", title: "Descubra os nossos essenciais", subtitle: "Peças selecionadas com qualidade superior e entrega rápida.", cta: "Ver catálogo", imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  majestic: {
    label: "Majestic Luxo",
    category: "Luxo",
    description: "Interiores e alta gama com contraste escuro e serifas douradas",
    previewImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "square",
      fonts: "playfair-lato",
      colors: { primary: "#c8a45d", background: "#0f1012", text: "#f5f3ee", muted: "#a19d94", accent: "#18191c", line: "#26282d" },
      announcement: { enabled: true, text: "Coleção Exclusiva 2026 · Atendimento personalizado" },
      hero: { eyebrow: "Curadoria de Luxo", title: "Faça da sua casa um refúgio", subtitle: "Design intemporal, materiais nobres e acabamento artesanal.", cta: "Explorar coleção", imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80" },
      banner: { title: "Espaços que definem o seu estilo", subtitle: "Cada peça é escolhida para elevar o ambiente com elegância.", cta: "Descobrir peças", imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80" },
    },
  },
  nook: {
    label: "Nook Editorial",
    category: "Casa",
    description: "Terracota quente e creme para móveis, decoração e lifestyle",
    previewImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "soft",
      fonts: "fraunces-work",
      colors: { primary: "#9e472a", background: "#fbf8f4", text: "#261c17", muted: "#75655d", accent: "#3b2318", line: "#eadfd6" },
      announcement: { enabled: true, text: "Novidades de temporada · Entregas em todo o país" },
      hero: { eyebrow: "Design & Conforto", title: "A arte de viver com estilo", subtitle: "Mobiliário e objetos pensados para transformar o dia a dia.", cta: "Ver seleção", imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  carrara: {
    label: "Carrara Studio",
    category: "Casa",
    description: "Estética arquitetónica em pedra, areia e tons neutros",
    previewImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "square",
      fonts: "cormorant-karla",
      colors: { primary: "#2c2b29", background: "#f5f4f0", text: "#1c1b19", muted: "#737069", accent: "#2c2b29", line: "#e0ddd5" },
      announcement: { enabled: true, text: "Peças esculturais e edição limitada" },
      hero: { eyebrow: "Arquitetura & Forma", title: "Beleza nas linhas simples", subtitle: "Objetos de design com textura natural e presença duradoura.", cta: "Ver galeria", imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  boutique: {
    label: "Modiva Boutique",
    category: "Moda",
    description: "Creme, bordeaux e serifas refinadas para moda e atelier",
    previewImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "square",
      fonts: "cormorant-karla",
      colors: { primary: "#7a1f3d", background: "#faf6f1", text: "#2a1a1f", muted: "#7d6a6f", accent: "#2a1a1f", line: "#eaded3" },
      announcement: { enabled: true, text: "Nova cápsula de estação já disponível" },
      hero: { eyebrow: "Atelier & Moda", title: "Elegância em cada detalhe", subtitle: "Tecidos selecionados, corte impecável e edição limitada.", cta: "Comprar agora", imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  street: {
    label: "Street Drop",
    category: "Moda",
    description: "Contraste forte, tipografia condensada e energia urbana",
    previewImage: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "square",
      fonts: "bebas-barlow",
      colors: { primary: "#f5c400", background: "#f4f4f2", text: "#0a0a0a", muted: "#5d5d5d", accent: "#0a0a0a", line: "#dcdcd8" },
      announcement: { enabled: true, text: "DROP LIMITADO · Envio expresso no mesmo dia" },
      hero: { eyebrow: "Streetwear & Sneakers", title: "Edição limitada na rua", subtitle: "Os lançamentos mais procurados com stock verificado em tempo real.", cta: "Garantir o meu", imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  manara: {
    label: "Manara Artesanal",
    category: "Luxo",
    description: "Carvão profundo e cobre para joalharia, cerâmica e arte",
    previewImage: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "soft",
      fonts: "syne-jakarta",
      colors: { primary: "#d97757", background: "#141414", text: "#f2efe9", muted: "#9a958d", accent: "#1e1e1e", line: "#2b2a28" },
      announcement: { enabled: true, text: "Feito à mão · Peças numeradas" },
      hero: { eyebrow: "Oficina Criativa", title: "Peças únicas feitas à mão", subtitle: "Artesanato contemporâneo com história e autenticidade.", cta: "Explorar peças", imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  tech: {
    label: "Pulse Tech",
    category: "Tecnologia",
    description: "Escuro, elétrico e futurista para gadgets e eletrónica",
    previewImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "soft",
      fonts: "space-grotesk",
      colors: { primary: "#22d3a6", background: "#0e1116", text: "#eef2f6", muted: "#8b95a3", accent: "#151a22", line: "#232a35" },
      announcement: { enabled: true, text: "Garantia oficial · Suporte técnico imediato via WhatsApp" },
      hero: { eyebrow: "Hardware & Inovação", title: "Tecnologia de próxima geração", subtitle: "Equipamentos originais com entrega segura e assistência dedicada.", cta: "Ver equipamentos", imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  hiper: {
    label: "Hiper Retalho",
    category: "Geral",
    description: "Alta conversão para lojas multiproduto e promoções frequentes",
    previewImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "soft",
      fonts: "outfit",
      colors: { primary: "#2563eb", background: "#ffffff", text: "#0f172a", muted: "#64748b", accent: "#1e293b", line: "#e2e8f0" },
      announcement: { enabled: true, text: "Super Semana · Descontos até 30% em artigos selecionados" },
      hero: { eyebrow: "Ofertas da Semana", title: "Tudo o que precisa num só lugar", subtitle: "Preços diretos, checkout rápido e acompanhamento em tempo real.", cta: "Aproveitar ofertas", imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  memorando: {
    label: "Memorando Desk",
    category: "Tecnologia",
    description: "Organização, papelaria e acessórios de trabalho minimalistas",
    previewImage: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "soft",
      fonts: "dm-sans",
      colors: { primary: "#7c2d12", background: "#faf9f7", text: "#1c1917", muted: "#78716c", accent: "#292524", line: "#e7e5e4" },
      announcement: { enabled: true, text: "Essenciais de escritório · Kits corporativos disponíveis" },
      hero: { eyebrow: "Workspace & Foco", title: "Essenciais para o trabalho diário", subtitle: "Acessórios funcionais que trazem clareza à sua secretária.", cta: "Explorar kits", imageUrl: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  mercado: {
    label: "Mercado Orgânico",
    category: "Alimentação",
    description: "Quente, verde e terracota para produtos frescos e gourmet",
    previewImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "round",
      fonts: "outfit",
      colors: { primary: "#c2522d", background: "#fffaf2", text: "#1f2a1c", muted: "#6b7464", accent: "#2f5d3a", line: "#ece3d2" },
      announcement: { enabled: true, text: "100% Fresco · Entregas diárias na sua zona" },
      hero: { eyebrow: "Do Produtor à Mesa", title: "Sabores autênticos todos os dias", subtitle: "Ingredientes selecionados com origem garantida e entrega rápida.", cta: "Encomendar agora", imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80" },
    },
  },
  evervale: {
    label: "Evervale Botânica",
    category: "Alimentação",
    description: "Verde salva sereno para cosmética natural, chá e bem-estar",
    previewImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    theme: {
      radius: "round",
      fonts: "fraunces-work",
      colors: { primary: "#2d5a43", background: "#f6f8f5", text: "#1b2e24", muted: "#62756a", accent: "#1f3d2e", line: "#dce4db" },
      announcement: { enabled: true, text: "Fórmulas naturais e sustentáveis · Testado e aprovado" },
      hero: { eyebrow: "Cuidado Natural", title: "Equilíbrio puro para o seu dia", subtitle: "Cosmética botânica e bem-estar com ingredientes limpos.", cta: "Descobrir linha", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80" },
    },
  },
};

export function defaultTheme(): StoreTheme { return structuredClone(base); }

/** Fills any missing keys with defaults so older or partial themes always render. */
export function normalizeTheme(input: unknown): StoreTheme {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const d = defaultTheme();
  const merged = { ...d, ...raw } as Record<string, unknown>;
  for (const k of ["colors", "brand", "announcement", "hero", "banner", "textBlock", "footer", "seo"] as const) merged[k] = { ...(d[k] as object), ...((raw[k] as object) ?? {}) };
  const parsed = themeSchema.safeParse(merged);
  const t = parsed.success ? parsed.data : d;
  const listed = (t.sections ?? []).filter((s, i, a) => a.findIndex(x => x.id === s.id) === i);
  t.sections = [...listed, ...baseSections.filter(s => !listed.some(x => x.id === s.id))];
  return t;
}

export function applyPreset(current: StoreTheme, presetId: string, applyContent = false): StoreTheme {
  const p = PRESETS[presetId]; if (!p) return current;
  const pt = p.theme;
  return normalizeTheme({
    ...current,
    preset: presetId,
    radius: pt.radius ?? current.radius,
    fonts: pt.fonts ?? current.fonts,
    colors: { ...defaultTheme().colors, ...(pt.colors ?? {}) },
    ...(applyContent
      ? {
          announcement: pt.announcement ?? current.announcement,
          hero: { ...current.hero, ...(pt.hero ?? {}) },
          banner: { ...current.banner, ...(pt.banner ?? {}) },
        }
      : {}),
  });
}

export function moveSection(sections: NonNullable<StoreTheme["sections"]>, index: number, delta: number) {
  const next = [...sections]; const to = index + delta;
  if (to < 0 || to >= next.length) return next;
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

export function themeCssVars(t: StoreTheme): Record<string, string> {
  const f = FONT_PAIRS[t.fonts ?? "dm-sans"];
  return {
    "--store-ink": t.colors.text, "--store-muted": t.colors.muted, "--store-blue": t.colors.primary, "--store-line": t.colors.line,
    "--store-bg": t.colors.background, "--store-accent": t.colors.accent,
    "--store-radius": t.radius === "square" ? "2px" : t.radius === "round" ? "22px" : "10px",
    "--store-font-heading": `"${f.heading}", system-ui, sans-serif`, "--store-font-body": `"${f.body}", system-ui, sans-serif`,
  };
}

export function fontHref(id: FontPairId | undefined) {
  const f = FONT_PAIRS[id ?? "dm-sans"];
  const fam = [...new Set([f.heading, f.body])].map(n => `family=${n.replace(/ /g, "+")}:wght@400;500;600;700`).join("&");
  return `https://fonts.googleapis.com/css2?${fam}&display=swap`;
}

/** Plan gates (UI). The server strips the same keys on publish. */
export function themeAccess(features: string[]) {
  return { sections: features.includes("analytics"), fonts: features.includes("analytics"), versions: features.includes("sales") };
}
