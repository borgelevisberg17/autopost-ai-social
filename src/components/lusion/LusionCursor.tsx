import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * E-commerce cursor with shopping bag icon + data-cursor label support.
 * Shows a small emerald dot by default, expands on interactive elements,
 * and displays a label pill when hovering [data-cursor] elements.
 */
export function LusionCursor() {
  const [enabled, setEnabled] = useState(false);
  const [cursorText, setCursorText] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorTarget = target.closest("[data-cursor]") as HTMLElement | null;
      if (cursorTarget) {
        setCursorText(cursorTarget.getAttribute("data-cursor"));
        setIsHovering(true);
      } else {
        const isClickable = target.closest("a, button, [role='button'], input, textarea");
        if (isClickable) {
          setCursorText(null);
          setIsHovering(true);
        } else {
          setCursorText(null);
          setIsHovering(false);
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[100] -translate-x-1/2 -translate-y-1/2 will-change-transform"
      style={{ x: smoothX, y: smoothY }}
    >
      <motion.div
        animate={{
          scale: isHovering ? (cursorText ? 1 : 1.6) : 1,
          opacity: 1,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`flex items-center justify-center transition-colors duration-200 ${
          cursorText
            ? "rounded-full bg-slate-950/90 text-white px-3.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md border border-white/20"
            : isHovering
            ? "h-8 w-8 rounded-full border border-slate-900/60 bg-slate-900/10 backdrop-blur-xs"
            : "h-3.5 w-3.5 rounded-full bg-slate-900 shadow-[0_0_12px_rgba(15,23,42,0.22)]"
        }`}
      >
        {cursorText && (
          <span className="font-mono text-[9px] uppercase tracking-widest font-semibold text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
            {cursorText}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}

// Keep backward-compat alias
export const EcommerceCursor = LusionCursor;
