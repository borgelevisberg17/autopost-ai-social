import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) return;

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <AuthShell
      footer={
        !sent && (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Voltar ao login
          </Link>
        )
      }
      compact
    >
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Recuperar acesso
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enviaremos um link para o email da sua conta.
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nome@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              required
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "A enviar…" : "Enviar link"}
          </button>
        </form>
      ) : (
        <div>
          <div className="mb-6 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
            <CheckCircle2
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Verifique o seu email
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enviámos um link para:
          </p>
          <p className="mt-3 break-all rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs text-slate-800">
            {email}
          </p>
          <Link
            to="/login"
            className="mt-7 flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            Voltar ao login
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
