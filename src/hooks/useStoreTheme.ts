import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fontHref, normalizeTheme, themeCssVars, type StoreTheme } from "@/lib/storeTheme";

export const THEME_PREVIEW_MESSAGE = "vendora-theme-preview";
export const THEME_FOCUS_MESSAGE = "vendora-theme-focus-section";
export const THEME_PAGE_MESSAGE = "vendora-theme-preview-page";
export const THEME_SELECT_MESSAGE = "vendora-theme-select-section";

export type PreviewPage = "home" | "product" | "cart" | "checkout" | "faq";

const SECTION_DOM_IDS: Record<string, string> = {
  hero: "inicio",
  categories: "categorias",
  products: "produtos",
  banner: "sobre",
  testimonials: "testemunhos",
  text: "texto",
  newsletter: "newsletter",
  faq: "faq",
  footer: "contacto",
};

/** Published theme for a storefront; inside the editor's preview frame, live draft updates come from the parent window. */
export function useStoreTheme(
  slug: string,
  onPreviewPage?: (page: PreviewPage) => void,
) {
  const [raw, setRaw] = useState<StoreTheme>(() => normalizeTheme(null));
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const isPreview =
    typeof window !== "undefined" &&
    window.parent !== window &&
    new URLSearchParams(window.location.search).get("preview") === "1";

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    void supabase.rpc("get_store_theme", { _slug: slug }).then(({ data }) => {
      if (alive && data && !isPreview) setRaw(normalizeTheme(data));
    });
    return () => {
      alive = false;
    };
  }, [slug, isPreview]);

  useEffect(() => {
    if (!isPreview) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data?.type === THEME_PREVIEW_MESSAGE) setRaw(normalizeTheme(e.data.theme));
      if (e.data?.type === THEME_FOCUS_MESSAGE) {
        const key = String(e.data.section ?? "");
        setActiveSection(key || null);
        if (key === "announcement" || key === "brand") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const domId = SECTION_DOM_IDS[key];
          if (domId) document.getElementById(domId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      if (e.data?.type === THEME_PAGE_MESSAGE && onPreviewPage) {
        onPreviewPage(e.data.page as PreviewPage);
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: `${THEME_PREVIEW_MESSAGE}-ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [isPreview, onPreviewPage]);

  useEffect(() => {
    const id = "store-theme-font";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = fontHref(raw.fonts);
  }, [raw.fonts]);

  useEffect(() => {
    if (raw.seo.title) document.title = raw.seo.title;
    if (raw.seo.description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", raw.seo.description);
    }
  }, [raw.seo.title, raw.seo.description]);

  const notifySelectSection = useCallback(
    (section: string) => {
      if (!isPreview) return;
      setActiveSection(section);
      window.parent.postMessage({ type: THEME_SELECT_MESSAGE, section }, window.location.origin);
    },
    [isPreview],
  );

  return useMemo(
    () => ({
      ...raw,
      cssVars: themeCssVars(raw) as CSSProperties,
      isPreview,
      activeSection,
      notifySelectSection,
    }),
    [raw, isPreview, activeSection, notifySelectSection],
  );
}
