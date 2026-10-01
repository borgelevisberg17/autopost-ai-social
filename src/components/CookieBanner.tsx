import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const CONSENT_KEY = "vendora-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
  }, []);

  const choose = (value: "accepted" | "essential") => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setPreferencesOpen(false);
    setClosing(true);
  };

  if (!visible) return null;

  return (
    <aside
      className={`safe-area-bottom fixed inset-x-3 bottom-3 z-[90] max-h-[min(88dvh,520px)] overflow-y-auto rounded-xl border border-[#e2ded5] bg-[#fffdf9] shadow-[0_16px_48px_rgba(32,37,34,0.18)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[min(420px,calc(100vw-2.5rem))] ${
        closing ? "cookie-banner-exit" : "cookie-banner-enter"
      }`}
      role="region"
      aria-labelledby="cookie-banner-title"
      aria-live="polite"
      aria-hidden={closing}
      onAnimationEnd={(event) => {
        if (closing && event.animationName === "cookie-banner-out") {
          setVisible(false);
          setClosing(false);
        }
      }}
    >
      <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <h2
          id="cookie-banner-title"
          className="text-lg font-semibold tracking-[-0.025em] text-[#202522]"
        >
          Usamos cookies
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6e716b]">
          Cookies essenciais mantêm a sessão e guardam as preferências. Não
          ativamos cookies de análise ou publicidade nesta versão.
        </p>
      </div>

      {preferencesOpen && (
        <div
          id="cookie-preferences"
          className="cookie-preferences-enter overflow-hidden"
        >
          <div className="mx-5 border-y border-[#ebe7df] py-3 text-xs leading-5 text-[#6e716b] sm:mx-6">
            <p>
              <span className="font-semibold text-[#202522]">Essenciais</span>
              <span className="ml-2 text-[#2c6457]">Sempre ativos</span>
              <br />
              Necessários para manter a sessão e as preferências da interface.
            </p>
            <p className="mt-3">
              <span className="font-semibold text-[#202522]">
                Análise e publicidade
              </span>
              <br />
              Não são utilizadas neste momento.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-2 px-5 pt-1 pb-5 sm:px-6 sm:pb-6">
        <button
          type="button"
          disabled={closing}
          onClick={() => choose("accepted")}
          className="inline-flex min-h-11 items-center justify-center bg-[#202522] px-4 text-sm font-semibold text-white transition hover:bg-[#2c6457] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2 disabled:pointer-events-none"
        >
          Aceitar
        </button>
        <button
          type="button"
          disabled={closing}
          onClick={() => choose("essential")}
          className="inline-flex min-h-11 items-center justify-center border border-[#d8d3c8] bg-[#fffdf9] px-4 text-sm font-semibold text-[#3f4840] transition hover:bg-[#f6f3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457] focus-visible:ring-offset-2 disabled:pointer-events-none"
        >
          Apenas essenciais
        </button>
        <button
          type="button"
          disabled={closing}
          aria-expanded={preferencesOpen}
          aria-controls="cookie-preferences"
          onClick={() => setPreferencesOpen((open) => !open)}
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#f1eee7] px-4 text-sm font-medium text-[#3f4840] transition hover:bg-[#e9eee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457] focus-visible:ring-offset-2 disabled:pointer-events-none"
        >
          Gerir preferências
          {preferencesOpen ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
