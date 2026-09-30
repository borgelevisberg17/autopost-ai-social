import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
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

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || session) {
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
    password.length > 0 && confirmation.length > 0 && password === confirmation;

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
      <AuthShell compact>
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#e2ded5] border-t-[#202522]" />
          <p className="text-[14px] font-medium text-[#202522]">
            A verificar ligação...
          </p>
          <p className="mt-1 text-xs text-[#8f8a80]">
            Link inválido ou expirado?
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
      <AuthShell compact>
        <div>
          <div className="mb-6 grid h-11 w-11 place-items-center rounded-full bg-[#d9e7de] text-[#2c6457]">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
          </div>

          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#202522] sm:text-[36px]">
            Palavra-passe atualizada
          </h1>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#202522] text-[14px] font-semibold text-white transition-colors hover:bg-[#2c6457]"
          >
            Entrar
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
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
            Redefinir palavra-passe
          </h1>
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
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Pelo menos 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                required
                minLength={8}
                className="h-12 w-full border border-[#d8d3c8] bg-transparent pl-3.5 pr-11 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#a09b90] hover:border-[#c8c1b4] focus:border-[#202522] focus:ring-1 focus:ring-[#202522]"
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
                className="h-12 w-full border border-[#d8d3c8] bg-transparent pl-3.5 pr-11 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#a09b90] hover:border-[#c8c1b4] focus:border-[#202522] focus:ring-1 focus:ring-[#202522]"
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

          <button
            type="submit"
            disabled={isLoading || !password || !confirmation}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#202522] text-[14px] font-semibold text-white transition-all hover:bg-[#2c6457] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "A guardar…" : "Guardar"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
