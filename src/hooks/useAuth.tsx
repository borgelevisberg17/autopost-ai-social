import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "Email ou palavra-passe incorretos.";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("user already registered")
  ) {
    return "Este email já está cadastrado. Tente entrar na sua conta.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme o seu email antes de entrar.";
  }

  if (normalized.includes("password") && normalized.includes("weak")) {
    return "Escolha uma palavra-passe mais forte.";
  }

  if (normalized.includes("rate limit")) {
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  }

  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (event === "PASSWORD_RECOVERY") {
        // A página /reset-password trata o fluxo de recuperação.
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast.error(getAuthErrorMessage(error.message));
        return { error };
      }

      if (data.session) {
        toast.success("Conta criada com sucesso.");
      } else {
        toast.success(
          "Conta criada. Verifique o seu email para confirmar o acesso.",
        );
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast.error(getAuthErrorMessage(err.message));
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(getAuthErrorMessage(error.message));
        return { error };
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast.error(getAuthErrorMessage(err.message));
      return { error: err };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Não foi possível terminar a sessão.");
      return;
    }

    toast.success("Sessão terminada.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
