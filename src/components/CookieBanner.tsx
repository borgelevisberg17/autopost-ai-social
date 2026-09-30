import { useEffect, useState } from "react";
import { Check, Cookie, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const CONSENT_KEY = "vendora-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
  }, []);

  if (location.pathname !== "/") return null;

  const choose = (value: "accepted" | "essential") => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={reduceMotion ? { opacity: 0 } : { y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: 24, opacity: 0 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 250, damping: 25, mass: 0.85 }
          }
          className="safe-area-bottom fixed inset-x-0 bottom-0 z-[90] overflow-hidden border-t border-[#d8d3c8] bg-[#fffdf9] shadow-[0_-12px_40px_rgba(32,37,34,0.16)]"
          role="dialog"
          aria-label="Preferências de cookies"
          aria-live="polite"
        >
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }
            }
            className="absolute inset-x-0 top-0 h-[3px] origin-left bg-[#e36c3f]"
          />
          <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-5">
            <div className="flex gap-3">
              <motion.span
                initial={reduceMotion ? false : { scale: 0.7, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 320,
                        damping: 18,
                        delay: 0.12,
                      }
                }
                className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center border border-[#b9cabe] bg-[#d9e7de] text-[#2c6457]"
              >
                <Cookie className="h-4 w-4" />
              </motion.span>
              <div>
                <p className="text-sm font-semibold text-[#202522]">
                  A sua privacidade, ao seu ritmo.
                </p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#6e716b]">
                  Usamos cookies essenciais para manter a Vendora segura e, se
                  autorizar, cookies de análise para perceber o que ajuda as
                  equipas a vender.
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:flex lg:shrink-0 lg:items-center">
              <button
                type="button"
                onClick={() => choose("essential")}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#d8d3c8] px-4 text-xs font-semibold text-[#5f625d] transition hover:border-[#8bad9d] hover:bg-[#f6f3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457] focus-visible:ring-offset-2"
              >
                <X className="h-3.5 w-3.5" /> Apenas essenciais
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#202522] px-4 text-xs font-semibold text-white transition hover:bg-[#2c6457] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
              >
                <Check className="h-3.5 w-3.5" /> Aceitar todos
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
