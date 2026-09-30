import { useEffect, useState } from "react";
import { Check, Cookie, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const CONSENT_KEY = "vendora-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show banner if consent hasn't been set yet
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
  }, []);

  // Only show on the landing page ("/")
  if (location.pathname !== "/") {
    return null;
  }

  const choose = (value: "accepted" | "essential") => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-[#d8d3c8] bg-[#fffdf9]/95 px-4 py-4 shadow-[0_-12px_40px_rgba(32,37,34,0.12)] backdrop-blur sm:px-6"
          role="dialog"
          aria-label="Cookie preferences"
        >
          <div className="mx-auto flex max-w-[1240px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center bg-[#d9e7de] text-[#2c6457]">
                <Cookie className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#202522]">
                  A better operating rhythm starts with a little context.
                </p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#6e716b]">
                  We use essential cookies to keep Vendora secure and optional analytics cookies to understand what helps teams convert. You can change your choice at any time.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 pl-12 lg:pl-0">
              <button
                type="button"
                onClick={() => choose("essential")}
                className="inline-flex h-10 items-center gap-2 border border-[#d8d3c8] px-4 text-xs font-semibold text-[#5f625d] transition hover:border-[#8bad9d]"
              >
                <X className="h-3.5 w-3.5" /> Only essential
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="inline-flex h-10 items-center gap-2 bg-[#202522] px-4 text-xs font-semibold text-white transition hover:bg-[#2c6457]"
              >
                <Check className="h-3.5 w-3.5" /> Accept all
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
