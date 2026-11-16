// Consolidated Index page for Vendora
import React, { useEffect, useState, useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useSpring,
  AnimatePresence,
  useTransform,
} from "framer-motion";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bot, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Globe2, Instagram, MessageCircle, MessageSquare, Package, Play, RefreshCw, Send, ShoppingBag, Sparkles, Users, WalletCards, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PlansSection } from "@/components/site/PlansSection";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WaterWakeHero } from "@/components/site/WaterWakeHero";

// ---------------------------------------------------------------------------
// Helper: smooth scrolling
function smoothScrollToElement(targetId: string) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const headerOffset = 74;
  const startY = window.scrollY;
  const targetY = el.getBoundingClientRect().top + window.scrollY - headerOffset;
  const distance = targetY - startY;
  const duration = Math.min(1100, Math.max(550, Math.abs(distance) * 0.45));
  const startTime = performance.now();
  const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuint(progress);
    window.scrollTo(0, startY + distance * eased);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// ---------------------------------------------------------------------------
// Nav drawer (mobile)
function NavDrawer({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        >
          <motion.nav
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="absolute top-4 left-4 w-64 bg-white rounded-xl shadow-xl p-5"
            onClick={e => e.stopPropagation()}
          >
            <ul className="space-y-3">
              <li><Link to="/" className="block text-lg font-medium hover:text-emerald-600">Home</Link></li>
              <li><Link to="/about" className="block text-lg font-medium hover:text-emerald-600">About</Link></li>
              <li><Link to="/projects" className="block text-lg font-medium hover:text-emerald-600">Projects</Link></li>
              <li><Link to="/contact" className="block text-lg font-medium hover:text-emerald-600">Contact</Link></li>
            </ul>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Scroll progress bar
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 origin-left z-[70] pointer-events-none shadow-[0_0_12px_rgba(16,185,129,0.5)]"
      style={{ scaleX }}
    />
  );
}

// ---------------------------------------------------------------------------
// Section reveal with Lusion‑style animation
function SectionReveal({ children, className = "", delay = 0, id }: { children: ReactNode; className?: string; delay?: number; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "start 25%"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  const y = useTransform(smoothProgress, [0, 1], [44, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.65, 1], [0.15, 0.9, 1]);
  return (
    <div ref={ref} id={id} className={`relative w-full overflow-hidden ${className}`}>
      <motion.div style={{ y, opacity }} transition={{ delay }} className="w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid cross decorative element
function GridCross({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`pointer-events-none select-none font-mono text-[10px] text-emerald-600/50 flex items-center gap-1.5 z-20 ${className}`}>
      <span className="text-emerald-500 font-bold">+</span>
      {label && (
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-medium">{label}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lusion tilt card
function LusionTiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rX = ((y - centerY) / centerY) * -5;
    const rY = ((x - centerX) / centerX) * 5;
    setRotateX(rX);
    setRotateY(rY);
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: isHovered ? "transform 0.08s ease-out" : "transform 0.45s ease-out",
      }}
      className={`relative transition-all ${className}`}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-20"
          style={{
            background: `radial-gradient(450px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.08), transparent 65%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data‑stream ribbon (Lusion style)
function DataStreamRibbon() {
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, { stiffness: 80, damping: 24, restDelta: 0.001 });
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30 select-none">
      <svg className="w-full h-full" viewBox="0 0 1440 3200" fill="none" preserveAspectRatio="none">
        <path
          d="M 720 0 C 880 400, 1150 700, 720 1100 C 350 1500, 1050 1900, 720 2300 C 450 2700, 850 3000, 720 3200"
          stroke="rgba(16, 185, 129, 0.16)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        <motion.path
          d="M 720 0 C 880 400, 1150 700, 720 1100 C 350 1500, 1050 1900, 720 2300 C 450 2700, 850 3000, 720 3200"
          stroke="rgba(16, 185, 129, 0.16)"
          strokeWidth="1.5"
          style={{ pathLength, opacity: 0.7 }}
          animate={{ pathLength: 1, opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
export default function Index() {
  const { user } = useAuth();
  const startPath = user ? "/dashboard" : "/signup";
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-slate-50/50 text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-950 relative">
      <ScrollProgressBar />
      {/* Bottom dock (mobile only) – hide on large screens via Tailwind lg:hidden */}
      <div className="lg:hidden">
        {/* LusionChapterDock placeholder – implement as needed */}
      </div>
      {/* Data‑stream ribbon */}
      <DataStreamRibbon />
      <SiteHeader ctaHref={startPath} onCtaClick={() => setOnboardingOpen(true)} />
      <main className="pt-[72px] sm:pt-[76px] relative z-10">
        {/* Hero section */}
        <section className="relative">
          <WaterWakeHero />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-white">Bem‑vindo ao Vendora</h1>
          </div>
        </section>
        {/* Example content sections using our helpers */}
        <SectionReveal id="plans" className="py-12">
          <PlansSection />
        </SectionReveal>
        <SectionReveal id="features" className="py-12 bg-gray-50">
          <div className="grid md:grid-cols-3 gap-8">
            <LusionTiltCard className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Rápido</h3>
              <p>Desempenho de nível empresarial.</p>
            </LusionTiltCard>
            <LusionTiltCard className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Escalável</h3>
              <p>Suporte a múltiplas lojas e vendedores.</p>
            </LusionTiltCard>
            <LusionTiltCard className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Customizável</h3>
              <p>Temas e plugins fáceis de integrar.</p>
            </LusionTiltCard>
          </div>
        </SectionReveal>
        {/* Grid cross example */}
        <div className="relative py-8">
          <GridCross label="Seção 1" className="absolute top-0 left-0" />
        </div>
      </main>
      <SiteFooter />
      {/* Mobile nav drawer */}
      <NavDrawer open={onboardingOpen} setOpen={setOnboardingOpen} />
    </div>
  );
}
