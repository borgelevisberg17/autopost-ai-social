import { useEffect, useState } from "react";
import { Check, Cookie, X } from "lucide-react";

const CONSENT_KEY = "vendora-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
  }, []);

  const choose = (value: "accepted" | "essential") => {
    setClosing(true);
    window.setTimeout(() => {
      window.localStorage.setItem(CONSENT_KEY, value);
      setVisible(false);
      setClosing(false);
    }, 280);
  };

  if (!visible) return null;

  return (
    <aside
      className={`fixed inset-x-0 bottom-4 z-[90] px-4 sm:px-6 pointer-events-none transition-all duration-300 ${
        closing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}
      role="dialog"
      aria-label="Preferências de cookies"
      aria-live="polite"
    >
      <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-2xl backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3.5">
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
            <Cookie className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Preferências de cookies e privacidade
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
              Utilizamos cookies essenciais para manter o Vendora seguro e cookies analíticos para melhorar a sua experiência. Pode alterar as suas preferências a qualquer momento.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:self-end lg:self-center">
          <button
            type="button"
            onClick={() => choose("essential")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-3.5 w-3.5" /> Apenas essenciais
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            <Check className="h-3.5 w-3.5" /> Aceitar todos
          </button>
        </div>
      </div>
    </aside>
  );
}
