import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useSpring,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Instagram,
  MessageCircle,
  Package,
  Play,
  RefreshCw,
  Send,
  ShoppingBag,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PlansSection } from "@/components/site/PlansSection";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WaterWakeHero } from "@/components/site/WaterWakeHero";
import { LusionCursor } from "@/components/lusion/LusionCursor";
import { useInertiaScroll } from "@/components/lusion/useInertiaScroll";
import { lusionSound } from "@/components/lusion/LusionAudio";
import { TactileGrain } from "@/components/lusion/TactileGrain";

function playTactileFeedback() {
  lusionSound.playClick();
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {
    // audio unavailable
  }
}

/**
 * Scroll suave com curva de inércia (estilo Lusion / Lenis) para navegação entre secções.
 */
function smoothScrollToElement(targetId: string) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const headerOffset = 74;
  const startY = window.scrollY;
  const targetY =
    el.getBoundingClientRect().top + window.scrollY - headerOffset;
  const distance = targetY - startY;
  const duration = Math.min(1100, Math.max(550, Math.abs(distance) * 0.45));
  const startTime = performance.now();

  const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuint(progress);
    window.scrollTo(0, startY + distance * eased);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 origin-left z-[70] pointer-events-none shadow-[0_0_12px_rgba(16,185,129,0.5)]"
      style={{ scaleX }}
    />
  );
}

const CHAPTERS = [
  { id: "hero-stage", number: "01", label: "Início" },
  { id: "proof", number: "02", label: "Comunidade" },
  { id: "whatsapp", number: "03", label: "WhatsApp IA" },
  { id: "channels", number: "04", label: "Canais" },
  { id: "agents", number: "05", label: "Agentes" },
  { id: "plans", number: "06", label: "Planos" },
  { id: "process", number: "07", label: "Processo" },
  { id: "control-room", number: "08", label: "Comando" },
] as const;

/**
 * Dock Flutuante de Navegação entre Secções estilo Lusion.
 * Acompanha a secção ativa em tempo real com transição líquida (`layoutId`) e permite
 * saltar suavemente entre qualquer capítulo ou avançar para a próxima secção.
 */
function LusionChapterDock() {
  const [activeId, setActiveId] = useState<string>("hero-stage");

  useEffect(() => {
    const handleScroll = () => {
      const viewportMiddle = window.scrollY + window.innerHeight * 0.38;
      let current: string = CHAPTERS[0].id;
      for (const ch of CHAPTERS) {
        const el = document.getElementById(ch.id);
        if (el) {
          const top = el.offsetTop;
          if (viewportMiddle >= top) {
            current = ch.id;
          }
        }
      }
      setActiveId(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeIndex = Math.max(
    0,
    CHAPTERS.findIndex((c) => c.id === activeId)
  );
  const nextChapter = CHAPTERS[(activeIndex + 1) % CHAPTERS.length];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-1.5 rounded-full border border-slate-800/80 bg-slate-950/90 p-1.5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="flex items-center gap-0.5 px-1">
        {CHAPTERS.map((chapter) => {
          const isActive = chapter.id === activeId;
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => {
                playTactileFeedback();
                smoothScrollToElement(chapter.id);
              }}
              className={`relative rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="lusion-active-chapter-pill"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                  className="absolute inset-0 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.45)]"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span
                  className={`font-mono text-[9px] ${
                    isActive ? "text-slate-900" : "text-slate-500"
                  }`}
                >
                  {chapter.number}
                </span>
                <span>{chapter.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="h-4 w-[1px] bg-white/15" />

      <button
        type="button"
        onClick={() => {
          playTactileFeedback();
          smoothScrollToElement(nextChapter.id);
        }}
        title={`Ir para ${nextChapter.label}`}
        className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300 transition hover:bg-white/20"
      >
        <span>Seguinte</span>
        <ArrowDown className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * Ponte de transição entre secções estilo Lusion ("Continue to Scroll")
 * que conecta visualmente uma secção à seguinte sem quebrar as bordas do ecrã.
 */
function SectionBridge({
  nextId,
  label,
  dark = false,
}: {
  nextId: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-t px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] ${
        dark
          ? "border-white/10 bg-slate-950/40 text-slate-400"
          : "border-slate-200/70 bg-white/60 text-slate-500"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between lg:px-3">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            playTactileFeedback();
            smoothScrollToElement(nextId);
          }}
          className={`inline-flex items-center gap-2 transition ${
            dark ? "hover:text-white" : "hover:text-slate-950"
          }`}
        >
          <span>Continuar a explorar</span>
          <ArrowDown className="h-3 w-3 text-slate-400 group-hover:text-emerald-500 transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Transição de Secção Lusion-Grade:
 * Mantém a secção 100% full-width (sem nunca encolher as laterais nem abrir buracos entre secções)
 * e aplica movimento com propósito (paralaxe suave + revelação progressiva) ao conteúdo.
 */
function SectionReveal({
  children,
  className = "",
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 92%", "start 25%"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const y = useTransform(smoothProgress, [0, 1], [44, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.65, 1], [0.15, 0.9, 1]);

  return (
    <div ref={ref} id={id} className={`relative w-full overflow-hidden ${className}`}>
      <motion.div
        style={{ y, opacity }}
        transition={{ delay }}
        className="w-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

function GridCross({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none select-none font-mono text-[10px] text-emerald-600/50 flex items-center gap-1.5 z-20 ${className}`}
    >
      <span className="text-emerald-500 font-bold">+</span>
      {label && (
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-medium">
          {label}
        </span>
      )}
    </div>
  );
}

function LusionTiltCard({
  children,
  className = "",
  cursorText = "INTERAGIR",
}: {
  children: ReactNode;
  className?: string;
  cursorText?: string;
}) {
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

  const handleMouseEnter = () => {
    setIsHovered(true);
    lusionSound.playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      data-cursor={cursorText}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: isHovered
          ? "transform 0.08s ease-out"
          : "transform 0.45s ease-out",
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

/**
 * Linha de fluxo estilo Lusion sincronizada com o scroll (`pathLength`).
 */
function DataStreamRibbon() {
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-20 select-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 3200"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M 720 0 C 880 400, 1150 700, 720 1100 C 350 1500, 1050 1900, 720 2300 C 450 2700, 850 3000, 720 3200"
          stroke="rgba(16, 185, 129, 0.12)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        <motion.path
          d="M 720 0 C 880 400, 1150 700, 720 1100 C 350 1500, 1050 1900, 720 2300 C 450 2700, 850 3000, 720 3200"
          stroke="url(#ribbon-gradient)"
          strokeWidth="1.75"
          strokeLinecap="round"
          style={{ pathLength }}
        />
        <defs>
          <linearGradient
            id="ribbon-gradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#14b8a6" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.45" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

type EyebrowProps = { children: ReactNode; light?: boolean };

function Eyebrow({ children, light = false }: EyebrowProps) {
  return (
    <div
      className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${
        light
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
          : "border-slate-200/90 bg-white/80 text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${light ? "bg-emerald-400" : "bg-emerald-500"}`}
      />
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof WalletCards;
}) {
  return (
    <LusionTiltCard className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <Icon className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{note}</div>
    </LusionTiltCard>
  );
}

function ProductFrame() {
  return (
    <div className="relative mx-auto max-w-[1160px]">
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.12)]">
        <div className="flex h-11 items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
          <div className="font-mono text-[10px] text-slate-500 font-medium">
            app.vendora.co / overview
          </div>
          <div className="h-5 w-16 rounded-full border border-slate-200 bg-slate-100" />
        </div>
        <div className="grid min-h-[420px] md:grid-cols-[180px_1fr]">
          <aside className="hidden border-r border-slate-800 bg-slate-950 p-4 text-slate-100 md:block">
            <div className="mb-8 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-white">
                <Circle className="h-2.5 w-2.5 fill-current" />
              </span>
              <span className="text-[12px] font-bold tracking-tight">
                Vendora OS
              </span>
            </div>
            <div className="space-y-1">
              {["Visão Geral", "Pedidos", "Produtos", "Clientes", "Agentes"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium ${i === 0 ? "bg-white/10 text-white" : "text-white/50"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-emerald-400" : "bg-white/30"}`}
                    />
                    {item}
                  </div>
                )
              )}
            </div>
            <div className="mt-8 border-t border-white/10 pt-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40 font-semibold">
                Canais Ativos
              </div>
              <div className="mt-3 space-y-2 text-[11px] text-white/60">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
                  Loja Online
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />{" "}
                  Instagram
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                  WhatsApp
                </div>
              </div>
            </div>
          </aside>
          <div className="min-w-0 bg-slate-50/80 p-4 sm:p-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  Segunda-feira · Tempo Real
                </div>
                <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  Bom dia, Amina.
                </div>
              </div>
              <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-[10px] text-slate-600 sm:block">
                Últimos 30 dias
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric
                label="Faturamento"
                value="48.290 $"
                note="↑ 12.8% vs período anterior"
                icon={WalletCards}
              />
              <Metric
                label="Pedidos"
                value="684"
                note="Em 3 canais sincronizados"
                icon={ShoppingBag}
              />
              <Metric
                label="Produtos"
                value="128"
                note="7 com estoque baixo"
                icon={Package}
              />
              <Metric
                label="Conversão"
                value="4.8%"
                note="Loja & WhatsApp"
                icon={BarChart3}
              />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Performance Diária
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      Receita por dia (US$)
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Vendas Concluídas
                  </div>
                </div>
                <div className="mt-6 flex h-28 items-end gap-1.5 border-b border-slate-100 px-1">
                  {[
                    32, 46, 38, 62, 54, 78, 66, 88, 75, 94, 81, 100, 86, 97,
                  ].map((height, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-full transition hover:opacity-80 ${i === 11 ? "bg-emerald-500" : "bg-slate-300"}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between font-mono text-[9px] text-slate-400">
                  <span>01 OUT</span>
                  <span>14 OUT</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Atividade Recente
                </div>
                <div className="mt-3 space-y-3">
                  {[
                    ["Novo pedido", "Sapato Nike #D2CC2E82 · WhatsApp", "2m"],
                    [
                      "Alerta de estoque",
                      "Sapato Nike tam 40 · 6 un restantes",
                      "18m",
                    ],
                    [
                      "Agente finalizou",
                      "Campanha Instagram Drop agendada",
                      "1h",
                    ],
                  ].map(([title, detail, time]) => (
                    <div key={title} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2 text-[11px] font-semibold text-slate-900">
                          <span>{title}</span>
                          <span className="font-mono text-[9px] font-normal text-slate-400">
                            {time}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-slate-500">
                          {detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function ProofSection() {
  const orders = useCountUp(12840);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const outerRingRotate = useTransform(scrollYProgress, [0, 1], [-25, 45]);
  const innerRingRotate = useTransform(scrollYProgress, [0, 1], [30, -50]);

  const profiles = [
    {
      src: "/media/optimized/profile-01.webp",
      name: "Amina",
      channel: "Instagram",
      position: "left-[2%] top-[13%]",
      delay: "0ms",
      size: "h-28 w-28 sm:h-40 sm:w-40",
    },
    {
      src: "/media/optimized/profile-05.webp",
      name: "Marta",
      channel: "WhatsApp",
      position: "left-[18%] top-[4%]",
      delay: "180ms",
      size: "h-20 w-20 sm:h-28 sm:w-28",
    },
    {
      src: "/media/optimized/profile-06.webp",
      name: "João",
      channel: "Facebook",
      position: "right-[18%] top-[5%]",
      delay: "360ms",
      size: "h-24 w-24 sm:h-32 sm:w-32",
    },
    {
      src: "/media/optimized/profile-04.webp",
      name: "Nia",
      channel: "Website",
      position: "right-[2%] top-[18%]",
      delay: "540ms",
      size: "h-32 w-32 sm:h-44 sm:w-44",
    },
    {
      src: "/media/optimized/profile-07.webp",
      name: "Leo",
      channel: "Facebook",
      position: "left-[7%] bottom-[12%]",
      delay: "720ms",
      size: "h-20 w-20 sm:h-28 sm:w-28",
    },
    {
      src: "/media/optimized/profile-09.webp",
      name: "Sofia",
      channel: "Instagram",
      position: "left-[27%] bottom-[4%]",
      delay: "900ms",
      size: "h-24 w-24 sm:h-32 sm:w-32",
    },
    {
      src: "/media/optimized/profile-10.webp",
      name: "Rui",
      channel: "WhatsApp",
      position: "right-[27%] bottom-[5%]",
      delay: "1080ms",
      size: "h-20 w-20 sm:h-28 sm:w-28",
    },
    {
      src: "/media/optimized/profile-12.webp",
      name: "Maya",
      channel: "Website",
      position: "right-[7%] bottom-[13%]",
      delay: "1260ms",
      size: "h-28 w-28 sm:h-40 sm:w-40",
    },
  ];
  return (
    <section
      ref={sectionRef}
      className="reveal-up reveal-delay-2 relative min-h-[650px] overflow-hidden border-b border-[#37423b] bg-[#202522] text-[#f6f3ed] sm:min-h-[800px]"
    >
      <div className="absolute inset-0 bg-[#2c6457]/20" />
      <motion.div
        style={{ rotate: outerRingRotate }}
        className="absolute left-1/2 top-1/2 hidden h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 sm:block sm:h-[680px] sm:w-[680px]"
      />
      <motion.div
        style={{ rotate: innerRingRotate }}
        className="absolute left-1/2 top-1/2 hidden h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e36c3f]/20 sm:block sm:h-[430px] sm:w-[430px]"
      />
      <div className="absolute inset-0 hidden sm:block" aria-hidden="true">
        {profiles.map((profile, index) => (
          <button
            key={`${profile.name}-${profile.channel}`}
            type="button"
            aria-label={`${profile.name}, ${profile.channel}`}
            style={{ animationDelay: profile.delay }}
            className={`people-profile group absolute ${profile.position} z-10 transition duration-300 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none`}
          >
            <span className="relative block">
              <img
                src={profile.src}
                alt={`${profile.name} customer profile`}
                loading="lazy"
                className={`${profile.size} rounded-full border-4 border-[#29322d] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.3)]`}
              />
              <span className="absolute -right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#29322d] bg-[#e36c3f] text-[9px] font-bold text-white">
                {index + 1}
              </span>
            </span>
            <span className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap border border-white/15 bg-[#29322d] px-3 py-1.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {profile.name} · {profile.channel}
            </span>
          </button>
        ))}
      </div>
      <div className="relative z-20 mx-auto flex min-h-[650px] max-w-[1240px] flex-col items-center justify-center px-5 py-16 text-center sm:min-h-[800px] sm:py-24 lg:px-8">
        <div
          className="mb-7 flex items-center justify-center gap-3 sm:hidden"
          aria-label="Real commerce teams"
        >
          {profiles.slice(0, 4).map((profile) => (
            <img
              key={profile.name}
              src={profile.src}
              alt={profile.name}
              loading="lazy"
              className="h-12 w-12 rounded-full border-2 border-[#9ab5ab] object-cover shadow-lg"
            />
          ))}
          <span className="sr-only">
            Commerce teams across Instagram, WhatsApp and web
          </span>
        </div>
        <div className="max-w-4xl">
          <Eyebrow light>More demand, less tab switching</Eyebrow>
          <h2 className="text-balance text-[clamp(2.25rem,9.5vw,3rem)] font-semibold leading-[0.98] tracking-[-0.075em] sm:text-7xl sm:leading-[0.94] lg:text-[88px]">
            The platform behind the people who keep selling.
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
            From an independent shop to a growing brand, Vendora gives every
            team the same clear operating rhythm.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                playTactileFeedback();
                smoothScrollToElement("process");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#e36c3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f08055]"
            >
              See how it works <ArrowRight className="h-4 w-4" />
            </button>
            <div className="text-left sm:border-l sm:border-white/20 sm:pl-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                Orders moved this month
              </div>
              <div className="mt-1 text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                {orders.toLocaleString("en-US")}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 left-0 w-full px-4 text-center font-mono text-[8px] uppercase tracking-[0.1em] text-white/45 sm:bottom-8 sm:text-[10px] sm:tracking-[0.16em]">
          Operators like you · independent teams · real commerce
        </div>
      </div>
    </section>
  );
}

function WhatsAppFlow() {
  const states = [
    [
      "/media/optimized/whatsapp-status-01.webp",
      "AI sells",
      "Product, price and context ready",
      "Amina's store",
      "09:41",
    ],
    [
      "/media/optimized/whatsapp-status-02.webp",
      "AI answers",
      "Stock checked before the reply",
      "Marta's edit",
      "09:43",
    ],
    [
      "/media/optimized/whatsapp-status-03.webp",
      "Platform closes",
      "Order, inventory and customer aligned",
      "João's order",
      "09:47",
    ],
    [
      "/media/optimized/whatsapp-status-04.webp",
      "AI understands",
      "Customer intent becomes a clear reply",
      "Nia's question",
      "09:49",
    ],
    [
      "/media/optimized/whatsapp-status-05.webp",
      "AI recommends",
      "Two available products, one easy choice",
      "Amina's shortlist",
      "09:52",
    ],
    [
      "/media/optimized/whatsapp-status-06.webp",
      "Order moves",
      "The delivery update is already on its way",
      "João's delivery",
      "09:56",
    ],
  ];
  const [active, setActive] = useState(0);
  const [src, label, detail, story, time] = states[active];
  return (
    <div className="relative mx-auto max-w-[500px]">
      <div className="mb-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-[#5f625d]">
        <span>WhatsApp Status</span>
        <span className="text-[#2c6457]">
          Live sequence · {active + 1}/{states.length}
        </span>
      </div>
      <LusionTiltCard className="relative mx-auto max-w-[370px] overflow-hidden rounded-[30px] border-[10px] border-[#202522] bg-[#202522] shadow-[0_24px_60px_rgba(32,37,34,0.22)]">
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
          {states.map((_, index) => (
            <span
              key={index}
              className="h-1 flex-1 overflow-hidden bg-white/35"
            >
              <span
                className={`block h-full bg-white ${index === active ? "w-full" : index < active ? "w-full" : "w-0"}`}
              />
            </span>
          ))}
        </div>
        <img
          src={src}
          alt={detail}
          className="aspect-[9/16] w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 border-t border-white/15 bg-[#202522]/90 p-4 text-white">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 overflow-hidden rounded-full border border-white/40">
              <img
                src={`/media/optimized/profile-0${(active % 4) + 1}.webp`}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <div className="text-xs font-semibold">{story}</div>
              <div className="font-mono text-[9px] text-white/55">
                {time} · WhatsApp
              </div>
            </div>
          </div>
          <div className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e36c3f]">
            {label}
          </div>
          <div className="mt-1 text-sm font-semibold">{detail}</div>
        </div>
      </LusionTiltCard>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Previous WhatsApp status"
          onClick={() =>
            setActive(
              (current) => (current - 1 + states.length) % states.length
            )
          }
          className="grid h-9 w-9 place-items-center border border-[#b9cabe] bg-[#d9e7de] text-[#2c6457] transition hover:bg-[#fffdf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {states.map((item, index) => (
          <button
            key={item[0]}
            type="button"
            aria-label={`Show ${item[1]} status`}
            aria-pressed={index === active}
            onClick={() => setActive(index)}
            className={`h-2.5 w-2.5 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] ${index === active ? "bg-[#e36c3f]" : "bg-[#8bad9d]"}`}
          />
        ))}
        <button
          type="button"
          aria-label="Next WhatsApp status"
          onClick={() => setActive((current) => (current + 1) % states.length)}
          className="grid h-9 w-9 place-items-center border border-[#b9cabe] bg-[#d9e7de] text-[#2c6457] transition hover:bg-[#fffdf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ChannelShowcase() {
  const channels = [
    {
      name: "Facebook",
      eyebrow: "Community feed",
      title: "Give the whole community a reason to stop scrolling.",
      detail:
        "Wide posts, social proof and a clear path from reaction to order.",
      assets: [
        "/media/optimized/facebook-campaign-01.webp",
        "/media/optimized/facebook-campaign-02.webp",
        "/media/optimized/facebook-campaign-03.webp",
      ],
      alt: [
        "Facebook order-ready campaign print",
        "Facebook customer-favourite campaign print",
        "Facebook community campaign print",
      ],
      tone: "bg-[#27352e]",
    },
    {
      name: "Instagram",
      eyebrow: "Visual feed",
      title: "Turn the product into the conversation.",
      detail:
        "Portrait posts, carousel moments and a shoppable story built around the product.",
      assets: [
        "/media/optimized/instagram-campaign-01.webp",
        "/media/optimized/instagram-campaign-02.webp",
        "/media/optimized/instagram-campaign-03.webp",
      ],
      alt: [
        "Instagram new-drop campaign print",
        "Instagram made-to-move campaign print",
        "Instagram carousel product campaign print",
      ],
      tone: "bg-[#d9e7de]",
    },
  ];
  return (
    <section
      id="channels"
      className="border-b border-[#d8d3c8] bg-[#f1eee7] text-[#202522]"
    >
      <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
        <div className="max-w-3xl">
          <Eyebrow>Every channel, in its own language</Eyebrow>
          <h2 className="text-5xl font-semibold leading-[0.96] tracking-[-0.07em] sm:text-6xl">
            The sale changes shape. Your operation stays clear.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#5f625d]">
            Facebook and Instagram each get their own space, their own visual
            rhythm and their own campaign story – without making the operator
            switch modes to understand the system.
          </p>
        </div>
        <div className="mt-14 space-y-5">
          {channels.map((channel, channelIndex) => (
            <article
              key={channel.name}
              className={`${channel.tone} overflow-hidden rounded-2xl p-5 sm:p-7 ${channelIndex === 1 ? "text-[#202522]" : "text-white"}`}
            >
              <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
                <div>
                  <div
                    className={`font-mono text-[10px] uppercase tracking-[0.16em] ${channelIndex === 1 ? "text-[#2c6457]" : "text-[#e36c3f]"}`}
                  >
                    {channel.name} · {channel.eyebrow}
                  </div>
                  <h3 className="mt-4 max-w-md text-4xl font-semibold leading-[0.96] tracking-[-0.07em] sm:text-5xl">
                    {channel.title}
                  </h3>
                  <p
                    className={`mt-5 max-w-sm text-sm leading-6 ${channelIndex === 1 ? "text-[#5f625d]" : "text-white/60"}`}
                  >
                    {channel.detail}
                  </p>
                  <div
                    className={`mt-7 flex items-center gap-3 border-t pt-4 font-mono text-[9px] uppercase tracking-[0.15em] ${channelIndex === 1 ? "border-[#8bad9d] text-[#5f625d]" : "border-white/15 text-white/45"}`}
                  >
                    <span>3 campaign pieces</span>
                    <span>·</span>
                    <span>1 catalog source</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_0.3fr] gap-3">
                  <div className="overflow-hidden rounded-xl border border-white/20 bg-[#f6f3ed] p-2 sm:p-3">
                    <img
                      src={channel.assets[0]}
                      alt={channel.alt[0]}
                      loading="lazy"
                      className={`w-full object-cover ${channelIndex === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}`}
                    />
                    <div className="flex items-center justify-between px-1 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                      <span>{channel.name} campaign</span>
                      <span className="text-[#2c6457]">Ready to publish</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {channel.assets.slice(1).map((asset, index) => (
                      <div
                        key={asset}
                        className="overflow-hidden rounded-xl border border-white/20 bg-[#29322d] p-1"
                      >
                        <img
                          src={asset}
                          alt={channel.alt[index + 1]}
                          loading="lazy"
                          className={`w-full object-cover ${channelIndex === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const CASE_STUDIES = [
  {
    company: "Kora Market",
    logo: "/media/optimized/logo-kora.webp",
    quote:
      "Vendora gave us a way to keep the campaign moving without losing the human reply.",
    person: "Amina Costa",
    role: "Founder, Kora Market",
    result: "+42%",
    resultLabel: "more WhatsApp conversations",
    detail: "A product launch adapted across Instagram, Facebook and WhatsApp.",
    channels: "Instagram · Facebook · WhatsApp",
  },
  {
    company: "Mova",
    logo: "/media/optimized/logo-mova.webp",
    quote:
      "We stopped guessing what was available. The team now sells from the same answer.",
    person: "Joel Mendes",
    role: "Operations lead, Mova",
    result: "-31%",
    resultLabel: "fewer stock-related replies",
    detail:
      "Sales AI checks stock and price before the customer gets a promise.",
    channels: "WhatsApp · Website",
  },
  {
    company: "Nala House",
    logo: "/media/optimized/logo-nala.webp",
    quote:
      "The dashboard finally tells us what to do next, not just what happened yesterday.",
    person: "Marta Silva",
    role: "Owner, Nala House",
    result: "+2.4×",
    resultLabel: "faster weekly decisions",
    detail: "Analytics turns product attention into a clear campaign brief.",
    channels: "Instagram · Analytics",
  },
  {
    company: "Orbit Works",
    logo: "/media/optimized/logo-orbit.webp",
    quote:
      "Our small team now feels like it has a whole operations department behind it.",
    person: "Leo Baptista",
    role: "Co-founder, Orbit Works",
    result: "4",
    resultLabel: "connected channels",
    detail:
      "One catalogue and one operating rhythm across every customer touchpoint.",
    channels: "Website · Instagram · Facebook",
  },
  {
    company: "Paxi",
    logo: "/media/optimized/logo-paxi.webp",
    quote:
      "The guardrails are the difference. The AI moves quickly, but never invents the answer.",
    person: "Nia Ramos",
    role: "Director, Paxi",
    result: "100%",
    resultLabel: "replies checked against stock",
    detail:
      "Every assisted response passes product, price and permission rules.",
    channels: "WhatsApp · Products · Orders",
  },
] as const;

const COMPANY_LOGOS = [
  ["Kora Market", "/media/optimized/logo-kora.webp"],
  ["Mova", "/media/optimized/logo-mova.webp"],
  ["Nala House", "/media/optimized/logo-nala.webp"],
  ["Orbit Works", "/media/optimized/logo-orbit.webp"],
  ["Paxi", "/media/optimized/logo-paxi.webp"],
  ["Senda", "/media/optimized/logo-senda.webp"],
  ["Tala Studio", "/media/optimized/logo-tala.webp"],
  ["Umbra", "/media/optimized/logo-umbra.webp"],
  ["Viva Foods", "/media/optimized/logo-viva.webp"],
  ["Zuri Collective", "/media/optimized/logo-zuri.webp"],
] as const;

function CaseStudiesSection() {
  const [active, setActive] = useState(0);
  const current = CASE_STUDIES[active];
  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % CASE_STUDIES.length),
      5600
    );
    return () => window.clearInterval(timer);
  }, []);
  return (
    <section
      id="proof-cases"
      className="overflow-hidden bg-[#e6d4aa] text-[#202522]"
    >
      <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Proof from the operating floor</Eyebrow>
            <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.07em] sm:text-6xl">
              When the system carries the work, the team sees the next move.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#6e716b]">
              A live story at a time: see how connected channels, governed
              agents and shared data change the daily rhythm.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous case study"
              onClick={() =>
                setActive(
                  (index) =>
                    (index - 1 + CASE_STUDIES.length) % CASE_STUDIES.length
                )
              }
              className="grid h-11 w-11 place-items-center rounded-full border border-[#a9976c]/70 bg-[#fffdf9]/50 text-[#2c6457] transition hover:border-[#e36c3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b6b36]">
              0{active + 1} / 0{CASE_STUDIES.length}
            </div>
            <button
              type="button"
              aria-label="Next case study"
              onClick={() =>
                setActive((index) => (index + 1) % CASE_STUDIES.length)
              }
              className="grid h-11 w-11 place-items-center rounded-full border border-[#a9976c]/70 bg-[#fffdf9]/50 text-[#2c6457] transition hover:border-[#e36c3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <article
            aria-live="polite"
            className="flex min-h-[420px] flex-col justify-between rounded-2xl bg-[#202522] p-6 text-[#f6f3ed] shadow-[0_18px_48px_rgba(32,37,34,0.12)] sm:p-9"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f6f3ed] p-2">
                  <img
                    src={current.logo}
                    alt={`${current.company} logo`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                </span>
                <div>
                  <div className="font-semibold">{current.company}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
                    {current.channels}
                  </div>
                </div>
              </div>
              <blockquote className="mt-12 max-w-xl text-3xl font-semibold leading-[1.02] tracking-[-0.06em] sm:text-4xl">
                "{current.quote}"
              </blockquote>
            </div>
            <div className="border-t border-white/15 pt-5">
              <div className="text-sm font-semibold">{current.person}</div>
              <div className="mt-1 text-xs text-white/50">{current.role}</div>
            </div>
          </article>
          <article className="flex min-h-[420px] flex-col justify-between rounded-2xl bg-[#fffdf9] p-6 shadow-[0_18px_48px_rgba(32,37,34,0.07)] sm:p-9">
            <div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">
                  Case study / {current.company}
                </div>
                <span className="h-2 w-2 rounded-full bg-[#e36c3f]" />
              </div>
              <div className="mt-12 grid gap-6 sm:grid-cols-[1fr_0.7fr] sm:items-end">
                <div>
                  <div className="text-2xl font-semibold leading-[1.05] tracking-[-0.05em]">
                    From scattered activity to one clear operating rhythm.
                  </div>
                  <p className="mt-5 max-w-md text-sm leading-6 text-[#6e716b]">
                    {current.detail}
                  </p>
                </div>
                <div className="border-t border-[#c8c1b4] pt-4 sm:border-l sm:border-t-0 sm:pl-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f8a80]">
                    Outcome
                  </div>
                  <div className="mt-2 text-5xl font-semibold tracking-[-0.08em] text-[#2c6457]">
                    {current.result}
                  </div>
                  <div className="mt-1 text-sm text-[#6e716b]">
                    {current.resultLabel}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-[#d8d3c8] pt-4">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                <span>Customer story</span>
                <span>Auto-advances</span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#d8d3c8]">
                <div
                  key={active}
                  className="case-study-progress h-full origin-left rounded-full bg-[#e36c3f]"
                  style={{
                    animation: "case-study-progress 5.6s linear forwards",
                  }}
                />
              </div>
            </div>
          </article>
        </div>
        <div className="mt-12">
          <h3
            id="company-marquee-title"
            className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b6b36]"
          >
            Teams already moving with Vendora
          </h3>
          <div
            role="region"
            aria-labelledby="company-marquee-title"
            className="company-marquee py-3"
          >
            <div className="company-marquee__track">
              {[0, 1].map((copy) => (
                <ul
                  key={copy}
                  className="company-marquee__group"
                  aria-hidden={copy === 1}
                >
                  {COMPANY_LOGOS.map(([name, logo]) => (
                    <li key={name} className="company-marquee__item">
                      <img
                        src={logo}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="company-marquee__logo"
                      />
                      <span className="whitespace-nowrap text-[14px] font-semibold tracking-[-0.02em] text-[#202522] sm:text-[15px]">
                        {name}
                      </span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OnboardingModal({
  open,
  onClose,
  startPath,
}: {
  open: boolean;
  onClose: () => void;
  startPath: string;
}) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("Sell more");
  const [channels, setChannels] = useState<string[]>(["Instagram"]);
  useEffect(() => {
    if (!open) return;
    setStep(1);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);
  if (!open) return null;
  const toggleChannel = (channel: string) =>
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
    );
  const destination = `${startPath}?goal=${encodeURIComponent(goal.toLowerCase().replace(/ /g, "-"))}&channels=${encodeURIComponent(channels.join(",").toLowerCase())}`;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#202522]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-[#d8d3c8] bg-[#fffdf9] shadow-[0_30px_100px_rgba(32,37,34,0.28)] sm:max-w-[560px] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-[#e2ded5] px-5 py-4 sm:px-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">
            Vendora / setup
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close onboarding"
            className="grid h-8 w-8 place-items-center rounded-full text-2xl text-[#8f8a80] transition hover:bg-[#f1eee7] hover:text-[#202522]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
            <span className={step >= 1 ? "text-[#2c6457]" : ""}>01 Goal</span>
            <span>/</span>
            <span className={step >= 2 ? "text-[#2c6457]" : ""}>
              02 Channels
            </span>
            <span>/</span>
            <span className={step >= 3 ? "text-[#2c6457]" : ""}>03 Plan</span>
          </div>
          {step === 1 && (
            <div className="mt-8">
              <h2
                id="onboarding-title"
                className="text-4xl font-semibold leading-[0.98] tracking-[-0.07em]"
              >
                What should Vendora carry first?
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#6e716b]">
                Choose the outcome you want to see first. We will shape the
                setup around it.
              </p>
              <div className="mt-7 grid gap-2">
                {[
                  "Sell more",
                  "Connect my channels",
                  "Organize daily operations",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGoal(item)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-semibold transition ${goal === item ? "border-[#2c6457] bg-[#d9e7de] text-[#202522]" : "border-[#d8d3c8] hover:border-[#8bad9d]"}`}
                  >
                    <span>{item}</span>
                    <span
                      className={`h-3 w-3 rounded-full border ${goal === item ? "border-[#2c6457] bg-[#2c6457]" : "border-[#b9b2a5]"}`}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#202522] text-sm font-semibold text-white transition hover:bg-[#2c6457]"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="mt-8">
              <h2
                id="onboarding-title"
                className="text-4xl font-semibold leading-[0.98] tracking-[-0.07em]"
              >
                Where is the work happening?
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#6e716b]">
                Pick every channel you want to keep aligned. You can add the
                rest later.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-2">
                {["Website", "Instagram", "Facebook", "WhatsApp"].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleChannel(item)}
                      className={`rounded-xl border p-4 text-left text-sm font-semibold transition ${channels.includes(item) ? "border-[#2c6457] bg-[#d9e7de]" : "border-[#d8d3c8] hover:border-[#8bad9d]"}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span>{item}</span>
                        <span
                          className={`h-3 w-3 rounded-full border ${channels.includes(item) ? "border-[#2c6457] bg-[#2c6457]" : "border-[#b9b2a5]"}`}
                        />
                      </span>
                    </button>
                  )
                )}
              </div>
              <div className="mt-7 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-12 flex-1 rounded-full border border-[#d8d3c8] text-sm font-semibold text-[#5f625d]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!channels.length}
                  onClick={() => setStep(3)}
                  className="h-12 flex-[2] rounded-full bg-[#202522] text-sm font-semibold text-white transition hover:bg-[#2c6457] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Review setup <ArrowRight className="ml-1 inline h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="mt-8">
              <h2
                id="onboarding-title"
                className="text-4xl font-semibold leading-[0.98] tracking-[-0.07em]"
              >
                Your first operating rhythm.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#6e716b]">
                A focused start means you can see value before you connect
                everything.
              </p>
              <div className="mt-7 divide-y divide-[#d8d3c8] border-y border-[#d8d3c8]">
                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                    Primary goal
                  </span>
                  <span className="text-sm font-semibold">{goal}</span>
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                    Channels
                  </span>
                  <span className="max-w-[230px] text-right text-sm font-semibold">
                    {channels.join(" · ")}
                  </span>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-3 gap-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[#6e716b]">
                <div className="rounded-xl bg-[#f1eee7] px-2 py-3">No card</div>
                <div className="rounded-xl bg-[#f1eee7] px-2 py-3">
                  Guided setup
                </div>
                <div className="rounded-xl bg-[#f1eee7] px-2 py-3">
                  Add CRM later
                </div>
              </div>
              <div className="mt-7 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-12 flex-1 rounded-full border border-[#d8d3c8] text-sm font-semibold text-[#5f625d]"
                >
                  Back
                </button>
                <Link
                  to={destination}
                  onClick={onClose}
                  className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-[#e36c3f] text-sm font-semibold text-white transition hover:bg-[#c95735]"
                >
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type SuggestionId = "stock" | "whatsapp" | "post" | "metrics";

const PROMPT_SUGGESTIONS: Array<{
  id: SuggestionId;
  label: string;
  prompt: string;
  badge: string;
  tag: string;
}> = [
  {
    id: "stock",
    label: "👟 Estoque Sapato Nike",
    prompt: "Verificar estoque atual e tamanhos de Sapato Nike",
    badge: "Estoque em Tempo Real",
    tag: "Catálogo",
  },
  {
    id: "whatsapp",
    label: "💬 Venda no WhatsApp",
    prompt: "Simular conversa de cliente interessado no WhatsApp",
    badge: "Sales AI · WhatsApp",
    tag: "Atendimento",
  },
  {
    id: "post",
    label: "🚀 Post Instagram & Facebook",
    prompt: "Gerar post de lançamento para o drop do Sapato Nike",
    badge: "Marketing AI",
    tag: "Campanhas",
  },
  {
    id: "metrics",
    label: "📊 Vendas de Hoje",
    prompt: "Como estão as vendas e pedidos consolidados de hoje?",
    badge: "Analytics AI",
    tag: "Operação",
  },
];

function InteractiveHeroPrompt() {
  const [activeId, setActiveId] = useState<SuggestionId>("stock");
  const [inputValue, setInputValue] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSelect = (id: SuggestionId) => {
    if (activeId === id) return;
    setIsSimulating(true);
    setActiveId(id);
    const suggestion = PROMPT_SUGGESTIONS.find((s) => s.id === id);
    if (suggestion) setInputValue(suggestion.prompt);
    setTimeout(() => setIsSimulating(false), 260);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsSimulating(true);
    const lower = inputValue.toLowerCase();
    if (
      lower.includes("whatsapp") ||
      lower.includes("conversa") ||
      lower.includes("cliente")
    ) {
      setActiveId("whatsapp");
    } else if (
      lower.includes("post") ||
      lower.includes("insta") ||
      lower.includes("face")
    ) {
      setActiveId("post");
    } else if (
      lower.includes("venda") ||
      lower.includes("metrica") ||
      lower.includes("fatur")
    ) {
      setActiveId("metrics");
    } else {
      setActiveId("stock");
    }
    setTimeout(() => setIsSimulating(false), 300);
  };

  const current =
    PROMPT_SUGGESTIONS.find((s) => s.id === activeId) || PROMPT_SUGGESTIONS[0];

  return (
    <div className="relative mx-auto mt-12 max-w-4xl px-2 sm:px-0">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_25px_65px_-15px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 backdrop-blur-2xl transition duration-300 hover:shadow-[0_32px_80px_-15px_rgba(15,23,42,0.12)]">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="ml-3 font-mono text-[11px] font-medium text-slate-600 uppercase tracking-wider">
              Terminal Operacional · Simulação em Tempo Real
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
            <span>Latência: 42ms</span>
            <span className="text-slate-300">/</span>
            <span className="text-emerald-600 font-medium">● Conectado</span>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-3">
          <div className="relative flex items-center">
            <Sparkles className="absolute left-4 h-5 w-5 text-emerald-600 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pergunte ao Vendora AI... (ex: estoque Sapato Nike, simular venda WhatsApp)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3.5 pl-12 pr-28 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition"
            />
            <button
              type="submit"
              className="absolute right-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
            >
              Executar
              <Send className="h-3 w-3" />
            </button>
          </div>

          {/* Quick Prompt Suggestion Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600 mr-1">
              Sugestões:
            </span>
            {PROMPT_SUGGESTIONS.map((s) => {
              const isSelected = activeId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </form>

        {/* Interactive Response Area */}
        <div className="border-t border-slate-100 bg-slate-50/40 p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {isSimulating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-32 items-center justify-center gap-3 text-slate-500"
              >
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                <span className="font-mono text-xs">
                  Consultando banco de dados e agentes...
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
                      {current.badge}
                    </span>
                    <span className="text-xs text-slate-500">
                      Resultado para:{" "}
                      <strong className="text-slate-800">
                        "{current.prompt}"
                      </strong>
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    Tempo de resposta: 0.18s
                  </span>
                </div>

                {/* Stock Response */}
                {activeId === "stock" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 font-bold text-slate-800">
                          👟
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">
                            Sapato Nike Air Street
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            SKU: NK-STREET-01 · Categoria: Calçados
                          </div>
                        </div>
                      </div>
                      <div className="text-right sm:border-l sm:border-slate-100 sm:pl-5">
                        <div className="text-xs text-slate-500">
                          Preço Oficial
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                          3.600 US$
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        <span>
                          Disponibilidade por Tamanho (14 pares em estoque
                          total)
                        </span>
                        <span className="text-emerald-700">
                          ● Conexão Atômica com Pedidos
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5">
                          <div className="text-xs font-medium text-slate-600">
                            Tamanho 39
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-base font-bold text-slate-900">
                              2 pares
                            </span>
                            <span className="font-mono text-[9px] font-semibold text-amber-700">
                              Estoque Baixo
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
                          <div className="text-xs font-medium text-slate-600">
                            Tamanho 40
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-base font-bold text-emerald-950">
                              6 pares
                            </span>
                            <span className="font-mono text-[9px] font-semibold text-emerald-700">
                              Disponível
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 opacity-60">
                          <div className="text-xs font-medium text-slate-600">
                            Tamanho 41
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-base font-bold text-slate-500">
                              0 pares
                            </span>
                            <span className="font-mono text-[9px] font-semibold text-rose-700">
                              Esgotado
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
                          <div className="text-xs font-medium text-slate-600">
                            Tamanho 42
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-base font-bold text-emerald-950">
                              6 pares
                            </span>
                            <span className="font-mono text-[9px] font-semibold text-emerald-700">
                              Disponível
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Chat Simulation */}
                {activeId === "whatsapp" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-xs text-white">
                          V
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Vitoria Catchiluvia
                          </div>
                          <div className="text-[10px] text-emerald-600">
                            WhatsApp oficial · +244 936 370 703
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-800">
                        Atendimento IA Ativo
                      </span>
                    </div>
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 p-3 text-xs text-slate-800">
                          Olá! Ainda têm o Sapato Nike no tamanho 40 disponível?
                          <span className="mt-1 block text-right font-mono text-[9px] text-slate-400">
                            10:14
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-emerald-700 p-3 text-xs text-white shadow-sm">
                          Olá Vitoria! Sim, temos 6 pares do Sapato Nike no
                          tamanho 40 a 3.600 US$. Gostaria de reservar agora com
                          entrega grátis em Luanda?
                          <span className="mt-1 block text-right font-mono text-[9px] text-emerald-200">
                            10:14 · IA
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 p-3 text-xs text-slate-800">
                          Sim por favor! Como posso efetuar o pagamento?
                          <span className="mt-1 block text-right font-mono text-[9px] text-slate-400">
                            10:15
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-emerald-700 p-3 text-xs text-white shadow-sm">
                          Perfeito! Já reservei o seu par por 15 min. Pode pagar
                          via Multicaixa Express pelo link seguro abaixo:
                          <div className="mt-2 rounded-lg bg-emerald-800/80 p-2 font-mono text-[10px] text-emerald-100">
                            🔗 vendora.co/pedidos/D2CC2E82
                          </div>
                          <span className="mt-1 block text-right font-mono text-[9px] text-emerald-200">
                            10:15 · IA
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-emerald-700 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Pedido #D2CC2E82 criado e estoque atualizado
                        atomicamente
                      </span>
                    </div>
                  </div>
                )}

                {/* Marketing Post Generator */}
                {activeId === "post" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <span className="text-xs font-bold text-slate-900">
                            Post de Lançamento (Instagram & Facebook)
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 space-y-2">
                          <p className="font-semibold text-slate-900">
                            👟 O drop mais aguardado acabou de aterrissar na
                            Sapataria Shop!
                          </p>
                          <p>
                            Conforto lendário para o seu dia a dia e um design
                            que destaca qualquer visual. O Sapato Nike já está
                            disponível com estoque limitado nos tamanhos 39 a 42
                            por 3.600 US$.
                          </p>
                          <p className="font-mono text-[11px] text-emerald-700">
                            👉 Compre direto no link da bio ou chame no WhatsApp
                            para atendimento imediato com entrega em Luanda!
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            #SapatariaShop #SneakersLuanda #ModaAngola
                            #SapatoNike #Vendora
                          </p>
                        </div>
                      </div>
                      <div className="w-full sm:w-48 shrink-0 rounded-xl border border-slate-200 bg-slate-100 p-3 flex flex-col justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase text-slate-500 font-semibold">
                            Canais Prontos
                          </div>
                          <div className="mt-2 space-y-1.5 text-xs text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Check className="h-3 w-3 text-emerald-600" />{" "}
                              Feed Instagram
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="h-3 w-3 text-emerald-600" />{" "}
                              Stories Instagram
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="h-3 w-3 text-emerald-600" />{" "}
                              Página Facebook
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 rounded-lg bg-emerald-600 text-white text-center py-1.5 text-xs font-semibold">
                          Agendar Post
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metrics Analytics */}
                {activeId === "metrics" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="text-xs text-slate-500">
                          Faturamento Hoje
                        </div>
                        <div className="mt-1 text-xl font-bold text-slate-900">
                          3.600 US$
                        </div>
                        <div className="mt-1 font-mono text-[10px] font-semibold text-emerald-700">
                          ↑ +24% vs ontem
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="text-xs text-slate-500">
                          Pedidos Concluídos
                        </div>
                        <div className="mt-1 text-xl font-bold text-slate-900">
                          18 pedidos
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-slate-500">
                          2 pendentes
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="text-xs text-slate-500">
                          Canal Líder
                        </div>
                        <div className="mt-1 text-xl font-bold text-emerald-700">
                          WhatsApp
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-slate-500">
                          68% das vendas
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="text-xs text-slate-500">
                          Tempo de Resposta
                        </div>
                        <div className="mt-1 text-xl font-bold text-slate-900">
                          1.2s
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-emerald-700">
                          100% por IA
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-center justify-between">
                      <span>
                        💡 <strong>Insight da IA:</strong> O Sapato Nike gerou
                        72% das conversões hoje após a publicação programada.
                      </span>
                      <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function HeroSection({
  onStart,
}: {
  startPath: string;
  onStart: () => void;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });

  // Movimento de scroll limpo e fluido (sem apagar o título cedo demais)
  const headlineY = useTransform(smoothScroll, [0, 0.5], [0, -35]);
  const promptY = useTransform(smoothScroll, [0, 0.5], [0, -18]);

  // Product frame unfolds from 3D isometric perspective to full-fidelity flat view
  const productRotateX = useTransform(smoothScroll, [0.05, 0.55], [12, 0]);
  const productScale = useTransform(smoothScroll, [0.05, 0.55], [0.93, 1.0]);
  const productY = useTransform(smoothScroll, [0.05, 0.55], [45, 0]);

  return (
    <section
      id="hero-stage"
      ref={heroRef}
      className="relative overflow-hidden border-b border-slate-200/80 bg-[#fcfdfd] cursor-default"
    >
      {/* Architectural Grid Crosses */}
      <GridCross
        label="SYS // 00.HERO_NEXUS"
        className="absolute top-6 left-6"
      />
      <GridCross
        label="FLUID // KELVIN_WAKE"
        className="absolute top-6 right-6"
      />
      <WaterWakeHero
        damping={0.991}
        dropRadius={0.024}
        className="pb-24 pt-16 sm:pb-32 sm:pt-24 min-h-[960px] flex flex-col justify-center"
      >
        {/* Transição suave para a secção clara do preview, mantendo o fundo branco. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-50 via-slate-50/70 to-transparent z-10" />

        <div className="relative z-20 mx-auto max-w-[1240px] px-5 lg:px-8">
          <motion.div
            style={{ y: headlineY }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="pointer-events-auto mb-8 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-slate-700">
                Operating System para Comércio
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-[10px] text-slate-400">Multi-Canal & IA</span>
            </div>

            <h1 className="text-balance text-[clamp(2.75rem,7.5vw,5.75rem)] font-bold tracking-[-0.045em] text-slate-950 leading-[0.96] sm:leading-[0.93]">
              Vender com inteligência.
              <br />
              <span className="text-slate-900 font-medium">
                Operar com{" "}
                <span className="font-serif italic font-normal text-slate-800">
                  precisão absoluta.
                </span>
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 font-normal">
              A infraestrutura transacional que unifica o seu site, WhatsApp,
              Instagram e catálogo em tempo real. Cada conversa fecha vendas com
              estoque verificado e rastreabilidade total.
            </p>

            <div className="pointer-events-auto mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                data-cursor="COMEÇAR AGORA"
                onClick={() => {
                  playTactileFeedback();
                  onStart();
                }}
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-slate-950 px-8 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] transition-all hover:bg-slate-800 hover:scale-[1.04] active:scale-[0.98]"
              >
                Começar Gratuitamente
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                data-cursor="VER DEMO"
                onClick={() => {
                  playTactileFeedback();
                  smoothScrollToElement("whatsapp");
                }}
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-7 text-sm font-semibold text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 hover:border-slate-400 hover:scale-[1.04] active:scale-[0.98]"
              >
                <Play className="h-3.5 w-3.5 fill-current text-slate-600" />
                Ver em Ação
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              <span>● WhatsApp Cloud API Nativa</span>
              <span className="text-slate-300">/</span>
              <span>● Estoque Atômico RLS</span>
              <span className="text-slate-300">/</span>
              <span>● Auditoria Completa</span>
            </div>
          </motion.div>

          {/* Prompt Interativo */}
          <motion.div style={{ y: promptY }} className="pointer-events-auto" data-cursor="TESTAR IA">
            <InteractiveHeroPrompt />
          </motion.div>

          {/* Desdobramento e Expansão 3D do Dashboard pelo Scroll */}
          <motion.div
            style={{
              rotateX: productRotateX,
              scale: productScale,
              y: productY,
              transformPerspective: 1200,
            }}
            data-cursor="EXPLORAR OS"
            className="pointer-events-auto mt-20"
          >
            <div className="mb-8 flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-1 mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Plataforma em Tempo Real · Visão Unificada
              </div>
              <p className="mt-1 max-w-lg text-sm text-slate-500 font-normal">
                Acompanhe pedidos, estoque compartilhado e conversas em uma única interface transacional.
              </p>
            </div>
            <ProductFrame />
          </motion.div>
        </div>
      </WaterWakeHero>
      <SectionBridge nextId="proof" label="01 // Comunidade & Operadores Reais" />
    </section>
  );
}

const FAQ_ITEMS = [
  [
    "Can the AI invent a product, price or stock level?",
    "No. Sales AI is designed to query product search, stock and price tools before responding. If the data is not available or the item is out of stock, the agent should say so instead of guessing.",
  ],
  [
    "What permissions do the agents have?",
    "Permissions are scoped by role. Marketing can prepare and publish approved content, Sales can query customer and product context, Analytics can read performance signals, and Admin controls the rules and connections.",
  ],
  [
    "What happens to our customer and order data?",
    "Your operational data stays in the shared business layer so the right agent can use the right context. Access is structured around the role and action, not an unrestricted chatbot account.",
  ],
  [
    "Can Vendora connect to our CRM?",
    "Yes – Vendora is designed to sit alongside your CRM through an API and webhook layer. Customer context, conversation outcomes and order events can be routed back to the relationship system your team already uses.",
  ],
  [
    "Do we need to replace our existing CRM?",
    "No. The goal is to keep your CRM as the relationship record while Vendora handles channel conversations, catalogue checks and operational follow-through. Start with the events and workflows that matter most.",
  ],
  [
    "What stops an agent from publishing the wrong thing?",
    "Before a publish action, the system can check that the product exists, stock is available, the price is valid, content meets approval rules and the timing is allowed. Those guardrails are part of the operating rhythm.",
  ],
] as const;

function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="border-b border-[#d8d3c8] bg-[#f1eee7]">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-32">
        <div>
          <Eyebrow>Questions before you connect</Eyebrow>
          <h2 className="max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.07em] sm:text-6xl">
            Security, permissions and CRM – answered clearly.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-[#6e716b]">
            The fastest way to trust an AI system is to understand what it can
            access, what it can change and where your existing customer data
            fits.
          </p>
          <Link
            to="/signup"
            className="mt-9 inline-flex items-center gap-2 bg-[#202522] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2c6457]"
          >
            Connect your operation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="border-t border-[#c8c1b4]">
          {FAQ_ITEMS.map(([question, answer], index) => (
            <div key={question} className="border-b border-[#c8c1b4]">
              <button
                type="button"
                onClick={() => setOpen(open === index ? -1 : index)}
                aria-expanded={open === index}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-semibold text-[#202522] transition hover:text-[#2c6457]"
              >
                <span>{question}</span>
                <span className="grid h-7 w-7 shrink-0 place-items-center border border-[#b9b2a5] font-mono text-lg font-normal text-[#2c6457]">
                  {open === index ? "-" : "+"}
                </span>
              </button>
              {open === index && (
                <div className="max-w-2xl pb-6 pr-10 text-sm leading-6 text-[#6e716b]">
                  {answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PROCESS_STEP_COUNT = 3;

function ProcessSection() {
  const steps = [
    {
      number: "01",
      label: "Customer asks",
      title: "The question arrives where the sale already lives.",
      detail:
        "A customer asks about the olive linen shirt in WhatsApp. No new inbox. No context lost.",
      status: "Incoming intent",
      tone: "bg-[#d9e7de]",
      visual: (
        <div className="mx-auto max-w-[360px] rounded-2xl border border-[#b9cabe] bg-[#fffdf9] p-4 shadow-[0_16px_40px_rgba(44,100,87,0.12)]">
          <div className="flex items-center gap-3 border-b border-[#d8e3da] pb-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#2c6457] text-white">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-semibold">Amina's store</div>
              <div className="font-mono text-[9px] text-[#8f8a80]">
                WhatsApp · 09:41
              </div>
            </div>
          </div>
          <div className="mt-5 ml-auto max-w-[250px] bg-[#d9e7de] p-3 text-sm leading-5 text-[#202522]">
            Hi – is the linen shirt available in olive?
          </div>
          <div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#2c6457]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e36c3f]" />
            Intent detected
          </div>
        </div>
      ),
    },
    {
      number: "02",
      label: "AI checks",
      title: "The answer is earned from the operating data.",
      detail:
        "Sales AI checks the catalogue, stock, price and customer context before it writes a reply.",
      status: "Guardrails active",
      tone: "bg-[#e6d4aa]",
      visual: (
        <div className="mx-auto max-w-[390px] rounded-2xl border border-[#c9b57e] bg-[#fffdf9] p-5 shadow-[0_16px_40px_rgba(139,107,54,0.12)]">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b6b36]">
              Sales AI / verification
            </div>
            <span className="h-2 w-2 rounded-full bg-[#e36c3f]" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["Product exists", "Linen shirt · Olive", true],
              ["Stock available", "12 units", true],
              ["Price valid", "$68.00", true],
              ["Customer intent", "Ready to buy", true],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between gap-4 border-b border-[#eee5d0] pb-3 text-sm"
              >
                <span className="flex items-center gap-2 text-[#5f625d]">
                  <Check className="h-3.5 w-3.5 text-[#2c6457]" />
                  {String(label)}
                </span>
                <span className="font-mono text-[10px] text-[#202522]">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 border border-[#b9cabe] bg-[#d9e7de] px-3 py-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-[#2c6457]">
            Safe to answer
          </div>
        </div>
      ),
    },
    {
      number: "03",
      label: "Platform closes",
      title: "The conversation becomes a clean, traceable outcome.",
      detail:
        "The order is created, inventory is reserved and the customer gets a clear confirmation – without a handoff hunt.",
      status: "Outcome recorded",
      tone: "bg-[#202522]",
      visual: (
        <div className="mx-auto max-w-[390px] rounded-2xl border border-white/15 bg-[#151a17] p-5 text-[#f6f3ed] shadow-[0_16px_40px_rgba(32,37,34,0.2)]">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#e36c3f]">
              Order closed / #VD-1048
            </div>
            <span className="border border-[#8bad9d]/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#b9cabe]">
              Reserved
            </span>
          </div>
          <div className="mt-6 flex items-center gap-3 border-b border-white/10 pb-5">
            <span className="grid h-10 w-10 place-items-center bg-[#e36c3f] text-white">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-semibold">Linen shirt · Olive</div>
              <div className="font-mono text-[9px] text-white/45">
                1 item · $68.00
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-xs text-white/65">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#b9cabe]" />
              Inventory reserved
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#b9cabe]" />
              Customer notified
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#b9cabe]" />
              CRM event ready
            </div>
          </div>
        </div>
      ),
    },
  ] as const;
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % PROCESS_STEP_COUNT),
      5200
    );
    return () => window.clearInterval(timer);
  }, []);
  const current = steps[active];
  return (
    <section className="overflow-hidden border-b border-[#d8d3c8] bg-[#f6f3ed]">
      <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Eyebrow>The work behind the reply</Eyebrow>
            <h2 className="max-w-xl text-5xl font-semibold leading-[0.94] tracking-[-0.07em] sm:text-6xl">
              One question in. A complete operation out.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#6e716b]">
              The intelligence is not a chatbot layer floating above the
              business. It is the controlled path from customer intent to a
              clean, traceable outcome.
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-[#d8d3c8] pt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80] lg:justify-end lg:border-t-0 lg:pt-0">
            <span className="text-[#2c6457]">Question</span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Context</span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Order</span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Notified</span>
          </div>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                aria-pressed={active === index}
                onClick={() => setActive(index)}
                className={`w-full rounded-2xl border p-5 text-left transition ${active === index ? "border-[#2c6457] bg-[#d9e7de]" : "border-[#d8d3c8] bg-[#fffdf9] hover:border-[#8bad9d]"}`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`font-mono text-[10px] ${active === index ? "text-[#e36c3f]" : "text-[#8f8a80]"}`}
                  >
                    {step.number}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                      {step.label}
                    </span>
                    <span className="mt-2 block text-base font-semibold leading-5 tracking-[-0.03em] text-[#202522]">
                      {step.title}
                    </span>
                  </span>
                  <span
                    className={`ml-auto mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${active === index ? "bg-[#e36c3f]" : "bg-[#d8d3c8]"}`}
                  />
                </div>
              </button>
            ))}
          </div>
          <div
            className={`min-h-[430px] rounded-2xl ${current.tone} flex flex-col justify-between p-5 sm:p-8`}
          >
            <div
              className={`flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] ${active === 2 ? "text-white/45" : "text-[#8f8a80]"}`}
            >
              <span>Live operation / 0{active + 1}</span>
              <span
                className={active === 2 ? "text-[#e36c3f]" : "text-[#2c6457]"}
              >
                {current.status}
              </span>
            </div>
            <div className="py-10">{current.visual}</div>
            <div
              className={`max-w-2xl border-t pt-5 ${active === 2 ? "border-white/15 text-white/60" : "border-black/10 text-[#6e716b]"}`}
            >
              <p className="text-sm leading-6">{current.detail}</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex items-center justify-between border-t border-[#d8d3c8] pt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
          <span>Click a step to inspect the handoff</span>
          <span>Auto-advances</span>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const { user } = useAuth();
  const startPath = user ? "/dashboard" : "/signup";
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Lusion-grade smooth inertia scroll
  useInertiaScroll();

  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-slate-50/50 text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-950 relative">
      <TactileGrain />
      <LusionCursor />
      <ScrollProgressBar />
      {/* Guia de fluxo e fita de dados conectiva contínua (estilo Lusion) */}
      <DataStreamRibbon />
      <SiteHeader
        ctaHref={startPath}
        onCtaClick={() => setOnboardingOpen(true)}
      />
      <main className="pt-[72px] sm:pt-[76px] relative z-10">
        {/* Section 1: White hero with interactive liquid-water cursor wake */}
        <HeroSection
          startPath={startPath}
          onStart={() => setOnboardingOpen(true)}
        />

        {/* Section 2: Proof & Real Operators in Orbit */}
        <SectionReveal id="proof" delay={0.04} className="relative">
          <GridCross
            label="SYS // 01.REAL_OPERATORS"
            className="absolute top-4 left-6 hidden sm:flex"
          />
          <ProofSection />
          <SectionBridge nextId="whatsapp" label="02 // Comércio Conversacional WhatsApp" dark />
        </SectionReveal>

        {/* Section 3: WhatsApp Conversational Commerce */}
        <SectionReveal id="whatsapp" delay={0.04} className="relative">
          <GridCross
            label="SYS // 02.WHATSAPP_AI"
            className="absolute top-4 right-6 hidden sm:flex"
          />
          <section className="overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50 py-24 sm:py-32">
            <div className="mx-auto grid max-w-[1240px] gap-10 px-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8">
              <div>
                <Eyebrow>Comércio dentro da conversa</Eyebrow>
                <h2 className="max-w-xl text-5xl font-bold leading-[0.96] tracking-[-0.07em] text-slate-950 sm:text-6xl">
                  A IA vende no canal que os seus clientes já usam todos os
                  dias.
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
                  Responde a dúvidas sobre produto, verifica estoque em tempo
                  real, gera o pedido e atualiza a equipe com clareza e
                  precisão.
                </p>
                <div className="mt-9 space-y-4 border-t border-slate-200/80 pt-6 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    Conversas naturais com contexto de catálogo
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Estoque conferido antes de qualquer confirmação
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Pedidos e pagamentos sincronizados com o painel central
                  </div>
                </div>
              </div>
              <div data-cursor="SIMULAR PEDIDO">
                <WhatsAppFlow />
              </div>
            </div>
          </section>
          <SectionBridge nextId="channels" label="03 // Publicação Multi-Canal" />
        </SectionReveal>

        {/* Section 4: Omni-channel feed showcase */}
        <SectionReveal id="channels" delay={0.04} className="relative">
          <GridCross
            label="SYS // 03.OMNICHANNEL_FEED"
            className="absolute top-4 left-6 hidden sm:flex"
          />
          <ChannelShowcase />
          <SectionBridge nextId="agents" label="04 // Orquestração de Agentes IA" />
        </SectionReveal>

        {/* Section 5: AI Specialized Agents & Guardrails */}
        <SectionReveal id="agents" delay={0.04} className="relative">
          <GridCross
            label="SYS // 04.AGENT_GOVERNANCE"
            className="absolute top-4 right-6 hidden sm:flex text-emerald-400/50"
          />
          <section className="overflow-hidden border-b border-slate-800 bg-slate-950 text-slate-100 py-24 sm:py-32">
            <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
              <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
                <div>
                  <Eyebrow light>Inteligência com Governança</Eyebrow>
                  <h2 className="max-w-xl text-5xl font-bold leading-[0.94] tracking-[-0.07em] sm:text-6xl text-white">
                    Um orquestrador. Três especialistas. Toda ação protegida.
                  </h2>
                  <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                    A Vendora não entrega o seu negócio a um chatbot genérico.
                    Ela coordena agentes focados com acesso estrito a dados
                    reais e permissões invioláveis.
                  </p>
                  <div className="mt-10 space-y-3">
                    <LusionTiltCard className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-white text-base">
                            Marketing AI
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Adapta fotos, ganchos e campanhas para cada canal
                            (Feed, Stories, Reels).
                          </div>
                        </div>
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">
                          Pode Publicar
                        </span>
                      </div>
                    </LusionTiltCard>
                    <LusionTiltCard className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-white text-base">
                            Sales AI
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Verifica estoque, reserva pedidos e orienta
                            pagamentos seguros.
                          </div>
                        </div>
                        <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-teal-400 font-semibold">
                          Pode Consultar
                        </span>
                      </div>
                    </LusionTiltCard>
                    <LusionTiltCard className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-white text-base">
                            Analytics AI
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Transforma conversões e sinais em recomendações
                            práticas semanais.
                          </div>
                        </div>
                        <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-indigo-400 font-semibold">
                          Pode Ler
                        </span>
                      </div>
                    </LusionTiltCard>
                  </div>
                </div>
                <div>
                  <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/60 p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
                    <video
                      className="aspect-video w-full rounded-2xl object-cover"
                      src="/media/agent-architecture.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-label="Diagrama da arquitetura de agentes Vendora"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      <span>Sistema de Agentes / Mapa Ativo</span>
                      <span className="text-emerald-400 font-semibold">
                        ● Controlado por Regras RLS
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                        Canais
                      </div>
                      <div className="mt-1.5 text-base font-bold text-white">
                        4 conectados
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                        Agentes
                      </div>
                      <div className="mt-1.5 text-base font-bold text-white">
                        3 especializados
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                        Fonte Única
                      </div>
                      <div className="mt-1.5 text-base font-bold text-white">
                        1 base transacional
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-14 border-t border-white/10 pt-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                      Guardrails Antes de Qualquer Ação
                    </div>
                    <div className="mt-1 text-xl font-bold tracking-tight text-white">
                      O agente só age com validação total.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
                    {[
                      "Produto existe",
                      "Estoque conferido",
                      "Preço validado",
                      "Conteúdo verificado",
                      "Regra cumprida",
                    ].map((step, index) => (
                      <span key={step} className="flex items-center gap-2">
                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                          {step}
                        </span>
                        {index < 4 && (
                          <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          <SectionBridge nextId="plans" label="05 // Planos & Escala" dark />
        </SectionReveal>

        {/* Section 6: Plans & Pricing */}
        <SectionReveal id="plans" delay={0.04}>
          <PlansSection />
          <SectionBridge nextId="proof-cases" label="06 // Resultados Reais" />
        </SectionReveal>

        {/* Section 7: Case Studies & Testimonials */}
        <SectionReveal id="proof-cases" delay={0.04}>
          <CaseStudiesSection />
        </SectionReveal>

        {/* Section 8: FAQ Accordion */}
        <SectionReveal id="faq" delay={0.04}>
          <FAQSection />
        </SectionReveal>

        {/* Section 9: Operating Rhythm & How it works */}
        <SectionReveal id="process" delay={0.04}>
          <ProcessSection />
          <SectionBridge nextId="control-room" label="07 // Visão de Comando" />
        </SectionReveal>

        {/* Section 10: Control Room */}
        <SectionReveal id="control-room" delay={0.04}>
          <section className="border-b border-slate-800 bg-slate-900 text-slate-100 py-24 sm:py-32">
            <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <Eyebrow light>Visão de Comando</Eyebrow>
                  <h2 className="max-w-2xl text-5xl font-bold leading-[0.96] tracking-[-0.07em] sm:text-6xl text-white">
                    Toda a sua operação sem troca de telas.
                  </h2>
                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
                    Pedidos, catálogo, canais e trabalho diário residem no mesmo
                    ecossistema – clareza total para cada decisão do seu
                    negócio.
                  </p>
                </div>
                <Link
                  to={startPath}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Explorar plataforma <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-14 grid gap-6 lg:grid-cols-2">
                <LusionTiltCard className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-2 sm:p-3 shadow-xl">
                  <img
                    src="/media/optimized/operations-audit.webp"
                    alt="Visão de operações da Vendora"
                    loading="lazy"
                    className="w-full rounded-2xl object-cover"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    <span>Operações em Tempo Real</span>
                    <span className="text-emerald-400 font-semibold">
                      ● Auditoria Conectada
                    </span>
                  </div>
                </LusionTiltCard>
                <LusionTiltCard className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-2 sm:p-3 shadow-xl">
                  <img
                    src="/media/optimized/storefront-commerce.webp"
                    alt="Loja virtual da Vendora com estoque em tempo real"
                    loading="lazy"
                    className="w-full rounded-2xl object-cover"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    <span>Fonte do Catálogo</span>
                    <span className="text-emerald-400 font-semibold">
                      ● Sincronização 100%
                    </span>
                  </div>
                </LusionTiltCard>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                <span className="text-emerald-400 font-bold">Pedidos</span>
                <span>·</span>
                <span>Estoque Atômico</span>
                <span>·</span>
                <span>Contexto de Clientes</span>
                <span>·</span>
                <span>Publicação Multi-canal</span>
              </div>
            </div>
          </section>
        </SectionReveal>

        {/* Section 11: Final Call to Action */}
        <SectionReveal delay={0.04}>
          <section className="relative overflow-hidden bg-slate-950 text-white py-24 sm:py-32" data-cursor="COMEÇAR">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/40 via-slate-900/50 to-indigo-950/40" />
            <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
              <div>
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Pronto para começar
                </div>
                <h2 className="mt-4 max-w-xl text-5xl font-bold leading-[0.96] tracking-[-0.07em] sm:text-6xl text-white">
                  Opere o momento com inteligência e controle.
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
                  Dê à sua equipe uma plataforma unificada para captar
                  intenções, fechar vendas no WhatsApp e manter seu estoque
                  perfeitamente alinhado.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Link
                    to={startPath}
                    data-cursor="CRIAR CONTA"
                    className="mt-9 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                  >
                    Criar conta grátis <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-2.5 sm:p-3 shadow-2xl backdrop-blur-sm">
                <img
                  src="/media/optimized/cta-merchant-at-work.webp"
                  alt="Comerciante operando calmamente com o celular"
                  loading="lazy"
                  className="aspect-[3/2] w-full rounded-2xl object-cover"
                />
                <div className="flex items-center justify-between px-3 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-300">
                  <span>Comércio em Movimento</span>
                  <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Controle Total
                  </span>
                </div>
              </div>
            </div>
          </section>
        </SectionReveal>
      </main>
      <OnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        startPath={startPath}
      />
      <SiteFooter />
    </div>
  );
}