import { useCallback, useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Copy, Loader2, MessageCircle, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type Account = { id: string; phone_number_id: string; waba_id: string | null; display_phone: string | null; status: string; auto_reply: boolean; last_event_at: string | null };
type Convo = { id: string; customer_phone: string; customer_name: string | null; status: string; last_message_at: string; last_inbound_at: string | null };
type Msg = { id: string; direction: string; sender: string; body: string; status: string; error: string | null; created_at: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const WEBHOOK_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-webhook`;
const STATUS: Record<string, string> = { open: "Agente a responder", handoff: "Com a equipa", closed: "Fechada" };

async function fnError(error: unknown, fallback: string) {
  if (error instanceof FunctionsHttpError) {
    const b = await error.context.json().catch(() => null);
    if (b?.error) return String(b.error);
  }
  return fallback;
}

function AccountSetup({ companyId, account, onSaved }: { companyId: string; account: Account | null; onSaved: () => void }) {
  const [pnid, setPnid] = useState(account?.phone_number_id ?? "");
  const [waba, setWaba] = useState(account?.waba_id ?? "");
  const [phone, setPhone] = useState(account?.display_phone ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!/^\d{5,30}$/.test(pnid.trim())) return toast.error("O ID do número deve ter só algarismos.");
    setSaving(true);
    const row = { company_id: companyId, phone_number_id: pnid.trim(), waba_id: waba.trim() || null, display_phone: phone.trim() || null };
    const { error } = account
      ? await db.from("whatsapp_accounts").update(row).eq("id", account.id)
      : await db.from("whatsapp_accounts").insert(row);
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "Este número já está ligado a outra empresa." : "Só administradores podem ligar o número.");
    toast.success("Número guardado");
    onSaved();
  };

  const toggle = async (v: boolean) => {
    if (!account) return;
    const { error } = await db.from("whatsapp_accounts").update({ auto_reply: v }).eq("id", account.id);
    if (error) toast.error("Não foi possível alterar."); else onSaved();
  };

  return (
    <section className="rounded border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Número WhatsApp Business</h2>
          <p className="text-sm text-muted-foreground">
            {account ? (account.status === "active" ? `Ativo — última mensagem ${account.last_event_at ? new Date(account.last_event_at).toLocaleString("pt-PT") : "—"}` : "A aguardar a primeira mensagem da Meta") : "Ainda não ligado"}
          </p>
        </div>
        {account && (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={account.auto_reply} onCheckedChange={toggle} />
            Agente responde automaticamente
          </label>
        )}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Input placeholder="ID do número (Phone number ID)" value={pnid} onChange={(e) => setPnid(e.target.value)} />
        <Input placeholder="ID da conta Business (WABA ID)" value={waba} onChange={(e) => setWaba(e.target.value)} />
        <Input placeholder="Número visível, ex. +244 9xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">Endereço para a Meta:</span>
          <code className="truncate rounded border border-border px-2 py-1">{WEBHOOK_URL}</code>
          <button type="button" aria-label="Copiar endereço" onClick={() => { void navigator.clipboard.writeText(WEBHOOK_URL); toast.success("Copiado"); }}>
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Conversations() {
  const { company } = useCompany();
  const [account, setAccount] = useState<Account | null>(null);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!company) return;
    const [{ data: acc }, { data: cs }] = await Promise.all([
      db.from("whatsapp_accounts").select("*").eq("company_id", company.id).limit(1).maybeSingle(),
      db.from("conversations").select("*").eq("company_id", company.id).order("last_message_at", { ascending: false }).limit(100),
    ]);
    setAccount(acc ?? null);
    setConvos(cs ?? []);
    setLoading(false);
  }, [company]);

  const loadMsgs = useCallback(async (id: string) => {
    const { data } = await db.from("messages").select("*").eq("conversation_id", id).order("created_at").limit(300);
    setMsgs(data ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (active) void loadMsgs(active); }, [active, loadMsgs]);
  useEffect(() => {
    const t = setInterval(() => { void load(); if (active) void loadMsgs(active); }, 10000);
    return () => clearInterval(t);
  }, [load, loadMsgs, active]);

  const convo = convos.find((c) => c.id === active) ?? null;

  const setStatus = async (status: string) => {
    if (!convo) return;
    const { error } = await db.from("conversations").update({ status }).eq("id", convo.id);
    if (error) toast.error("Não foi possível alterar."); else void load();
  };

  const send = async () => {
    if (!convo || !text.trim()) return;
    setSending(true);
    const { error } = await supabase.functions.invoke("whatsapp-send", { body: { conversation_id: convo.id, text: text.trim() } });
    setSending(false);
    if (error) return toast.error(await fnError(error, "Não foi possível enviar."));
    setText("");
    void loadMsgs(convo.id);
  };

  return (
    <AdminLayout title="Conversas">
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-medium">Conversas WhatsApp</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mensagens recebidas pela Vendora e respostas do agente de atendimento.</p>
        </div>
        {company && !loading && <AccountSetup key={account?.id ?? "new"} companyId={company.id} account={account} onSaved={load} />}

        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <aside className="rounded border border-border bg-card">
            {convos.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Ainda não há conversas. Aparecem aqui quando um cliente escrever para o número ligado.</p>
            ) : convos.map((c) => (
              <button key={c.id} type="button" onClick={() => setActive(c.id)}
                className={`block w-full border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted ${active === c.id ? "bg-muted" : ""}`}>
                <p className="truncate text-sm font-medium">{c.customer_name || `+${c.customer_phone}`}</p>
                <p className="text-xs text-muted-foreground">{STATUS[c.status] ?? c.status} · {new Date(c.last_message_at).toLocaleString("pt-PT")}</p>
              </button>
            ))}
          </aside>

          <section className="flex min-h-[420px] flex-col rounded border border-border bg-card">
            {!convo ? (
              <div className="grid flex-1 place-items-center p-6 text-center text-sm text-muted-foreground">
                <div><MessageCircle className="mx-auto mb-2 h-6 w-6" />Escolha uma conversa</div>
              </div>
            ) : (
              <>
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div>
                    <p className="font-medium">{convo.customer_name || `+${convo.customer_phone}`}</p>
                    <p className="text-xs text-muted-foreground">+{convo.customer_phone} · {STATUS[convo.status]}</p>
                  </div>
                  <div className="flex gap-2">
                    {convo.status !== "open" && <Button variant="outline" size="sm" onClick={() => setStatus("open")}>Devolver ao agente</Button>}
                    {convo.status === "open" && <Button variant="outline" size="sm" onClick={() => setStatus("handoff")}><UserRound className="mr-1 h-4 w-4" />Assumir</Button>}
                    {convo.status !== "closed" && <Button variant="outline" size="sm" onClick={() => setStatus("closed")}>Fechar</Button>}
                  </div>
                </header>
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {msgs.map((m) => (
                    <div key={m.id} className={m.direction === "in" ? "flex justify-start" : "flex justify-end"}>
                      <div className={`max-w-[80%] rounded px-3 py-2 text-sm ${m.direction === "in" ? "border border-border" : "bg-primary text-primary-foreground"}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {m.sender === "agent" ? "Agente" : m.sender === "staff" ? "Equipa" : "Cliente"} · {new Date(m.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                          {m.direction === "out" && ` · ${m.status === "failed" ? "falhou" : m.status}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
                  <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Responder como equipa…" maxLength={4000} />
                  <Button type="submit" disabled={sending || !text.trim()} aria-label="Enviar">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
