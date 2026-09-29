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
      title="Volte para a sua operação."
      description="Enviaremos um link para o email associado à sua conta para criar uma nova palavra-passe."
      footer={
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm font-medium text-[#666666] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      }
      compact
    >
      {!sent ? (
        <div>
          <div className="mb-9">
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#999999]">
              Recuperação
            </p>

            <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#111111] sm:text-[40px]">
              Esqueceu a palavra-passe?
            </h1>

            <p className="mt-3 text-[15px] leading-6 text-[#707070]">
              Introduza o seu email e enviaremos as instruções para recuperar
              o acesso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[13px] font-medium text-[#333333]"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#999999]"
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
                  className="h-[52px] w-full rounded-[10px] border border-[#ddddda] bg-white pl-11 pr-4 text-[14px] text-[#111111] outline-none transition-all placeholder:text-[#aaaaaa] hover:border-[#c8c8c4] focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/8 disabled:cursor-not-allowed disabled:bg-[#f7f7f5]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#111111] text-[14px] font-semibold text-white transition-all hover:bg-[#252525] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "A enviar..." : "Enviar instruções"}

              {!isLoading && (
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.8}
                />
              )}
            </button>
          </form>

          <div className="mt-7 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#666666] transition-colors hover:text-[#111111]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para entrar
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-8 grid h-12 w-12 place-items-center rounded-full bg-[#f2f2ef]">
            <CheckCircle2
              className="h-6 w-6 text-[#111111]"
              strokeWidth={1.7}
            />
          </div>

          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#999999]">
            Pedido enviado
          </p>

          <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#111111] sm:text-[40px]">
            Verifique o seu email.
          </h1>

          <p className="mt-4 text-[15px] leading-6 text-[#707070]">
            Se existir uma conta associada a este endereço, receberá as
            instruções para redefinir a sua palavra-passe.
          </p>

          <div className="mt-7 rounded-[10px] border border-[#e8e8e5] bg-[#fafaf8] px-4 py-3 text-[13px] text-[#555555]">
            <span className="font-medium text-[#222222]">{email}</span>
          </div>

          <Link
            to="/login"
            className="mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#ddddda] text-[14px] font-semibold text-[#111111] transition-colors hover:bg-[#f7f7f5]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para entrar
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
