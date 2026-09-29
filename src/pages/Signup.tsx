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
import { Link, useNavigate } from "react-router-dom";
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
      eyebrow="COMEÇAR"
      title="Construa a operação da sua loja."
      description="Crie a sua conta e depois configure a empresa, catálogo e canais no seu ritmo."
      footer={
        <div className="hidden items-center gap-2 text-sm text-[#666666] sm:flex">
          <span>Já tem uma conta?</span>
          <Link
            to="/login"
            className="font-semibold text-[#111111] underline decoration-[#cccccc] underline-offset-4 transition-colors hover:decoration-[#111111]"
          >
            Entrar
          </Link>
        </div>
      }
    >
      <div>
        <div className="mb-8">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#999999]">
            Nova conta
          </p>

          <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#111111] sm:text-[40px]">
            Comece por aqui.
          </h1>

          <p className="mt-3 max-w-[410px] text-[15px] leading-6 text-[#707070]">
            Primeiro criamos a sua conta. Depois, configuramos a sua empresa e
            a sua loja.
          </p>
        </div>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#111111] text-[11px] font-semibold text-white">
              1
            </span>

            <span className="text-[12px] font-medium text-[#333333]">
              Conta
            </span>
          </div>

          <div className="h-px flex-1 bg-[#e5e5e2]" />

          <div className="flex items-center gap-2 text-[#aaaaaa]">
            <span className="grid h-6 w-6 place-items-center rounded-full border border-[#ddddda] text-[11px] font-medium">
              2
            </span>

            <span className="text-[12px]">Loja</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-[13px] font-medium text-[#333333]"
            >
              Nome completo
            </label>

            <div className="relative">
              <UserRound
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#999999]"
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
                className="h-[52px] w-full rounded-[10px] border border-[#ddddda] bg-white pl-11 pr-4 text-[14px] text-[#111111] outline-none transition-all placeholder:text-[#aaaaaa] hover:border-[#c8c8c4] focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/8 disabled:cursor-not-allowed disabled:bg-[#f7f7f5]"
              />
            </div>
          </div>

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

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-[13px] font-medium text-[#333333]"
            >
              Palavra-passe
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
                className="h-[52px] w-full rounded-[10px] border border-[#ddddda] bg-white pl-11 pr-12 text-[14px] text-[#111111] outline-none transition-all placeholder:text-[#aaaaaa] hover:border-[#c8c8c4] focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/8 disabled:cursor-not-allowed disabled:bg-[#f7f7f5]"
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
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#888888] transition-colors hover:bg-[#f5f5f3] hover:text-[#111111] disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-[17px] w-[17px]" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-[17px] w-[17px]" strokeWidth={1.8} />
                )}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              <span
                className={`flex items-center gap-1.5 text-[11px] ${
                  password.length >= 8 ? "text-[#333333]" : "text-[#aaaaaa]"
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={2} />
                8 caracteres
              </span>

              <span
                className={`flex items-center gap-1.5 text-[11px] ${
                  password.length > 0
                    ? /[A-Za-z]/.test(password) && /\d/.test(password)
                      ? "text-[#333333]"
                      : "text-[#aaaaaa]"
                    : "text-[#aaaaaa]"
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={2} />
                Letras e números
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#111111] text-[14px] font-semibold text-white transition-all hover:bg-[#252525] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "A criar conta..." : "Criar conta"}

            {!isLoading && (
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.8}
              />
            )}
          </button>

          <p className="text-center text-[11px] leading-5 text-[#aaaaaa]">
            Ao criar uma conta, você concorda com os Termos de Uso e a Política
            de Privacidade.
          </p>
        </form>

        <div className="mt-8 border-t border-[#eeeeeb] pt-7 text-center sm:hidden">
          <p className="text-[13px] text-[#777777]">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#111111] underline decoration-[#cccccc] underline-offset-4"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
