import { useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { CheckCircle2, Clock3, Copy, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";

export type PayInfo = {
  payment_iban: string | null;
  payment_iban_holder: string | null;
  payment_express_number: string | null;
};

type Props = {
  orderId: string;
  total: number;
  currency: string;
  paymentStatus: string;
  submittedAt: string | null;
  info: PayInfo;
  onSubmitted: () => void;
};

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all font-mono text-sm font-semibold">{value}</p>
      </div>
      <button type="button" aria-label={`Copiar ${label}`} className="shrink-0 rounded border border-border p-2 hover:bg-muted"
        onClick={() => { void navigator.clipboard?.writeText(value); toast.success("Copiado"); }}>
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PaymentPanel({ orderId, total, currency, paymentStatus, submittedAt, info, onSubmitted }: Props) {
  const methods = [
    info.payment_iban && { id: "iban", label: "Transferência IBAN" },
    info.payment_express_number && { id: "express", label: "Multicaixa Express" },
  ].filter(Boolean) as { id: "iban" | "express"; label: string }[];
  const [method, setMethod] = useState<"iban" | "express">(methods[0]?.id ?? "iban");
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);

  if (paymentStatus === "paid") {
    return (
      <section className="mt-10 flex items-start gap-3 rounded border border-border bg-card p-5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
        <div><p className="font-semibold">Pagamento confirmado</p><p className="text-sm text-muted-foreground">Obrigado! A loja confirmou o seu pagamento.</p></div>
      </section>
    );
  }

  if (methods.length === 0) {
    return (
      <section className="mt-10 rounded border border-border bg-card p-5 text-sm text-muted-foreground">
        A loja vai contactá-lo para combinar o pagamento.
      </section>
    );
  }

  const submit = async () => {
    if (!file) return toast.error("Anexe o comprovativo.");
    setSending(true);
    const fd = new FormData();
    fd.append("order_id", orderId);
    fd.append("method", method);
    fd.append("reference", reference);
    fd.append("file", file);
    const { error } = await supabase.functions.invoke("payment-proof", { body: fd });
    setSending(false);
    if (error) {
      let msg = "Não foi possível enviar.";
      if (error instanceof FunctionsHttpError) { const b = await error.context.json().catch(() => null); if (b?.error) msg = b.error; }
      return toast.error(msg);
    }
    toast.success("Comprovativo enviado");
    setFile(null);
    onSubmitted();
  };

  return (
    <section className="mt-10 rounded border border-border bg-card p-5 sm:p-6">
      <h2 className="font-serif text-2xl">Pagamento</h2>
      {submittedAt && paymentStatus !== "failed" ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4" /> Comprovativo recebido. A loja está a verificar o pagamento.
        </p>
      ) : paymentStatus === "failed" ? (
        <p className="mt-2 text-sm font-medium text-destructive">A loja não conseguiu confirmar o comprovativo. Envie um novo, por favor.</p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Pague {formatMoney(total, currency)} e envie o comprovativo aqui.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {methods.map((m) => (
          <button key={m.id} type="button" onClick={() => setMethod(m.id)}
            className={`rounded border px-3 py-2 text-sm font-semibold ${method === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded border border-border px-4">
        {method === "iban" ? (
          <>
            {info.payment_iban_holder && <CopyRow label="Titular" value={info.payment_iban_holder} />}
            <CopyRow label="IBAN" value={info.payment_iban!} />
          </>
        ) : (
          <CopyRow label="Número Multicaixa Express" value={info.payment_express_number!} />
        )}
        <CopyRow label="Valor" value={formatMoney(total, currency)} />
        <CopyRow label="Descritivo" value={orderId.slice(0, 8).toUpperCase()} />
      </div>

      <div className="mt-4 grid gap-3">
        <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-border p-4 text-sm hover:bg-muted">
          <Upload className="h-4 w-4 shrink-0" />
          <span className="truncate">{file ? file.name : "Anexar comprovativo (imagem ou PDF, até 5 MB)"}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120}
          placeholder="Referência da transação (opcional)"
          className="h-11 rounded border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
        <button type="button" onClick={submit} disabled={sending || !file}
          className="inline-flex h-12 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}Enviar comprovativo
        </button>
      </div>
    </section>
  );
}
