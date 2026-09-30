import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [ready, setReady] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setReady(Boolean(session));
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        session
      ) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const passwordHasLength = password.length >= 8;
  const passwordsMatch =
    password.length > 0 &&
    confirmation.length > 0 &&
    password === confirmation;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passwordHasLength) {
      toast.error("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("As palavras-passe não coincidem.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setUpdated(true);
  };

  if (!ready && !updated) {
    return (
      <AuthShell
        eyebrow="RECUPERAÇÃO"
        title="Estamos a verificar o acesso."
        description="Aguarde enquanto validamos o link de recuperação da sua conta."
        compact
      >
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-5 h-9 w-9 animate-spin rounded-full border-2 border-[#ddddda] border-t-[#111111]" />

          <p className="text-[14px] font-medium text-[#333333]">
            A verificar...
          </p>

          <p className="mt-2 text-[12px] text-[#999999]">
            Se abriu esta página diretamente, solicite um novo link de
            recuperação.
          </p>

          <Link
            to="/forgot-password"
            className="mt-6 text-[13px] font-medium text-[#202522] underline decoration-[#cccccc] underline-offset-4"
          >
            Solicitar novo link
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (updated) {
    return (
      <AuthShell
        eyebrow="CONTA ATUALIZADA"
        title="O acesso está novamente protegido."
        description="A sua nova palavra-passe foi guardada com sucesso."
        compact
      >
        <div>
          <div className="mb-8 grid h-12 w-12 place-items-center rounded-full bg-[#f2f2ef]">
            <CheckCircle2
              className="h-6 w-6 text-[#202522]"
              strokeWidth={1.7}
            />
          </div>

          <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#202522] sm:text-[40px]">
            Palavra-passe atualizada.
          </h1>

          <p className="mt-4 text-[15px] leading-6 text-[#707070]">
            Já pode entrar novamente na sua conta com a nova palavra-passe.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-8 flex h-[52px] w-full items-center justify-center gap-2 rounded-[7px] bg-[#202522] text-[14px] font-semibold text-white transition-colors hover:bg-[#2c6457]"
          >
            Entrar na conta
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="SEGURANÇA DA CONTA"
      title="Defina uma nova palavra-passe."
      description="Escolha uma palavra-passe que seja difícil de adivinhar e fácil de reconhecer para si."
      footer={
        <Link
          to="/login"
          className="text-sm font-medium text-[#666666] transition-colors hover:text-[#202522]"
        >
          Cancelar
        </Link>
      }
      compact
    >
      <div>
        <div className="mb-9">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#999999]">
            Nova palavra-passe
          </p>

          <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#202522] sm:text-[40px]">
            Proteja novamente a sua conta.
          </h1>

          <p className="mt-3 text-[15px] leading-6 text-[#707070]">
            Defina a nova palavra-passe abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-[13px] font-medium text-[#333333]"
            >
              Nova palavra-passe
            </label>

            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#999999]"
                strokeWidth={1.8}
              />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                required
                minLength={8}
                className="h-[52px] w-full rounded-[7px] border border-[#ddddda] bg-[#fffdf9] pl-11 pr-12 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#aaaaaa] hover:border-[#c8c8c4] focus:border-[#2c6457] focus:ring-2 focus:ring-[#2c6457]/10"
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Ocultar palavra-passe"
                    : "Mostrar palavra-passe"
                }
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[7px] text-[#888888] hover:bg-[#f5f5f3] hover:text-[#202522]"
              >
                {showPassword ? (
                  <EyeOff className="h-[17px] w-[17px]" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-[17px] w-[17px]" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmation"
              className="mb-2 block text-[13px] font-medium text-[#333333]"
            >
              Confirmar palavra-passe
            </label>

            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#999999]"
                strokeWidth={1.8}
              />

              <input
                id="confirmation"
                name="confirmation"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repita a palavra-passe"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={isLoading}
                required
                className="h-[52px] w-full rounded-[7px] border border-[#ddddda] bg-[#fffdf9] pl-11 pr-12 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#aaaaaa] hover:border-[#c8c8c4] focus:border-[#2c6457] focus:ring-2 focus:ring-[#2c6457]/10"
              />

              <button
                type="button"
                aria-label={
                  showConfirmation
                    ? "Ocultar confirmação"
                    : "Mostrar confirmação"
                }
                onClick={() => setShowConfirmation((value) => !value)}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[7px] text-[#888888] hover:bg-[#f5f5f3] hover:text-[#202522]"
              >
                {showConfirmation ? (
                  <EyeOff className="h-[17px] w-[17px]" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-[17px] w-[17px]" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2 rounded-[7px] border border-[#eeeeeb] bg-[#fafaf8] px-4 py-3">
            <div
              className={`flex items-center gap-2 text-[12px] ${
                passwordHasLength ? "text-[#333333]" : "text-[#999999]"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Pelo menos 8 caracteres
            </div>

            <div
              className={`flex items-center gap-2 text-[12px] ${
                passwordsMatch ? "text-[#333333]" : "text-[#999999]"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              As palavras-passe coincidem
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwordHasLength || !passwordsMatch}
            className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-[7px] bg-[#202522] text-[14px] font-semibold text-white transition-all hover:bg-[#2c6457] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "A atualizar..." : "Atualizar palavra-passe"}

            {!isLoading && (
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.8}
              />
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
