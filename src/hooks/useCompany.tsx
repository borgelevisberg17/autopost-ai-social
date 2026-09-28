import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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
  select: (id: string) => void;
  reload: () => Promise<void>;
}

const CompanyContext = createContext<Ctx | undefined>(undefined);
const KEY = "vendora.company";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(() => localStorage.getItem(KEY));
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) { setCompanies([]); setLoading(false); return; }
    setLoading(true);
    const { data: members } = await supabase.from("company_members").select("company_id").eq("user_id", user.id);
    const ids = (members ?? []).map((m) => m.company_id);
    if (ids.length === 0) { setCompanies([]); setLoading(false); return; }
    const { data } = await supabase.from("companies").select("id,name,slug,currency,description,whatsapp").in("id", ids).order("created_at");
    setCompanies((data as Company[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const select = (id: string) => { localStorage.setItem(KEY, id); setCurrentId(id); };
  const company = companies.find((c) => c.id === currentId) ?? companies[0] ?? null;

  return <CompanyContext.Provider value={{ companies, company, loading, select, reload }}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const c = useContext(CompanyContext);
  if (!c) throw new Error("useCompany must be used within CompanyProvider");
  return c;
}
