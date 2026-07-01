import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, Navigate } from "react-router-dom";

const Router = typeof __IS_ELECTRON__ !== "undefined" && __IS_ELECTRON__ ? HashRouter : BrowserRouter;
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { usePermissions, PermissionKey } from "@/hooks/usePermissions";
import Login from "./pages/Login";

// Route-level code splitting: cada página vira um chunk sob demanda.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ArchitectDashboard = lazy(() => import("./pages/ArchitectDashboard"));
const NewProject = lazy(() => import("./pages/NewProject"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const TeamInviteAccept = lazy(() => import("./pages/TeamInviteAccept"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Orcamentos = lazy(() => import("./pages/Orcamentos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Mostruario = lazy(() => import("./pages/Mostruario"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const CalculadoraOrcamento = lazy(() => import("./pages/CalculadoraOrcamento"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Contratos = lazy(() => import("./pages/Contratos"));
const AssinaturaPublica = lazy(() => import("./pages/AssinaturaPublica"));
const StonePage = lazy(() => import("./pages/StonePage"));
const Equipe = lazy(() => import("./pages/Equipe"));
const Agenda = lazy(() => import("./pages/Agenda"));
const ClientePortal = lazy(() => import("./pages/ClientePortal"));
const InstaladorPortal = lazy(() => import("./pages/InstaladorPortal"));
const VendedorPortal = lazy(() => import("./pages/VendedorPortal"));
const RhPortal = lazy(() => import("./pages/RhPortal"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PermissionRoute = ({ permission, children }: { permission: PermissionKey; children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { can, loading: permLoading } = usePermissions();
  if (loading || permLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!can(permission)) return <Unauthorized />;
  return <>{children}</>;
};

const OwnerOrPermRoute = ({ permission, children }: { permission: PermissionKey; children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { can, isOwner, loading: permLoading } = usePermissions();
  if (loading || permLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOwner && !can(permission)) return <Unauthorized />;
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user, profile, loading } = useAuth();
  const { role, isOwner } = usePermissions();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'arquiteta') return <Navigate to="/architect" replace />;
  if (profile?.role === 'instalador') return <Navigate to="/instalador" replace />;
  if (profile?.role === 'vendedor') return <Navigate to="/vendedor" replace />;
  if (profile?.role === 'rh') return <Navigate to="/rh" replace />;
  if (profile?.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (profile?.role === 'cliente') return <Navigate to="/meu-projeto" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<Login />} />
    <Route path="/invite/:token" element={<InviteAccept />} />
    <Route path="/entrar/:token" element={<TeamInviteAccept />} />
    <Route path="/portfolio/:slug" element={<Portfolio />} />
    <Route path="/meu-projeto/:token" element={<ClientePortal />} />
    <Route path="/assinar/:token" element={<AssinaturaPublica />} />
    <Route path="/mostruario/:stoneId" element={<StonePage />} />
    <Route path="/unsubscribe" element={<Unsubscribe />} />
    <Route path="/configuracoes/notificacoes" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
    
    <Route path="/dashboard" element={<PermissionRoute permission="dashboard"><Dashboard /></PermissionRoute>} />
    <Route path="/architect" element={<ProtectedRoute><ArchitectDashboard /></ProtectedRoute>} />
    <Route path="/instalador" element={<ProtectedRoute><InstaladorPortal /></ProtectedRoute>} />
    <Route path="/vendedor" element={<ProtectedRoute><VendedorPortal /></ProtectedRoute>} />
    <Route path="/rh" element={<ProtectedRoute><RhPortal /></ProtectedRoute>} />
    <Route path="/financeiro" element={<PermissionRoute permission="financeiro"><Financeiro /></PermissionRoute>} />
    <Route path="/orcamentos" element={<PermissionRoute permission="orcamentos"><Orcamentos /></PermissionRoute>} />
    <Route path="/clientes" element={<PermissionRoute permission="clientes"><Clientes /></PermissionRoute>} />
    <Route path="/mostruario" element={<PermissionRoute permission="mostruario"><Mostruario /></PermissionRoute>} />
    <Route path="/fornecedores" element={<PermissionRoute permission="fornecedores"><Fornecedores /></PermissionRoute>} />
    <Route path="/calculadora" element={<PermissionRoute permission="calculadora"><CalculadoraOrcamento /></PermissionRoute>} />
    <Route path="/calculadora/:quoteId" element={<PermissionRoute permission="calculadora"><CalculadoraOrcamento /></PermissionRoute>} />
    <Route path="/relatorios" element={<PermissionRoute permission="relatorios"><Relatorios /></PermissionRoute>} />
    <Route path="/contratos" element={<PermissionRoute permission="contratos"><Contratos /></PermissionRoute>} />
    <Route path="/equipe" element={<OwnerOrPermRoute permission="equipe"><Equipe /></OwnerOrPermRoute>} />
    <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
    <Route path="/projeto/novo" element={<PermissionRoute permission="projetos"><NewProject /></PermissionRoute>} />
    <Route path="/projeto/:id" element={<PermissionRoute permission="projetos"><ProjectDetail /></PermissionRoute>} />
    <Route path="/nao-autorizado" element={<Unauthorized />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
