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
        <div className="flex items-center gap-1.5 text-xs text-[#6e716b]">
          <span>Já tem conta?</span>
          <Link
            to="/login"
            className="font-semibold text-[#202522] underline decoration-[#d8d3c8] underline-offset-4 transition-colors hover:decoration-[#202522]"
          >
            Entrar
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-serif text-[34px] font-medium leading-none tracking-[-0.045em] text-[#202522] sm:text-[38px]">
            Criar conta
          </h1>
          {selectedPlan && (
            <span className="border border-[#d8d3c8] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6e716b]">
              {selectedPlan} · {billing === "annual" ? "Anual" : "Mensal"}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs font-medium text-[#202522]"
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
            className="h-12 w-full border border-[#d8d3c8] bg-transparent px-3.5 text-sm text-[#202522] outline-none transition-colors placeholder:text-[#a09b90] hover:border-[#aaa397] focus:border-[#2c6457] focus:ring-2 focus:ring-[#2c6457]/10 disabled:cursor-not-allowed disabled:bg-[#f6f3ed]"
          />
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

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium text-[#202522]"
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
              className="h-12 w-full border border-[#d8d3c8] bg-transparent px-3.5 pr-11 text-sm text-[#202522] outline-none transition-colors placeholder:text-[#a09b90] hover:border-[#aaa397] focus:border-[#2c6457] focus:ring-2 focus:ring-[#2c6457]/10 disabled:cursor-not-allowed disabled:bg-[#f6f3ed]"
            />
            <button
              type="button"
              aria-label={
                showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
              }
              onClick={() => setShowPassword((value) => !value)}
              disabled={isLoading}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[#8f8a80] transition-colors hover:text-[#202522] disabled:opacity-50"
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
          className="mt-2 flex h-12 w-full items-center justify-center bg-[#202522] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2c6457] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "A criar conta…" : "Continuar"}
        </button>

        <p className="pt-1 text-center text-[11px] leading-5 text-[#8f8a80]">
          Ao criar conta, concorda com os Termos de Serviço e a Política de
          Privacidade.
        </p>
      </form>
    </AuthShell>
  );
}
