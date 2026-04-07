import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ArchitectDashboard from "./pages/ArchitectDashboard";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import InviteAccept from "./pages/InviteAccept";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'arquiteta') return <Navigate to="/architect" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<Login />} />
    <Route path="/invite/:token" element={<InviteAccept />} />
    <Route path="/portfolio/:slug" element={<Portfolio />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/architect" element={<ProtectedRoute><ArchitectDashboard /></ProtectedRoute>} />
    <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
    <Route path="/orcamentos" element={<ProtectedRoute><Orcamentos /></ProtectedRoute>} />
    <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
    <Route path="/mostruario" element={<ProtectedRoute><Mostruario /></ProtectedRoute>} />
    <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
    <Route path="/calculadora" element={<ProtectedRoute><CalculadoraOrcamento /></ProtectedRoute>} />
    <Route path="/calculadora/:quoteId" element={<ProtectedRoute><CalculadoraOrcamento /></ProtectedRoute>} />
    <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
    <Route path="/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
    <Route path="/projeto/novo" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
    <Route path="/projeto/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
    <Route path="/assinar/:token" element={<AssinaturaPublica />} />
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
