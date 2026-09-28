import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompany";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Overview from "./pages/admin/Overview";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Agents from "./pages/admin/Agents";
import CompanySettings from "./pages/admin/CompanySettings";
import Store from "./pages/store/Store";
import OrderStatus from "./pages/store/OrderStatus";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const P = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/loja/:slug" element={<Store />} />
              <Route path="/loja/:slug/pedido/:id" element={<OrderStatus />} />
              <Route path="/onboarding" element={<P><Onboarding /></P>} />
              <Route path="/dashboard" element={<P><Overview /></P>} />
              <Route path="/admin/produtos" element={<P><Products /></P>} />
              <Route path="/admin/pedidos" element={<P><Orders /></P>} />
              <Route path="/admin/agentes" element={<P><Agents /></P>} />
              <Route path="/admin/config" element={<P><CompanySettings /></P>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
