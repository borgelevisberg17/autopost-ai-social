import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
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

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <AuthShell
      eyebrow="RECUPERAR ACESSO"
      title="Volte a aceder à sua conta."
      description="Enviaremos um hiperligação para redefinir a sua palavra-passe com segurança."
      footer={
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6e716b] hover:text-[#202522] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>
      }
      compact
    >
      {!sent ? (
        <div>
          <div className="mb-7">
            <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#202522] sm:text-[36px]">
              Recuperar palavra-passe
            </h1>

            <p className="mt-2.5 text-[14px] text-[#6e716b]">
              Introduza o seu email registado para receber as instruções.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-medium text-[#202522]"
              >
                Email profissional
              </label>

              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8a80]"
                  strokeWidth={1.8}
                />

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
                  className="h-12 w-full rounded-lg border border-[#e2ded5] bg-[#fffdf9] pl-10 pr-4 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#a09b90] hover:border-[#c8c1b4] focus:border-[#202522] focus:ring-1 focus:ring-[#202522] disabled:cursor-not-allowed disabled:bg-[#f6f3ed]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#202522] text-[14px] font-semibold text-white transition-all hover:bg-[#2c6457] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "A enviar..." : "Enviar instruções"}
              {!isLoading && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6e716b] hover:text-[#202522] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Regressar ao login
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-left">
          <div className="mb-6 grid h-11 w-11 place-items-center rounded-full bg-[#d9e7de] text-[#2c6457]">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
          </div>

          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#202522] sm:text-[36px]">
            Email enviado
          </h1>

          <p className="mt-3 text-[14px] leading-6 text-[#6e716b]">
            Enviámos as instruções de recuperação para o email:
          </p>

          <div className="mt-4 rounded-lg border border-[#e2ded5] bg-[#f6f3ed] p-3.5 font-mono text-xs text-[#202522]">
            {email}
          </div>

          <Link
            to="/login"
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#c8c1b4] text-[14px] font-semibold text-[#202522] transition-colors hover:bg-[#202522] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
