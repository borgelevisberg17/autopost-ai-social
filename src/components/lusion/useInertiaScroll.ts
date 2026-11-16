import { useEffect } from "react";

/**
 * Lightweight Zero-Dependency Inertia Momentum Scroll Hook
 * Replicates the fluid momentum feel of Lusion / Lenis without heavy external runtime dependencies.
 */
export function useInertiaScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    // Skip on touch devices or if user prefers reduced motion
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || prefersReducedMotion) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let isRunning = false;
    const ease = 0.085; // Damping ratio (lower = smoother/heavier inertia)

    const onWheel = (e: WheelEvent) => {
      // Don't intercept if modifier keys pressed or inside inner scrollable container
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-lenis-prevent], textarea, input, select")) return;

      e.preventDefault();

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      // Normalize delta
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 30; // Line mode
      if (e.deltaMode === 2) delta *= window.innerHeight; // Page mode

      targetY = Math.min(Math.max(0, targetY + delta), maxScroll);

      if (!isRunning) {
        isRunning = true;
        window.requestAnimationFrame(step);
      }
    };

    const step = () => {
      currentY += (targetY - currentY) * ease;
      window.scrollTo(0, currentY);

      if (Math.abs(targetY - currentY) > 0.5) {
        window.requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
        currentY = targetY;
        isRunning = false;
      }
    };

    // Update target on programmatic or anchor scrolls
    const onScroll = () => {
      if (!isRunning) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);
}
