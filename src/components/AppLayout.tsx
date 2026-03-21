import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Home, DollarSign, FileText, Users, LogOut, Plus, Menu, X, Bell,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  alertCount?: number;
}

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { path: '/clientes', label: 'Clientes', icon: Users },
];

const AppLayout = ({ children, alertCount = 0 }: Props) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar border-r border-sidebar-border fixed h-full z-30">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-lg font-display font-bold text-foreground">MármoreProart</h1>
          <p className="text-xs text-muted-foreground truncate">{profile?.full_name || 'Usuário'}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.path === '/dashboard' && alertCount > 0 && (
                  <Badge className="ml-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">{alertCount}</Badge>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-sidebar-border space-y-1">
          <Button variant="default" size="sm" className="w-full justify-start" onClick={() => navigate('/projeto/novo')}>
            <Plus className="w-4 h-4 mr-2" /> Novo projeto
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-base font-display font-bold">MármoreProart</h1>
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center">{alertCount}</span>
              </div>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="px-4 pb-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                    active ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-sidebar-border flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => { navigate('/projeto/novo'); setMobileOpen(false); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo projeto
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
            </div>
          </nav>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border flex">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
