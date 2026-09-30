import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Company {
  id: string;
  name: string;
  slug: string;
  currency: string;
  description: string | null;
  whatsapp: string | null;
}

interface Ctx {
  companies: Company[];
  company: Company | null;
  loading: boolean;
  error: string | null;
  select: (id: string) => void;
  reload: () => Promise<void>;
}

const CompanyContext = createContext<Ctx | undefined>(undefined);
const KEY = "vendora.company";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(() =>
    localStorage.getItem(KEY),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setCompanies([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCompanies([]);

    try {
      const { data: members, error: membersError } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id);

      if (membersError) throw membersError;

      const ids = (members ?? []).map((member) => member.company_id);
      if (ids.length === 0) return;

      const { data, error: companiesError } = await supabase
        .from("companies")
        .select("id,name,slug,currency,description,whatsapp")
        .in("id", ids)
        .order("created_at");

      if (companiesError) throw companiesError;

      setCompanies((data as Company[]) ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar a empresa associada à conta.",
      );
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const select = (id: string) => {
    localStorage.setItem(KEY, id);
    setCurrentId(id);
  };

  const company =
    companies.find((item) => item.id === currentId) ?? companies[0] ?? null;

  return (
    <CompanyContext.Provider
      value={{ companies, company, loading, error, select, reload }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context)
    throw new Error("useCompany must be used within CompanyProvider");
  return context;
}
