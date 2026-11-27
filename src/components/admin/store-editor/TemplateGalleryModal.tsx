import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import {
  PRESETS,
  PRESET_CATEGORIES,
  applyPreset,
  type PresetCategory,
  type StoreTheme,
} from "@/lib/storeTheme";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TemplateGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTheme: StoreTheme;
  onApply: (next: StoreTheme) => void;
}

export function TemplateGalleryModal({
  open,
  onOpenChange,
  currentTheme,
  onApply,
}: TemplateGalleryModalProps) {
  const [category, setCategory] = useState<PresetCategory | "Todos">("Todos");
  const [applyContent, setApplyContent] = useState(true);

  const entries = Object.entries(PRESETS).filter(
    ([, p]) => category === "Todos" || p.category === category
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Galeria de Templates de Loja
              </DialogTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Escolha um template profissional inspirado nas melhores lojas Shopify & Wix para o seu nicho.
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={applyContent}
                onChange={(e) => setApplyContent(e.target.checked)}
                className="rounded border-slate-300"
              />
              Incluir textos e imagens de exemplo
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(["Todos", ...PRESET_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  category === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(([id, preset]) => {
              const active = currentTheme.preset === id;
              const c = preset.theme.colors ?? {
                primary: "#4169f5",
                background: "#ffffff",
                text: "#101114",
                accent: "#0b0c0e",
              };
              return (
                <div
                  key={id}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:shadow-lg",
                    active ? "border-slate-900 ring-2 ring-slate-900/15" : "border-slate-200"
                  )}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                    <img
                      src={preset.previewImage}
                      alt={preset.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-3.5"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.72) 100%)",
                      }}
                    >
                      <span className="inline-block w-fit rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-1">
                        {preset.category}
                      </span>
                      <p className="text-sm font-bold text-white leading-tight">
                        {preset.theme.hero?.title || preset.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{preset.label}</h4>
                        <div className="flex items-center -space-x-1">
                          {[c.background, c.primary, c.text].map((hex, i) => (
                            <span
                              key={i}
                              className="h-3.5 w-3.5 rounded-full border border-slate-300"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {preset.description}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={active ? "outline" : "default"}
                      onClick={() => {
                        onApply(applyPreset(currentTheme, id, applyContent));
                        onOpenChange(false);
                      }}
                      className={cn(
                        "mt-4 w-full text-xs font-semibold",
                        !active && "bg-slate-900 hover:bg-slate-800 text-white"
                      )}
                    >
                      {active ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                          Template ativo
                        </>
                      ) : (
                        "Aplicar template"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
