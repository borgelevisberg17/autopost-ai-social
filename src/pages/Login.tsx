import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";

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
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) return;

    setIsLoading(true);

    const { error } = await signIn(email.trim(), password);

    if (!error) {
      navigate(from, { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <AuthShell
      eyebrow="ACESSO À CONTA"
      title="Continue a gerir a sua operação."
      description="Aceda ao seu painel para gerir catálogo, encomendas, vendas e automação."
      footer={
        <div className="flex items-center gap-2 text-xs text-[#6e716b]">
          <span>Ainda não tem conta?</span>
          <Link
            to="/signup"
            className="font-semibold text-[#202522] underline decoration-[#d8d3c8] underline-offset-4 transition-colors hover:decoration-[#202522]"
          >
            Criar conta
          </Link>
        </div>
      }
    >
      <div>
        {/* Form Title */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#202522] sm:text-[36px]">
            Bem-vindo de volta
          </h1>
          <p className="mt-2.5 text-[14px] text-[#6e716b]">
            Introduza as suas credenciais para entrar na conta.
          </p>
        </div>

        {/* Login Form */}
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

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[13px] font-medium text-[#202522]"
              >
                Palavra-passe
              </label>

              <Link
                to="/forgot-password"
                className="text-[12px] font-medium text-[#6e716b] hover:text-[#202522] transition-colors"
              >
                Esqueceu-se?
              </Link>
            </div>

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
                autoComplete="current-password"
                placeholder="A sua palavra-passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                required
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#202522] text-[14px] font-semibold text-white transition-all hover:bg-[#2c6457] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "A entrar..." : "Entrar na conta"}
            {!isLoading && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
          </button>
        </form>

        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-[#a09b90]">
          Acesso encriptado & dados isolados por empresa
        </p>
      </div>
    </AuthShell>
  );
}
