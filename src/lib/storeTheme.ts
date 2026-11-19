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

export const PRESETS: Record<string, { label: string; description: string; theme: Partial<StoreTheme> }> = {
  minimal: { label: "Minimal", description: "Limpo, branco e azul", theme: {} },
  boutique: { label: "Boutique", description: "Creme, bordeaux e serifas", theme: { radius: "square", fonts: "cormorant-karla", colors: { primary: "#7a1f3d", background: "#faf6f1", text: "#2a1a1f", muted: "#7d6a6f", accent: "#2a1a1f", line: "#eaded3" } } },
  mercado: { label: "Mercado", description: "Quente, verde e terracota", theme: { radius: "round", fonts: "outfit", colors: { primary: "#c2522d", background: "#fffaf2", text: "#1f2a1c", muted: "#6b7464", accent: "#2f5d3a", line: "#ece3d2" } } },
  tech: { label: "Tecnologia", description: "Escuro e elétrico", theme: { radius: "soft", fonts: "space-grotesk", colors: { primary: "#22d3a6", background: "#0e1116", text: "#eef2f6", muted: "#8b95a3", accent: "#151a22", line: "#232a35" } } },
  street: { label: "Street", description: "Contraste forte e amarelo", theme: { radius: "square", fonts: "bebas-barlow", colors: { primary: "#f5c400", background: "#f4f4f2", text: "#0a0a0a", muted: "#5d5d5d", accent: "#0a0a0a", line: "#dcdcd8" } } },
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

export function applyPreset(current: StoreTheme, presetId: string): StoreTheme {
  const p = PRESETS[presetId]; if (!p) return current;
  return normalizeTheme({ ...current, ...p.theme, preset: presetId, colors: { ...defaultTheme().colors, ...(p.theme.colors ?? {}) } });
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
