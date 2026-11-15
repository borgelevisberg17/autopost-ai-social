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
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="text-sm font-semibold text-slate-900">
            A verificar ligação...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Link inválido ou expirado?
          </p>
          <Link
            to="/forgot-password"
            className="mt-5 text-xs font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
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
          <div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Palavra-passe atualizada
          </h1>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
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
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          Cancelar
        </Link>
      }
      compact
    >
      <div>
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Redefinir palavra-passe
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
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
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 shadow-2xs"
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Ocultar palavra-passe"
                    : "Mostrar palavra-passe"
                }
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-slate-400 hover:text-slate-700"
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
              className="mb-1.5 block text-xs font-semibold text-slate-700"
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
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 shadow-2xs"
              />

              <button
                type="button"
                aria-label={
                  showConfirmation
                    ? "Ocultar confirmação"
                    : "Mostrar confirmação"
                }
                onClick={() => setShowConfirmation((value) => !value)}
                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-slate-400 hover:text-slate-700"
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
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "A guardar…" : "Guardar"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
