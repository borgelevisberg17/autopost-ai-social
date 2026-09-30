import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
      footer={
        <div className="flex items-center gap-1.5 text-xs text-[#6e716b]">
          <span>Sem conta?</span>
          <Link
            to="/signup"
            className="font-semibold text-[#202522] underline decoration-[#d8d3c8] underline-offset-4 transition-colors hover:decoration-[#202522]"
          >
            Criar conta
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <h1 className="mb-7 font-serif text-[34px] font-medium leading-none tracking-[-0.045em] text-[#202522] sm:text-[38px]">
          Aceder à conta
        </h1>

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
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="text-xs font-medium text-[#202522]"
            >
              Palavra-passe
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-[#6e716b] transition-colors hover:text-[#202522]"
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
          {isLoading ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
