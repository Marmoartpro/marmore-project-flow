import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoleBadge from '@/components/RoleBadge';
import { Users, BarChart3, Calendar, Clock, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RhPortal = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    const { data: member } = await supabase
      .from('team_members').select('owner_id').eq('user_id', user!.id).eq('active', true).maybeSingle();
    if (!member) { setLoading(false); return; }

    const [mRes, lRes, pRes] = await Promise.all([
      supabase.from('team_members').select('*').eq('owner_id', member.owner_id).order('name'),
      supabase.from('access_logs').select('*').eq('owner_id', member.owner_id).order('created_at', { ascending: false }).limit(100),
      supabase.from('projects').select('*').eq('owner_id', member.owner_id).eq('status', 'em_andamento').order('deadline'),
    ]);
    setMembers(mRes.data || []);
    setAccessLogs(lRes.data || []);
    setProjects(pRes.data || []);
    setLoading(false);
  };

  const activeMembers = members.filter(m => m.active);
  const instaladores = members.filter(m => m.role === 'instalador' && m.active);

  // Access stats per member
  const memberAccessCount: Record<string, number> = {};
  accessLogs.forEach(l => {
    memberAccessCount[l.user_id] = (memberAccessCount[l.user_id] || 0) + 1;
  });

  // Upcoming installations (projects with deadline in next 7 days)
  const now = new Date();
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingProjects = projects.filter(p => {
    if (!p.deadline) return false;
    const d = new Date(p.deadline);
    return d >= now && d <= next7;
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-display font-bold">Recursos Humanos</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{activeMembers.length}</p>
              <p className="text-xs text-muted-foreground">Membros ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{accessLogs.length}</p>
              <p className="text-xs text-muted-foreground">Acessos (30 dias)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{instaladores.length}</p>
              <p className="text-xs text-muted-foreground">Instaladores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{upcomingProjects.length}</p>
              <p className="text-xs text-muted-foreground">Obras próximas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="membros">
          <TabsList>
            <TabsTrigger value="membros">Membros</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="acessos">Acessos</TabsTrigger>
          </TabsList>

          <TabsContent value="membros" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Membros da Equipe</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 border-b pb-3 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.email}</p>
                    </div>
                    <RoleBadge role={m.role} />
                    <Badge variant={m.active ? 'default' : 'destructive'} className="text-[10px]">
                      {m.active ? (m.accepted_at ? 'Ativo' : 'Pendente') : 'Inativo'}
                    </Badge>
                    <div className="text-right min-w-[80px]">
                      {m.last_seen_at ? (
                        <div>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {new Date(m.last_seen_at).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {new Date(m.last_seen_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Nunca acessou</p>
                      )}
                    </div>
                    <div className="text-center min-w-[40px]">
                      <p className="text-xs font-medium">{memberAccessCount[m.user_id] || 0}</p>
                      <p className="text-[9px] text-muted-foreground">acessos</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agenda" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Agenda de Obras (Próximos 7 dias)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {upcomingProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma obra agendada para os próximos 7 dias</p>
                ) : upcomingProjects.map(p => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.client_name} • {p.address || 'Sem endereço'}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : '-'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Todas as Obras em Andamento</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.client_name}</p>
                    </div>
                    <div className="text-right">
                      {p.deadline && <p className="text-xs text-muted-foreground">{new Date(p.deadline).toLocaleDateString('pt-BR')}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acessos" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Últimos Acessos</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {accessLogs.slice(0, 50).map(l => (
                  <div key={l.id} className="flex items-center justify-between text-xs border-b pb-1 last:border-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="text-[9px] shrink-0">{l.role || '-'}</Badge>
                      <span className="truncate">{l.page_accessed || l.action}</span>
                    </div>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      {new Date(l.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default RhPortal;
