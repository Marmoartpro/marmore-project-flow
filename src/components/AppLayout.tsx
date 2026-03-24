import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Home, DollarSign, FileText, Users, LogOut, Plus, Menu, X, Bell,
  Package, Truck, Calculator, CheckCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  alertCount?: number;
}

const marmoristNavItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/mostruario', label: 'Mostruário', icon: Package },
  { path: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { path: '/calculadora', label: 'Calculadora', icon: Calculator },
];

const architectNavItems = [
  { path: '/architect', label: 'Início', icon: Home },
  { path: '/mostruario', label: 'Mostruário', icon: Package },
];

const AppLayout = ({ children, alertCount = 0 }: Props) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isMarmorista = profile?.role === 'marmorista';
  const navItems = isMarmorista ? marmoristNavItems : architectNavItems;

  useEffect(() => {
    if (user) {
      supabase.from('notifications').select('*').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(20).then(({ data }) => setNotifications(data || []));
    }
  }, [user, location.pathname]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(n => n.filter(x => x.id !== id));
  };

  const markAllRead = async () => {
    const ids = notifications.map(n => n.id);
    if (ids.length === 0) return;
    await Promise.all(ids.map(id => supabase.from('notifications').update({ read: true }).eq('id', id)));
    setNotifications([]);
  };

  const totalAlerts = alertCount + notifications.length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar border-r border-sidebar-border fixed h-full z-30">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-lg font-display font-bold text-foreground">MármoreProart</h1>
          <p className="text-xs text-muted-foreground truncate">{profile?.full_name || 'Usuário'}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Notification bell in sidebar */}
        <div className="px-2 py-1">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Notificações
            {totalAlerts > 0 && (
              <Badge className="ml-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">{totalAlerts}</Badge>
            )}
          </button>
        </div>

        <div className="p-2 border-t border-sidebar-border space-y-1">
          {isMarmorista && (
            <Button variant="default" size="sm" className="w-full justify-start" onClick={() => navigate('/projeto/novo')}>
              <Plus className="w-4 h-4 mr-2" /> Novo projeto
            </Button>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Desktop notification panel */}
      {showNotifications && (
        <div className="hidden md:block fixed left-56 top-0 bottom-0 w-80 bg-card border-r border-border z-20 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notificações</h3>
            <div className="flex gap-1">
              {notifications.length > 0 && (
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={markAllRead}>
                  <CheckCheck className="w-3 h-3 mr-1" /> Marcar todas
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowNotifications(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma notificação</p>
            ) : notifications.map(n => (
              <div key={n.id} className="px-3 py-2 rounded-md bg-primary/10 border border-primary/30 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-primary">{n.title}</p>
                    <p className="text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('pt-BR')} {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button onClick={() => markRead(n.id)} className="text-muted-foreground hover:text-foreground text-[10px] shrink-0">✓</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-base font-display font-bold">MármoreProart</h1>
          <div className="flex items-center gap-2">
            <button className="relative" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="w-5 h-5 text-muted-foreground" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center">{totalAlerts}</span>
              )}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {showNotifications && notifications.length > 0 && (
          <div className="px-4 pb-3 space-y-1">
            <div className="flex justify-end mb-1">
              <Button size="sm" variant="ghost" className="text-xs h-6" onClick={markAllRead}>
                <CheckCheck className="w-3 h-3 mr-1" /> Marcar todas como lidas
              </Button>
            </div>
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="px-3 py-2 rounded-md bg-primary/10 border border-primary/30 text-xs flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium text-primary">{n.title}</p>
                  <p className="text-muted-foreground">{n.message}</p>
                </div>
                <button onClick={() => markRead(n.id)} className="text-muted-foreground hover:text-foreground text-[10px] shrink-0">✓</button>
              </div>
            ))}
          </div>
        )}
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
              {isMarmorista && (
                <Button size="sm" className="flex-1" onClick={() => { navigate('/projeto/novo'); setMobileOpen(false); }}>
                  <Plus className="w-4 h-4 mr-1" /> Novo projeto
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
            </div>
          </nav>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border flex">
        {navItems.slice(0, 5).map(item => {
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
      <main className={`flex-1 md:ml-56 pt-14 md:pt-0 pb-16 md:pb-0 ${showNotifications ? 'md:ml-[calc(14rem+20rem)]' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
