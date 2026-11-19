import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight,
  Instagram, MessageCircle, Package, ShieldCheck, Sparkles, BarChart3,
  ShoppingBag, Globe2, Workflow, Zap, CircleDot, Send, Clock3
} from "lucide-react";
import { Link } from "react-router-dom";
import { WaterWakeHero } from "@/components/site/WaterWakeHero";
import { PlansSection } from "@/components/site/PlansSection";

const wrap = "mx-auto w-full max-w-[1240px] px-5 sm:px-7 lg:px-8";
const eyebrow = "mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500";
const h2 = "max-w-[20ch] text-balance text-[1.8rem] font-semibold leading-[1.12] tracking-[-.035em] text-slate-950 sm:text-3xl lg:text-[clamp(2.25rem,3.2vw,2.8rem)]";
const muted = "text-[15px] leading-7 text-slate-600 sm:text-base";

function Label({ children }: { children: ReactNode }) {
  return <div className={eyebrow}><span className="h-1.5 w-1.5 rounded-full bg-slate-950" />{children}</div>;
}

function ProductWindow() {
  return (
    <div className="relative mx-auto w-full max-w-[1000px]" data-cursor="EXPLORAR PLATAFORMA">
      <div className="absolute -inset-5 rounded-[32px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(148,163,184,.20),transparent_65%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_35px_100px_rgba(15,23,42,.13)]">
        <div className="flex h-11 items-center justify-between border-b border-slate-100 px-4 sm:px-5">
          <div className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-200"/><i className="h-2.5 w-2.5 rounded-full bg-slate-200"/><i className="h-2.5 w-2.5 rounded-full bg-slate-200"/></div>
          <span className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-400">Vendora / Workspace</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Sistema ativo</span>
        </div>
        <div className="grid min-h-[310px] grid-cols-1 sm:grid-cols-[170px_1fr]">
          <aside className="hidden border-r border-slate-100 bg-slate-50/70 p-4 sm:block">
            <div className="mb-7 flex items-center gap-2 text-sm font-semibold text-slate-900"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-950 text-xs text-white">V</span> Vendora</div>
            {["Visão geral","Pedidos","Produtos","Conversas","Campanhas","Relatórios"].map((item,i)=><div key={item} className={`mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] ${i===0?"bg-white font-semibold text-slate-950 shadow-sm":"text-slate-500"}`}><span className="h-1.5 w-1.5 rounded-full bg-slate-300"/>{item}</div>)}
          </aside>
          <div className="min-w-0 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="text-[10px] text-slate-400">Terça-feira, 19 de Novembro</div><div className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Visão geral</div><p className="mt-1 text-xs text-slate-500">Acompanhe o que está a acontecer no seu negócio.</p></div>
              <span className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] text-slate-600">Últimos 30 dias⌄</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {[["Pedidos","128","12 em aberto"],["Vendas","Kz 2,4M","+12,8%"],["Produtos","246","8 com stock baixo"],["Conversas","84","21 por responder"]].map(([a,b,c])=><div key={a} className="rounded-xl border border-slate-200 p-3"><div className="text-[10px] text-slate-500">{a}</div><div className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{b}</div><div className="mt-1 text-[9px] text-slate-400">{c}</div></div>)}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_.7fr]">
              <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-800">Atividade comercial</span><span className="text-[9px] text-slate-400">Últimos 7 dias</span></div><div className="mt-4 flex h-20 items-end gap-2">{[35,48,42,68,55,82,72,92,65,78,88,60,96,73].map((v,i)=><span key={i} className="flex-1 rounded-t-sm bg-slate-900/85" style={{height:`${v}%`,opacity:.35+i*.045}}/>)}</div></div>
              <div className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-semibold text-slate-800">Últimos pedidos</div>{[["#VD-2048","Pago"],["#VD-2047","A preparar"],["#VD-2046","Enviado"]].map(([a,b])=><div key={a} className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]"><span className="text-slate-600">{a}</span><span className="text-slate-400">{b}</span></div>)}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 right-5 hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:block"><div className="flex items-center gap-2 text-[10px] font-medium text-slate-700"><span className="grid h-6 w-6 place-items-center rounded-full bg-slate-950 text-white"><Check className="h-3 w-3"/></span>Stock sincronizado</div></div>
    </div>
  );
}

function Hero({ startPath, onStart }: { startPath: string; onStart: () => void }) {
  return <section id="hero-stage" className="relative overflow-hidden bg-white">
    <WaterWakeHero damping={0.991} dropRadius={0.024} className="pb-20 pt-24 sm:pb-28 sm:pt-28">
      <div className={`${wrap} relative z-10`}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3.5 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-slate-600 shadow-sm backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>A plataforma para o comércio moderno</div>
          <h1 className="text-balance text-[clamp(3rem,8vw,6.7rem)] font-semibold leading-[.91] tracking-[-.075em] text-slate-950">O seu negócio.<br/><span className="text-slate-400">Em perfeita sintonia.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Venda, converse, publique e acompanhe a operação a partir de um único lugar. A Vendora conecta os canais e automatiza o trabalho que mantém o seu comércio em movimento.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={onStart} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-sm font-semibold text-white transition hover:bg-slate-700 sm:w-auto">Começar gratuitamente <ArrowRight className="h-4 w-4"/></button>
            <a href="#whatsapp" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-800 transition hover:border-slate-400 sm:w-auto">Conhecer a plataforma <ArrowDown className="h-4 w-4"/></a>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] text-slate-400"><span>Sem instalação complexa</span><span>·</span><span>Controlo centralizado</span><span>·</span><span>IA com regras de negócio</span></div>
        </div>
        <div className="mt-16 sm:mt-20"><ProductWindow/></div>
        <DotBrandWordmark />
      </div>
    </WaterWakeHero>
  </section>;
}

function DotBrandWordmark() {
  return (
    <div className="mx-auto mt-14 w-full max-w-[1680px] px-1 sm:mt-20 sm:px-5" aria-label="Vendora">
      <svg
        aria-hidden="true"
        className="block h-auto w-full overflow-visible"
        viewBox="0 0 1600 260"
        role="presentation"
      >
        <defs>
          <pattern id="vendora-dot-pattern" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="2.25" cy="2.25" r="1.55" fill="#111827" />
          </pattern>
          <mask id="vendora-wordmark-mask">
            <rect width="1600" height="260" fill="black" />
            <text
              x="800"
              y="207"
              textAnchor="middle"
              fill="white"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize="238"
              fontWeight="800"
              letterSpacing="-15"
            >
              VENDORA
            </text>
          </mask>
        </defs>
        <rect
          width="1600"
          height="260"
          fill="url(#vendora-dot-pattern)"
          mask="url(#vendora-wordmark-mask)"
        />
      </svg>
      <div className="mt-2 flex items-center justify-center gap-3 text-center font-mono text-[9px] uppercase tracking-[.22em] text-slate-400 sm:mt-4">
        <span className="h-px w-8 bg-slate-200" />
        <span>Everything connected. One clear view.</span>
        <span className="h-px w-8 bg-slate-200" />
      </div>
    </div>
  );
}

function ValueStory() {
 const items=[{n:"01",icon:Globe2,title:"Todos os canais, uma operação",text:"WhatsApp, Instagram, Facebook e loja online ligados ao mesmo catálogo e contexto."},{n:"02",icon:Workflow,title:"Menos tarefas repetidas",text:"Automatize respostas, publicação e acompanhamento sem perder o controlo."},{n:"03",icon:ShieldCheck,title:"Cada ação com contexto",text:"A IA consulta dados e respeita permissões antes de agir."}];
 return <section id="proof" className="border-y border-slate-200 bg-[#f8fafc] py-20 sm:py-28"><div className={wrap}>
   <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end"><div><Label>Uma operação, não mais ferramentas</Label><h2 className={h2}>Tudo ligado. <span className="text-slate-400">A mesma operação.</span></h2></div><p className={`${muted} max-w-lg lg:justify-self-end`}>A Vendora organiza os pontos de contacto do seu negócio para que a equipa tenha a mesma informação, o mesmo contexto e uma visão clara do que precisa de acontecer.</p></div>
   <div className="mt-14 grid gap-3 md:grid-cols-3">{items.map(({n,icon:Icon,title,text})=><article key={n} className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,.07)] sm:p-7"><div className="flex items-center justify-between"><span className="font-mono text-[10px] text-slate-400">{n} / 03</span><Icon className="h-5 w-5 text-slate-500 transition group-hover:text-slate-950"/></div><h3 className="mt-12 text-xl font-semibold tracking-tight text-slate-950">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></article>)}</div>
 </div></section>;
}


function VendoraParallaxStory() {
  return (
    <section aria-labelledby="vendora-intro-title" className="relative isolate min-h-[76svh] overflow-hidden bg-slate-950 text-white sm:min-h-[88svh]">
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <img
          src="/media/optimized/storefront-commerce.webp"
          alt="Espaço comercial que representa os negócios que a Vendora ajuda a organizar."
          loading="lazy"
          decoding="async"
          className="vendora-parallax-image absolute inset-x-0 -top-[14%] h-[128%] w-full object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-black/45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
      <div className={`${wrap} relative flex min-h-[76svh] flex-col justify-between py-12 sm:min-h-[88svh] sm:py-16 lg:py-20`}>
        <div className="flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[.2em] text-white/70">
          <span>Conheça a Vendora</span><span className="hidden sm:inline">Comércio conectado / 2026</span>
        </div>
        <div className="max-w-2xl py-16 sm:py-20">
          <h2 id="vendora-intro-title" className="max-w-[12ch] text-balance text-4xl font-semibold leading-[1.08] tracking-[-.045em] text-white sm:text-6xl lg:text-[clamp(3.5rem,6vw,5.5rem)]">
            O seu negócio. <span className="text-white/60">Em movimento.</span>
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
            A Vendora aproxima clientes, canais e operações para que possa gerir
            melhor cada etapa do seu negócio, a partir de um só lugar.
          </p>
          <a href="#whatsapp" className="mt-8 inline-flex items-center gap-3 border-b border-white/55 pb-2 text-xs font-semibold text-white transition-colors hover:border-white">
            Explorar a plataforma <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="flex items-end justify-between gap-6">
          <span className="font-mono text-[9px] uppercase tracking-[.18em] text-white/60">Uma visão. Toda a operação.</span>
          <span aria-hidden="true" className="text-[clamp(4rem,12vw,10rem)] font-semibold leading-[.7] tracking-[-.1em] text-white/25">V.</span>
        </div>
      </div>
    </section>
  );
}

function WhatsAppStory() {
 const [active,setActive]=useState(0);
 const states=[{title:"A conversa começa",text:"O cliente pergunta por um produto no WhatsApp.",image:"/media/optimized/whatsapp-status-01.webp",message:"Olá! Ainda têm este modelo disponível?"},{title:"A Vendora consulta",text:"A IA verifica catálogo, preço e disponibilidade antes de responder.",image:"/media/optimized/whatsapp-status-02.webp",message:"Temos sim. Vou confirmar as opções disponíveis para si."},{title:"O pedido fica organizado",text:"A intenção transforma-se num pedido acompanhado pela equipa.",image:"/media/optimized/whatsapp-status-03.webp",message:"Perfeito. O seu pedido foi registado. Já partilhamos os próximos passos."}];
 return <section id="whatsapp" className="overflow-hidden bg-white py-20 sm:py-28"><div className={wrap}>
   <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><Label>WhatsApp com contexto</Label><h2 className={h2}>Atendimento com contexto. <span className="text-slate-400">Do primeiro contacto ao pedido.</span></h2><p className={`${muted} mt-6 max-w-md`}>Respostas ligadas ao catálogo, disponibilidade consultada e pedidos acompanhados sem obrigar a equipa a saltar entre ferramentas.</p>
    <div className="mt-9 space-y-2">{states.map((s,i)=><button key={s.title} onClick={()=>setActive(i)} className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${active===i?"border-slate-900 bg-slate-50":"border-slate-200 bg-white hover:border-slate-300"}`}><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${active===i?"bg-slate-950 text-white":"bg-slate-100 text-slate-500"}`}>0{i+1}</span><span><span className="block text-sm font-semibold text-slate-900">{s.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{s.text}</span></span></button>)}</div>
   </div><div className="relative mx-auto w-full max-w-[580px]"><div className="absolute -inset-8 rounded-full bg-slate-100 blur-3xl"/><div className="relative grid gap-4 sm:grid-cols-[.8fr_1.2fr] sm:items-center"><div className="order-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:order-1"><img src={states[active].image} alt="Demonstração de conversa WhatsApp" className="aspect-[4/5] w-full rounded-xl object-cover transition" loading="lazy"/><div className="flex items-center justify-between px-2 py-2 text-[9px] text-slate-400"><span>Fluxo ilustrativo</span><span>0{active+1} / 03</span></div></div><div className="order-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_25px_65px_rgba(15,23,42,.10)] sm:order-2"><div className="flex items-center gap-2 border-b border-slate-100 pb-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-white"><MessageCircle className="h-4 w-4"/></div><div><div className="text-xs font-semibold text-slate-900">Atendimento Vendora</div><div className="text-[9px] text-slate-400">Demonstração de fluxo</div></div><span className="ml-auto h-2 w-2 rounded-full bg-emerald-500"/></div><div className="mt-5 space-y-3"><div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-slate-100 p-3 text-xs leading-5 text-slate-700">{states[active].message}</div><div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-slate-950 p-3 text-xs leading-5 text-white">{active===0?"Olá! Posso ajudar a encontrar o produto certo.":active===1?"Consultei o catálogo. O produto está disponível e o preço está confirmado.":"Pedido registado. A equipa já tem o contexto da conversa."}</div></div><div className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px] text-slate-400"><span>Escrever mensagem…</span><Send className="ml-auto h-3.5 w-3.5"/></div></div></div><div className="relative mt-5 flex items-center justify-between"><span className="text-[10px] text-slate-400">Explore o fluxo</span><div className="flex gap-2"><button aria-label="Etapa anterior" onClick={()=>setActive((active+2)%3)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 hover:bg-slate-50"><ChevronLeft className="h-4 w-4"/></button><button aria-label="Próxima etapa" onClick={()=>setActive((active+1)%3)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white hover:bg-slate-700"><ChevronRight className="h-4 w-4"/></button></div></div></div></div>
 </div></section>;
}

function ChannelStory() {
 const [active,setActive]=useState(0);
 const channels=[{name:"Instagram",desc:"Transforme produtos em conteúdo que desperta interesse.",images:["/media/optimized/instagram-campaign-01.webp","/media/optimized/instagram-campaign-02.webp","/media/optimized/instagram-campaign-03.webp"]},{name:"Facebook",desc:"Mantenha a comunidade informada e leve cada publicação até à venda.",images:["/media/optimized/facebook-campaign-01.webp","/media/optimized/facebook-campaign-02.webp","/media/optimized/facebook-campaign-03.webp"]}];
 const current=channels[active];
 return <section id="channels" className="border-y border-slate-200 bg-[#f8fafc] py-20 sm:py-28"><div className={wrap}>
  <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between"><div className="max-w-2xl"><Label>Publicação multicanal</Label><h2 className={h2}>Uma marca. <span className="text-slate-400">Todos os canais.</span></h2></div><div className="inline-flex rounded-full border border-slate-200 bg-white p-1">{channels.map((c,i)=><button key={c.name} onClick={()=>setActive(i)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${active===i?"bg-slate-950 text-white":"text-slate-500 hover:text-slate-900"}`}>{c.name}</button>)}</div></div>
  <div className="mt-12 grid gap-8 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-7 lg:grid-cols-[.72fr_1.28fr] lg:items-center"><div className="p-2 sm:p-5"><div className="font-mono text-[10px] uppercase tracking-[.16em] text-slate-400">Canal 0{active+1}</div><h3 className="mt-4 text-3xl font-semibold tracking-[-.05em] text-slate-950 sm:text-4xl">{current.name}</h3><p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">{current.desc}</p><ul className="mt-8 space-y-3 text-xs text-slate-600"><li className="flex gap-2"><Check className="h-4 w-4 text-slate-900"/>Conteúdo preparado a partir do catálogo</li><li className="flex gap-2"><Check className="h-4 w-4 text-slate-900"/>Identidade visual coerente</li><li className="flex gap-2"><Check className="h-4 w-4 text-slate-900"/>Publicação e acompanhamento centralizados</li></ul></div><div className="grid grid-cols-3 gap-2 sm:gap-3">{current.images.map((src,i)=><div key={src} className={`overflow-hidden rounded-xl border border-slate-100 bg-slate-50 ${i===1?"mt-7":"mb-7"}`}><img src={src} alt={`${current.name} exemplo visual ${i+1}`} loading="lazy" className="aspect-[4/5] h-full w-full object-cover transition duration-700 hover:scale-105"/></div>)}</div></div>
 </div></section>;
}

function AgentStory() {
 const [active,setActive]=useState(0);
 const agents=[
  {name:"Marketing",role:"Criação e publicação",detail:"Prepara campanhas adaptadas aos canais, respeitando o catálogo, a identidade da marca e as regras definidas pela equipa.",permission:"Preparar conteúdo"},
  {name:"Vendas",role:"Atendimento e pedidos",detail:"Consulta produtos, preço e disponibilidade antes de responder, organizar pedidos ou encaminhar situações para a equipa.",permission:"Consultar e organizar"},
  {name:"Analytics",role:"Leitura e recomendações",detail:"Transforma sinais de desempenho em informação clara para ajudar a equipa a decidir onde agir a seguir.",permission:"Analisar dados"}
 ];
 const current=agents[active];
 return <section id="agents" className="overflow-hidden bg-white py-24 sm:py-32">
  <div className={wrap}>
   <div className="mb-12 max-w-3xl"><Label>Especialistas Vendora</Label><h2 className={h2}>Uma equipa digital. <span className="text-slate-400">Três especialistas.</span></h2></div>
   <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
    <div className="overflow-hidden rounded-[24px] bg-slate-950 p-2 shadow-[0_28px_80px_rgba(15,23,42,.14)]">
     <video className="aspect-video w-full rounded-[18px] bg-black object-cover" src="/media/agent-architecture.mp4" autoPlay muted loop playsInline preload="metadata" aria-label="Demonstração visual da arquitetura de agentes especializados da Vendora" />
     <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-[9px] font-mono uppercase tracking-[.16em] text-slate-400"><span>Arquitetura de agentes / Vendora</span><span className="text-white">Permissões e contexto ativos</span></div>
    </div>
    <div className="lg:pl-4">
     <div className="font-mono text-[10px] uppercase tracking-[.16em] text-slate-400">Especialista 0{active+1} / 03</div>
     <AnimatePresence mode="wait"><motion.div key={active} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.25}}>
      <h3 className="mt-4 text-3xl font-semibold tracking-[-.055em] text-slate-950 sm:text-4xl">{current.name} AI</h3>
      <p className="mt-3 text-sm font-medium text-slate-500">{current.role}</p>
      <p className="mt-6 max-w-md text-[15px] leading-7 text-slate-600">{current.detail}</p>
      <div className="mt-7 border-t border-slate-200 pt-5"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-400">Capacidade principal</span><p className="mt-2 text-sm font-semibold text-slate-950">{current.permission}</p></div>
     </motion.div></AnimatePresence>
     <div className="mt-8 flex flex-wrap gap-2">{agents.map((a,i)=><button key={a.name} onClick={()=>setActive(i)} aria-pressed={active===i} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${active===i?"border-slate-950 bg-slate-950 text-white":"border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-950"}`}>{a.name}</button>)}</div>
    </div>
   </div>
  </div>
 </section>;
}

function AtmosphereStory() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const scenes = [
    {
      eyebrow: "Menos dispersão",
      title: "Tudo começa a fazer sentido quando a operação se liga.",
      text: "Pedidos, conversas e catálogo deixam de competir pela sua atenção. A informação importante passa a estar organizada num só lugar.",
      image: "/media/optimized/storefront-commerce.webp",
      alt: "Loja em funcionamento, representando a operação comercial ligada.",
    },
    {
      eyebrow: "Mais contexto",
      title: "Cada conversa continua de onde a anterior terminou.",
      text: "O histórico acompanha o cliente. A equipa encontra o contexto, consulta o catálogo e responde sem reconstruir a história a cada contacto.",
      image: "/media/optimized/whatsapp-status-02.webp",
      alt: "Conversa de atendimento WhatsApp com consulta de informação do catálogo.",
    },
    {
      eyebrow: "Mais controlo",
      title: "A tecnologia trabalha. A equipa mantém a direção.",
      text: "Automatize tarefas repetitivas sem abdicar de regras, permissões e visibilidade sobre as decisões e os resultados.",
      image: "/media/optimized/operations-audit.webp",
      alt: "Painel de operações que representa controlo e acompanhamento.",
    },
  ];

  useEffect(() => {
    const nodes = stepRefs.current.filter(
      (node): node is HTMLElement => node !== null,
    );
    if (!nodes.length) return;

    // Load all chapter images before the reader reaches the sticky sequence.
    scenes.forEach(({ image }) => {
      const preload = new window.Image();
      preload.src = image;
    });

    const setClosestChapter = () => {
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const distance =
          viewportCenter < rect.top
            ? rect.top - viewportCenter
            : viewportCenter > rect.bottom
              ? viewportCenter - rect.bottom
              : 0;

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActive((current) => (current === closestIndex ? current : closestIndex));
    };

    if (!("IntersectionObserver" in window)) {
      setClosestChapter();
      window.addEventListener("scroll", setClosestChapter, { passive: true });
      window.addEventListener("resize", setClosestChapter);
      return () => {
        window.removeEventListener("scroll", setClosestChapter);
        window.removeEventListener("resize", setClosestChapter);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const aRect = a.boundingClientRect;
            const bRect = b.boundingClientRect;
            const center = window.innerHeight / 2;
            const aDistance = Math.abs((aRect.top + aRect.bottom) / 2 - center);
            const bDistance = Math.abs((bRect.top + bRect.bottom) / 2 - center);
            return aDistance - bDistance;
          });

        if (!visible.length) return;
        const nextIndex = nodes.indexOf(visible[0].target as HTMLElement);
        if (nextIndex >= 0) {
          setActive((current) => (current === nextIndex ? current : nextIndex));
        }
      },
      {
        root: null,
        rootMargin: "-36% 0px -36% 0px",
        threshold: 0,
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="atmosphere-title"
      className="relative bg-[#f4f4f2] py-16 sm:py-20"
    >
      <div className={wrap}>
        <div className="mb-10 max-w-3xl sm:mb-12">
          <Label>Uma forma mais simples de operar</Label>
          <h2 id="atmosphere-title" className={h2}>
            Menos ruído.{" "}
            <span className="text-slate-400">Mais controlo.</span>
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600">
            Uma visão contínua do negócio, do primeiro contacto ao acompanhamento
            — sem saltar entre ferramentas.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
          <div className="relative lg:sticky lg:top-28 lg:h-[min(64vh,600px)] lg:self-start">
            <div className="relative h-[420px] overflow-hidden rounded-[26px] bg-slate-200 shadow-[0_30px_90px_rgba(15,23,42,.12)] sm:h-[540px] lg:h-full">
              {scenes.map((scene, index) => (
                <div
                  key={scene.image}
                  aria-hidden={active !== index}
                  className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${active === index ? "scale-100 opacity-100" : "pointer-events-none scale-[1.015] opacity-0"}`}
                >
                  <img
                    src={scene.image}
                    alt={scene.alt}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-8 sm:bottom-8">
                <div className="flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[.2em] text-white/70">
                  <span>Vendora / Capítulo 0{active + 1}</span>
                  <span>0{active + 1} — 03</span>
                </div>
                <p className="mt-4 max-w-lg text-2xl font-semibold leading-tight tracking-[-.045em] sm:text-3xl">
                  {scenes[active].title}
                </p>
                <div
                  className="mt-6 flex gap-1.5"
                  aria-label={`Capítulo ${active + 1} de 3`}
                >
                  {scenes.map((scene, index) => (
                    <span
                      key={scene.eyebrow}
                      className={`h-1 rounded-full transition-all duration-500 ${active === index ? "w-10 bg-white" : "w-4 bg-white/35"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            {scenes.map((scene, index) => (
              <article
                key={scene.eyebrow}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
                data-story-step={index}
                aria-current={active === index ? "step" : undefined}
                className="flex min-h-0 flex-col justify-center border-b border-slate-300/80 py-12 last:border-0 sm:py-16 lg:min-h-[62vh] lg:py-12"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] tabular-nums text-slate-400">
                    0{index + 1} / 03
                  </span>
                  <span
                    className={`h-px w-8 ${active === index ? "bg-slate-950" : "bg-slate-300"}`}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[.16em] text-slate-400">
                    {scene.eyebrow}
                  </span>
                </div>
                <h3
                  className={`mt-7 max-w-xl text-3xl font-semibold leading-[1.04] tracking-[-.055em] transition-colors duration-300 sm:text-4xl ${active === index ? "text-slate-950" : "text-slate-400"}`}
                >
                  {scene.title}
                </h3>
                <p className="mt-6 max-w-lg text-[15px] leading-7 text-slate-600">
                  {scene.text}
                </p>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-medium text-slate-400">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${active === index ? "bg-slate-950" : "bg-slate-300"}`}
                  />
                  {active === index
                    ? "A acompanhar este capítulo"
                    : "Continue a percorrer a história"}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowStory() {
 const [active,setActive]=useState(0);
 const steps=[{n:"01",title:"O cliente demonstra intenção",desc:"Uma mensagem, comentário ou visita inicia a jornada.",icon:MessageCircle},{n:"02",title:"A Vendora consulta o contexto",desc:"Catálogo, preço, disponibilidade e regras são verificados.",icon:Package},{n:"03",title:"A ação é executada ou encaminhada",desc:"A resposta, publicação ou pedido segue o fluxo autorizado.",icon:Zap},{n:"04",title:"A equipa acompanha o resultado",desc:"Tudo fica organizado para análise e continuidade.",icon:BarChart3}];
 const current=steps[active];const Icon=current.icon;
 return <section id="process" className="bg-white py-20 sm:py-28"><div className={wrap}><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><Label>Como funciona</Label><h2 className={h2}>Da mensagem <span className="text-slate-400">à ação.</span></h2><p className={`${muted} mt-6 max-w-md`}>A automação não é uma caixa-preta. Cada etapa tem uma origem, uma validação e um resultado que a equipa consegue acompanhar.</p></div><div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5 sm:p-7"><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-400">Fluxo operacional</span><span className="text-[10px] text-slate-500">0{active+1} / 04</span></div><div className="mt-7 grid grid-cols-4 gap-1">{steps.map((s,i)=><button key={s.n} onClick={()=>setActive(i)} aria-label={`Etapa ${s.n}`} className={`h-1.5 rounded-full transition ${i<=active?"bg-slate-950":"bg-slate-200"}`}/>)}</div><AnimatePresence mode="wait"><motion.div key={active} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="py-12"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-6 w-6"/></div><div className="mt-8 font-mono text-[10px] text-slate-400">{current.n} / PROCESSO</div><h3 className="mt-2 max-w-lg text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{current.title}</h3><p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">{current.desc}</p></motion.div></AnimatePresence><div className="flex justify-between border-t border-slate-200 pt-4"><button onClick={()=>setActive((active+3)%4)} className="text-xs font-medium text-slate-500 hover:text-slate-950">← Anterior</button><button onClick={()=>setActive((active+1)%4)} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-950">Próxima etapa <ArrowRight className="h-3.5 w-3.5"/></button></div></div></div></div></section>;
}

function CommandStory({startPath}:{startPath:string}) {
 return <section id="control-room" className="border-y border-slate-200 bg-[#f8fafc] py-20 sm:py-28"><div className={wrap}><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-center"><div><Label>Visão de comando</Label><h2 className={h2}>O negócio <span className="text-slate-400">num só painel.</span></h2><p className={`${muted} mt-6 max-w-md`}>Pedidos, catálogo, conversas, campanhas e indicadores deixam de viver em ferramentas isoladas.</p><Link to={startPath} className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-semibold text-white transition hover:bg-slate-700">Explorar a plataforma <ArrowRight className="h-4 w-4"/></Link></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_25px_70px_rgba(15,23,42,.08)] sm:p-3"><img src="/media/optimized/operations-audit.webp" alt="Painel de operações da Vendora" loading="lazy" className="w-full rounded-xl object-cover"/><div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 text-[9px] font-mono uppercase tracking-wider text-slate-400"><span>Workspace Vendora</span><span className="flex items-center gap-2 text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Dados centralizados</span></div></div></div></div></section>;
}

const faq=[["A IA pode inventar preços ou disponibilidade?","A Vendora foi concebida para consultar os dados do catálogo antes de responder. Quando a informação não está disponível, a resposta deve ser encaminhada ou apresentada como indisponível."],["Preciso de abandonar as ferramentas que já utilizo?","Não necessariamente. A proposta é centralizar a operação e ligar os canais suportados, sem obrigar a substituir todos os sistemas existentes."],["Posso controlar o que cada agente faz?","Sim. Os agentes devem operar dentro das permissões, regras e integrações configuradas para a empresa."],["A Vendora serve apenas para lojas online?","Não. A plataforma destina-se a operações comerciais que precisam de gerir catálogo, conversas, pedidos e canais digitais num fluxo coordenado."],["Como começo?","Crie a sua conta, configure a empresa e ligue os canais e dados necessários. A disponibilidade de cada integração depende das permissões e dos requisitos do respetivo fornecedor."]];
function FAQStory() {
 const [open,setOpen]=useState<number|null>(0);
 return <section id="faq" className="bg-white py-20 sm:py-28"><div className={wrap}><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><Label>Perguntas frequentes</Label><h2 className={h2}>Respostas claras.</h2><p className={`${muted} mt-6 max-w-sm`}>As respostas essenciais para perceber como a Vendora se integra no dia a dia do seu negócio.</p></div><div className="overflow-hidden rounded-2xl border border-slate-200">{faq.map(([q,a],i)=><div key={q} className="border-b border-slate-200 last:border-0"><button onClick={()=>setOpen(open===i?null:i)} aria-expanded={open===i} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"><span className="text-sm font-semibold text-slate-900">{q}</span><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-200 transition ${open===i?"rotate-180 bg-slate-950 text-white":"text-slate-500"}`}><ChevronDown className="h-4 w-4"/></span></button><AnimatePresence initial={false}>{open===i&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><p className="max-w-2xl px-5 pb-6 text-sm leading-6 text-slate-500 sm:px-6">{a}</p></motion.div>}</AnimatePresence></div>)}</div></div></div></section>;
}

function FinalCTA({startPath}:{startPath:string}) {
 return <section className="relative isolate overflow-hidden bg-slate-950 py-28 text-white sm:py-36" data-cursor="COMEÇAR">
  <img src="/media/optimized/cta-merchant-at-work.webp" alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover"/>
  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/75 to-black/35"/>
  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/35 via-transparent to-black/15"/>
  <div className={`${wrap} relative`}>
   <div className="max-w-3xl"><span className="font-mono text-[10px] uppercase tracking-[.2em] text-white/65">O próximo passo começa aqui</span><h2 className="mt-6 text-balance text-5xl font-semibold leading-[.96] tracking-[-.07em] sm:text-7xl">Trabalhe melhor. <span className="text-white/55">Com menos esforço.</span></h2><p className="mt-7 max-w-xl text-base leading-7 text-white/75">Ligue os seus canais, organize a operação e deixe a Vendora tratar do trabalho repetitivo — com a sua equipa sempre no controlo.</p><Link to={startPath} className="mt-10 inline-flex h-12 items-center gap-3 rounded-full bg-white px-7 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">Começar gratuitamente <ArrowUpRight className="h-4 w-4"/></Link></div>
  </div>
 </section>;
}

function ScrollStack({ children }: { children: ReactNode }) {
  const stackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = stackRef.current;
    if (!root) return;

    const panels = Array.from(root.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement && node.tagName === "SECTION",
    );

    const measure = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const availableHeight = window.innerHeight * 0.88;

      panels.forEach((panel, index) => {
        const canStack = desktop && panel.scrollHeight <= availableHeight;
        panel.classList.toggle("is-stackable", canStack);
        panel.style.setProperty("--stack-order", String(index + 1));
      });
    };

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measure)
      : null;

    panels.forEach((panel) => observer?.observe(panel));
    window.addEventListener("resize", measure, { passive: true });
    measure();

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return <div ref={stackRef} className="vendora-scroll-stack">{children}</div>;
}

export function HomeExperience({startPath,onStart}:{startPath:string;onStart:()=>void}) {
 return (
    <>
      <Hero startPath={startPath} onStart={onStart} />
      <ScrollStack>
        <ValueStory />
      </ScrollStack>
      <VendoraParallaxStory />
      <ScrollStack>
        <WhatsAppStory />
        <ChannelStory />
        <AtmosphereStory />
        <AgentStory />
        <section id="plans" className="bg-white"><PlansSection /></section>
        <WorkflowStory />
        <CommandStory startPath={startPath} />
        <FAQStory />
        <FinalCTA startPath={startPath} />
      </ScrollStack>
    </>
  );
}
