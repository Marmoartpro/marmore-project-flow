import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { usePermissions, PermissionKey } from "@/hooks/usePermissions";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ArchitectDashboard from "./pages/ArchitectDashboard";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import InviteAccept from "./pages/InviteAccept";
import TeamInviteAccept from "./pages/TeamInviteAccept";
import Financeiro from "./pages/Financeiro";
import Orcamentos from "./pages/Orcamentos";
import Clientes from "./pages/Clientes";
import Mostruario from "./pages/Mostruario";
import Fornecedores from "./pages/Fornecedores";
import CalculadoraOrcamento from "./pages/CalculadoraOrcamento";
import Portfolio from "./pages/Portfolio";
import Relatorios from "./pages/Relatorios";
import Contratos from "./pages/Contratos";
import AssinaturaPublica from "./pages/AssinaturaPublica";
import StonePage from "./pages/StonePage";
import Equipe from "./pages/Equipe";
import ClientePortal from "./pages/ClientePortal";
import InstaladorPortal from "./pages/InstaladorPortal";
import VendedorPortal from "./pages/VendedorPortal";
import RhPortal from "./pages/RhPortal";
import Unauthorized from "./pages/Unauthorized";
import NotificationPreferences from "./pages/NotificationPreferences";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
