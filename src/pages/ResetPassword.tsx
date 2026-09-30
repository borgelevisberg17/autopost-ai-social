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
        title="Validar ligação de acesso."
        description="Por favor aguarde enquanto verificamos o seu link de recuperação."
        compact
      >
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#e2ded5] border-t-[#202522]" />
          <p className="text-[14px] font-medium text-[#202522]">
            A verificar ligação...
          </p>
          <p className="mt-1 text-xs text-[#8f8a80]">
            Se abriu esta página diretamente, solicite um novo link de recuperação.
          </p>
          <Link
            to="/forgot-password"
            className="mt-5 text-xs font-semibold text-[#202522] underline decoration-[#d8d3c8] underline-offset-4"
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
        eyebrow="PALAVRA-PASSE ATUALIZADA"
        title="Conta novamente protegida."
        description="A sua palavra-passe foi redefinida com sucesso."
        compact
      >
        <div>
          <div className="mb-6 grid h-11 w-11 place-items-center rounded-full bg-[#d9e7de] text-[#2c6457]">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
          </div>

          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#202522] sm:text-[36px]">
            Palavra-passe atualizada
          </h1>

          <p className="mt-3 text-[14px] leading-6 text-[#6e716b]">
            Já pode aceder à sua conta com a nova palavra-passe.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#202522] text-[14px] font-semibold text-white transition-colors hover:bg-[#2c6457]"
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
      eyebrow="NOVA PALAVRA-PASSE"
      title="Defina uma nova palavra-passe."
      description="Escolha uma palavra-passe segura para proteger a sua conta e os dados da sua empresa."
      footer={
        <Link
          to="/login"
          className="text-xs font-medium text-[#6e716b] hover:text-[#202522] transition-colors"
        >
          Cancelar
        </Link>
      }
      compact
    >
      <div>
        <div className="mb-7">
          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#202522] sm:text-[36px]">
            Nova palavra-passe
          </h1>

          <p className="mt-2.5 text-[14px] text-[#6e716b]">
            Introduza e confirme a sua nova palavra-passe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-medium text-[#202522]"
            >
              Nova palavra-passe
            </label>

            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8a80]"
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
                className="h-12 w-full rounded-lg border border-[#e2ded5] bg-[#fffdf9] pl-10 pr-11 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#a09b90] hover:border-[#c8c1b4] focus:border-[#202522] focus:ring-1 focus:ring-[#202522]"
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Ocultar palavra-passe"
                    : "Mostrar palavra-passe"
                }
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[#8f8a80] hover:text-[#202522]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmation"
              className="mb-1.5 block text-[13px] font-medium text-[#202522]"
            >
              Confirmar palavra-passe
            </label>

            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8a80]"
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
                className="h-12 w-full rounded-lg border border-[#e2ded5] bg-[#fffdf9] pl-10 pr-11 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#a09b90] hover:border-[#c8c1b4] focus:border-[#202522] focus:ring-1 focus:ring-[#202522]"
              />

              <button
                type="button"
                aria-label={
                  showConfirmation
                    ? "Ocultar confirmação"
                    : "Mostrar confirmação"
                }
                onClick={() => setShowConfirmation((value) => !value)}
                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[#8f8a80] hover:text-[#202522]"
              >
                {showConfirmation ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 rounded-lg border border-[#e2ded5] bg-[#f6f3ed] p-3 text-xs">
            <div
              className={`flex items-center gap-1.5 ${
                passwordHasLength ? "text-[#2c6457] font-medium" : "text-[#8f8a80]"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Pelo menos 8 caracteres
            </div>

            <div
              className={`flex items-center gap-1.5 ${
                passwordsMatch ? "text-[#2c6457] font-medium" : "text-[#8f8a80]"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              As palavras-passe coincidem
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwordHasLength || !passwordsMatch}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#202522] text-[14px] font-semibold text-white transition-all hover:bg-[#2c6457] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "A redefinir..." : "Redefinir palavra-passe"}
            {!isLoading && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
