import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fontHref, normalizeTheme, themeCssVars, type StoreTheme } from "@/lib/storeTheme";

export const THEME_PREVIEW_MESSAGE = "vendora-theme-preview";

/** Published theme for a storefront; inside the editor's preview frame, live draft updates come from the parent window. */
export function useStoreTheme(slug: string) {
  const [raw, setRaw] = useState<StoreTheme>(() => normalizeTheme(null));
  const isPreview = typeof window !== "undefined" && window.parent !== window && new URLSearchParams(window.location.search).get("preview") === "1";

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    void supabase.rpc("get_store_theme", { _slug: slug }).then(({ data }) => { if (alive && data && !isPreview) setRaw(normalizeTheme(data)); });
    return () => { alive = false; };
  }, [slug, isPreview]);

  useEffect(() => {
    if (!isPreview) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data?.type === THEME_PREVIEW_MESSAGE) setRaw(normalizeTheme(e.data.theme));
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: `${THEME_PREVIEW_MESSAGE}-ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [isPreview]);

  useEffect(() => {
    const id = "store-theme-font";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.id = id; link.rel = "stylesheet"; document.head.appendChild(link); }
    link.href = fontHref(raw.fonts);
  }, [raw.fonts]);

  useEffect(() => {
    if (raw.seo.title) document.title = raw.seo.title;
    if (raw.seo.description) document.querySelector('meta[name="description"]')?.setAttribute("content", raw.seo.description);
  }, [raw.seo.title, raw.seo.description]);

  return useMemo(() => ({ ...raw, cssVars: themeCssVars(raw) as CSSProperties }), [raw]);
}
