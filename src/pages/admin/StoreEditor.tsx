import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  History,
  Layers,
  Loader2,
  Lock,
  Megaphone,
  Monitor,
  Palette,
  PanelBottom,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  Store as StoreIcon,
  Tablet,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { useCompany } from "@/hooks/useCompany";
import { useEntitlement } from "@/hooks/useEntitlement";
import {
  THEME_FOCUS_MESSAGE,
  THEME_PAGE_MESSAGE,
  THEME_PREVIEW_MESSAGE,
  THEME_SELECT_MESSAGE,
  type PreviewPage,
} from "@/hooks/useStoreTheme";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  SECTION_LABELS,
  defaultTheme,
  moveSection,
  normalizeTheme,
  themeAccess,
  themeSchema,
  type SectionId,
  type StoreTheme,
} from "@/lib/storeTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeSettingsPanel } from "@/components/admin/store-editor/ThemeSettingsPanel";
import {
  SectionInspector,
  type EditorNodeId,
} from "@/components/admin/store-editor/SectionInspector";
import { TemplateGalleryModal } from "@/components/admin/store-editor/TemplateGalleryModal";
import { AiStoreCopilot } from "@/components/admin/store-editor/AiStoreCopilot";

type LeftTab = "sections" | "theme" | "versions";
type Viewport = "desktop" | "tablet" | "mobile";

type ThemeVersion = {
  id: string;
  created_at: string;
  theme: Json;
};

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: "w-full",
  tablet: "w-[768px] max-w-full",
  mobile: "w-[390px] max-w-full",
};

const PREVIEW_PAGES: Array<{ id: PreviewPage; label: string }> = [
  { id: "home", label: "Página inicial" },
  { id: "product", label: "Página de produto" },
  { id: "cart", label: "Carrinho" },
  { id: "checkout", label: "Checkout" },
  { id: "faq", label: "Perguntas frequentes" },
];

export default function StoreEditor() {
  const { company, loading: companyLoading } = useCompany();
  const { data: entitlement } = useEntitlement();
  const access = useMemo(
    () => themeAccess(entitlement?.features ?? []),
    [entitlement?.features]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draft, setDraft] = useState<StoreTheme>(() => defaultTheme());
  const [savedDraftJson, setSavedDraftJson] = useState<string>("");
  const [publishedJson, setPublishedJson] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [versions, setVersions] = useState<ThemeVersion[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [history, setHistory] = useState<StoreTheme[]>([]);
  const [future, setFuture] = useState<StoreTheme[]>([]);

  const [leftTab, setLeftTab] = useState<LeftTab>("sections");
  const [selectedNode, setSelectedNode] = useState<EditorNodeId>("hero");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [previewPage, setPreviewPage] = useState<PreviewPage>("home");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [previewKey, setPreviewKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReadyRef = useRef(false);

  const draftJson = useMemo(() => JSON.stringify(draft), [draft]);
  const hasUnsavedChanges = savedDraftJson !== "" && draftJson !== savedDraftJson;
  const hasUnpublishedChanges =
    publishedJson === null || draftJson !== publishedJson;

  const postPreviewTheme = useCallback((themeToSend: StoreTheme) => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !previewReadyRef.current) return;
    win.postMessage(
      { type: THEME_PREVIEW_MESSAGE, theme: themeToSend },
      window.location.origin
    );
  }, []);

  const focusPreviewSection = useCallback((section: EditorNodeId) => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !previewReadyRef.current) return;
    win.postMessage(
      { type: THEME_FOCUS_MESSAGE, section },
      window.location.origin
    );
  }, []);

  // Load theme & version history
  const loadThemeData = useCallback(async (companyId: string) => {
    setLoading(true);
    try {
      const [{ data: row, error: themeErr }, { data: verRows }, { data: prodRows }] =
        await Promise.all([
          supabase
            .from("store_themes")
            .select("draft, published, published_at")
            .eq("company_id", companyId)
            .maybeSingle(),
          supabase
            .from("store_theme_versions")
            .select("id, created_at, theme")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("products")
            .select("images")
            .eq("company_id", companyId)
            .eq("active", true)
            .limit(16),
        ]);

      if (themeErr) {
        toast.error("Não foi possível carregar o tema da loja.");
      }

      const initial = normalizeTheme(row?.draft ?? row?.published ?? null);
      const initialPub = row?.published
        ? JSON.stringify(normalizeTheme(row.published))
        : null;

      setDraft(initial);
      setSavedDraftJson(JSON.stringify(initial));
      setPublishedJson(initialPub);
      setPublishedAt(row?.published_at ?? null);
      setVersions((verRows as ThemeVersion[]) ?? []);
      setProductImages(
        Array.from(
          new Set(
            (prodRows ?? [])
              .flatMap((p) => (Array.isArray(p.images) ? p.images : []))
              .filter((u): u is string => typeof u === "string" && u.startsWith("https://"))
          )
        )
      );
      setHistory([]);
      setFuture([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!company?.id) return;
    void loadThemeData(company.id);
  }, [company?.id, loadThemeData]);

  // Preview iframe handshake & live sync
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === `${THEME_PREVIEW_MESSAGE}-ready`) {
        previewReadyRef.current = true;
        postPreviewTheme(draft);
      }
      if (e.data?.type === THEME_SELECT_MESSAGE && e.data.section) {
        setLeftTab("sections");
        setSelectedNode(e.data.section as EditorNodeId);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [draft, postPreviewTheme]);

  const switchPreviewPage = (page: PreviewPage) => {
    setPreviewPage(page);
    const win = iframeRef.current?.contentWindow;
    if (win && previewReadyRef.current) {
      win.postMessage(
        { type: THEME_PAGE_MESSAGE, page },
        window.location.origin
      );
    }
  };

  useEffect(() => {
    postPreviewTheme(draft);
  }, [draft, postPreviewTheme]);

  // Push change to undo stack
  const updateDraft = useCallback(
    (next: StoreTheme) => {
      setHistory((prev) => [...prev.slice(-29), draft]);
      setFuture([]);
      setDraft(next);
    },
    [draft]
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [draft, ...f]);
    setDraft(prev);
  }, [draft, history]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, draft]);
    setDraft(next);
  }, [draft, future]);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.key.toLowerCase() === "z" && e.shiftKey) ||
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const persistDraft = async (themeToSave: StoreTheme): Promise<boolean> => {
    if (!company?.id) return false;
    const parsed = themeSchema.safeParse(themeToSave);
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ||
          "Verifique os campos inválidos antes de guardar."
      );
      return false;
    }

    const { error } = await supabase.from("store_themes").upsert(
      {
        company_id: company.id,
        draft: parsed.data as unknown as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" }
    );

    if (error) {
      toast.error("Erro ao guardar o rascunho.");
      return false;
    }

    setSavedDraftJson(JSON.stringify(parsed.data));
    return true;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const ok = await persistDraft(draft);
      if (ok) toast.success("Rascunho guardado!");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!company?.id) return;
    setPublishing(true);
    try {
      const ok = await persistDraft(draft);
      if (!ok) return;

      const { data, error } = await supabase.rpc("publish_store_theme", {
        _company: company.id,
      });

      if (error) {
        toast.error("Não foi possível publicar o tema.");
        return;
      }

      const normalizedPub = normalizeTheme(data ?? draft);
      setPublishedJson(JSON.stringify(normalizedPub));
      setPublishedAt(new Date().toISOString());

      const { data: verRows } = await supabase
        .from("store_theme_versions")
        .select("id, created_at, theme")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setVersions((verRows as ThemeVersion[]) ?? []);

      toast.success("Tema publicado na loja!");
    } finally {
      setPublishing(false);
    }
  };

  const handleResetToPublished = () => {
    if (publishedJson) {
      updateDraft(normalizeTheme(JSON.parse(publishedJson)));
      toast.info("Rascunho reposto para a versão publicada.");
    } else {
      updateDraft(defaultTheme());
      toast.info("Tema reposto para os padrões iniciais.");
    }
  };

  const selectSection = (node: EditorNodeId) => {
    setSelectedNode(node);
    focusPreviewSection(node);
  };

  const toggleSectionVisible = (id: SectionId) => {
    if (!access.sections) {
      toast.info("Mostrar/ocultar secções está disponível no plano Pro.");
      return;
    }
    const nextSections = (draft.sections ?? []).map((s) =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    updateDraft({ ...draft, sections: nextSections });
  };

  const reorderSection = (index: number, delta: number) => {
    if (!access.sections) {
      toast.info("Reordenar secções está disponível no plano Pro.");
      return;
    }
    const nextSections = moveSection(draft.sections ?? [], index, delta);
    updateDraft({ ...draft, sections: nextSections });
  };

  if (companyLoading || loading) {
    return (
      <div className="grid h-screen place-items-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="text-xs font-medium">A carregar editor da loja...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="grid h-screen place-items-center bg-slate-50 p-6 text-center">
        <div className="max-w-sm space-y-3">
          <StoreIcon className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="text-base font-bold text-slate-900">
            Nenhuma loja selecionada
          </h1>
          <Link to="/dashboard">
            <Button size="sm">Voltar ao painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sectionsList = draft.sections ?? [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f5f7] text-slate-900">
      {/* Top Studio Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/admin/canais"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            title="Voltar ao painel"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-xs sm:text-sm font-bold text-slate-900">
                {company.name}
              </span>
              <span
                className={cn(
                  "hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  hasUnsavedChanges
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : hasUnpublishedChanges
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    hasUnsavedChanges
                      ? "bg-amber-500"
                      : hasUnpublishedChanges
                      ? "bg-blue-500"
                      : "bg-emerald-500"
                  )}
                />
                {hasUnsavedChanges
                  ? "Por guardar"
                  : hasUnpublishedChanges
                  ? "Rascunho"
                  : "Publicado"}
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-slate-400">
              Editor Visual da Loja · /loja/{company.slug}
            </p>
          </div>
        </div>

        {/* Center Page Selector + Viewport Switcher (Shopify style) */}
        <div className="hidden md:flex items-center gap-2">
          <select
            aria-label="Selecionar página da loja"
            value={previewPage}
            onChange={(e) => switchPreviewPage(e.target.value as PreviewPage)}
            className="h-8 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-slate-900"
          >
            {PREVIEW_PAGES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setGalleryOpen(true)}
            className="h-8 px-2.5 text-xs font-semibold"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Templates
          </Button>

          <Button
            type="button"
            size="sm"
            variant={aiOpen ? "default" : "outline"}
            onClick={() => setAiOpen((v) => !v)}
            className={cn(
              "h-8 px-2.5 text-xs font-semibold",
              aiOpen
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100"
            )}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Criar com IA
          </Button>

          <div className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(
              [
                { id: "desktop", icon: Monitor, label: "Computador" },
                { id: "tablet", icon: Tablet, label: "Tablet" },
                { id: "mobile", icon: Smartphone, label: "Telemóvel" },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = viewport === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setViewport(item.id)}
                  title={item.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition",
                    active
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:flex items-center gap-0.5 mr-1">
            <button
              type="button"
              onClick={undo}
              disabled={history.length === 0}
              title="Desfazer (Ctrl+Z)"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              title="Refazer (Ctrl+Y)"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleResetToPublished}
              title="Reverter para versão publicada"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <a
            href={`/loja/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ver loja <ExternalLink className="h-3 w-3" />
          </a>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving || !hasUnsavedChanges}
            onClick={handleSaveDraft}
            className="h-8 px-2.5 text-xs font-semibold"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 sm:mr-1.5" />
            )}
            <span className="hidden sm:inline">Guardar</span>
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={publishing}
            onClick={handlePublish}
            className="h-8 bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
          >
            {publishing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            Publicar
          </Button>
        </div>
      </header>

      {/* Mobile Toggle Bar */}
      <div className="flex lg:hidden items-center border-b border-slate-200 bg-white px-3 py-1.5 gap-2">
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-semibold",
            mobileView === "editor"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600"
          )}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-semibold",
            mobileView === "preview"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600"
          )}
        >
          Pré-visualizar
        </button>
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
        >
          Templates
        </button>
        <button
          type="button"
          onClick={() => setAiOpen((v) => !v)}
          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white"
        >
          IA
        </button>
      </div>

      {/* Main 3-Column Shopify Studio */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar: Structure / Theme / Versions */}
        <aside
          className={cn(
            "flex w-full lg:w-[260px] xl:w-[285px] shrink-0 flex-col border-r border-slate-200 bg-white",
            mobileView === "preview" && "hidden lg:flex"
          )}
        >
          <div className="grid grid-cols-3 border-b border-slate-200 p-1.5 gap-1 bg-slate-50/70">
            {(
              [
                { id: "sections", icon: Layers, label: "Secções" },
                { id: "theme", icon: Palette, label: "Tema" },
                { id: "versions", icon: History, label: "Versões" },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = leftTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeftTab(tab.id)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition",
                    active
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200/70"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {leftTab === "sections" && (
              <div className="space-y-4">
                {/* Fixed Header Group */}
                <div>
                  <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cabeçalho
                  </p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => selectSection("announcement")}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition",
                        selectedNode === "announcement"
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <Megaphone className="h-3.5 w-3.5 shrink-0 opacity-75" />
                      <span className="truncate flex-1">Barra de Anúncios</span>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          draft.announcement.enabled
                            ? "bg-emerald-400"
                            : "bg-slate-300"
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => selectSection("brand")}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition",
                        selectedNode === "brand"
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <StoreIcon className="h-3.5 w-3.5 shrink-0 opacity-75" />
                      <span className="truncate flex-1">Cabeçalho & Marca</span>
                    </button>
                  </div>
                </div>

                {/* Page Sections */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Secções da Página
                    </p>
                    {!access.sections && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                        <Lock className="h-2.5 w-2.5" /> Pro
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {sectionsList.map((sec, idx) => {
                      const active = selectedNode === sec.id;
                      return (
                        <div
                          key={sec.id}
                          draggable={access.sections}
                          onDragStart={() => setDragIndex(idx)}
                          onDragOver={(e) => {
                            if (!access.sections || dragIndex === null) return;
                            e.preventDefault();
                          }}
                          onDrop={() => {
                            if (!access.sections || dragIndex === null || dragIndex === idx) {
                              setDragIndex(null);
                              return;
                            }
                            const next = [...sectionsList];
                            const [moved] = next.splice(dragIndex, 1);
                            next.splice(idx, 0, moved);
                            updateDraft({ ...draft, sections: next });
                            setDragIndex(null);
                          }}
                          onDragEnd={() => setDragIndex(null)}
                          className={cn(
                            "group flex items-center gap-1 rounded-lg px-2 py-1.5 transition",
                            active
                              ? "bg-slate-900 text-white"
                              : "text-slate-700 hover:bg-slate-100",
                            dragIndex === idx && "opacity-40"
                          )}
                        >
                          {access.sections && (
                            <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab opacity-40 group-hover:opacity-80" />
                          )}
                          <button
                            type="button"
                            onClick={() => selectSection(sec.id)}
                            className={cn(
                              "flex min-w-0 flex-1 items-center gap-2 text-left text-xs font-semibold",
                              !sec.visible && "opacity-50"
                            )}
                          >
                            <span className="truncate">
                              {SECTION_LABELS[sec.id]}
                            </span>
                          </button>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => reorderSection(idx, -1)}
                              disabled={idx === 0 || !access.sections}
                              title="Mover para cima"
                              className={cn(
                                "rounded p-1 disabled:opacity-25",
                                active
                                  ? "hover:bg-white/15"
                                  : "hover:bg-slate-200"
                              )}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => reorderSection(idx, 1)}
                              disabled={
                                idx === sectionsList.length - 1 ||
                                !access.sections
                              }
                              title="Mover para baixo"
                              className={cn(
                                "rounded p-1 disabled:opacity-25",
                                active
                                  ? "hover:bg-white/15"
                                  : "hover:bg-slate-200"
                              )}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSectionVisible(sec.id)}
                              title={
                                sec.visible
                                  ? "Ocultar secção"
                                  : "Mostrar secção"
                              }
                              className={cn(
                                "rounded p-1",
                                active
                                  ? "hover:bg-white/15"
                                  : "hover:bg-slate-200"
                              )}
                            >
                              {sec.visible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fixed Footer */}
                <div>
                  <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rodapé
                  </p>
                  <button
                    type="button"
                    onClick={() => selectSection("footer")}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition",
                      selectedNode === "footer"
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <PanelBottom className="h-3.5 w-3.5 shrink-0 opacity-75" />
                    <span className="truncate flex-1">Rodapé & Redes</span>
                  </button>
                </div>

                {/* Inline Inspector on <lg viewports inside left pane */}
                <div className="lg:hidden border-t border-slate-200 pt-4 mt-4">
                  <SectionInspector
                    selected={selectedNode}
                    theme={draft}
                    onChange={updateDraft}
                    canToggleSections={access.sections}
                    companyName={company.name}
                    productImages={productImages}
                  />
                </div>
              </div>
            )}

            {leftTab === "theme" && (
              <ThemeSettingsPanel
                theme={draft}
                onChange={updateDraft}
                canEditFonts={access.fonts}
                companyName={company.name}
                companySlug={company.slug}
              />
            )}

            {leftTab === "versions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Histórico Publicado
                  </h3>
                  {!access.versions && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                      <Lock className="h-2.5 w-2.5" /> Pro
                    </span>
                  )}
                </div>

                {publishedAt && (
                  <p className="text-[11px] text-slate-500">
                    Última publicação:{" "}
                    {new Intl.DateTimeFormat("pt-PT", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(publishedAt))}
                  </p>
                )}

                {versions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-500">
                    <Sparkles className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                    Publique o seu tema para criar o primeiro ponto de restauro.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {versions.map((ver, idx) => (
                      <div
                        key={ver.id}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {idx === 0 ? "Versão atual" : `Versão #${versions.length - idx}`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Intl.DateTimeFormat("pt-PT", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(ver.created_at))}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!access.versions}
                          onClick={() => {
                            updateDraft(normalizeTheme(ver.theme));
                            toast.success("Versão restaurada para o rascunho!");
                          }}
                          className="mt-2 h-7 w-full text-[11px]"
                        >
                          Restaurar no rascunho
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center Live Storefront Preview */}
        <main
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-start overflow-auto bg-[#e9ecef] p-3 sm:p-5",
            mobileView === "editor" && "hidden lg:flex"
          )}
        >
          <div className="mb-2.5 flex w-full max-w-[1400px] items-center justify-between px-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Pré-visualização em tempo real · {company.slug}
            </span>
            <button
              type="button"
              onClick={() => {
                previewReadyRef.current = false;
                setPreviewKey((k) => k + 1);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-2xs hover:text-slate-900"
            >
              <RefreshCw className="h-3 w-3" /> Recarregar
            </button>
          </div>

          <div
            className={cn(
              "relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-300/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition-all duration-300",
              VIEWPORT_WIDTHS[viewport]
            )}
          >
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-slate-200/80 bg-slate-50 px-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
              <div className="rounded-md bg-white border border-slate-200/80 px-2.5 py-0.5 text-[10px] font-mono text-slate-500 truncate max-w-[260px]">
                vendora.cachiluvia.com/loja/{company.slug}
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {PREVIEW_PAGES.find((p) => p.id === previewPage)?.label}
              </span>
            </div>
            <iframe
              key={previewKey}
              ref={iframeRef}
              title={`Pré-visualização da loja ${company.name}`}
              src={`/loja/${company.slug}?preview=1`}
              className="flex-1 w-full border-0"
            />
          </div>
        </main>

        {/* Right Contextual Inspector (Desktop lg+) */}
        {!aiOpen && (
          <aside className="hidden lg:flex w-[300px] xl:w-[335px] shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto p-4">
            <SectionInspector
              selected={selectedNode}
              theme={draft}
              onChange={updateDraft}
              canToggleSections={access.sections}
              companyName={company.name}
              productImages={productImages}
            />
          </aside>
        )}

        <AiStoreCopilot
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          companyId={company.id}
          companyName={company.name}
          currentTheme={draft}
          selectedSection={selectedNode}
          onApplyTheme={updateDraft}
          onFocusSection={(sec) => selectSection(sec)}
        />
      </div>

      <TemplateGalleryModal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        currentTheme={draft}
        onApply={(next) => {
          updateDraft(next);
          toast.success("Template aplicado ao rascunho!");
        }}
      />
    </div>
  );
}
