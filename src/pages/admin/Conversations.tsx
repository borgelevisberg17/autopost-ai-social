import { MetaConnect } from "@/components/admin/MetaConnect";
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

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-PT")
    .trim();
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
  const [messagesLoading, setMessagesLoading] = useState(false);
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
  const messagesRequestRef = useRef(0);
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
    const requestId = ++messagesRequestRef.current;
    setMessagesLoading(true);
    setMsgs([]);
    try {
      const { data, error } = await db
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at")
        .limit(300);
      if (error) throw error;
      if (requestId === messagesRequestRef.current) setMsgs((data ?? []) as Msg[]);
    } catch {
      if (requestId === messagesRequestRef.current) {
        toast.error("Não foi possível carregar o histórico desta conversa.");
      }
    } finally {
      if (requestId === messagesRequestRef.current) setMessagesLoading(false);
    }
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
    const searchTerms = normalizeSearch(search);
    const numericSearch = search.replace(/\D/g, "");
    return convos.filter((c) => {
      const matchesSearch =
        !searchTerms ||
        normalizeSearch(c.customer_name ?? "").includes(searchTerms) ||
        (numericSearch.length > 0 && c.customer_phone.replace(/\D/g, "").includes(numericSearch)) ||
        normalizeSearch(latestMsgs[c.id]?.body ?? "").includes(searchTerms);

      if (!matchesSearch) return false;
      if (filter === "unread") return c.status !== "closed" && latestMsgs[c.id]?.direction === "in";
      if (filter === "agent") return c.status === "open";
      if (filter === "staff") return c.status === "handoff";
      if (filter === "closed") return c.status === "closed";
      return true;
    });
  }, [convos, latestMsgs, search, filter]);

  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name">("recent");
  const sortedConvos = useMemo(() => {
    return [...filteredConvos].sort((a, b) => {
      if (sortBy === "name") {
        return (a.customer_name || a.customer_phone).localeCompare(
          b.customer_name || b.customer_phone,
          "pt-PT",
          { sensitivity: "base" },
        );
      }
      const delta = new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      return sortBy === "recent" ? delta : -delta;
    });
  }, [filteredConvos, sortBy]);

  const filterCounts = useMemo(() => ({
    all: convos.length,
    unread: convos.filter((c) => c.status !== "closed" && latestMsgs[c.id]?.direction === "in").length,
    agent: convos.filter((c) => c.status === "open").length,
    staff: convos.filter((c) => c.status === "handoff").length,
    closed: convos.filter((c) => c.status === "closed").length,
  }), [convos, latestMsgs]);

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

  return (
    <AdminLayout title="Conversas" fullBleed>
      <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-50 text-slate-900">
        <header className="flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Atendimento omnicanal
            </div>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Conversas</h1>
              <span className="pb-0.5 text-xs text-slate-500">Gerencie mensagens e acompanhe os atendimentos da sua loja.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold leading-tight text-slate-800">WhatsApp Business</p>
                <p className="max-w-[150px] truncate text-[10px] text-slate-500">
                  {account?.display_phone || whatsappConnectionLabel(connectionState)}
                </p>
              </div>
            </div>
            {account && (
              <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                <Bot className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-semibold text-slate-700">Agente IA</span>
                <Switch
                  checked={account.auto_reply}
                  onCheckedChange={toggleAutoReply}
                  id="master-ai-toggle"
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSetupOpen(true)}
              className="h-10 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Canal</span>
              <span className="sm:hidden">Configurar</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setNewChatOpen(true)}
              className="h-10 rounded-lg bg-slate-950 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
              Nova conversa
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6 lg:px-8">
          <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <p className="text-[11px] font-medium text-slate-500">Total de conversas</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{convos.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <p className="text-[11px] font-medium text-slate-500">A aguardar resposta</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600">
                {filterCounts.unread}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <p className="text-[11px] font-medium text-slate-500">Com Agente IA</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-violet-700">{convos.filter((c) => c.status === "open").length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <p className="text-[11px] font-medium text-slate-500">Com a equipa</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-sky-700">{convos.filter((c) => c.status === "handoff").length}</p>
            </div>
          </div>

          <section className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Caixa de entrada</h2>
                <p className="mt-0.5 text-xs text-slate-500">Pesquise, filtre e abra uma conversa para responder.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar nome, número ou mensagem..."
                    aria-label="Pesquisar conversas"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  onClick={() => { setRefreshing(true); void load(); if (active) void loadMsgs(active); }}
                  className="h-10 rounded-lg border-slate-200 px-3 text-xs font-semibold"
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-100 px-4 py-3 sm:px-5">
              {([
                ["all", "Todas"],
                ["unread", "A aguardar"],
                ["agent", "Agente IA"],
                ["staff", "Equipa"],
                ["closed", "Encerradas"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${filter === value ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
                >
                  {label}
                  <span className={`text-[10px] tabular-nums ${filter === value ? "text-slate-300" : "text-slate-400"}`}>{filterCounts[value]}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <label htmlFor="conversation-sort" className="hidden text-[10px] font-medium text-slate-400 sm:inline">Ordenar</label>
                <select id="conversation-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 outline-none focus:border-emerald-500">
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigas</option>
                  <option value="name">Nome A–Z</option>
                </select>
                <span className="hidden text-[10px] text-slate-400 lg:inline">{sortedConvos.length} registo(s)</span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-[0.09em] text-slate-500">
                    <th className="px-5 py-3">Contacto</th>
                    <th className="px-4 py-3">Última mensagem</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Última atividade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-5 py-4">
                          <div className="h-9 animate-pulse rounded-md bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : filteredConvos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-20 text-center">
                        <div className="mx-auto flex max-w-xs flex-col items-center">
                          <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                            <MessageCircle className="h-5 w-5" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-800">Nenhuma conversa encontrada</p>
                          <p className="mt-1 text-xs text-slate-500">Experimente alterar os filtros ou iniciar uma nova conversa.</p>
                          <Button size="sm" onClick={() => setNewChatOpen(true)} className="mt-4 h-9 rounded-lg bg-slate-950 text-xs text-white hover:bg-slate-800">
                            <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" /> Nova conversa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : sortedConvos.map((c) => {
                    const last = latestMsgs[c.id];
                    const waiting = c.status !== "closed" && last?.direction === "in";
                    const name = c.customer_name || `+${c.customer_phone}`;
                    const avatar = getAvatarColor(c.customer_phone || c.id);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => { setActive(c.id); setInfoOpen(false); }}
                        className="group cursor-pointer outline-none transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => { setActive(c.id); setInfoOpen(false); }}
                            aria-label={`Abrir conversa com ${name}`}
                            className="flex w-full min-w-0 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                          >
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${avatar.bg} ${avatar.text}`}>
                              {name.charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold text-slate-900 group-hover:text-emerald-800">{name}</span>
                              <span className="mt-0.5 block text-[10px] text-slate-500">+{c.customer_phone.replace(/^\+/, "")}</span>
                            </span>
                          </button>
                        </td>
                        <td className="max-w-[360px] px-4 py-3.5">
                          <div className="flex min-w-0 items-center gap-1.5">
                            {last?.direction === "out" && <CheckCheck className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                            <span className={`truncate text-xs ${waiting ? "font-semibold text-slate-900" : "text-slate-600"}`}>{last?.body || "Conversa iniciada"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                            {c.status === "open" ? <Bot className="h-3.5 w-3.5 text-violet-600" /> : c.status === "handoff" ? <UserRound className="h-3.5 w-3.5 text-sky-600" /> : <User className="h-3.5 w-3.5 text-slate-400" />}
                            {c.status === "open" ? "Agente IA" : c.status === "handoff" ? "Equipa" : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold ${c.status === "open" ? "bg-violet-50 text-violet-700" : c.status === "handoff" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                            {c.status === "open" ? "IA a responder" : c.status === "handoff" ? "Em atendimento" : "Encerrada"}
                          </span>
                          {waiting && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" title="Mensagem recebida recentemente" />}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span title={new Date(c.last_message_at).toLocaleString("pt-PT")} className="text-[11px] font-medium text-slate-500">{formatChatDateBadge(c.last_message_at)}</span>
                          <span className="mt-0.5 block text-[10px] text-slate-400">{formatChatTime(c.last_message_at)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[10px] text-slate-500 sm:px-5">
              <span>Os dados são atualizados automaticamente.</span>
              <span className="font-medium">{filteredConvos.length} de {convos.length} conversas</span>
            </div>
          </section>
        </div>

        <AnimatePresence>
          {active && convo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="absolute inset-0 z-40 bg-slate-950/35 p-0 backdrop-blur-[2px] sm:p-3 lg:p-5"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setActive(null);
                  setInfoOpen(false);
                }
              }}
            >
              <motion.section
                initial={{ y: 14, scale: 0.99 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 10, scale: 0.99 }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="relative mx-auto flex h-full max-w-[1500px] min-w-0 overflow-hidden rounded-none border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
                aria-label="Mensageiro da conversa"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <button type="button" onClick={() => { setActive(null); setInfoOpen(false); }} aria-label="Voltar à caixa de entrada" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${getAvatarColor(convo.customer_phone).bg} ${getAvatarColor(convo.customer_phone).text}`}>
                        {(convo.customer_name || convo.customer_phone).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{convo.customer_name || `+${convo.customer_phone}`}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                          <span className={`h-1.5 w-1.5 rounded-full ${convo.status === "open" ? "bg-violet-500" : convo.status === "handoff" ? "bg-sky-500" : "bg-slate-400"}`} />
                          {convo.status === "open" ? "Agente IA está a responder" : convo.status === "handoff" ? "Atendimento com a equipa" : "Conversa encerrada"}
                          <span className="text-slate-300">·</span>
                          +{convo.customer_phone.replace(/^\+/, "")}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {convo.status === "open" ? (
                        <Button variant="outline" size="sm" onClick={() => setStatus("handoff")} className="h-9 rounded-lg border-sky-200 px-2.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 sm:px-3">
                          <UserRound className="mr-1.5 h-3.5 w-3.5" /><span className="hidden sm:inline">Assumir</span>
                        </Button>
                      ) : convo.status === "handoff" ? (
                        <Button variant="outline" size="sm" onClick={() => setStatus("open")} className="h-9 rounded-lg border-violet-200 px-2.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 sm:px-3">
                          <Bot className="mr-1.5 h-3.5 w-3.5" /><span className="hidden sm:inline">Devolver à IA</span>
                        </Button>
                      ) : null}
                      {convo.status !== "closed" ? (
                        <Button variant="outline" size="sm" onClick={() => setStatus("closed")} className="h-9 rounded-lg border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:px-3">
                          <X className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Encerrar</span>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setStatus("open")} className="h-9 rounded-lg border-emerald-200 px-2.5 text-[11px] font-semibold text-emerald-700 sm:px-3">
                          <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Reabrir</span>
                        </Button>
                      )}
                      <button type="button" onClick={() => setInfoOpen((v) => !v)} aria-label="Mostrar dados do cliente" aria-pressed={infoOpen} className={`grid h-9 w-9 place-items-center rounded-lg transition ${infoOpen ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-100"}`}>
                        <Info className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => { setActive(null); setInfoOpen(false); }} aria-label="Fechar mensageiro" className="hidden h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 sm:grid">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </header>

                  <div className="flex min-h-0 flex-1 flex-col bg-[#f7f8fa]">
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-5 sm:px-7">
                      {is24hWindowExpired && (
                        <div className="mx-auto mb-5 flex max-w-xl items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-800">
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>A janela de 24 horas da Meta expirou. Para retomar o contacto, poderá ser necessário utilizar um modelo de mensagem aprovado.</span>
                        </div>
                      )}
                      {messagesLoading ? (
                        <div className="m-auto w-full max-w-xl space-y-4 py-10" aria-label="A carregar mensagens">
                          <div className="h-14 w-3/5 animate-pulse rounded-2xl bg-slate-200/70" />
                          <div className="ml-auto h-16 w-2/3 animate-pulse rounded-2xl bg-emerald-100" />
                          <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-slate-200/70" />
                        </div>
                      ) : msgs.length === 0 ? (
                        <div className="m-auto max-w-sm py-12 text-center">
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm"><MessageCircle className="h-5 w-5" /></div>
                          <p className="mt-3 text-sm font-semibold text-slate-800">Início da conversa</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">Envie uma mensagem para iniciar o atendimento com este contacto.</p>
                        </div>
                      ) : msgs.map((m, idx) => {
                        const showDateBadge = idx === 0 || !isSameDay(msgs[idx - 1].created_at, m.created_at);
                        const inbound = m.direction === "in";
                        const isAgent = m.sender === "agent";
                        const isStaff = m.sender === "staff";
                        return (
                          <div key={m.id} className="mb-3">
                            {showDateBadge && <div className="my-4 flex justify-center"><span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">{formatChatDateBadge(m.created_at)}</span></div>}
                            <div className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
                              <div className={`max-w-[88%] rounded-2xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:max-w-[72%] ${inbound ? "rounded-tl-md border-slate-200 bg-white text-slate-800" : "rounded-tr-md border-emerald-100 bg-emerald-50 text-slate-800"}`}>
                                {!inbound && (
                                  <div className={`mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] ${isAgent ? "text-violet-700" : isStaff ? "text-emerald-700" : "text-slate-500"}`}>
                                    {isAgent ? <Sparkles className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                    {isAgent ? "Agente IA" : isStaff ? "Equipa" : "Loja"}
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{m.body}</p>
                                <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[9px] text-slate-400">
                                  <span>{formatChatTime(m.created_at)}</span>
                                  {!inbound && (m.status === "sending" ? <Clock className="h-3 w-3" /> : m.status === "failed" ? <span className="font-bold text-red-500" title={m.error || "Falhou"}>Falhou</span> : <CheckCheck className="h-3 w-3 text-sky-500" />)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <footer className="shrink-0 border-t border-slate-200 bg-white px-3 py-3 sm:px-5">
                      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="mx-auto flex max-w-5xl items-end gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" title="Inserir emoji" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Smile className="h-5 w-5" /></button>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="start" className="w-64 rounded-xl border-slate-200 bg-white p-3 shadow-xl">
                            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Emojis rápidos</p>
                            <div className="grid grid-cols-6 gap-1.5 text-lg">
                              {QUICK_EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => setText((prev) => prev + emoji)} className="grid h-8 w-8 place-items-center rounded-md transition hover:bg-slate-100">{emoji}</button>)}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" title="Respostas rápidas" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Zap className="h-4 w-4" /></button>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="start" className="w-80 rounded-xl border-slate-200 bg-white p-3 shadow-xl">
                            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Respostas rápidas</p>
                            <div className="space-y-1">{QUICK_REPLIES.map((reply, i) => <button key={i} type="button" onClick={() => setText(reply)} className="block w-full rounded-lg p-2.5 text-left text-xs leading-relaxed text-slate-700 transition hover:bg-slate-50">{reply}</button>)}</div>
                          </PopoverContent>
                        </Popover>
                        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                          <textarea
                            ref={textareaRef}
                            value={text}
                            rows={1}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                            placeholder="Escreva uma mensagem..."
                            aria-label="Escreva uma mensagem"
                            maxLength={4000}
                            className="max-h-32 min-h-6 w-full resize-y bg-transparent text-xs leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
                          />
                          <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                            <span>Enter para enviar · Shift + Enter para nova linha</span>
                            <span>{text.length}/4000</span>
                          </div>
                        </div>
                        <button type="submit" disabled={sending || !text.trim()} aria-label="Enviar mensagem" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                      </form>
                    </footer>
                  </div>
                </div>

                {infoOpen && (
                  <aside className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:relative sm:inset-auto sm:w-[340px] sm:shrink-0 sm:shadow-none">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-950">Perfil do contacto</h3>
                        <p className="mt-0.5 text-[10px] text-slate-500">Informações e histórico da loja</p>
                      </div>
                      <button type="button" onClick={() => setInfoOpen(false)} aria-label="Fechar detalhes" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex-1 space-y-5 overflow-y-auto p-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-lg font-bold ${getAvatarColor(convo.customer_phone).bg} ${getAvatarColor(convo.customer_phone).text}`}>{(convo.customer_name || convo.customer_phone).charAt(0).toUpperCase()}</div>
                        <p className="mt-3 text-sm font-bold text-slate-950">{convo.customer_name || "Contacto sem nome"}</p>
                        <p className="mt-1 text-xs text-slate-500">+{convo.customer_phone.replace(/^\+/, "")}</p>
                        <a href={`https://wa.me/${convo.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
                          <ExternalLink className="h-3 w-3" /> Abrir no WhatsApp
                        </a>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dados da conversa</h4>
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">
                          <div className="flex items-center justify-between py-3 text-xs"><span className="text-slate-500">Estado</span><span className="font-semibold text-slate-800">{convo.status === "open" ? "Agente IA" : convo.status === "handoff" ? "Equipa" : "Encerrada"}</span></div>
                          <div className="flex items-center justify-between py-3 text-xs"><span className="text-slate-500">Criada em</span><span className="font-semibold text-slate-800">{new Date(convo.created_at).toLocaleDateString("pt-PT")}</span></div>
                          <div className="flex items-center justify-between py-3 text-xs"><span className="text-slate-500">Última atividade</span><span className="font-semibold text-slate-800">{formatChatDateBadge(convo.last_message_at)} · {formatChatTime(convo.last_message_at)}</span></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Package className="h-3.5 w-3.5" /> Pedidos recentes</h4>
                        {loadingOrders ? (
                          <div className="rounded-xl border border-slate-200 p-5 text-center text-xs text-slate-500"><Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />A pesquisar pedidos...</div>
                        ) : customerOrders.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">Nenhum pedido associado a este número.</p>
                        ) : customerOrders.map((o) => (
                          <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                            <div><p className="text-xs font-bold text-slate-800">#{o.id.slice(0, 8).toUpperCase()}</p><p className="mt-1 text-[10px] text-slate-500">{new Date(o.created_at).toLocaleDateString("pt-PT")}</p></div>
                            <div className="text-right"><p className="text-xs font-bold text-slate-900">{formatMoney(o.total, company?.currency)}</p><span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-600">{o.status}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                )}
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
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

            {company && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Ligação automática (recomendado)</h3>
                <MetaConnect companyId={company.id} kind="whatsapp" onConnected={() => void accountQuery.refetch()} />
              </div>
            )}
            <p className="text-xs font-semibold text-neutral-500">Ou ligue manualmente com os IDs da Meta:</p>
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
