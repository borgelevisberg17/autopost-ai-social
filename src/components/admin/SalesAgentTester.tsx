import { useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "client" | "agent"; text: string; handoff?: boolean };

export function SalesAgentTester({ companyId }: { companyId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const message = text.trim();
    if (!message || loading) return;
    const history = msgs;
    setMsgs([...history, { role: "client", text: message }]);
    setText("");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("sales-agent", {
      body: { company_id: companyId, message, history },
    });
    setLoading(false);
    let reply: Msg;
    if (error) {
      let msg = "Não foi possível responder agora.";
      if (error instanceof FunctionsHttpError) {
        const b = await error.context.json().catch(() => null);
        if (b?.error) msg = b.error;
      }
      reply = { role: "agent", text: `⚠ ${msg}` };
    } else {
      reply = { role: "agent", text: data.reply, handoff: data.handoff };
    }
    setMsgs((m) => [...m, reply]);
  };

  return (
    <section className="rounded border border-border bg-card p-4 md:p-5">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold">Agente de atendimento WhatsApp — teste</h2>
          <p className="text-sm text-muted-foreground">
            Escreva como se fosse um cliente. Responde só com produtos, preços, stock e pedidos reais.
          </p>
        </div>
      </div>
      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
        {msgs.length === 0 && (
          <p className="text-sm text-muted-foreground">Ex.: "Têm ténis brancos? Quanto custam?"</p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "client" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[80%] rounded px-3 py-2 text-sm ${m.role === "client" ? "bg-primary text-primary-foreground" : "border border-border"}`}>
              {m.text}
              {m.handoff && <p className="mt-1 text-xs text-muted-foreground">→ Passaria para a equipa</p>}
            </div>
          </div>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem do cliente…" maxLength={1000} />
        <Button type="submit" disabled={loading || !text.trim()} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
      </form>
    </section>
  );
}
