import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompany";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Overview = lazy(() => import("./pages/admin/Overview"));
const Products = lazy(() => import("./pages/admin/Products"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const Agents = lazy(() => import("./pages/admin/Agents"));
const Approvals = lazy(() => import("./pages/admin/Approvals"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const CompanySettings = lazy(() => import("./pages/admin/CompanySettings"));
const Channels = lazy(() => import("./pages/admin/Channels"));
const Team = lazy(() => import("./pages/admin/Team"));
const Activity = lazy(() => import("./pages/admin/Activity"));
const Audit = lazy(() => import("./pages/admin/Audit"));
const Content = lazy(() => import("./pages/admin/Content"));
const Automations = lazy(() => import("./pages/admin/Automations"));
const Payments = lazy(() => import("./pages/admin/Payments"));
const Conversations = lazy(() => import("./pages/admin/Conversations"));
const Store = lazy(() => import("./pages/store/Store"));
const OrderStatus = lazy(() => import("./pages/store/OrderStatus"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LazyCookieBanner = lazy(() =>
  import("@/components/CookieBanner").then(({ CookieBanner }) => ({
    default: CookieBanner,
  })),
);

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

function RouteLoading() {
  return (
    <div
      role="status"
      aria-label="A carregar página"
      className="grid min-h-screen place-items-center bg-[#f8f7f4]"
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#ded9d0] border-t-[#2c6457]"
      />
    </div>
  );
}

function CookieBannerGate() {
  const { pathname } = useLocation();

  if (pathname !== "/") return null;

  return (
    <Suspense fallback={null}>
      <LazyCookieBanner />
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />

      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Index />} />
                <Route path="/pricing" element={<Navigate to="/#plans" replace />} />

                {/* Authentication */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Public Store */}
                <Route path="/loja/:slug" element={<Store />} />
                <Route path="/loja/:slug/pedido/:id" element={<OrderStatus />} />

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
                <Route path="/admin/conteudo" element={<P><Content /></P>} />
                <Route path="/admin/automacoes" element={<P><Automations /></P>} />
                <Route path="/admin/pagamentos" element={<P><Payments /></P>} />
                <Route path="/admin/conversas" element={<P><Conversations /></P>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieBannerGate />
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
