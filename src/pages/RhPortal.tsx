import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart3, Calendar } from 'lucide-react';

const RhPortal = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    const { data: member } = await supabase
      .from('team_members').select('owner_id').eq('user_id', user!.id).eq('active', true).maybeSingle();
    if (!member) { setLoading(false); return; }

    const [mRes, lRes] = await Promise.all([
      supabase.from('team_members').select('*').eq('owner_id', member.owner_id).order('name'),
      supabase.from('access_logs').select('*').eq('owner_id', member.owner_id).order('created_at', { ascending: false }).limit(50),
    ]);
    setMembers(mRes.data || []);
    setAccessLogs(lRes.data || []);
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-display font-bold">Recursos Humanos</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{members.filter(m => m.active).length}</p>
              <p className="text-xs text-muted-foreground">Membros ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{accessLogs.length}</p>
              <p className="text-xs text-muted-foreground">Acessos recentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{members.filter(m => m.role === 'instalador').length}</p>
              <p className="text-xs text-muted-foreground">Instaladores</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Membros da Equipe</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 border-b pb-2 last:border-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {m.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">{m.email}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{m.role}</Badge>
                <Badge variant={m.active ? 'default' : 'destructive'} className="text-[10px]">
                  {m.active ? 'Ativo' : 'Inativo'}
                </Badge>
                {m.last_seen_at && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.last_seen_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Últimos Acessos</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {accessLogs.slice(0, 20).map(l => (
              <div key={l.id} className="flex items-center justify-between text-xs border-b pb-1 last:border-0">
                <span>{l.action || l.page_accessed}</span>
                <span className="text-muted-foreground">{l.role}</span>
                <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default RhPortal;
