import { Check, Lock, Sparkles } from "lucide-react";
import {
  FONT_PAIRS,
  PRESETS,
  applyPreset,
  type FontPairId,
  type StoreTheme,
} from "@/lib/storeTheme";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ThemeSettingsPanelProps {
  theme: StoreTheme;
  onChange: (next: StoreTheme) => void;
  canEditFonts: boolean;
  companyName: string;
  companySlug: string;
}

const COLOR_FIELDS: Array<{
  key: keyof StoreTheme["colors"];
  label: string;
  hint: string;
}> = [
  { key: "primary", label: "Cor principal", hint: "Botões e destaques" },
  { key: "background", label: "Fundo", hint: "Fundo geral da loja" },
  { key: "text", label: "Texto principal", hint: "Títulos e parágrafos" },
  { key: "muted", label: "Texto secundário", hint: "Legendas e subtítulos" },
  { key: "accent", label: "Barra / Acento", hint: "Barra de anúncios" },
  { key: "line", label: "Linhas e bordas", hint: "Divisórias e cards" },
];

const RADIUS_OPTIONS: Array<{
  id: StoreTheme["radius"];
  label: string;
  previewClass: string;
}> = [
  { id: "square", label: "Quadrado", previewClass: "rounded-[2px]" },
  { id: "soft", label: "Suave", previewClass: "rounded-[8px]" },
  { id: "round", label: "Arredondado", previewClass: "rounded-[18px]" },
];

export function ThemeSettingsPanel({
  theme,
  onChange,
  canEditFonts,
  companyName,
  companySlug,
}: ThemeSettingsPanelProps) {
  const updateColor = (key: keyof StoreTheme["colors"], value: string) => {
    onChange({
      ...theme,
      colors: { ...theme.colors, [key]: value },
    });
  };

  const updateSeo = (patch: Partial<StoreTheme["seo"]>) => {
    onChange({
      ...theme,
      seo: { ...theme.seo, ...patch },
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Presets */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Estilos de Tema
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
            <Sparkles className="h-3 w-3" /> 1 clique
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(PRESETS).map(([id, preset]) => {
            const active = theme.preset === id;
            const colors = preset.theme.colors ?? {
              primary: "#4169f5",
              background: "#ffffff",
              text: "#101114",
              accent: "#0b0c0e",
            };
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(applyPreset(theme, id))}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-2.5 text-left transition",
                  active
                    ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      {preset.label}
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {preset.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center -space-x-1 pl-2">
                  {[colors.background, colors.primary, colors.text].map((hex, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-slate-300/80 shadow-2xs"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Colors */}
      <section className="border-t border-slate-200 pt-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Paleta de Cores
        </h3>
        <div className="space-y-2.5">
          {COLOR_FIELDS.map((field) => {
            const val = theme.colors[field.key];
            return (
              <div
                key={field.key}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{field.label}</p>
                  <p className="text-[10px] text-slate-400">{field.hint}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    aria-label={field.label}
                    value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : "#000000"}
                    onChange={(e) => updateColor(field.key, e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded-md border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={val}
                    maxLength={7}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(next)) {
                        updateColor(field.key, next);
                      }
                    }}
                    className="w-[70px] rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 font-mono text-[11px] uppercase text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Typography */}
      <section className="border-t border-slate-200 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tipografia
          </h3>
          {!canEditFonts && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
              <Lock className="h-2.5 w-2.5" /> Plano Pro
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(FONT_PAIRS) as Array<[FontPairId, (typeof FONT_PAIRS)[FontPairId]]>).map(
            ([id, pair]) => {
              const active = (theme.fonts ?? "dm-sans") === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!canEditFonts}
                  onClick={() => onChange({ ...theme, fonts: id })}
                  className={cn(
                    "rounded-xl border p-2.5 text-left transition",
                    active
                      ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-300",
                    !canEditFonts && "cursor-not-allowed opacity-60"
                  )}
                >
                  <p className="text-xs font-bold text-slate-900">{pair.label}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {pair.heading}
                  </p>
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* Radius */}
      <section className="border-t border-slate-200 pt-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Estilo dos Cantos
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {RADIUS_OPTIONS.map((opt) => {
            const active = theme.radius === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...theme, radius: opt.id })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition",
                  active
                    ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <span
                  className={cn(
                    "h-5 w-8 border-2 border-slate-700 bg-slate-100",
                    opt.previewClass
                  )}
                />
                <span className="text-[11px] font-semibold text-slate-800">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SEO */}
      <section className="border-t border-slate-200 pt-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          SEO & Partilha Social
        </h3>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-700">
            Título da página
          </label>
          <Input
            value={theme.seo.title}
            maxLength={70}
            onChange={(e) => updateSeo({ title: e.target.value })}
            placeholder={`${companyName} — Loja Online`}
            className="h-9 text-xs"
          />
          <p className="mt-1 text-right text-[10px] text-slate-400">
            {theme.seo.title.length}/70
          </p>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-700">
            Descrição meta
          </label>
          <Textarea
            value={theme.seo.description}
            maxLength={160}
            rows={2}
            onChange={(e) => updateSeo({ description: e.target.value })}
            placeholder="Descubra os nossos produtos com entrega rápida."
            className="text-xs resize-none"
          />
          <p className="mt-1 text-right text-[10px] text-slate-400">
            {theme.seo.description.length}/160
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Pré-visualização Google
          </p>
          <p className="truncate text-[11px] text-emerald-700">
            vendora.cachiluvia.com/loja/{companySlug}
          </p>
          <p className="truncate text-sm font-medium text-blue-700">
            {theme.seo.title || `${companyName} — Loja Online`}
          </p>
          <p className="line-clamp-2 text-xs text-slate-600 mt-0.5">
            {theme.seo.description ||
              "Compre online com segurança, stock atualizado em tempo real e atendimento via WhatsApp."}
          </p>
        </div>
      </section>
    </div>
  );
}
