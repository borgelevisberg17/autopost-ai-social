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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6e716b] transition-colors hover:text-[#202522]"
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
            <h1 className="font-serif text-[34px] font-medium leading-none tracking-[-0.045em] text-[#202522] sm:text-[38px]">
              Recuperar acesso
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6e716b]">
              Enviaremos um link para o email da sua conta.
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-[#202522]"
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
              className="h-12 w-full border border-[#d8d3c8] bg-transparent px-3.5 text-sm text-[#202522] outline-none transition-colors placeholder:text-[#a09b90] hover:border-[#aaa397] focus:border-[#2c6457] focus:ring-2 focus:ring-[#2c6457]/10 disabled:cursor-not-allowed disabled:bg-[#f6f3ed]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-12 w-full items-center justify-center bg-[#202522] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2c6457] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "A enviar…" : "Enviar link"}
          </button>
        </form>
      ) : (
        <div>
          <div className="mb-6 grid h-10 w-10 place-items-center bg-[#d9e7de] text-[#2c6457]">
            <CheckCircle2
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </div>
          <h1 className="font-serif text-[34px] font-medium leading-none tracking-[-0.045em] text-[#202522] sm:text-[38px]">
            Verifique o seu email
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6e716b]">
            Enviámos um link para:
          </p>
          <p className="mt-3 break-all border border-[#e2ded5] bg-[#f6f3ed] px-3.5 py-3 font-mono text-xs text-[#202522]">
            {email}
          </p>
          <Link
            to="/login"
            className="mt-7 flex h-12 w-full items-center justify-center border border-[#c8c1b4] px-4 text-sm font-semibold text-[#202522] transition-colors hover:bg-[#202522] hover:text-white"
          >
            Voltar ao login
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
