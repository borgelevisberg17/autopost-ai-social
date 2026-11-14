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
  Package,
  Phone,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  User,
  UserCheck,
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

const QUICK_EMOJIS = ["👍", "🙏", "😊", "❤️", "👟", "📦", "🔥", "🤝", "✨", "👋"];

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

function getAvatarGradient(key: string): { bg: string; text: string } {
  const palettes = [
    { bg: "bg-emerald-500", text: "text-white" },
    { bg: "bg-teal-500", text: "text-white" },
    { bg: "bg-sky-500", text: "text-white" },
    { bg: "bg-indigo-500", text: "text-white" },
    { bg: "bg-violet-500", text: "text-white" },
    { bg: "bg-amber-600", text: "text-white" },
    { bg: "bg-rose-500", text: "text-white" },
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

  // Keep form in sync when account loads
  useEffect(() => {
    if (account) {
      setPnid(account.phone_number_id ?? "");
      setWaba(account.waba_id ?? "");
      setPhone(account.display_phone ?? "");
    }
  }, [account]);

  // Load conversations and their latest messages
  const load = useCallback(async () => {
    if (!company) return;
    try {
      const { data: cs } = await db
        .from("conversations")
        .select("*")
        .eq("company_id", company.id)
        .order("last_message_at", { ascending: false })
        .limit(100);

      const conversationsList = (cs ?? []) as Convo[];
      setConvos(conversationsList);

      if (conversationsList.length > 0) {
        const convoIds = conversationsList.map((c) => c.id);
        const { data: recentMsgs } = await db
          .from("messages")
          .select("*")
          .in("conversation_id", convoIds)
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

  // Load messages for the active conversation
  const loadMsgs = useCallback(async (id: string) => {
    const { data } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at")
      .limit(300);
    setMsgs((data ?? []) as Msg[]);
  }, []);

  // Initial load
  useEffect(() => {
    void load();
  }, [load]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (active) {
      void loadMsgs(active);
    }
  }, [active, loadMsgs]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Real-time subscription & periodic poll backup
  useEffect(() => {
    if (!company) return;

    const channel = supabase
      .channel(`admin-conversations-${company.id}`)
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

    const t = setInterval(() => {
      void load();
      if (active) void loadMsgs(active);
    }, 12000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(t);
    };
  }, [company, active, load, loadMsgs]);

  // Active conversation object
  const convo = useMemo(() => convos.find((c) => c.id === active) ?? null, [convos, active]);

  // Load orders for active customer
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

  // Check 24-hour Meta service window
  const is24hWindowExpired = useMemo(() => {
    if (!convo?.last_inbound_at) return false;
    const diff = Date.now() - new Date(convo.last_inbound_at).getTime();
    return diff > 24 * 3600 * 1000;
  }, [convo?.last_inbound_at]);

  // Filter conversations
  const filteredConvos = useMemo(() => {
    return convos.filter((c) => {
      // Search
      const searchTerms = search.toLowerCase().trim();
      const matchesSearch =
        !searchTerms ||
        (c.customer_name && c.customer_name.toLowerCase().includes(searchTerms)) ||
        c.customer_phone.includes(searchTerms) ||
        (latestMsgs[c.id]?.body && latestMsgs[c.id].body.toLowerCase().includes(searchTerms));

      if (!matchesSearch) return false;

      // Status filter
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
          : "Conversa marcada como fechada",
      );
      void load();
    }
  };

  const send = async () => {
    if (!convo || !text.trim() || sending) return;
    const messageBody = text.trim();
    setText("");
    setSending(true);

    // Optimistic message append
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

  // Toggle master auto reply
  const toggleAutoReply = async (enabled: boolean) => {
    if (!account) return;
    const { error } = await db
      .from("whatsapp_accounts")
      .update({ auto_reply: enabled })
      .eq("id", account.id);

    if (error) {
      toast.error("Não foi possível alterar a resposta automática.");
    } else {
      toast.success(
        enabled
          ? "Agente IA ativado para respostas automáticas."
          : "Respostas automáticas do Agente IA pausadas.",
      );
      void accountQuery.refetch();
    }
  };

  // Save Meta setup
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

  // Create or open new chat
  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    const cleanNumber = newPhone.replace(/\D/g, "");
    if (cleanNumber.length < 8) {
      return toast.error("Introduza um número de WhatsApp válido.");
    }

    // Check if exists
    const existing = convos.find((c) => c.customer_phone.replace(/\D/g, "") === cleanNumber);
    if (existing) {
      setActive(existing.id);
      setNewChatOpen(false);
      setNewPhone("");
      setNewName("");
      toast.info("Conversa já existente selecionada.");
      return;
    }

    // Insert new conversation
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
  const isConnected = connectionState === "connected";

  return (
    <AdminLayout title="Conversas WhatsApp">
      <div className="space-y-4">
        {/* TOP STATUS RIBBON */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 sm:px-5 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#25D366]/10 text-[#075E54]">
              <MessageCircle className="h-5 w-5 fill-[#25D366] text-[#25D366]" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                  WhatsApp Business
                </h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    isConnected
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {whatsappConnectionLabel(connectionState)}
                </span>
              </div>
              <p className="text-xs text-neutral-500 truncate">
                {account?.display_phone
                  ? `Linha oficial: ${account.display_phone}`
                  : "Nenhum número validado na Meta"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Auto Reply Switch */}
            {account && (
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 sm:border-l-0">
                <Switch
                  checked={account.auto_reply}
                  onCheckedChange={toggleAutoReply}
                  id="auto-reply-switch"
                />
                <label
                  htmlFor="auto-reply-switch"
                  className="hidden md:inline text-xs font-semibold text-neutral-700 cursor-pointer select-none"
                >
                  Agente IA automático
                </label>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                void load();
                if (active) void loadMsgs(active);
              }}
              disabled={refreshing}
              className="h-9 px-3 rounded-full border-neutral-200 text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>

            {/* Meta Configuration Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSetupOpen(true)}
              className="h-9 px-3.5 rounded-full border-neutral-200 bg-[#fbfaf6] hover:bg-neutral-100 text-neutral-800 text-xs font-semibold"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
              <span>Conexão Meta</span>
            </Button>
          </div>
        </header>

        {/* MAIN WHATSAPP APP CANVAS */}
        <div className="relative flex h-[calc(100vh-175px)] min-h-[580px] max-h-[860px] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          {/* LEFT COLUMN: CHAT LIST SIDEBAR */}
          <aside
            className={`flex flex-col w-full md:w-[360px] lg:w-[400px] border-r border-[#e9edef] bg-white shrink-0 ${
              active ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Sidebar Top Profile & Header */}
            <div className="flex items-center justify-between border-b border-[#e9edef] bg-[#f0f2f5] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#101114] text-white font-bold text-xs shadow-xs">
                  {company?.name?.charAt(0).toUpperCase() || "V"}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111b21]">Conversas</h2>
                  <p className="text-[11px] text-[#667781]">
                    {convos.length} {convos.length === 1 ? "contacto" : "contactos"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNewChatOpen(true)}
                  title="Iniciar nova conversa"
                  className="h-9 w-9 rounded-full text-[#54656f] hover:bg-[#e9edef] hover:text-[#111b21]"
                >
                  <MessageSquarePlus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-2.5 border-b border-[#e9edef] bg-white">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-[#54656f]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Procurar ou criar conversa..."
                  className="h-9 w-full rounded-lg bg-[#f0f2f5] pl-10 pr-8 text-xs font-normal text-[#111b21] placeholder:text-[#54656f] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#00a884] transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 text-[#54656f] hover:text-[#111b21]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills (WhatsApp Web style) */}
            <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 border-b border-[#e9edef] bg-white scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer whitespace-nowrap ${
                  filter === "all"
                    ? "bg-[#e7fce3] text-[#008069]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                Tudo
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filter === "unread"
                    ? "bg-[#e7fce3] text-[#008069]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                <span>Não lidas</span>
                {convos.filter((c) => latestMsgs[c.id]?.direction === "in").length > 0 && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[#25D366] text-white font-bold text-[9px]">
                    {convos.filter((c) => latestMsgs[c.id]?.direction === "in").length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilter("agent")}
                className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer whitespace-nowrap ${
                  filter === "agent"
                    ? "bg-[#e7fce3] text-[#008069]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                🤖 Agente IA
              </button>
              <button
                type="button"
                onClick={() => setFilter("staff")}
                className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer whitespace-nowrap ${
                  filter === "staff"
                    ? "bg-[#e7fce3] text-[#008069]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                👤 Com a Equipa
              </button>
              <button
                type="button"
                onClick={() => setFilter("closed")}
                className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer whitespace-nowrap ${
                  filter === "closed"
                    ? "bg-[#e7fce3] text-[#008069]"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                Fechadas
              </button>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5] whatsapp-chat-scroll">
              {loading ? (
                <div className="p-8 text-center text-xs text-[#667781] space-y-2">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#00a884]" />
                  <p>A carregar conversas...</p>
                </div>
              ) : filteredConvos.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#667781] space-y-3">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f0f2f5] text-[#54656f]">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-neutral-800">Nenhuma conversa encontrada</p>
                  <p className="text-[11px] leading-relaxed max-w-[240px] mx-auto">
                    {search
                      ? "Nenhum contacto coincide com a pesquisa."
                      : "As mensagens recebidas no WhatsApp aparecerão aqui automaticamente."}
                  </p>
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
                  const avatarColor = getAvatarGradient(c.customer_phone || c.id);
                  const displayName = c.customer_name || `+${c.customer_phone}`;

                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      whileHover={{ backgroundColor: isSelected ? "#f0f2f5" : "#f8f9fb" }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setActive(c.id)}
                      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer ${
                        isSelected ? "bg-[#f0f2f5]" : "bg-white"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold shadow-2xs ${avatarColor.bg} ${avatarColor.text}`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                        {c.status === "open" && (
                          <span
                            title="Agente IA ativo"
                            className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#101114] text-[9px] text-white border border-white"
                          >
                            🤖
                          </span>
                        )}
                        {c.status === "handoff" && (
                          <span
                            title="Com a equipa humana"
                            className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-blue-600 text-[9px] text-white border border-white"
                          >
                            👤
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-[13px] font-bold text-[#111b21]">
                            {displayName}
                          </p>
                          <span className="shrink-0 text-[10px] text-[#667781] font-medium">
                            {formatChatTime(c.last_message_at)}
                          </span>
                        </div>

                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-[#667781] flex items-center gap-1">
                            {last?.direction === "out" && (
                              <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#53bdeb]" />
                            )}
                            <span className="truncate">
                              {last?.body || "Conversa iniciada"}
                            </span>
                          </p>

                          {hasInboundPending && (
                            <span className="grid h-4 min-w-4 px-1 place-items-center rounded-full bg-[#25D366] text-[10px] font-bold text-white leading-none shrink-0 shadow-2xs">
                              1
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: ACTIVE CHAT VIEWPORT */}
          <main
            className={`flex-1 flex flex-col bg-[#efeae2] relative min-w-0 ${
              !active ? "hidden md:flex" : "flex"
            }`}
          >
            {!convo ? (
              /* EMPTY LANDING STATE (AUTHENTIC WHATSAPP WEB) */
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#f0f2f5] border-l border-[#e9edef]">
                <div className="max-w-md space-y-4">
                  <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#25D366]/10 text-[#00a884] shadow-xs">
                    <MessageCircle className="h-12 w-12 stroke-[1.5]" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#111b21]">
                    WhatsApp Business para a sua Loja
                  </h2>
                  <p className="text-xs sm:text-sm text-[#667781] leading-relaxed">
                    Envie e receba mensagens dos seus clientes em tempo real. O agente de inteligência
                    artificial responde automaticamente e a sua equipa pode assumir a qualquer instante.
                  </p>
                  <div className="pt-4 flex items-center justify-center gap-2 text-xs text-[#8696a0]">
                    <ShieldCheck className="h-4 w-4 text-[#00a884]" />
                    <span>Linha protegida pela Meta Cloud API com isolamento por empresa.</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE CHAT VIEWPORT */
              <div className="flex flex-1 flex-col h-full overflow-hidden">
                {/* 1. CHAT HEADER */}
                <header className="flex items-center justify-between border-b border-[#e9edef] bg-[#f0f2f5] px-4 py-2.5 z-10 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActive(null)}
                      className="md:hidden grid h-8 w-8 place-items-center rounded-full text-[#54656f] hover:bg-[#e9edef]"
                      aria-label="Voltar para a lista"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div
                      onClick={() => setInfoOpen((v) => !v)}
                      className="flex items-center gap-3 cursor-pointer group min-w-0"
                    >
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold shadow-2xs ${getAvatarGradient(
                          convo.customer_phone,
                        ).bg} text-white`}
                      >
                        {(convo.customer_name || convo.customer_phone).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-[#111b21] group-hover:underline">
                            {convo.customer_name || `+${convo.customer_phone}`}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#667781] truncate">
                          {convo.status === "open" ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Agente IA a responder
                            </span>
                          ) : convo.status === "handoff" ? (
                            <span className="text-blue-700 font-semibold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              Atendimento com a equipa
                            </span>
                          ) : (
                            <span className="text-neutral-500">Conversa fechada</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2">
                    {/* Takeover or Handback button */}
                    {convo.status === "open" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatus("handoff")}
                        className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-full border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 shadow-2xs"
                      >
                        <UserRound className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                        <span className="hidden sm:inline">Assumir Atendimento</span>
                        <span className="sm:hidden">Assumir</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatus("open")}
                        className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-full border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 shadow-2xs"
                      >
                        <Bot className="h-3.5 w-3.5 mr-1 sm:mr-1.5 text-emerald-600" />
                        <span className="hidden sm:inline">Devolver à IA</span>
                        <span className="sm:hidden">IA</span>
                      </Button>
                    )}

                    {/* Close / Reopen */}
                    {convo.status !== "closed" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatus("closed")}
                        title="Fechar conversa"
                        className="h-8 px-2.5 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                      >
                        Fechar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatus("open")}
                        className="h-8 px-2.5 rounded-full text-xs font-semibold text-neutral-700"
                      >
                        Reabrir
                      </Button>
                    )}

                    {/* Customer Info Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setInfoOpen((v) => !v)}
                      title="Ver dados do cliente"
                      className={`h-8 w-8 rounded-full ${infoOpen ? "bg-[#e9edef] text-[#111b21]" : "text-[#54656f]"}`}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </header>

                {/* 2. CHAT STREAM (WHATSAPP BACKGROUND) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 whatsapp-chat-bg whatsapp-chat-scroll">
                  {/* Security message pill */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#ffeecd] px-3 py-1 text-[11px] text-[#54656f] shadow-2xs max-w-md text-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                      As mensagens são processadas com criptografia de ponta a ponta na Meta.
                    </span>
                  </div>

                  {/* 24-hour Meta Policy Warning */}
                  {is24hWindowExpired && (
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-[11px] font-medium text-amber-800 shadow-2xs max-w-lg text-center">
                        <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        Passaram 24h desde a última mensagem do cliente. A Meta exige nova mensagem do cliente para envio livre.
                      </span>
                    </div>
                  )}

                  {/* Messages list with date grouping */}
                  {msgs.map((m, idx) => {
                    const showDateBadge =
                      idx === 0 || !isSameDay(msgs[idx - 1].created_at, m.created_at);

                    const isInbound = m.direction === "in";
                    const isAgent = m.sender === "agent";
                    const isStaff = m.sender === "staff";

                    return (
                      <div key={m.id} className="space-y-3">
                        {showDateBadge && (
                          <div className="flex justify-center my-3">
                            <span className="rounded-md bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-[#54656f] shadow-2xs">
                              {formatChatDateBadge(m.created_at)}
                            </span>
                          </div>
                        )}

                        <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                          <div
                            className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
                              isInbound
                                ? "bg-white text-[#111b21] rounded-tl-xs"
                                : "bg-[#d9fdd3] text-[#111b21] rounded-tr-xs"
                            }`}
                          >
                            {/* Sender Tag on Outbound */}
                            {!isInbound && (
                              <div className="flex items-center gap-1 mb-0.5">
                                {isAgent ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Agente Vendora
                                  </span>
                                ) : isStaff ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                                    <User className="h-2.5 w-2.5" />
                                    Equipa
                                  </span>
                                ) : null}
                              </div>
                            )}

                            {/* Message Body */}
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>

                            {/* Timestamp & Status Checkmark */}
                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#667781]">
                              <span>{formatChatTime(m.created_at)}</span>
                              {!isInbound && (
                                <>
                                  {m.status === "sending" ? (
                                    <Clock className="h-3 w-3 text-neutral-400" />
                                  ) : m.status === "failed" ? (
                                    <span className="text-red-500 font-bold" title={m.error || "Falhou"}>
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

                {/* 3. QUICK CHIPS STRIP */}
                <div className="border-t border-[#e9edef] bg-[#f0f2f5] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                  <span className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider shrink-0 mr-1">
                    Rápido:
                  </span>
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setText((prev) => prev + emoji)}
                      className="px-2 py-0.5 rounded-full hover:bg-white text-sm transition cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                  <div className="h-4 w-px bg-neutral-300 shrink-0 mx-1" />
                  {QUICK_REPLIES.slice(0, 2).map((reply, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setText(reply)}
                      className="truncate max-w-[200px] px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#54656f] hover:text-[#111b21] hover:border-black border border-neutral-200 transition shrink-0"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* 4. CHAT INPUT FOOTER */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send();
                  }}
                  className="flex items-center gap-2 border-t border-[#e9edef] bg-[#f0f2f5] p-3"
                >
                  <div className="relative flex-1">
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
                      placeholder="Escrever mensagem como equipa (Enter para enviar)..."
                      maxLength={4000}
                      className="w-full resize-none rounded-xl bg-white px-4 py-2.5 text-xs text-[#111b21] placeholder:text-[#54656f] focus:outline-none focus:ring-1 focus:ring-[#00a884] shadow-xs max-h-32 transition"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    disabled={sending || !text.trim()}
                    aria-label="Enviar mensagem"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-white hover:bg-[#008f6f] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition cursor-pointer"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 fill-white translate-x-0.5" />
                    )}
                  </motion.button>
                </form>
              </div>
            )}

            {/* CUSTOMER DETAILS SIDE PANEL (SLIDE-OVER) */}
            <AnimatePresence>
              {infoOpen && convo && (
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 280 }}
                  className="absolute inset-y-0 right-0 z-20 w-80 sm:w-96 border-l border-[#e9edef] bg-white shadow-xl flex flex-col"
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-[#e9edef] bg-[#f0f2f5] px-4 py-3">
                    <h3 className="text-sm font-bold text-[#111b21]">Dados do Cliente</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setInfoOpen(false)}
                      className="h-8 w-8 rounded-full text-[#54656f]"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Panel Content */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Contact Profile Card */}
                    <div className="text-center space-y-2">
                      <div
                        className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-xl font-bold text-white shadow-md ${getAvatarGradient(
                          convo.customer_phone,
                        ).bg}`}
                      >
                        {(convo.customer_name || convo.customer_phone).charAt(0).toUpperCase()}
                      </div>
                      <h4 className="text-base font-bold text-[#111b21]">
                        {convo.customer_name || `+${convo.customer_phone}`}
                      </h4>
                      <p className="text-xs text-[#667781]">+{convo.customer_phone}</p>

                      <div className="pt-2">
                        <a
                          href={`https://wa.me/${convo.customer_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3.5 py-1 text-xs font-bold text-[#075E54] hover:bg-[#25D366]/20 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Abrir no WhatsApp Oficial</span>
                        </a>
                      </div>
                    </div>

                    {/* Status & Timing */}
                    <div className="rounded-xl border border-neutral-200/80 bg-[#fbfaf6] p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-neutral-200/60">
                        <span className="text-neutral-500">Estado</span>
                        <span className="font-bold text-neutral-900">
                          {convo.status === "open"
                            ? "🤖 Agente IA"
                            : convo.status === "handoff"
                            ? "👤 Equipa"
                            : "Fechada"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-200/60">
                        <span className="text-neutral-500">Início</span>
                        <span className="font-semibold text-neutral-800">
                          {new Date(convo.created_at).toLocaleDateString("pt-PT")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-neutral-500">Última interação</span>
                        <span className="font-semibold text-neutral-800">
                          {new Date(convo.last_message_at).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Customer Orders in Vendora */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-neutral-700" />
                        <span>Pedidos na Loja</span>
                      </h4>

                      {loadingOrders ? (
                        <div className="p-4 text-center text-xs text-neutral-400">
                          <Loader2 className="mx-auto h-4 w-4 animate-spin text-neutral-500 mb-1" />
                          A pesquisar histórico...
                        </div>
                      ) : customerOrders.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-500">
                          Nenhum pedido finalizado encontrado com este contacto telefónico.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {customerOrders.map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 text-xs shadow-2xs"
                            >
                              <div>
                                <p className="font-bold text-neutral-900">
                                  #{o.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className="text-[11px] text-neutral-400">
                                  {new Date(o.created_at).toLocaleDateString("pt-PT")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-extrabold text-neutral-900">
                                  {formatMoney(o.total, company?.currency)}
                                </p>
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 uppercase">
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
              A Vendora usa a Meta Cloud API oficial. Cada loja liga o seu número próprio com total
              isolamento de conversas e dados.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Status card */}
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

            {/* Form */}
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
                  Encontrado no painel do Meta Developers em WhatsApp &gt; API Setup.
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

            {/* Webhook Configuration Guide */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-600" />
                Configurar Webhook na Meta
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                No portal Meta for Developers, configure este endereço exato como URL de callback e
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
                  className="text-neutral-500 hover:text-black p-1"
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
