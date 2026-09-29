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

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
