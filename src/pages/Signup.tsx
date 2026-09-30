import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const billing = searchParams.get("billing");

  useEffect(() => {
    if (user) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || password.length < 8) return;

    setIsLoading(true);

    const { error } = await signUp(email.trim(), password, name.trim());

    if (!error) {
      navigate("/onboarding", { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <AuthShell
      eyebrow="CRIAR CONTA DE OPERAÇÃO"
      title="Inicie a sua operação em minutos."
      description="Crie a sua conta e configure a sua empresa, catálogo e canais ao seu próprio ritmo."
      footer={
        <div className="flex items-center gap-2 text-xs text-[#6e716b]">
          <span>Já tem uma conta?</span>
          <Link
            to="/login"
            className="font-semibold text-[#202522] underline decoration-[#d8d3c8] underline-offset-4 transition-colors hover:decoration-[#202522]"
          >
            Entrar
          </Link>
        </div>
      }
    >
      <div>
        {/* Form Title */}
        <div className="mb-7">
          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#202522] sm:text-[36px]">
            Criar nova conta
          </h1>

          <p className="mt-2.5 text-[14px] text-[#6e716b]">
            Comece gratuitamente sem cartão de crédito.
          </p>

          {selectedPlan && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-[#e6d4aa] bg-[#fbf3dd] px-3.5 py-2.5 text-xs text-[#8b6b36]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e36c3f]" />
              <div>
                Plano <strong className="capitalize">{selectedPlan}</strong> selecionado
                {billing === "annual" ? " (anual)" : " (mensal)"}.
              </div>
            </div>
          )}
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[13px] font-medium text-[#202522]"
            >
              Nome completo
            </label>

            <div className="relative">
              <UserRound
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8a80]"
                strokeWidth={1.8}
              />

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
                className="h-12 w-full rounded-lg border border-[#e2ded5] bg-[#fffdf9] pl-10 pr-4 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#a09b90] hover:border-[#c8c1b4] focus:border-[#202522] focus:ring-1 focus:ring-[#202522] disabled:cursor-not-allowed disabled:bg-[#f6f3ed]"
              />
            </div>
          </div>

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

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-medium text-[#202522]"
            >
              Palavra-passe
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
                className="h-12 w-full rounded-lg border border-[#e2ded5] bg-[#fffdf9] pl-10 pr-11 text-[14px] text-[#202522] outline-none transition-all placeholder:text-[#a09b90] hover:border-[#c8c1b4] focus:border-[#202522] focus:ring-1 focus:ring-[#202522] disabled:cursor-not-allowed disabled:bg-[#f6f3ed]"
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Ocultar palavra-passe"
                    : "Mostrar palavra-passe"
                }
                onClick={() => setShowPassword((value) => !value)}
                disabled={isLoading}
                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[#8f8a80] hover:text-[#202522] transition-colors disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.8} />
                )}
              </button>
            </div>

            {/* Password check helper */}
            <div className="mt-2.5 flex items-center gap-4 text-xs">
              <span
                className={`flex items-center gap-1 transition-colors ${
                  password.length >= 8 ? "text-[#2c6457] font-medium" : "text-[#a09b90]"
                }`}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                8+ caracteres
              </span>

              <span
                className={`flex items-center gap-1 transition-colors ${
                  password.length > 0 && /[A-Za-z]/.test(password) && /\d/.test(password)
                    ? "text-[#2c6457] font-medium"
                    : "text-[#a09b90]"
                }`}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                Letras e números
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#202522] text-[14px] font-semibold text-white transition-all hover:bg-[#2c6457] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "A criar conta..." : "Criar conta gratuita"}
            {!isLoading && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
          </button>

          <p className="pt-2 text-center text-[11px] leading-5 text-[#8f8a80]">
            Ao criar uma conta, concorda com os Termos de Serviço e a Política de Privacidade.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
