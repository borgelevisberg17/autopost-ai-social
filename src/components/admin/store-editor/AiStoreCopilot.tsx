import { useState } from "react";
import { Loader2, RotateCcw, Send, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  PRESETS,
  SECTION_IDS,
  applyPreset,
  normalizeTheme,
  type SectionId,
  type StoreTheme,
} from "@/lib/storeTheme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EditorNodeId } from "./SectionInspector";

interface AiStoreCopilotProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  currentTheme: StoreTheme;
  selectedSection: EditorNodeId;
  onApplyTheme: (next: StoreTheme) => void;
  onFocusSection?: (section: EditorNodeId) => void;
}

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  areas?: string[];
  previousTheme?: StoreTheme;
};

const QUICK_ACTIONS = [
  {
    label: "Criar loja completa para o meu negócio",
    mode: "generate" as const,
    prompt:
      "Cria uma identidade visual completa, escolhe o melhor template e imagem, escreve textos de destaque, barra de anúncios, testemunhos e SEO perfeitos para os meus produtos.",
  },
  {
    label: "Auditoria UX & Conversão automática",
    mode: "refine" as const,
    prompt:
      "Faz uma auditoria completa à minha loja atual: corrige textos genéricos, melhora o contraste se necessário, ativa secções de confiança e otimiza o SEO para vender mais.",
  },
  {
    label: "Estilo luxo escuro & sofisticado",
    mode: "refine" as const,
    prompt:
      "Transforma a loja num estilo luxuoso e sofisticado com fundo escuro, detalhes dourados, fotografia adequada e tipografia editorial.",
  },
  {
    label: "Reordenar secções para alta conversão",
    mode: "refine" as const,
    prompt:
      "Reordena as secções da página para máxima conversão: banner principal, produtos em destaque, testemunhos visíveis, banner promocional e FAQ.",
  },
];

function mergeThemePatch(
  current: StoreTheme,
  patch: Record<string, unknown>
): StoreTheme {
  let base = current;

  if (typeof patch.preset === "string" && PRESETS[patch.preset]) {
    base = applyPreset(base, patch.preset, false);
  }

  const next: Record<string, unknown> = { ...base };

  if (patch.fonts) next.fonts = patch.fonts;
  if (patch.radius) next.radius = patch.radius;

  for (const key of [
    "colors",
    "brand",
    "announcement",
    "hero",
    "banner",
    "textBlock",
    "footer",
    "seo",
  ] as const) {
    if (patch[key] && typeof patch[key] === "object") {
      next[key] = {
        ...(base[key] as Record<string, unknown>),
        ...(patch[key] as Record<string, unknown>),
      };
    }
  }

  if (Array.isArray(patch.testimonials) && patch.testimonials.length > 0) {
    next.testimonials = patch.testimonials;
  }

  // Reorder & toggle sections if AI requested
  const baseSections = base.sections ?? SECTION_IDS.map((id) => ({ id, visible: true }));
  const visibilityMap = new Map(baseSections.map((s) => [s.id, s.visible]));

  if (patch.sections_visibility && typeof patch.sections_visibility === "object") {
    for (const [k, v] of Object.entries(patch.sections_visibility as Record<string, unknown>)) {
      if (SECTION_IDS.includes(k as SectionId) && typeof v === "boolean") {
        visibilityMap.set(k as SectionId, v);
      }
    }
  }

  if (Array.isArray(patch.sections_order) && patch.sections_order.length > 0) {
    const validOrder = patch.sections_order.filter((id): id is SectionId =>
      SECTION_IDS.includes(id as SectionId)
    );
    const remaining = baseSections
      .map((s) => s.id)
      .filter((id) => !validOrder.includes(id));
    next.sections = [...validOrder, ...remaining].map((id) => ({
      id,
      visible: visibilityMap.get(id) ?? true,
    }));
  } else if (patch.sections_visibility) {
    next.sections = baseSections.map((s) => ({
      id: s.id,
      visible: visibilityMap.get(s.id) ?? s.visible,
    }));
  }

  return normalizeTheme(next);
}

export function AiStoreCopilot({
  open,
  onClose,
  companyId,
  companyName,
  currentTheme,
  selectedSection,
  onApplyTheme,
  onFocusSection,
}: AiStoreCopilotProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  if (!open) return null;

  const runPrompt = async (
    text: string,
    mode: "generate" | "refine" = "refine"
  ) => {
    const clean = text.trim();
    if (!clean || loading) return;

    const snapshotBefore = currentTheme;
    setMessages((prev) => [...prev, { role: "user", text: clean }]);
    setPrompt("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "store-builder-ai",
        {
          body: {
            company_id: companyId,
            prompt: clean,
            mode,
            selected_section: selectedSection,
            current_theme: currentTheme,
          },
        }
      );

      if (error || data?.error) {
        const msg =
          data?.error ||
          error?.message ||
          "Não foi possível gerar alterações com IA.";
        toast.error(msg);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `Erro: ${msg}` },
        ]);
        return;
      }

      const nextTheme = mergeThemePatch(
        currentTheme,
        (data?.patch ?? {}) as Record<string, unknown>
      );
      onApplyTheme(nextTheme);

      if (data?.focusSection && onFocusSection) {
        onFocusSection(data.focusSection as EditorNodeId);
      }

      const summary =
        String(data?.summary ?? "").trim() ||
        "Alterações aplicadas ao rascunho da loja!";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: summary,
          areas: Array.isArray(data?.changedAreas) ? data.changedAreas : undefined,
          previousTheme: snapshotBefore,
        },
      ]);
      toast.success("Tema atualizado pela IA!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao contactar a IA.";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Erro: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="flex w-full sm:w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white z-20 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-gradient-to-r from-slate-950 to-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">Motor IA da Loja</p>
            <p className="text-[10px] text-slate-300">
              Copiloto de design para {companyName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="Fechar assistente IA"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white">
                <Wand2 className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                Como posso desenhar a sua loja hoje?
              </p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                A IA lê o seu catálogo real, escolhe cores, fontes, fotos, reordena secções e escreve textos persuasivos.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Superpoderes rápidos
              </p>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={loading}
                  onClick={() => runPrompt(action.prompt, action.mode)}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-2",
                  msg.role === "user"
                    ? "ml-6 bg-slate-900 text-white"
                    : "mr-4 border border-slate-200 bg-slate-50 text-slate-800"
                )}
              >
                <p>{msg.text}</p>
                {msg.areas && msg.areas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {msg.areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
                {msg.previousTheme && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyTheme(msg.previousTheme!);
                      toast.info("Alteração da IA desfeita.");
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-900"
                  >
                    <RotateCcw className="h-3 w-3" /> Desfazer esta alteração
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                A orquestrar layout, imagens e textos...
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runPrompt(prompt, messages.length === 0 ? "generate" : "refine");
        }}
        className="border-t border-slate-200 bg-slate-50 p-3 space-y-2"
      >
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void runPrompt(
                prompt,
                messages.length === 0 ? "generate" : "refine"
              );
            }
          }}
          rows={2}
          placeholder="Ex.: Melhora esta secção ou muda para estilo boutique..."
          className="bg-white text-xs resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Secção em foco: <strong>{selectedSection}</strong>
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !prompt.trim()}
            className="h-7 bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Send className="mr-1 h-3 w-3" /> Aplicar
              </>
            )}
          </Button>
        </div>
      </form>
    </aside>
  );
}
