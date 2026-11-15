import { FormEvent, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const redirectingToOnboarding = useRef(false);

  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const billing = searchParams.get("billing");

  useEffect(() => {
    if (
      user &&
      !authLoading &&
      !isLoading &&
      !redirectingToOnboarding.current
    ) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, isLoading, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || password.length < 8) return;

    setIsLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());

    if (!error) {
      redirectingToOnboarding.current = true;
      navigate("/onboarding", { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <AuthShell
      footer={
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Já tem conta?</span>
          <Link
            to="/login"
            className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-900"
          >
            Entrar
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Criar conta
          </h1>
          {selectedPlan && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
              {selectedPlan} · {billing === "annual" ? "Anual" : "Mensal"}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Nome completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="O seu nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isLoading}
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 shadow-2xs"
          />
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

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Palavra-passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo: 8 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
              minLength={8}
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
          {isLoading ? "A criar conta…" : "Continuar"}
        </button>

        <p className="pt-1 text-center text-xs leading-5 text-slate-400">
          Ao criar conta, concorda com os{" "}
          <Link to="/terms" className="font-semibold text-emerald-600 hover:underline">
            Termos de Serviço
          </Link>{" "}
          e a{" "}
          <Link to="/policy" className="font-semibold text-emerald-600 hover:underline">
            Política de Privacidade
          </Link>.
        </p>
      </form>
    </AuthShell>
  );
}
