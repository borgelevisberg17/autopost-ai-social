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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";

import Overview from "./pages/admin/Overview";
import Products from "./pages/admin/Products";
import Inventory from "./pages/admin/Inventory";
import Orders from "./pages/admin/Orders";
import Customers from "./pages/admin/Customers";
import Agents from "./pages/admin/Agents";
import Approvals from "./pages/admin/Approvals";
import Analytics from "./pages/admin/Analytics";
import CompanySettings from "./pages/admin/CompanySettings";
import Channels from "./pages/admin/Channels";
import Team from "./pages/admin/Team";
import Activity from "./pages/admin/Activity";
import Audit from "./pages/admin/Audit";
import { RoadmapSurface } from "@/components/admin/RoadmapSurface";

import Store from "./pages/store/Store";
import OrderStatus from "./pages/store/OrderStatus";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />

              {/* Authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/forgot-password"
                element={<ForgotPassword />}
              />
              <Route
                path="/reset-password"
                element={<ResetPassword />}
              />

              {/* Public Store */}
              <Route path="/loja/:slug" element={<Store />} />
              <Route
                path="/loja/:slug/pedido/:id"
                element={<OrderStatus />}
              />

              {/* Protected */}
              <Route
                path="/onboarding"
                element={
                  <P>
                    <Onboarding />
                  </P>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <P>
                    <Overview />
                  </P>
                }
              />

              <Route
                path="/admin/produtos"
                element={
                  <P>
                    <Products />
                  </P>
                }
              />

              <Route
                path="/admin/inventario"
                element={
                  <P>
                    <Inventory />
                  </P>
                }
              />

              <Route
                path="/admin/pedidos"
                element={
                  <P>
                    <Orders />
                  </P>
                }
              />

              <Route
                path="/admin/clientes"
                element={
                  <P>
                    <Customers />
                  </P>
                }
              />

              <Route
                path="/admin/agentes"
                element={
                  <P>
                    <Agents />
                  </P>
                }
              />

              <Route
                path="/admin/aprovacoes"
                element={
                  <P>
                    <Approvals />
                  </P>
                }
              />

              <Route
                path="/admin/analytics"
                element={
                  <P>
                    <Analytics />
                  </P>
                }
              />

              <Route
                path="/admin/config"
                element={
                  <P>
                    <CompanySettings />
                  </P>
                }
              />

              <Route
                path="/admin/canais"
                element={
                  <P>
                    <Channels />
                  </P>
                }
              />

              <Route path="/admin/equipa" element={<P><Team /></P>} />
              <Route path="/admin/atividade" element={<P><Activity /></P>} />
              <Route path="/admin/auditoria" element={<P><Audit /></P>} />
              <Route path="/admin/conteudo" element={<P><RoadmapSurface eyebrow="Automação / Conteúdo" title="Conteúdo" description="Espaço para preparar, rever e acompanhar conteúdo por canal." backendNote="A base atual tem content_history e aprovações, mas não existe uma entidade de calendário com estados draft, scheduled, published e failed." capabilities={["Lista de rascunhos", "Filtros por canal", "Fluxo de aprovação"]} next="Adicionar scheduling persistente no backend antes de apresentar calendário ou publicação automática." /></P>} />
              <Route path="/admin/automacoes" element={<P><RoadmapSurface eyebrow="Automação" title="Automações" description="Regras operacionais para reduzir trabalho repetitivo sem esconder o que o sistema executa." backendNote="O backend atual suporta agentes, runs, permissions e actions, mas não possui uma tabela de automações ou triggers configuráveis." capabilities={["Regras e triggers", "Histórico de execuções", "Permissões por ação"]} next="Criar o contrato de automações no backend antes de permitir edição e ativação." /></P>} />
              <Route path="/admin/pagamentos" element={<P><RoadmapSurface eyebrow="Commerce / Pagamentos" title="Pagamentos" description="Estado de pagamento por pedido, separado de estado do pedido e fulfillment." backendNote="Os pedidos possuem payment_status no pipeline enriquecido, mas não existe uma entidade de pagamentos ou gateway configurado." capabilities={["Estado de pagamento", "Reconciliação", "Métodos de pagamento"]} next="Ligar um provedor de pagamentos e persistência própria antes de oferecer ações financeiras." /></P>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
