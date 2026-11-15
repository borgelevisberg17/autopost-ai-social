import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/dashboard";

  useEffect(() => {
    if (user) {
      void supabase.rpc("has_platform_admin", { _user: user.id }).then(({ data }) => navigate(from === "/dashboard" && data === true ? "/plataforma" : from, { replace: true }));
    }
  }, [user, navigate, from]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) return;

    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);

    if (!error) {
      const { data: { user: signedIn } } = await supabase.auth.getUser();
      const { data: admin } = signedIn ? await supabase.rpc("has_platform_admin", { _user: signedIn.id }) : { data: false };
      navigate(from === "/dashboard" && admin === true ? "/plataforma" : from, { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <AuthShell
      footer={
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Sem conta?</span>
          <Link
            to="/signup"
            className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-900"
          >
            Criar conta
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <h1 className="mb-7 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Aceder à conta
        </h1>

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

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-slate-700"
            >
              Palavra-passe
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-slate-500 transition-colors hover:text-slate-900"
            >
              Esqueceu-se?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Palavra-passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 shadow-2xs"
            />
            <button
              type="button"
              aria-label={
                showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
              }
              onClick={() => setShowPassword((value) => !value)}
              disabled={isLoading}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
