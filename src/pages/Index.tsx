import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Globe2,
  Instagram,
  MessageCircle,
  Package,
  Play,
  ShoppingBag,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PlansSection } from "@/components/site/PlansSection";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

type EyebrowProps = { children: ReactNode; light?: boolean };

function Eyebrow({ children, light = false }: EyebrowProps) {
  return (
    <div
      className={`mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] ${light ? "text-[#e36c3f]" : "text-[#2c6457]"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${light ? "bg-[#e36c3f]" : "bg-[#2c6457]"}`}
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
    <div className="rounded-2xl border border-[#e2ded5] bg-[#fffdf9] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-[#2c6457]" />
      </div>
      <div className="mt-3 text-[23px] font-semibold tracking-[-0.05em] text-[#202522]">
        {value}
      </div>
      <div className="mt-1 text-[10px] text-[#8f8a80]">{note}</div>
    </div>
  );
}

function ProductFrame() {
  return (
    <div className="relative mx-auto max-w-[1160px]">
      <div className="overflow-hidden rounded-2xl border border-[#d9d5cc] bg-[#f1eee7] shadow-[0_28px_80px_rgba(32,37,34,0.14)]">
        <div className="flex h-11 items-center justify-between rounded-t-2xl border-b border-[#ded9d0] bg-[#fffdf9] px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#d9d5cc]" />
            <span className="h-2 w-2 rounded-full bg-[#d9d5cc]" />
            <span className="h-2 w-2 rounded-full bg-[#d9d5cc]" />
          </div>
          <div className="font-mono text-[9px] text-[#8f8a80]">
            app.vendora.co / overview
          </div>
          <div className="h-5 w-14 rounded-full border border-[#e2ded5] bg-[#f6f3ed]" />
        </div>
        <div className="grid min-h-[420px] md:grid-cols-[180px_1fr]">
          <aside className="hidden border-r border-[#ded9d0] bg-[#202522] p-4 text-[#f6f3ed] md:block">
            <div className="mb-8 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[#e36c3f] text-white">
                <Circle className="h-2.5 w-2.5 fill-current" />
              </span>
              <span className="text-[11px] font-bold">Vendora</span>
            </div>
            <div className="space-y-1">
              {["Overview", "Orders", "Products", "Customers", "Agents"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] ${i === 0 ? "bg-white/10 text-white" : "text-white/50"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[#e36c3f]" : "bg-white/30"}`}
                    />
                    {item}
                  </div>
                ),
              )}
            </div>
            <div className="mt-8 border-t border-white/10 pt-4">
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">
                Channels
              </div>
              <div className="mt-3 space-y-2 text-[10px] text-white/55">
                <div>● Website</div>
                <div>● Instagram</div>
                <div>● WhatsApp</div>
              </div>
            </div>
          </aside>
          <div className="min-w-0 bg-[#f6f3ed] p-4 sm:p-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                  Monday, 14 October
                </div>
                <div className="mt-1 text-xl font-semibold tracking-[-0.05em] text-[#202522]">
                  Good morning, Amina.
                </div>
              </div>
              <div className="hidden rounded-full border border-[#ded9d0] bg-[#fffdf9] px-3 py-2 font-mono text-[9px] text-[#8f8a80] sm:block">
                Last 30 days
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Metric
                label="Revenue"
                value="$48,290"
                note="↑ 12.8% vs previous"
                icon={WalletCards}
              />
              <Metric
                label="Orders"
                value="684"
                note="Across 3 channels"
                icon={ShoppingBag}
              />
              <Metric
                label="Products"
                value="128"
                note="7 need attention"
                icon={Package}
              />
              <Metric
                label="Conversion"
                value="4.8%"
                note="Storefront"
                icon={BarChart3}
              />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-[#ded9d0] bg-[#fffdf9] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                      Performance
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#202522]">
                      Revenue by day
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-[#2c6457]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2c6457]" />
                    Revenue
                  </div>
                </div>
                <div className="mt-7 flex h-28 items-end gap-1.5 border-b border-[#e8e3da] px-1">
                  {[
                    32, 46, 38, 62, 54, 78, 66, 88, 75, 94, 81, 100, 86, 97,
                  ].map((height, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-full ${i === 11 ? "bg-[#e36c3f]" : "bg-[#9ab5ab]"}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between font-mono text-[8px] text-[#aaa49a]">
                  <span>01 OCT</span>
                  <span>14 OCT</span>
                </div>
              </div>
              <div className="rounded-2xl border border-[#ded9d0] bg-[#fffdf9] p-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                  Activity
                </div>
                <div className="mt-3 space-y-3">
                  {[
                    ["New order", "#VD-1048 · Website", "2m"],
                    ["Stock alert", "Linen shirt · 4 left", "18m"],
                    ["Agent completed", "Campaign brief ready", "1h"],
                  ].map(([title, detail, time]) => (
                    <div key={title} className="flex items-start gap-2.5">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e36c3f]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2 text-[10px] font-semibold text-[#202522]">
                          <span>{title}</span>
                          <span className="font-mono text-[8px] font-normal text-[#aaa49a]">
                            {time}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[9px] text-[#8f8a80]">
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
    <section className="reveal-up reveal-delay-2 relative min-h-[650px] overflow-hidden border-b border-[#37423b] bg-[#202522] text-[#f6f3ed] sm:min-h-[800px]">
      <div className="absolute inset-0 bg-[#2c6457]/20" />
      <div className="absolute left-1/2 top-1/2 hidden h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 sm:block sm:h-[680px] sm:w-[680px]" />
      <div className="absolute left-1/2 top-1/2 hidden h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e36c3f]/20 sm:block sm:h-[430px] sm:w-[430px]" />
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
            <a
              href="#process"
              className="inline-flex items-center gap-2 rounded-full bg-[#e36c3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f08055]"
            >
              See how it works <ArrowRight className="h-4 w-4" />
            </a>
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
      <div className="relative mx-auto max-w-[370px] overflow-hidden rounded-[30px] border-[10px] border-[#202522] bg-[#202522] shadow-[0_24px_60px_rgba(32,37,34,0.22)]">
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
      </div>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Previous WhatsApp status"
          onClick={() =>
            setActive(
              (current) => (current - 1 + states.length) % states.length,
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
            rhythm and their own campaign story — without making the operator
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
    result: "−31%",
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
      5600,
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
                    (index - 1 + CASE_STUDIES.length) % CASE_STUDIES.length,
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
                “{current.quote}”
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

const HERO_VARIANTS = {
  a: {
    eyebrow: "Commerce operating system",
    title: ["Your business,", "always selling."],
    description:
      "One intelligent platform for your website, Instagram, Facebook and WhatsApp. Run the catalog, orders and daily work from one clear place.",
    primary: "Start for free",
    secondary: "See the operation",
    secondaryHref: "#whatsapp",
    proof: ["No card required", "Setup in minutes", "Built for real stock"],
  },
  b: {
    eyebrow: "From first message to paid order",
    title: ["Turn every channel", "into a clear next move."],
    description:
      "684 orders across 3 channels. Vendora connects your website, Instagram, Facebook and WhatsApp to one operating rhythm.",
    primary: "Build my operation",
    secondary: "See how it works",
    secondaryHref: "#agents",
    proof: ["4 channels connected", "Stock-aware AI", "One shared data layer"],
  },
} as const;

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
        : [...current, channel],
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
                  ),
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
                <div className="rounded-xl bg-[#f1eee7] px-2 py-3">Guided setup</div>
                <div className="rounded-xl bg-[#f1eee7] px-2 py-3">Add CRM later</div>
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

function HeroSection({
  startPath,
  onStart,
}: {
  startPath: string;
  onStart: () => void;
}) {
  const [variant, setVariant] = useState<keyof typeof HERO_VARIANTS>(() => {
    if (typeof window === "undefined") return "a";
    const forced = new URLSearchParams(window.location.search).get("hero");
    if (forced === "a" || forced === "b") return forced;
    const saved = window.localStorage.getItem("vendora-hero-variant");
    if (saved === "a" || saved === "b") return saved;
    const assigned = Math.random() < 0.5 ? "a" : "b";
    window.localStorage.setItem("vendora-hero-variant", assigned);
    return assigned;
  });
  const copy = HERO_VARIANTS[variant];
  return (
    <section
      data-hero-variant={variant}
      className="reveal-up border-b border-[#e2ded5] bg-[#fffdf9]"
    >
      <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-20 lg:px-8 lg:pb-24 lg:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="text-balance text-[52px] font-semibold leading-[0.95] tracking-[-0.075em] text-[#202522] sm:text-[72px] lg:text-[92px]">
            {copy.title[0]}
            <br />
            <span className="text-[#2c6457]">{copy.title[1]}</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#6e716b] sm:text-lg">
            {copy.description}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-12 w-full items-center justify-center gap-2 bg-[#202522] px-6 text-sm font-semibold text-[#fffdf9] transition hover:bg-[#2c6457] sm:w-auto"
            >
              {copy.primary}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={copy.secondaryHref}
              className="inline-flex h-12 w-full items-center justify-center gap-2 border border-[#d9d5cc] bg-[#fffdf9] px-6 text-sm font-semibold text-[#5f625d] transition hover:border-[#a9a39a] sm:w-auto"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {copy.secondary}
            </a>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
            {copy.proof.map((item, index) => (
              <span key={item} className={index === 0 ? "text-[#2c6457]" : ""}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <Link
          to="/#plans"
          className="mt-4 inline-flex items-center gap-2 border border-[#e6d4aa] bg-[#fbf3dd] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b6b36] transition hover:border-[#e36c3f]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#e36c3f]" />
          Launch offer · save 30% for 3 months{" "}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="reveal-up reveal-delay-1 mt-16">
        <ProductFrame />
      </div>
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
    "Yes — Vendora is designed to sit alongside your CRM through an API and webhook layer. Customer context, conversation outcomes and order events can be routed back to the relationship system your team already uses.",
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
            Security, permissions and CRM — answered clearly.
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
                  {open === index ? "−" : "+"}
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
            Hi — is the linen shirt available in olive?
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
        "The order is created, inventory is reserved and the customer gets a clear confirmation — without a handoff hunt.",
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
      5200,
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
  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-[#f6f3ed] text-[#202522]">
      <SiteHeader
        ctaHref={startPath}
        onCtaClick={() => setOnboardingOpen(true)}
      />
      <main className="pt-[72px] sm:pt-[76px]">
        <HeroSection
          startPath={startPath}
          onStart={() => setOnboardingOpen(true)}
        />
        <div id="proof">
          <ProofSection />
        </div>
        <section
          id="whatsapp"
          className="overflow-hidden border-b border-[#b9cabe] bg-[#d9e7de]"
        >
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-24 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8 lg:py-32">
            <div>
              <Eyebrow>Commerce in the conversation</Eyebrow>
              <h2 className="max-w-xl text-5xl font-semibold leading-[0.96] tracking-[-0.07em] sm:text-6xl">
                AI sells in the channel your customers already use.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#5f625d]">
                It answers the question, checks the stock, creates the order and
                leaves your team with a clear record of what happened.
              </p>
              <div className="mt-9 space-y-4 border-t border-[#b9cabe] pt-5 text-sm text-[#5f625d]">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-[#2c6457]" />
                  Natural conversations, not another inbox
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-[#2c6457]" />
                  Catalog and inventory checked before the reply
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-[#2c6457]" />
                  Every outcome closes back into the platform
                </div>
              </div>
            </div>
            <WhatsAppFlow />
          </div>
        </section>
        <ChannelShowcase />
        <section
          id="agents"
          className="overflow-hidden border-b border-[#37423b] bg-[#202522] text-[#f6f3ed]"
        >
          <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
            <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div>
                <Eyebrow light>The intelligence behind the feed</Eyebrow>
                <h2 className="max-w-xl text-5xl font-semibold leading-[0.94] tracking-[-0.07em] sm:text-6xl">
                  One orchestrator. Three specialists. Every action controlled.
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-white/60">
                  Vendora does not hand your business to one generic chatbot. It
                  coordinates focused agents that share your real operating data
                  and stay inside clear permissions.
                </p>
                <div className="mt-10 space-y-3">
                  <div className="rounded-xl border border-white/15 bg-[#29322d] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold">Marketing AI</div>
                        <div className="mt-1 text-sm text-white/55">
                          Adapts the product story to each channel.
                        </div>
                      </div>
                      <span className="border border-[#e36c3f]/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#e36c3f]">
                        Can publish
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-[#29322d] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold">Sales AI</div>
                        <div className="mt-1 text-sm text-white/55">
                          Checks stock, price and customer intent.
                        </div>
                      </div>
                      <span className="border border-[#8bad9d]/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#b9cabe]">
                        Can query
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-[#29322d] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold">Analytics AI</div>
                        <div className="mt-1 text-sm text-white/55">
                          Turns signals into the next clear decision.
                        </div>
                      </div>
                      <span className="border border-[#8bad9d]/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#b9cabe]">
                        Can read
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#151a17] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-3">
                  <video
                    className="aspect-video w-full object-cover"
                    src="/media/agent-architecture.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    aria-label="Animated diagram showing Vendora's AI orchestrator connecting specialized agents to Facebook, Instagram, WhatsApp, Website and shared business data"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
                    <span>Agent system / live map</span>
                    <span className="text-[#e36c3f]">Controlled by rules</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="border border-white/15 px-3 py-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#e36c3f]">
                      Channels
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      4 connected
                    </div>
                  </div>
                  <div className="border border-white/15 px-3 py-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#e36c3f]">
                      Agents
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      3 specialized
                    </div>
                  </div>
                  <div className="border border-white/15 px-3 py-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#e36c3f]">
                      Source
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      1 shared data layer
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-14 border-t border-white/15 pt-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#e36c3f]">
                    Guardrails before action
                  </div>
                  <div className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                    The agent earns the right to publish.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-white/65">
                  {[
                    "Product exists",
                    "Stock available",
                    "Price valid",
                    "Content approved",
                    "Timing allowed",
                  ].map((step, index) => (
                    <span key={step} className="flex items-center gap-2">
                      <span className="border border-white/20 px-3 py-2">
                        {step}
                      </span>
                      {index < 4 && (
                        <ArrowRight className="h-3.5 w-3.5 text-[#e36c3f]" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <PlansSection />
        <CaseStudiesSection />
        <FAQSection />
        <section id="process">
          <ProcessSection />
        </section>
        <section
          id="control-room"
          className="border-b border-[#35453d] bg-[#27352e] text-[#f6f3ed]"
        >
          <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Eyebrow light>One source of truth</Eyebrow>
                <h2 className="max-w-2xl text-5xl font-semibold leading-[0.96] tracking-[-0.07em] sm:text-6xl">
                  See the whole operation without switching modes.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
                  Orders, catalogue, channel status and daily activity live in
                  the same operating language — so the next decision is obvious.
                </p>
              </div>
              <Link
                to={startPath}
                className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#f6f3ed]"
              >
                Explore the platform <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#f6f3ed] p-2 sm:p-3">
                <img
                  src="/media/optimized/operations-audit.webp"
                  alt="Vendora operations view with orders, activity, audit and channel status"
                  loading="lazy"
                  className="w-full object-cover"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                  <span>Live operations</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#f6f3ed] p-2 sm:p-3">
                <img
                  src="/media/optimized/storefront-commerce.webp"
                  alt="Vendora connected storefront product detail with live inventory"
                  loading="lazy"
                  className="w-full object-cover"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8a80]">
                  <span>Catalogue source</span>
                  <span className="text-[#2c6457]">Sync complete</span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/15 pt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
              <span className="text-[#e36c3f]">Orders</span>
              <span>·</span>
              <span>Inventory</span>
              <span>·</span>
              <span>Customer context</span>
              <span>·</span>
              <span>Channel publishing</span>
            </div>
          </div>
        </section>
        <section className="relative overflow-hidden bg-[#e36c3f] text-white">
          <div className="absolute inset-0 bg-[#202522]/15" />
          <div className="relative mx-auto grid max-w-[1240px] gap-10 px-5 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                Ready when you are
              </div>
              <h2 className="mt-4 max-w-xl text-5xl font-semibold leading-[0.96] tracking-[-0.07em] sm:text-6xl">
                Operate the moment, not the mess.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-white/80">
                Give your team one place to see the signal, make the decision
                and keep the sale moving.
              </p>
              <Link
                to={startPath}
                className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#202522] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2c6457]"
              >
                Build your operation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative overflow-hidden border border-white/25 bg-[#c95735] p-2 sm:p-3">
              <img
                src="/media/optimized/cta-merchant-at-work.webp"
                alt="Merchant working calmly with phone and orders in a real shop"
                loading="lazy"
                className="aspect-[3/2] w-full object-cover"
              />
              <div className="flex items-center justify-between px-2 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/65">
                <span>Commerce in motion</span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  In control
                </span>
              </div>
            </div>
          </div>
        </section>
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
