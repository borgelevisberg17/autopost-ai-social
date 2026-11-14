import { useEffect, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  CreditCard,
  FileCheck,
  FileText,
  Hash,
  Loader2,
  Lock,
  MessageCircle,
  RefreshCw,
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
  whatsappNumber?: string | null;
  storeName?: string;
};

function formatOrderDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function CopyRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
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
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 sm:p-4 border border-[#e9e9eb] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-neutral-300">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
          {Icon && <Icon className="h-3.5 w-3.5 text-neutral-400" />}
          <span>{label}</span>
        </div>
        <p className="mt-1 break-all font-mono text-sm sm:text-base font-bold tracking-tight text-[#101114]">
          {value}
        </p>
      </div>

      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar ${label}`}
        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition ${
          copied
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-black hover:bg-neutral-100 hover:text-black"
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
        className="flex h-12 items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-800 shadow-2xs transition hover:border-black hover:bg-neutral-50/60 disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {busy === "stripe" ? (
            <Loader2 className="h-4 w-4 animate-spin text-neutral-800" />
          ) : (
            <CreditCard className="h-4 w-4 text-neutral-600" />
          )}
          <span>Cartão de Crédito / Débito</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src="/media/payments/visa.svg"
            alt="Visa"
            className="h-3 w-auto object-contain"
          />
          <img
            src="/media/payments/mastercard.svg"
            alt="Mastercard"
            className="h-3.5 w-auto object-contain"
          />
        </div>
      </button>

      <button
        type="button"
        disabled={!!busy}
        onClick={() => start("paypal")}
        className="flex h-12 items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-800 shadow-2xs transition hover:border-[#0070BA] hover:bg-neutral-50/60 disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {busy === "paypal" ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#0070BA]" />
          ) : (
            <span className="font-semibold text-neutral-600">Pagar com</span>
          )}
          <img
            src="/media/payments/paypal.svg"
            alt="PayPal"
            className="h-3.5 w-auto object-contain"
          />
        </div>

        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          Instantâneo
        </span>
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
  whatsappNumber,
  storeName = "Loja",
}: Props) {
  const methods = [
    info.payment_express_number && {
      id: "express" as const,
      label: "Multicaixa Express",
    },
    info.payment_iban && {
      id: "iban" as const,
      label: "Transferência IBAN",
    },
  ].filter(Boolean) as {
    id: "express" | "iban";
    label: string;
  }[];

  const [method, setMethod] = useState<"express" | "iban">(
    methods[0]?.id ?? "express",
  );
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);
  const [showReupload, setShowReupload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanWhatsapp = whatsappNumber?.replace(/\D/g, "") || "";
  const whatsappNotifyUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
        `Olá! Já fiz o pagamento e enviei o comprovativo do meu pedido #${orderId.slice(0, 8).toUpperCase()} no valor de ${formatMoney(total, currency)}. Podem conferir, por favor?`,
      )}`
    : null;

  // 1. STATE: PAYMENT CONFIRMED (PAID)
  if (paymentStatus === "paid") {
    return (
      <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/60 p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Pagamento Confirmado
            </span>
            <h2 className="mt-2 text-xl font-bold text-[#101114]">
              Transação validada com sucesso
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              Muito obrigado! O pagamento foi validado pela loja e o seu pedido
              encontra-se em preparação imediata.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!file) {
      toast.error("Por favor, selecione primeiro o ficheiro do comprovativo.");
      fileInputRef.current?.click();
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
    setShowReupload(false);
    onSubmitted();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // 2. STATE: PROOF SUBMITTED AND AWAITING STORE VERIFICATION (ESTADO DE ESPERA)
  if (submittedAt && paymentStatus !== "failed") {
    return (
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        {/* HERO BADGE & TITLE */}
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-sm">
            <Clock3 className="h-6 w-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Comprovativo em Análise
              </span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-[#101114]">
              Pagamento em Conferência
            </h2>
            <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
              Recebemos o seu comprovativo com sucesso! A equipa da {storeName} está
              a conferir a transação bancária para aprovar o seu pedido.
            </p>
          </div>
        </div>

        {/* VERIFICATION DETAILS CARD */}
        <div className="rounded-2xl bg-[#fafafa] border border-[#e9e9eb] p-4 sm:p-5 space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-medium">Montante do Pedido</span>
            <span className="font-extrabold text-[#101114] text-base">
              {formatMoney(total, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-medium">Estado do Comprovativo</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Em validação financeira
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-[#e9e9eb] pt-2.5">
            <span className="text-neutral-500 font-medium">Data do Envio</span>
            <span className="font-medium text-neutral-800">
              {formatOrderDate(submittedAt)}
            </span>
          </div>
        </div>

        {/* WHATSAPP NOTIFICATION CTA */}
        {whatsappNotifyUrl && (
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  Quer acelerar a confirmação?
                </p>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Avise a loja no WhatsApp para que o operador confira o comprovativo de imediato.
                </p>
              </div>
            </div>

            <a
              href={whatsappNotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-[0.99]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Avisar Loja no WhatsApp</span>
            </a>
          </div>
        )}

        {/* COLLAPSIBLE RE-UPLOAD IF NEEDED */}
        <div className="border-t border-[#e9e9eb] pt-4">
          {!showReupload ? (
            <button
              type="button"
              onClick={() => setShowReupload(true)}
              className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-[#101114] transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Enviou o ficheiro errado? Clique para reenviar outro comprovativo</span>
            </button>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Substituir Comprovativo
                </p>
                <button
                  type="button"
                  onClick={() => setShowReupload(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-700 font-semibold"
                >
                  Cancelar
                </button>
              </div>

              {/* UPLOAD DROPZONE */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center cursor-pointer transition ${
                  file
                    ? "border-emerald-500 bg-emerald-50/40"
                    : "border-neutral-300 hover:border-black bg-[#fafafa] hover:bg-neutral-50"
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
                  <div className="flex items-center gap-3.5 w-full max-w-md mx-auto">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-2xs">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-bold text-neutral-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-neutral-500 font-medium">
                        {(file.size / 1024).toFixed(0)} KB • Novo ficheiro pronto
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition"
                      aria-label="Remover ficheiro"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-white border border-neutral-200/80 text-neutral-700 shadow-xs group-hover:scale-105 group-hover:border-black transition">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-neutral-900">
                      Clique para selecionar o novo comprovativo
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      Substituirá o documento enviado anteriormente
                    </p>
                  </>
                )}
              </div>

              {/* OPTIONAL REFERENCE */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                  <Hash className="h-4 w-4" />
                </div>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  maxLength={120}
                  placeholder="Nº de Operação ou Referência Bancária (opcional)"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-[#fafafa] pl-10 pr-4 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:bg-white focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* RE-SUBMIT BUTTON */}
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#101114] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-black active:scale-[0.99] cursor-pointer"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>A reenviar...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Reenviar Novo Comprovativo</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. STATE: INITIAL UNPAID / PROOF FAILED (Awaiting initial transfer or retry)
  return (
    <div className="rounded-3xl border border-[#e9e9eb] bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
      {/* HEADER */}
      <div className="border-b border-[#e9e9eb] pb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Aguardando Pagamento
          </span>
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#101114]">
          Instruções de Pagamento
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Efetue o pagamento através de Multicaixa Express ou transferência bancária e envie o comprovativo.
        </p>
      </div>

      {/* FAILURE NOTICE IF PREVIOUS ATTEMPT FAILED */}
      {paymentStatus === "failed" && (
        <div className="flex items-start gap-3.5 rounded-2xl bg-red-50/80 border border-red-200/80 p-4 sm:p-5">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-red-900">Comprovativo não validado</p>
            <p className="mt-0.5 text-red-700 leading-relaxed text-xs">
              Não foi possível confirmar a transação com o documento anterior.
              Por favor, anexe uma foto nítida ou PDF oficial.
            </p>
          </div>
        </div>
      )}

      {/* SEGMENTED METHOD SELECTION TABS */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
          Método de Transferência
        </p>

        <div className="flex rounded-2xl bg-neutral-100 p-1.5 gap-1.5">
          {methods.map((m) => {
            const isSelected = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                  isSelected
                    ? "bg-white text-[#101114] shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {m.id === "express" ? (
                  <MulticaixaExpressLogo className="h-3.5 w-auto max-w-[75px]" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CREDENTIALS DETAILS ROWS */}
      <div className="rounded-2xl bg-[#fafafa] border border-[#e9e9eb] p-4 sm:p-5 space-y-3">
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
            />
          </>
        ) : (
          <CopyRow
            label="Número Multicaixa Express"
            value={info.payment_express_number!}
          />
        )}

        <CopyRow
          label="Montante Exato"
          value={formatMoney(total, currency)}
          icon={Lock}
        />

        <CopyRow
          label="Referência do Pedido"
          value={orderId.slice(0, 8).toUpperCase()}
          icon={Hash}
        />
      </div>

      {/* COMPROVATIVO UPLOAD ZONE */}
      <div className="border-t border-[#e9e9eb] pt-6 space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Comprovativo de Pagamento
          </label>
          <span className="text-[11px] font-medium text-neutral-400">
            Imagem ou PDF até 5 MB
          </span>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center cursor-pointer transition ${
            file
              ? "border-emerald-500 bg-emerald-50/40"
              : "border-neutral-300 hover:border-black bg-[#fafafa] hover:bg-neutral-50"
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
            <div className="flex items-center gap-3.5 w-full max-w-md mx-auto">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-2xs">
                <FileCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-bold text-neutral-900">
                  {file.name}
                </p>
                <p className="text-xs text-neutral-500 font-medium">
                  {(file.size / 1024).toFixed(0)} KB • Ficheiro pronto
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition"
                aria-label="Remover ficheiro"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white border border-neutral-200/80 text-neutral-700 shadow-xs group-hover:scale-105 group-hover:border-black transition">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-neutral-900">
                Clique para selecionar ou arraste o ficheiro
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Formatos aceites: JPG, PNG, WebP ou PDF
              </p>
            </>
          )}
        </div>

        {/* TRANSACTION REFERENCE INPUT */}
        <div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
              <Hash className="h-4 w-4" />
            </div>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={120}
              placeholder="Nº de Operação ou Referência Bancária (opcional)"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-[#fafafa] pl-10 pr-4 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#101114] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-black active:scale-[0.99] cursor-pointer"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>A enviar comprovativo...</span>
            </>
          ) : file ? (
            <>
              <FileCheck className="h-4 w-4 text-emerald-400" />
              <span>Confirmar e Enviar Comprovativo</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Selecionar Comprovativo para Enviar</span>
            </>
          )}
        </button>
      </div>

      {/* OPTIONAL ONLINE CARD PAYMENT SECTION */}
      <div className="border-t border-[#e9e9eb] pt-6">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Ou pagar online de imediato
          </span>
          <span className="h-px flex-1 bg-neutral-100" />
        </div>
        <CardPay orderId={orderId} onPaid={onSubmitted} />
      </div>
    </div>
  );
}
