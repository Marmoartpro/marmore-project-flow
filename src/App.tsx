import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, Navigate } from "react-router-dom";

const Router = typeof __IS_ELECTRON__ !== "undefined" && __IS_ELECTRON__ ? HashRouter : BrowserRouter;
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { usePermissions, PermissionKey } from "@/hooks/usePermissions";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";
import Login from "./pages/Login";

// Route-level code splitting: cada página vira um chunk sob demanda.
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const ArchitectDashboard = lazyWithRetry(() => import("./pages/ArchitectDashboard"));
const NewProject = lazyWithRetry(() => import("./pages/NewProject"));
const ProjectDetail = lazyWithRetry(() => import("./pages/ProjectDetail"));
const InviteAccept = lazyWithRetry(() => import("./pages/InviteAccept"));
const TeamInviteAccept = lazyWithRetry(() => import("./pages/TeamInviteAccept"));
const Financeiro = lazyWithRetry(() => import("./pages/Financeiro"));
const Orcamentos = lazyWithRetry(() => import("./pages/Orcamentos"));
const Clientes = lazyWithRetry(() => import("./pages/Clientes"));
const Mostruario = lazyWithRetry(() => import("./pages/Mostruario"));
const Fornecedores = lazyWithRetry(() => import("./pages/Fornecedores"));
const CalculadoraOrcamento = lazyWithRetry(() => import("./pages/CalculadoraOrcamento"));
const Portfolio = lazyWithRetry(() => import("./pages/Portfolio"));
const Relatorios = lazyWithRetry(() => import("./pages/Relatorios"));
const Contratos = lazyWithRetry(() => import("./pages/Contratos"));
const AssinaturaPublica = lazyWithRetry(() => import("./pages/AssinaturaPublica"));
const StonePage = lazyWithRetry(() => import("./pages/StonePage"));
const Equipe = lazyWithRetry(() => import("./pages/Equipe"));
const Agenda = lazyWithRetry(() => import("./pages/Agenda"));
const ClientePortal = lazyWithRetry(() => import("./pages/ClientePortal"));
const InstaladorPortal = lazyWithRetry(() => import("./pages/InstaladorPortal"));
const VendedorPortal = lazyWithRetry(() => import("./pages/VendedorPortal"));
const RhPortal = lazyWithRetry(() => import("./pages/RhPortal"));
const Unauthorized = lazyWithRetry(() => import("./pages/Unauthorized"));
const NotificationPreferences = lazyWithRetry(() => import("./pages/NotificationPreferences"));
const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const OAuthConsent = lazyWithRetry(() => import("./pages/OAuthConsent"));

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
  <ChunkErrorBoundary>
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
    <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
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
  </Suspense>
  </ChunkErrorBoundary>
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
