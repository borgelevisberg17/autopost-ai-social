import { useState } from "react";
import { Loader2, Send, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  PRESETS,
  applyPreset,
  normalizeTheme,
  type StoreTheme,
} from "@/lib/storeTheme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AiStoreCopilotProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  currentTheme: StoreTheme;
  onApplyTheme: (next: StoreTheme) => void;
}

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const QUICK_ACTIONS = [
  {
    label: "Criar loja completa para o meu negócio",
    mode: "generate" as const,
    prompt:
      "Cria uma identidade visual completa, textos de destaque, barra de anúncios e SEO perfeitos para os produtos da minha loja.",
  },
  {
    label: "Estilo luxo escuro & sofisticado",
    mode: "refine" as const,
    prompt:
      "Transforma a loja num estilo luxuoso e sofisticado com fundo escuro, detalhes dourados e tipografia editorial.",
  },
  {
    label: "Campanha promocional no banner",
    mode: "refine" as const,
    prompt:
      "Escreve uma campanha atrativa de oferta especial na barra de anúncios e no banner promocional.",
  },
  {
    label: "Otimizar títulos e SEO para Google",
    mode: "refine" as const,
    prompt:
      "Otimiza o título da página, descrição SEO, subtítulo principal e texto do rodapé para converter mais visitantes.",
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

  return normalizeTheme(next);
}

export function AiStoreCopilot({
  open,
  onClose,
  companyId,
  companyName,
  currentTheme,
  onApplyTheme,
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

      const summary =
        String(data?.summary ?? "").trim() ||
        "Alterações aplicadas ao rascunho da loja!";

      setMessages((prev) => [...prev, { role: "assistant", text: summary }]);
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
            <p className="text-xs font-bold leading-tight">
              Motor IA da Loja
            </p>
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
                Descreva o estilo, cores, campanha ou público-alvo. A IA lê os seus produtos reais e aplica tudo ao vivo.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Ações rápidas
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
                  "rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "ml-6 bg-slate-900 text-white"
                    : "mr-4 border border-slate-200 bg-slate-50 text-slate-800"
                )}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="mr-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                A gerar design e textos para a sua loja...
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
          placeholder="Ex.: Deixa a loja mais minimalista em tons areia..."
          className="bg-white text-xs resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Ctrl+Z desfaz qualquer ajuste
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
