import { useEffect, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  FileCheck,
  FileText,
  Loader2,
  Lock,
  Upload,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { MulticaixaExpressLogo } from "@/components/store/StoreFooter";

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

function CopyRow({
  label,
  value,
  icon: Icon,
  helper,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  helper?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      toast.success(`${label} copiado`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3.5 border border-neutral-200/80 shadow-2xs transition hover:border-neutral-300">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
          {Icon && <Icon className="h-3.5 w-3.5 text-neutral-400" />}
          <span>{label}</span>
          {helper && <span className="text-[10px] text-neutral-400">({helper})</span>}
        </div>
        <p className="mt-1 break-all font-mono text-sm font-bold tracking-tight text-neutral-900">
          {value}
        </p>
      </div>

      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar ${label}`}
        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
          copied
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 hover:text-black"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>Copiado</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-neutral-400" />
            <span>Copiar</span>
          </>
        )}
      </button>
    </div>
  );
}

async function errMsg(error: unknown, fallback: string) {
  if (error instanceof FunctionsHttpError) {
    const b = await error.context.json().catch(() => null);
    if (b?.error) return b.error as string;
  }
  return fallback;
}

function CardPay({ orderId, onPaid }: { orderId: string; onPaid: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const provider = q.get("payment");
    const token =
      provider === "stripe"
        ? q.get("session_id")
        : provider === "paypal"
        ? q.get("token")
        : null;

    if (!provider || !token || done.current) return;
    done.current = true;
    setBusy(provider);

    void supabase.functions
      .invoke("capture-card-payment", {
        body: { order_id: orderId, provider, token },
      })
      .then(async ({ error }) => {
        setBusy(null);
        window.history.replaceState(null, "", window.location.pathname);
        if (error) {
          return toast.error(
            await errMsg(error, "Não foi possível confirmar o pagamento."),
          );
        }
        toast.success("Pagamento confirmado com sucesso!");
        onPaid();
      });
  }, [orderId, onPaid]);

  const start = async (provider: "stripe" | "paypal") => {
    setBusy(provider);
    const return_url = window.location.origin + window.location.pathname;
    const { data, error } = await supabase.functions.invoke(
      "create-card-payment",
      {
        body: { order_id: orderId, provider, return_url },
      },
    );

    if (error || !data?.url) {
      setBusy(null);
      return toast.error(
        await errMsg(error, "Não foi possível iniciar o pagamento."),
      );
    }
    window.location.href = data.url;
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        disabled={!!busy}
        onClick={() => start("stripe")}
        className="flex h-12 items-center justify-center gap-2.5 rounded-2xl border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-800 shadow-2xs transition hover:border-black hover:bg-neutral-50 disabled:opacity-50"
      >
        {busy === "stripe" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-neutral-700" />
            <span>Cartão de Crédito / Débito</span>
          </div>
        )}
      </button>

      <button
        type="button"
        disabled={!!busy}
        onClick={() => start("paypal")}
        className="flex h-12 items-center justify-center gap-2.5 rounded-2xl border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-800 shadow-2xs transition hover:border-[#0070BA] hover:bg-neutral-50 disabled:opacity-50"
      >
        {busy === "paypal" ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#0070BA]" />
        ) : (
          <div className="flex items-center gap-2">
            <img
              src="/media/payments/paypal.svg"
              alt="PayPal"
              className="h-4 w-auto object-contain"
            />
            <span>Pagar com PayPal</span>
          </div>
        )}
      </button>
    </div>
  );
}

export function PaymentPanel({
  orderId,
  total,
  currency,
  paymentStatus,
  submittedAt,
  info,
  onSubmitted,
}: Props) {
  const methods = [
    info.payment_express_number && {
      id: "express" as const,
      label: "Multicaixa Express",
      badge: "Recomendado",
    },
    info.payment_iban && {
      id: "iban" as const,
      label: "Transferência Bancária (IBAN)",
      badge: "Todos os Bancos",
    },
  ].filter(Boolean) as {
    id: "express" | "iban";
    label: string;
    badge: string;
  }[];

  const [method, setMethod] = useState<"express" | "iban">(
    methods[0]?.id ?? "express",
  );
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If already marked as paid
  if (paymentStatus === "paid") {
    return (
      <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/60 p-6 sm:p-7 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              Pagamento Confirmado
            </span>
            <h2 className="mt-1.5 text-lg font-bold text-neutral-900">
              Transação validada com sucesso
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              Muito obrigado! A loja já verificou o seu pagamento e a equipa está
              a embalar o seu pedido para expedição.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no manual bank transfer options configured, only show card payment
  if (methods.length === 0) {
    return (
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Pagamento</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Conclua o pagamento de {formatMoney(total, currency)} online.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400">Total a pagar</span>
            <p className="text-xl font-extrabold text-neutral-900">
              {formatMoney(total, currency)}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <CardPay orderId={orderId} onPaid={onSubmitted} />
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!file) {
      toast.error("Por favor, anexe o comprovativo da transferência.");
      return;
    }

    setSending(true);
    const fd = new FormData();
    fd.append("order_id", orderId);
    fd.append("method", method);
    fd.append("reference", reference);
    fd.append("file", file);

    const { error } = await supabase.functions.invoke("payment-proof", {
      body: fd,
    });
    setSending(false);

    if (error) {
      let msg = "Não foi possível enviar o comprovativo.";
      if (error instanceof FunctionsHttpError) {
        const b = await error.context.json().catch(() => null);
        if (b?.error) msg = b.error;
      }
      return toast.error(msg);
    }

    toast.success("Comprovativo enviado com sucesso!");
    setFile(null);
    setReference("");
    onSubmitted();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-xs">
      {/* HEADER ROW */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Pagamento Pendente
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-900">
            Dados para Pagamento
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Efetue o pagamento do valor exato e anexe o comprovativo abaixo.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 px-4 py-2.5 text-right border border-neutral-200/80">
          <span className="text-[11px] font-semibold text-neutral-400 block uppercase tracking-wider">
            Total a liquidar
          </span>
          <span className="text-2xl font-black tracking-tight text-neutral-900">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>

      {/* NOTICES: VERIFICATION STATUS */}
      {submittedAt && paymentStatus !== "failed" ? (
        <div className="mt-6 flex items-start gap-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 sm:p-5">
          <Clock3 className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">
              Comprovativo em verificação pela loja
            </p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Já recebemos o comprovativo deste pedido. A nossa equipa financeira
              está a validar o crédito. Pode anexar um novo documento se
              necessário.
            </p>
          </div>
        </div>
      ) : paymentStatus === "failed" ? (
        <div className="mt-6 flex items-start gap-3.5 rounded-2xl bg-red-50/80 border border-red-200/80 p-4 sm:p-5">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-red-900">Comprovativo não validado</p>
            <p className="mt-0.5 text-red-700 leading-relaxed">
              Não foi possível confirmar a transação com o documento anterior.
              Por favor, anexe uma foto nítida ou PDF oficial da sua operação.
            </p>
          </div>
        </div>
      ) : null}

      {/* METHOD SELECTION TABS */}
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
          Escolha a forma de pagamento
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {methods.map((m) => {
            const isSelected = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`relative flex items-center justify-between gap-3 rounded-2xl p-4 text-left transition border ${
                  isSelected
                    ? "border-neutral-900 bg-[#111216] text-white shadow-sm"
                    : "border-neutral-200 bg-neutral-50/60 hover:bg-neutral-100/80 text-neutral-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {m.id === "express" ? (
                    <div
                      className={`h-9 px-2 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-white" : "bg-white border border-neutral-200"
                      }`}
                    >
                      <MulticaixaExpressLogo className="h-4 w-auto max-w-[85px]" />
                    </div>
                  ) : (
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                        isSelected ? "bg-white/10 text-white" : "bg-white text-neutral-800 border border-neutral-200"
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}

                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isSelected ? "text-white" : "text-neutral-900"
                      }`}
                    >
                      {m.label}
                    </p>
                    <span
                      className={`text-[10px] font-semibold tracking-wide ${
                        isSelected ? "text-neutral-400" : "text-neutral-500"
                      }`}
                    >
                      {m.badge}
                    </span>
                  </div>
                </div>

                <div
                  className={`grid h-5 w-5 place-items-center rounded-full border ${
                    isSelected
                      ? "border-white bg-white text-black"
                      : "border-neutral-300 bg-transparent"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CREDENTIALS DETAILS BOX */}
      <div className="mt-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 p-4 sm:p-5 space-y-2.5">
        {method === "iban" ? (
          <>
            {info.payment_iban_holder && (
              <CopyRow
                label="Titular da Conta"
                value={info.payment_iban_holder}
                icon={User}
              />
            )}
            <CopyRow
              label="IBAN"
              value={info.payment_iban!}
              icon={Building2}
              helper="Copie para colar no seu banco"
            />
          </>
        ) : (
          <CopyRow
            label="Número Multicaixa Express"
            value={info.payment_express_number!}
            helper="Pagar no app Express"
          />
        )}

        <CopyRow
          label="Montante Exato"
          value={formatMoney(total, currency)}
          icon={Lock}
          helper="Liquidar valor integral"
        />

        <CopyRow
          label="Descritivo / Referência do Pedido"
          value={orderId.slice(0, 8).toUpperCase()}
          helper="Insira na descrição da transferência"
        />
      </div>

      {/* COMPROVATIVO UPLOAD ZONE */}
      <div className="mt-6">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2.5">
          Anexar Comprovativo de Pagamento
        </label>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
            file
              ? "border-emerald-500 bg-emerald-50/30"
              : "border-neutral-300 hover:border-black bg-neutral-50/50 hover:bg-neutral-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {file ? (
            <div className="flex items-center gap-3 w-full max-w-md mx-auto">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-bold text-neutral-900">
                  {file.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {(file.size / 1024).toFixed(0)} KB • Ficheiro pronto a enviar
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition"
                aria-label="Remover ficheiro"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white border border-neutral-200/80 text-neutral-600 shadow-2xs group-hover:scale-105 group-hover:border-black transition">
                <Upload className="h-5 w-5 text-neutral-700" />
              </div>
              <p className="mt-3 text-sm font-bold text-neutral-800">
                Clique para selecionar ou arraste o ficheiro
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Aceita imagem (JPEG, PNG, WebP) ou PDF até 5 MB
              </p>
            </>
          )}
        </div>

        {/* TRANSACTION REFERENCE INPUT */}
        <div className="mt-3">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            maxLength={120}
            placeholder="Nº de Operação ou Referência Bancária (opcional)"
            className="h-11 w-full rounded-xl border border-neutral-200/90 bg-neutral-50/50 px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:bg-white focus:outline-none transition shadow-2xs"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="button"
          onClick={submit}
          disabled={sending || !file}
          className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#111216] px-6 text-sm font-bold text-white shadow-md transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>A enviar comprovativo...</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              <span>Confirmar e Enviar Comprovativo</span>
            </>
          )}
        </button>
      </div>

      {/* OPTIONAL ONLINE CARD PAYMENT SECTION */}
      <div className="mt-8 border-t border-neutral-100 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Ou pagar online via Cartão / PayPal
        </p>
        <CardPay orderId={orderId} onPaid={onSubmitted} />
      </div>
    </div>
  );
}
