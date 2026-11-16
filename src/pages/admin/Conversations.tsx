import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCheck,
  Clock,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  MessageCircle,
  MessageSquarePlus,
  Moon,
  Package,
  Phone,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Sun,
  User,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { useWhatsAppAccount } from "@/hooks/useWhatsAppAccount";
import { whatsappConnectionLabel, whatsappConnectionState } from "@/lib/whatsappStatus";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatMoney } from "@/lib/format";

type Account = {
  id: string;
  phone_number_id: string;
  waba_id: string | null;
  display_phone: string | null;
  status: string;
  auto_reply: boolean;
  last_event_at: string | null;
};

type Convo = {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  status: "open" | "handoff" | "closed" | string;
  last_message_at: string;
  last_inbound_at: string | null;
  created_at: string;
};

type Msg = {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  sender: "customer" | "agent" | "staff" | string;
  body: string;
  status: "received" | "sent" | "delivered" | "read" | "failed" | string;
  error: string | null;
  created_at: string;
};

type OrderPreview = {
  id: string;
  total: number;
  status: string;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const WEBHOOK_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-webhook`;

const QUICK_EMOJIS = ["👍", "🙏", "😊", "❤️", "👟", "📦", "🔥", "🤝", "✨", "👋", "✅", "🙌"];

const QUICK_REPLIES = [
  "Olá! Bem-vindo à nossa loja. Como podemos ajudar hoje? 😊",
  "O seu pedido já está a ser preparado e será expedido em breve! 📦",
  "Temos esses artigos disponíveis em stock na nossa loja! 👟",
  "Pode enviar o comprovativo bancário por aqui para validação imediata. 💳",
  "Qualquer dúvida adicional, estamos sempre à sua inteira disposição!",
];

async function fnError(error: unknown, fallback: string) {
  if (error instanceof FunctionsHttpError) {
    const b = await error.context.json().catch(() => null);
    if (b?.error) return String(b.error);
  }
  return fallback;
}

function getAvatarColor(key: string): { bg: string; text: string } {
  const palettes = [
    { bg: "bg-[#00a884]", text: "text-white" },
    { bg: "bg-[#25D366]", text: "text-[#111b21]" },
    { bg: "bg-[#0284c7]", text: "text-white" },
    { bg: "bg-[#6366f1]", text: "text-white" },
    { bg: "bg-[#8b5cf6]", text: "text-white" },
    { bg: "bg-[#d97706]", text: "text-white" },
    { bg: "bg-[#e11d48]", text: "text-white" },
  ];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash << 5) - hash + key.charCodeAt(i);
  return palettes[Math.abs(hash) % palettes.length];
}

function formatChatTime(dateString: string) {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatChatDateBadge(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Hoje";
    if (isYesterday) return "Ontem";

    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

function isSameDay(d1: string, d2: string) {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export default function Conversations() {
  const { company } = useCompany();
  const accountQuery = useWhatsAppAccount(company?.id);
  const account = accountQuery.data ?? null;

  // WhatsApp Web Theme Mode: Dark by default (matching WhatsApp Web desktop reference) with 1-click Light mode toggle
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("whatsapp_theme") as "dark" | "light") || "dark";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("whatsapp_theme", next);
  };

  // Conversations & Messages state
  const [convos, setConvos] = useState<Convo[]>([]);
  const [latestMsgs, setLatestMsgs] = useState<Record<string, Msg>>({});
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "agent" | "staff" | "closed">("all");

  // Modals & Panels
  const [setupOpen, setSetupOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<OrderPreview[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Setup form
  const [pnid, setPnid] = useState(account?.phone_number_id ?? "");
  const [waba, setWaba] = useState(account?.waba_id ?? "");
  const [phone, setPhone] = useState(account?.display_phone ?? "");
  const [savingAccount, setSavingAccount] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync setup form
  useEffect(() => {
    if (account) {
      setPnid(account.phone_number_id ?? "");
      setWaba(account.waba_id ?? "");
      setPhone(account.display_phone ?? "");
    }
  }, [account]);

  // Load conversations and latest messages
  const load = useCallback(async () => {
    if (!company) return;
    try {
      const { data: cs } = await db
        .from("conversations")
        .select("*")
        .eq("company_id", company.id)
        .order("last_message_at", { ascending: false })
        .limit(100);

      const list = (cs ?? []) as Convo[];
      setConvos(list);

      if (list.length > 0) {
        const ids = list.map((c) => c.id);
        const { data: recentMsgs } = await db
          .from("messages")
          .select("*")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false })
          .limit(300);

        if (recentMsgs) {
          const map: Record<string, Msg> = {};
          for (const m of recentMsgs as Msg[]) {
            if (!map[m.conversation_id]) {
              map[m.conversation_id] = m;
            }
          }
          setLatestMsgs(map);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [company]);

  // Load messages for active conversation
  const loadMsgs = useCallback(async (id: string) => {
    const { data } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at")
      .limit(300);
    setMsgs((data ?? []) as Msg[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (active) {
      void loadMsgs(active);
    }
  }, [active, loadMsgs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Realtime subscription & polling backup
  useEffect(() => {
    if (!company) return;

    const channel = supabase
      .channel(`admin-conversations-realtime-${company.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          void load();
          if (active) void loadMsgs(active);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      void load();
      if (active) void loadMsgs(active);
    }, 12000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [company, active, load, loadMsgs]);

  const convo = useMemo(() => convos.find((c) => c.id === active) ?? null, [convos, active]);

  // Load customer orders
  useEffect(() => {
    if (!convo?.customer_phone || !company) {
      setCustomerOrders([]);
      return;
    }
    setLoadingOrders(true);
    const cleanPhone = convo.customer_phone.replace(/\D/g, "");
    db.from("orders")
      .select("id, total, status, created_at")
      .eq("company_id", company.id)
      .ilike("customer_phone", `%${cleanPhone}%`)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }: { data: OrderPreview[] | null }) => {
        setCustomerOrders(data ?? []);
        setLoadingOrders(false);
      })
      .catch(() => setLoadingOrders(false));
  }, [convo?.customer_phone, company]);

  const is24hWindowExpired = useMemo(() => {
    if (!convo?.last_inbound_at) return false;
    const diff = Date.now() - new Date(convo.last_inbound_at).getTime();
    return diff > 24 * 3600 * 1000;
  }, [convo?.last_inbound_at]);

  // Filter list
  const filteredConvos = useMemo(() => {
    return convos.filter((c) => {
      const searchTerms = search.toLowerCase().trim();
      const matchesSearch =
        !searchTerms ||
        (c.customer_name && c.customer_name.toLowerCase().includes(searchTerms)) ||
        c.customer_phone.includes(searchTerms) ||
        (latestMsgs[c.id]?.body && latestMsgs[c.id].body.toLowerCase().includes(searchTerms));

      if (!matchesSearch) return false;

      if (filter === "unread") {
        const lastMsg = latestMsgs[c.id];
        return lastMsg && lastMsg.direction === "in";
      }
      if (filter === "agent") return c.status === "open";
      if (filter === "staff") return c.status === "handoff";
      if (filter === "closed") return c.status === "closed";
      return true;
    });
  }, [convos, latestMsgs, search, filter]);

  // Actions
  const setStatus = async (status: "open" | "handoff" | "closed") => {
    if (!convo) return;
    const { error } = await db.from("conversations").update({ status }).eq("id", convo.id);
    if (error) {
      toast.error("Não foi possível alterar o estado.");
    } else {
      toast.success(
        status === "open"
          ? "Conversa devolvida ao Agente IA"
          : status === "handoff"
          ? "Atendimento assumido pela equipa"
          : "Conversa encerrada",
      );
      void load();
    }
  };

  const send = async () => {
    if (!convo || !text.trim() || sending) return;
    const messageBody = text.trim();
    setText("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Msg = {
      id: tempId,
      conversation_id: convo.id,
      direction: "out",
      sender: "staff",
      body: messageBody,
      status: "sending",
      error: null,
      created_at: new Date().toISOString(),
    };
    setMsgs((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase.functions.invoke("whatsapp-send", {
      body: { conversation_id: convo.id, text: messageBody },
    });

    setSending(false);

    if (error) {
      toast.error(await fnError(error, "Não foi possível enviar a mensagem."));
      setMsgs((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    void loadMsgs(convo.id);
    void load();
  };

  const toggleAutoReply = async (enabled: boolean) => {
    if (!account) return;
    const { error } = await db
      .from("whatsapp_accounts")
      .update({ auto_reply: enabled })
      .eq("id", account.id);

    if (error) {
      toast.error("Não foi possível alterar o agente automático.");
    } else {
      toast.success(
        enabled
          ? "Agente IA ativado para respostas automáticas."
          : "Respostas automáticas do Agente IA pausadas.",
      );
      void accountQuery.refetch();
    }
  };

  const saveAccountSetup = async () => {
    if (!company) return;
    if (!/^\d{5,30}$/.test(pnid.trim())) {
      return toast.error("O ID do número (Phone Number ID) deve conter apenas algarismos.");
    }
    if (!/^\d{5,30}$/.test(waba.trim())) {
      return toast.error("O ID da conta Business (WABA ID) deve conter apenas algarismos.");
    }
    if (!/^\+?[\d\s().-]{7,25}$/.test(phone.trim())) {
      return toast.error("Introduza o número de telefone visível (ex: +244 9xx xxx xxx).");
    }

    setSavingAccount(true);
    const { data: verified, error: verifyError } = await supabase.functions.invoke(
      "whatsapp-verify-number",
      {
        body: {
          company_id: company.id,
          phone_number: phone.trim(),
          phone_number_id: pnid.trim(),
          waba_id: waba.trim(),
        },
      },
    );

    setSavingAccount(false);

    if (verifyError) {
      return toast.error(await fnError(verifyError, "Não foi possível validar o número na Meta."));
    }

    setPhone(verified?.display_phone ?? phone);
    toast.success("Número validado e conta WhatsApp Business subscrita com sucesso!");
    setSetupOpen(false);
    void accountQuery.refetch();
    void load();
  };

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    const cleanNumber = newPhone.replace(/\D/g, "");
    if (cleanNumber.length < 8) {
      return toast.error("Introduza um número de WhatsApp válido.");
    }

    const existing = convos.find((c) => c.customer_phone.replace(/\D/g, "") === cleanNumber);
    if (existing) {
      setActive(existing.id);
      setNewChatOpen(false);
      setNewPhone("");
      setNewName("");
      toast.info("Conversa existente selecionada.");
      return;
    }

    const { data: newConvo, error } = await db
      .from("conversations")
      .insert({
        company_id: company.id,
        customer_phone: cleanNumber,
        customer_name: newName.trim() || null,
        status: "handoff",
      })
      .select()
      .single();

    if (error) {
      toast.error("Não foi possível criar a conversa.");
    } else if (newConvo) {
      toast.success("Nova conversa criada!");
      setNewChatOpen(false);
      setNewPhone("");
      setNewName("");
      await load();
      setActive(newConvo.id);
    }
  };

  const connectionState = whatsappConnectionState(
    account,
    accountQuery.isLoading || !company,
    accountQuery.isError,
  );
  const isConnected = connectionState === "active";

  const isDark = theme === "dark";

  return (
    <AdminLayout title="Conversas WhatsApp" fullBleed>
      {/* FULL-BLEED INTEGRATED WHATSAPP SUITE */}
      <div
        className={`w-full h-full flex flex-col overflow-hidden transition-colors ${
          isDark
            ? "bg-[#111b21] text-[#e9edef]"
            : "bg-white text-slate-900"
        }`}
      >
        {/* 1. TOP COMMAND TOOLBAR (Integrated directly into the workspace) */}
        <header
          className={`flex items-center justify-between px-4 py-2 border-b shrink-0 select-none ${
            isDark ? "bg-[#202c33] border-[#2a3942]" : "bg-white border-slate-200/80"
          }`}
        >
          {/* Left: WhatsApp Business Status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white shadow-xs">
              <MessageCircle className="h-5 w-5 fill-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm tracking-tight truncate">
                  WhatsApp Business
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    isConnected
                      ? "bg-[#00a884]/20 text-[#25D366]"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isConnected ? "bg-[#25D366] animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  {whatsappConnectionLabel(connectionState)}
                </span>
              </div>
              <p
                className={`text-[11px] truncate font-mono ${
                  isDark ? "text-[#8696a0]" : "text-[#667781]"
                }`}
              >
                {account?.display_phone || "Sem número configurado"}
              </p>
            </div>
          </div>

          {/* Right: Master Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Master AI Agent Switch */}
            {account && (
              <div
                className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${
                  isDark
                    ? "bg-[#111b21] border-[#2a3942] text-[#e9edef]"
                    : "bg-white border-[#d1d7db] text-[#111b21]"
                }`}
              >
                <Switch
                  checked={account.auto_reply}
                  onCheckedChange={toggleAutoReply}
                  id="master-ai-toggle"
                  className="data-[state=checked]:bg-[#00a884]"
                />
                <label
                  htmlFor="master-ai-toggle"
                  className="hidden md:inline text-[11px] font-bold cursor-pointer select-none"
                >
                  {account.auto_reply ? "IA Ativa" : "IA Pausada"}
                </label>
              </div>
            )}

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
              className={`grid h-8 w-8 place-items-center rounded-full transition cursor-pointer ${
                isDark
                  ? "bg-[#111b21] hover:bg-[#2a3942] text-[#e9edef]"
                  : "bg-white hover:bg-[#e9edef] text-[#54656f]"
              }`}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                void load();
                if (active) void loadMsgs(active);
              }}
              disabled={refreshing}
              title="Atualizar mensagens"
              className={`grid h-8 w-8 place-items-center rounded-full transition cursor-pointer ${
                isDark
                  ? "bg-[#111b21] hover:bg-[#2a3942] text-[#e9edef]"
                  : "bg-white hover:bg-[#e9edef] text-[#54656f]"
              }`}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin text-[#00a884]" : ""}`}
              />
            </button>

            {/* Meta Cloud API Drawer Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSetupOpen(true)}
              className={`h-8 px-3 rounded-full text-xs font-bold transition border ${
                isDark
                  ? "bg-[#111b21] border-[#2a3942] hover:bg-[#2a3942] text-[#e9edef]"
                  : "bg-white border-[#d1d7db] hover:bg-[#e9edef] text-[#111b21]"
              }`}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5 opacity-70" />
              <span className="hidden sm:inline">Meta API</span>
            </Button>
          </div>
        </header>

        {/* 2. MAIN 2-COLUMN WHATSAPP BODY */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* LEFT COLUMN: CONVERSATION LIST (SIDEBAR) */}
          <aside
            className={`w-full md:w-[360px] lg:w-[390px] flex flex-col border-r shrink-0 min-h-0 ${
              isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-[#e9edef]"
            } ${active ? "hidden md:flex" : "flex"}`}
          >
            {/* Sidebar Top: New Chat Trigger */}
            <div
              className={`flex items-center justify-between px-4 py-2.5 border-b ${
                isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-[#e9edef]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">Conversas</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isDark ? "bg-[#202c33] text-[#8696a0]" : "bg-[#f0f2f5] text-[#667781]"
                  }`}
                >
                  {convos.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                title="Iniciar nova conversa no WhatsApp"
                className={`grid h-8 w-8 place-items-center rounded-full transition cursor-pointer ${
                  isDark
                    ? "bg-[#202c33] hover:bg-[#2a3942] text-[#00a884]"
                    : "bg-[#f0f2f5] hover:bg-[#e9edef] text-[#008069]"
                }`}
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div
              className={`p-2.5 border-b ${
                isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-[#e9edef]"
              }`}
            >
              <div className="relative flex items-center">
                <Search
                  className={`absolute left-3.5 h-3.5 w-3.5 ${
                    isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Procurar conversa..."
                  className={`h-8.5 w-full rounded-lg pl-9 pr-7 text-xs transition focus:outline-none ${
                    isDark
                      ? "bg-[#202c33] text-[#e9edef] placeholder:text-[#8696a0] focus:ring-1 focus:ring-[#00a884]"
                      : "bg-[#f0f2f5] text-[#111b21] placeholder:text-[#54656f] focus:ring-1 focus:ring-[#008069]"
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 opacity-60 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills (No ugly scrollbars, wraps gracefully) */}
            <div
              className={`flex flex-wrap items-center gap-1.5 px-3 py-2 border-b text-[11px] ${
                isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-[#e9edef]"
              }`}
            >
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
                  filter === "all"
                    ? isDark
                      ? "bg-[#00a884] text-[#111b21]"
                      : "bg-[#008069] text-white"
                    : isDark
                    ? "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                Tudo
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer flex items-center gap-1 ${
                  filter === "unread"
                    ? isDark
                      ? "bg-[#00a884] text-[#111b21]"
                      : "bg-[#008069] text-white"
                    : isDark
                    ? "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                <span>Não lidas</span>
                {convos.filter((c) => latestMsgs[c.id]?.direction === "in").length > 0 && (
                  <span className="grid h-3.5 min-w-3.5 px-1 place-items-center rounded-full bg-[#25D366] text-[#111b21] font-black text-[9px]">
                    {convos.filter((c) => latestMsgs[c.id]?.direction === "in").length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilter("agent")}
                className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
                  filter === "agent"
                    ? isDark
                      ? "bg-[#00a884] text-[#111b21]"
                      : "bg-[#008069] text-white"
                    : isDark
                    ? "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                🤖 IA
              </button>
              <button
                type="button"
                onClick={() => setFilter("staff")}
                className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
                  filter === "staff"
                    ? isDark
                      ? "bg-[#00a884] text-[#111b21]"
                      : "bg-[#008069] text-white"
                    : isDark
                    ? "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                👤 Equipa
              </button>
              <button
                type="button"
                onClick={() => setFilter("closed")}
                className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
                  filter === "closed"
                    ? isDark
                      ? "bg-[#00a884] text-[#111b21]"
                      : "bg-[#008069] text-white"
                    : isDark
                    ? "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                Fechadas
              </button>
            </div>

            {/* Scrollable Conversation List */}
            <div
              className={`flex-1 overflow-y-auto divide-y min-h-0 ${
                isDark
                  ? "whatsapp-dark-scroll divide-[#222d34]"
                  : "whatsapp-chat-scroll divide-[#f0f2f5]"
              }`}
            >
              {loading ? (
                <div className="p-8 text-center text-xs opacity-60 space-y-2">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#00a884]" />
                  <p>A carregar conversas...</p>
                </div>
              ) : filteredConvos.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-60 space-y-3">
                  <div
                    className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
                      isDark ? "bg-[#202c33]" : "bg-[#f0f2f5]"
                    }`}
                  >
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <p className="font-bold">Nenhuma conversa encontrada</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewChatOpen(true)}
                    className="rounded-full text-xs font-bold"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />
                    Iniciar conversa
                  </Button>
                </div>
              ) : (
                filteredConvos.map((c) => {
                  const isSelected = active === c.id;
                  const last = latestMsgs[c.id];
                  const hasInboundPending = last && last.direction === "in";
                  const avatarColor = getAvatarColor(c.customer_phone || c.id);
                  const displayName = c.customer_name || `+${c.customer_phone}`;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActive(c.id)}
                      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer select-none ${
                        isSelected
                          ? isDark
                            ? "bg-[#2a3942]"
                            : "bg-[#f0f2f5]"
                          : isDark
                          ? "hover:bg-[#202c33]"
                          : "hover:bg-[#f5f6f6]"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold shadow-xs ${avatarColor.bg} ${avatarColor.text}`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                        {c.status === "open" && (
                          <span
                            title="Agente IA ativo"
                            className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-[#111b21] text-[8px] text-[#25D366] border border-[#222d34]"
                          >
                            🤖
                          </span>
                        )}
                        {c.status === "handoff" && (
                          <span
                            title="Com a equipa"
                            className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-blue-600 text-[8px] text-white border border-[#222d34]"
                          >
                            👤
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs sm:text-[13px] font-bold">
                            {displayName}
                          </p>
                          <span
                            className={`shrink-0 text-[10px] font-medium ${
                              hasInboundPending
                                ? "text-[#25D366] font-bold"
                                : isDark
                                ? "text-[#8696a0]"
                                : "text-[#667781]"
                            }`}
                          >
                            {formatChatTime(c.last_message_at)}
                          </span>
                        </div>

                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-xs flex items-center gap-1 ${
                              isDark ? "text-[#8696a0]" : "text-[#667781]"
                            }`}
                          >
                            {last?.direction === "out" && (
                              <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#53bdeb]" />
                            )}
                            <span className="truncate">
                              {last?.body || "Conversa iniciada"}
                            </span>
                          </p>

                          {hasInboundPending && (
                            <span className="grid h-4 min-w-4 px-1 place-items-center rounded-full bg-[#25D366] text-[10px] font-black text-[#111b21] leading-none shrink-0 shadow-2xs">
                              1
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: CHAT VIEWPORT */}
          <main
            className={`flex-1 flex flex-col relative min-w-0 min-h-0 ${
              !active ? "hidden md:flex" : "flex"
            }`}
          >
            {!convo ? (
              /* EMPTY LANDING SCREEN (AUTHENTIC WHATSAPP WEB) */
              <div
                className={`flex flex-1 flex-col items-center justify-center p-8 text-center border-l select-none ${
                  isDark
                    ? "bg-[#222e35] border-[#222d34]"
                    : "bg-[#f0f2f5] border-[#e9edef]"
                }`}
              >
                <div className="max-w-md space-y-4">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366] shadow-sm">
                    <MessageCircle className="h-10 w-10 fill-current stroke-none" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    WhatsApp Web da Loja
                  </h2>
                  <p
                    className={`text-xs leading-relaxed max-w-sm mx-auto ${
                      isDark ? "text-[#8696a0]" : "text-[#667781]"
                    }`}
                  >
                    Selecione uma conversa à esquerda para responder aos seus clientes ou acompanhar
                    o atendimento automático do Agente de IA em tempo real.
                  </p>
                  <div
                    className={`pt-6 flex items-center justify-center gap-1.5 text-[11px] ${
                      isDark ? "text-[#8696a0]" : "text-[#8696a0]"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-[#00a884]" />
                    <span>Mensagens protegidas com encriptação oficial da Meta Cloud API.</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE CHAT SCREEN */
              <div className="flex flex-1 flex-col h-full overflow-hidden min-h-0">
                {/* 1. CHAT HEADER */}
                <header
                  className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 z-10 shadow-xs ${
                    isDark
                      ? "bg-[#202c33] border-[#2a3942] text-[#e9edef]"
                      : "bg-[#f0f2f5] border-[#e9edef] text-[#111b21]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActive(null)}
                      className="md:hidden grid h-8 w-8 place-items-center rounded-full hover:bg-black/10"
                      aria-label="Voltar para a lista"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div
                      onClick={() => setInfoOpen((v) => !v)}
                      className="flex items-center gap-3 cursor-pointer group min-w-0"
                    >
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold shadow-xs ${
                          getAvatarColor(convo.customer_phone).bg
                        } ${getAvatarColor(convo.customer_phone).text}`}
                      >
                        {(convo.customer_name || convo.customer_phone).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs sm:text-sm font-bold group-hover:underline">
                          {convo.customer_name || `+${convo.customer_phone}`}
                        </p>
                        <p
                          className={`text-[11px] truncate font-medium ${
                            isDark ? "text-[#8696a0]" : "text-[#667781]"
                          }`}
                        >
                          {convo.status === "open" ? (
                            <span className="text-[#25D366] flex items-center gap-1 font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
                              Agente IA a responder
                            </span>
                          ) : convo.status === "handoff" ? (
                            <span className="text-sky-400 flex items-center gap-1 font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                              Atendimento com a equipa
                            </span>
                          ) : (
                            <span>Conversa fechada</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2">
                    {/* Handoff / Return to AI */}
                    {convo.status === "open" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatus("handoff")}
                        className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-full border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 shadow-2xs"
                      >
                        <UserRound className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Assumir</span>
                        <span className="sm:hidden">Assumir</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatus("open")}
                        className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-full border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#25D366] shadow-2xs"
                      >
                        <Bot className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Devolver à IA</span>
                        <span className="sm:hidden">IA</span>
                      </Button>
                    )}

                    {/* Close / Reopen */}
                    {convo.status !== "closed" ? (
                      <button
                        type="button"
                        onClick={() => setStatus("closed")}
                        title="Fechar conversa"
                        className="h-8 px-2.5 rounded-full text-xs font-bold opacity-70 hover:opacity-100 transition cursor-pointer"
                      >
                        Fechar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStatus("open")}
                        className="h-8 px-2.5 rounded-full text-xs font-bold text-[#00a884] hover:underline"
                      >
                        Reabrir
                      </button>
                    )}

                    {/* Customer Info Toggle */}
                    <button
                      type="button"
                      onClick={() => setInfoOpen((v) => !v)}
                      title="Ver dados do cliente"
                      className={`grid h-8 w-8 place-items-center rounded-full transition cursor-pointer ${
                        infoOpen ? "bg-white/10" : "hover:bg-white/10 opacity-80"
                      }`}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                {/* 2. CHAT STREAM AREA (With Authentic WhatsApp Background) */}
                <div
                  className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-0 ${
                    isDark
                      ? "whatsapp-chat-dark-bg whatsapp-dark-scroll"
                      : "whatsapp-chat-bg whatsapp-chat-scroll"
                  }`}
                >
                  {/* Meta 24-hour expiration notice */}
                  {is24hWindowExpired && (
                    <div className="flex justify-center">
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-[11px] text-amber-400 shadow-xs max-w-md text-center flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Janela de 24h da Meta expirada. Aguarde nova mensagem do cliente para
                          envio livre.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Messages list */}
                  {msgs.map((m, idx) => {
                    const showDateBadge =
                      idx === 0 || !isSameDay(msgs[idx - 1].created_at, m.created_at);

                    const isInbound = m.direction === "in";
                    const isAgent = m.sender === "agent";
                    const isStaff = m.sender === "staff";

                    return (
                      <div key={m.id} className="space-y-2">
                        {showDateBadge && (
                          <div className="flex justify-center my-3">
                            <span
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xs select-none ${
                                isDark
                                  ? "bg-[#182229] text-[#8696a0]"
                                  : "bg-white text-[#667781]"
                              }`}
                            >
                              {formatChatDateBadge(m.created_at)}
                            </span>
                          </div>
                        )}

                        <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                          <div
                            className={`relative max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
                              isInbound
                                ? isDark
                                  ? "bg-[#202c33] text-[#e9edef] rounded-tl-xs"
                                  : "bg-white text-[#111b21] rounded-tl-xs"
                                : isDark
                                ? "bg-[#005c4b] text-[#e9edef] rounded-tr-xs"
                                : "bg-[#d9fdd3] text-[#111b21] rounded-tr-xs"
                            }`}
                          >
                            {/* Sender Tag on Outbound */}
                            {!isInbound && (
                              <div className="flex items-center gap-1 mb-1">
                                {isAgent ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#25D366] uppercase tracking-wider">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Agente IA
                                  </span>
                                ) : isStaff ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                                    <User className="h-2.5 w-2.5" />
                                    Equipa
                                  </span>
                                ) : null}
                              </div>
                            )}

                            {/* Message Body */}
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>

                            {/* Timestamp & Status Icon */}
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                isDark ? "text-[#8696a0]" : "text-[#667781]"
                              }`}
                            >
                              <span>{formatChatTime(m.created_at)}</span>
                              {!isInbound && (
                                <>
                                  {m.status === "sending" ? (
                                    <Clock className="h-3 w-3 opacity-60" />
                                  ) : m.status === "failed" ? (
                                    <span className="text-red-400 font-bold" title={m.error || "Falhou"}>
                                      ✕
                                    </span>
                                  ) : (
                                    <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* 3. INPUT FOOTER (Clean WhatsApp Web footer without native scrollbars) */}
                <footer
                  className={`border-t px-3 py-2.5 shrink-0 select-none ${
                    isDark
                      ? "bg-[#202c33] border-[#2a3942]"
                      : "bg-[#f0f2f5] border-[#e9edef]"
                  }`}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send();
                    }}
                    className="flex items-center gap-2"
                  >
                    {/* Quick Emojis Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          title="Inserir emoji"
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition cursor-pointer ${
                            isDark
                              ? "hover:bg-[#2a3942] text-[#8696a0]"
                              : "hover:bg-[#e9edef] text-[#54656f]"
                          }`}
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="start"
                        className={`w-64 p-2.5 rounded-2xl shadow-xl border ${
                          isDark
                            ? "bg-[#202c33] border-[#2a3942] text-white"
                            : "bg-white border-[#d1d7db] text-black"
                        }`}
                      >
                        <p className="text-[11px] font-bold opacity-60 mb-1.5 px-1">
                          Emojis rápidos
                        </p>
                        <div className="grid grid-cols-6 gap-1.5 text-lg">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setText((prev) => prev + emoji)}
                              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10 transition cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Quick Canned Replies Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          title="Respostas prontas"
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition cursor-pointer ${
                            isDark
                              ? "hover:bg-[#2a3942] text-[#8696a0]"
                              : "hover:bg-[#e9edef] text-[#54656f]"
                          }`}
                        >
                          <Zap className="h-5 w-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="start"
                        className={`w-80 p-3 rounded-2xl shadow-xl border space-y-1.5 ${
                          isDark
                            ? "bg-[#202c33] border-[#2a3942] text-white"
                            : "bg-white border-[#d1d7db] text-black"
                        }`}
                      >
                        <p className="text-[11px] font-bold opacity-60 px-1">
                          Modelos de Resposta Rápida
                        </p>
                        {QUICK_REPLIES.map((reply, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setText(reply)}
                            className="w-full text-left text-xs p-2 rounded-xl hover:bg-white/10 transition leading-relaxed block"
                          >
                            {reply}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>

                    {/* Message Text Input */}
                    <div className="flex-1 min-w-0">
                      <textarea
                        ref={textareaRef}
                        value={text}
                        rows={1}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void send();
                          }
                        }}
                        placeholder="Escrever mensagem..."
                        maxLength={4000}
                        className={`w-full resize-none rounded-xl px-4 py-2 text-xs leading-normal transition focus:outline-none ${
                          isDark
                            ? "bg-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0]"
                            : "bg-white text-[#111b21] placeholder:text-[#54656f]"
                        }`}
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={sending || !text.trim()}
                      aria-label="Enviar mensagem"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00a884] text-white hover:bg-[#02906f] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition cursor-pointer"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 fill-white translate-x-0.5" />
                      )}
                    </button>
                  </form>
                </footer>
              </div>
            )}

            {/* CUSTOMER DETAILS SLIDE-OVER */}
            <AnimatePresence>
              {infoOpen && convo && (
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 280 }}
                  className={`absolute inset-y-0 right-0 z-20 w-80 sm:w-96 border-l shadow-2xl flex flex-col ${
                    isDark
                      ? "bg-[#111b21] border-[#222d34] text-[#e9edef]"
                      : "bg-white border-[#e9edef] text-[#111b21]"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-3 border-b ${
                      isDark ? "bg-[#202c33] border-[#2a3942]" : "bg-[#f0f2f5] border-[#e9edef]"
                    }`}
                  >
                    <h3 className="text-sm font-bold">Dados do Cliente</h3>
                    <button
                      type="button"
                      onClick={() => setInfoOpen(false)}
                      className="p-1 rounded-full hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    <div className="text-center space-y-2">
                      <div
                        className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-xl font-bold shadow-md ${
                          getAvatarColor(convo.customer_phone).bg
                        } ${getAvatarColor(convo.customer_phone).text}`}
                      >
                        {(convo.customer_name || convo.customer_phone).charAt(0).toUpperCase()}
                      </div>
                      <h4 className="text-base font-bold">
                        {convo.customer_name || `+${convo.customer_phone}`}
                      </h4>
                      <p className="text-xs opacity-70">+{convo.customer_phone}</p>

                      <div className="pt-2">
                        <a
                          href={`https://wa.me/${convo.customer_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/20 px-3.5 py-1 text-xs font-bold text-[#25D366] hover:bg-[#25D366]/30 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Abrir no WhatsApp Oficial</span>
                        </a>
                      </div>
                    </div>

                    <div
                      className={`rounded-xl border p-3.5 space-y-2 text-xs ${
                        isDark
                          ? "bg-[#202c33] border-[#2a3942]"
                          : "bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      <div className="flex justify-between py-1 border-b border-white/10">
                        <span className="opacity-70">Estado</span>
                        <span className="font-bold">
                          {convo.status === "open"
                            ? "🤖 Agente IA"
                            : convo.status === "handoff"
                            ? "👤 Equipa"
                            : "Fechada"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/10">
                        <span className="opacity-70">Início</span>
                        <span className="font-semibold">
                          {new Date(convo.created_at).toLocaleDateString("pt-PT")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="opacity-70">Última mensagem</span>
                        <span className="font-semibold">
                          {new Date(convo.last_message_at).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        <span>Pedidos na Loja</span>
                      </h4>

                      {loadingOrders ? (
                        <div className="p-4 text-center text-xs opacity-60">
                          <Loader2 className="mx-auto h-4 w-4 animate-spin mb-1" />
                          A pesquisar pedidos...
                        </div>
                      ) : customerOrders.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-white/20 p-4 text-center text-xs opacity-60">
                          Nenhum pedido registado com este telefone.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {customerOrders.map((o) => (
                            <div
                              key={o.id}
                              className={`flex items-center justify-between rounded-xl border p-3 text-xs shadow-xs ${
                                isDark
                                  ? "bg-[#202c33] border-[#2a3942]"
                                  : "bg-white border-neutral-200"
                              }`}
                            >
                              <div>
                                <p className="font-bold">#{o.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-[11px] opacity-60">
                                  {new Date(o.created_at).toLocaleDateString("pt-PT")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-extrabold">
                                  {formatMoney(o.total, company?.currency)}
                                </p>
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 uppercase">
                                  {o.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* META CONFIGURATION SLIDE-OVER SHEET */}
      <Sheet open={setupOpen} onOpenChange={setSetupOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
              <span>Conexão WhatsApp Business</span>
            </SheetTitle>
            <SheetDescription>
              A Vendora utiliza a Meta Cloud API oficial. Cada empresa liga o seu número próprio com
              isolamento seguro de dados.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600">Estado da Conexão</span>
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                    isConnected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {whatsappConnectionLabel(connectionState)}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {account?.display_phone || "Aguardando validação dos IDs na Meta"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                  ID do Número (Phone Number ID)
                </label>
                <Input
                  placeholder="Ex: 1365696243304618"
                  value={pnid}
                  onChange={(e) => setPnid(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Obtido no portal Meta for Developers em WhatsApp &gt; API Setup.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                  ID da Conta WhatsApp Business (WABA ID)
                </label>
                <Input
                  placeholder="Ex: 2560335957780489"
                  value={waba}
                  onChange={(e) => setWaba(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                  Número de Telefone Visível
                </label>
                <Input
                  placeholder="Ex: +244 936 370 703"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button
                onClick={saveAccountSetup}
                disabled={savingAccount}
                className="w-full h-11 bg-[#101114] hover:bg-black text-white font-bold rounded-xl"
              >
                {savingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Validar e Ligar Número
              </Button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-600" />
                Configurar Webhook na Meta
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                No painel Meta for Developers, configure este endereço exato como URL de callback e
                subscreva o campo <strong className="text-black">messages</strong>.
              </p>

              <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-2 text-xs font-mono">
                <code className="flex-1 truncate">{WEBHOOK_URL}</code>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(WEBHOOK_URL);
                    toast.success("Endereço do webhook copiado!");
                  }}
                  className="text-neutral-500 hover:text-black p-1 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* NEW CHAT DIALOG */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-[#25D366]" />
              <span>Nova Conversa WhatsApp</span>
            </DialogTitle>
            <DialogDescription>
              Introduza o número de telefone do cliente para abrir ou iniciar uma conversa direta no
              painel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStartNewChat} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Número de WhatsApp *
              </label>
              <Input
                placeholder="Ex: 244936370703 ou 936370703"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="text-sm"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Nome do Contacto (opcional)
              </label>
              <Input
                placeholder="Ex: Manuel Silva"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewChatOpen(false)}
                className="rounded-full text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold px-5"
              >
                Abrir Conversa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
