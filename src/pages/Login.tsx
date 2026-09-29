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
      eyebrow="BEM-VINDO DE VOLTA"
      title="Continue a gerir o seu negócio."
      description="Entre para acompanhar pedidos, produtos, canais e tudo o que acontece na sua operação."
      footer={
        <div className="hidden items-center gap-2 text-sm text-[#666666] sm:flex">
          <span>Não tem uma conta?</span>
          <Link
            to="/signup"
            className="font-semibold text-[#111111] underline decoration-[#cccccc] underline-offset-4 transition-colors hover:decoration-[#111111]"
          >
            Criar conta
          </Link>
        </div>
      }
    >
      <div>
        <div className="mb-9">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#999999]">
            Aceder à conta
          </p>

          <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#111111] sm:text-[40px]">
            Bem-vindo de volta.
          </h1>

          <p className="mt-3 text-[15px] leading-6 text-[#707070]">
            Entre para continuar de onde parou.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[13px] font-medium text-[#333333]"
              >
                Palavra-passe
              </label>

              <Link
                to="/forgot-password"
                className="text-[12px] font-medium text-[#666666] underline decoration-[#cccccc] underline-offset-4 transition-colors hover:text-[#111111] hover:decoration-[#111111]"
              >
                Esqueceu?
              </Link>
            </div>

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
                autoComplete="current-password"
                placeholder="A sua palavra-passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                required
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#111111] text-[14px] font-semibold text-white transition-all hover:bg-[#252525] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "A entrar..." : "Entrar na conta"}

            {!isLoading && (
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.8}
              />
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-[#eeeeeb] pt-7 text-center sm:hidden">
          <p className="text-[13px] text-[#777777]">
            Não tem uma conta?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[#111111] underline decoration-[#cccccc] underline-offset-4"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-[11px] leading-5 text-[#aaaaaa]">
          O acesso é protegido e os dados da sua empresa permanecem isolados
          da operação de outras contas.
        </p>
      </div>
    </AuthShell>
  );
}
