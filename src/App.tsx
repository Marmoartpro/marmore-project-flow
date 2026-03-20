import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import InviteAccept from "./pages/InviteAccept";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={loading ? null : user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projeto/novo" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
      <Route path="/projeto/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

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
