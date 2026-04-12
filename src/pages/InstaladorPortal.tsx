import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Camera, AlertTriangle } from 'lucide-react';

const InstaladorPortal = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    // Installer sees projects assigned to them (via team_members -> owner_id projects)
    const { data: member } = await supabase
      .from('team_members')
      .select('owner_id')
      .eq('user_id', user!.id)
      .eq('active', true)
      .maybeSingle();

    if (!member) { setLoading(false); return; }

    const today = new Date().toISOString().split('T')[0];
    const { data: projs } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', member.owner_id)
      .eq('status', 'em_andamento')
      .order('deadline');

    setProjects(projs || []);

    if (projs && projs.length > 0) {
      const ids = projs.map(p => p.id);
      const { data: st } = await supabase.from('project_stages').select('*').in('project_id', ids).order('stage_number');
      setStages(st || []);
    }
    setLoading(false);
  };

  const toggleStage = async (stageId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'concluido' ? 'pendente' : 'concluido';
    await supabase.from('project_stages').update({
      status: newStatus,
      completed_at: newStatus === 'concluido' ? new Date().toISOString() : null,
    }).eq('id', stageId);
    fetchData();
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-display font-bold">Obras</h1>
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : projects.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma obra atribuída a você.</CardContent></Card>
        ) : (
          projects.map(p => {
            const pStages = stages.filter(s => s.project_id === p.id);
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.address}
                    </p>
                  )}
                  {p.client_name && <p className="text-xs text-muted-foreground">Cliente: {p.client_name}</p>}
                </CardHeader>
                <CardContent className="space-y-2">
                  {pStages.map(s => (
                    <div key={s.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={s.status === 'concluido'}
                        onCheckedChange={() => toggleStage(s.id, s.status)}
                      />
                      <span className={`text-sm flex-1 ${s.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                        {s.name}
                      </span>
                      <Badge variant={s.status === 'concluido' ? 'default' : 'secondary'} className="text-[10px]">
                        {s.status === 'concluido' ? 'Feito' : s.status === 'em_andamento' ? 'Em curso' : 'Pendente'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </AppLayout>
  );
};

export default InstaladorPortal;
