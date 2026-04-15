import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Camera, AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CHECKLIST_ITEMS = [
  'Conferir medidas no local',
  'Verificar nivelamento da base',
  'Proteger áreas adjacentes',
  'Aplicar adesivo/argamassa',
  'Posicionar peças',
  'Verificar alinhamento e nível',
  'Aplicar rejunte',
  'Limpeza final',
  'Registrar fotos de conclusão',
];

const InstaladorPortal = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<Record<string, boolean[]>>({});
  const [occurrenceText, setOccurrenceText] = useState<Record<string, string>>({});

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    // FIX #2: Only show projects assigned to this installer
    const { data: assignments } = await (supabase as any)
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user!.id);

    if (!assignments || assignments.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const projectIds = assignments.map((a: any) => a.project_id);
    const { data: projs } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .eq('status', 'em_andamento')
      .order('deadline');

    setProjects(projs || []);

    if (projs && projs.length > 0) {
      const ids = projs.map(p => p.id);
      const { data: st } = await supabase.from('project_stages').select('*').in('project_id', ids).order('stage_number');
      setStages(st || []);

      // Init checklists
      const cl: Record<string, boolean[]> = {};
      (projs || []).forEach(p => { cl[p.id] = new Array(CHECKLIST_ITEMS.length).fill(false); });
      setChecklists(cl);
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
    toast.success(newStatus === 'concluido' ? 'Etapa concluída!' : 'Etapa reaberta');
  };

  const toggleChecklist = (projectId: string, index: number) => {
    setChecklists(prev => {
      const copy = { ...prev };
      copy[projectId] = [...(copy[projectId] || [])];
      copy[projectId][index] = !copy[projectId][index];
      return copy;
    });
  };

  const handlePhotoUpload = async (stageId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `stages/${stageId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('project-files').upload(path, file);
    if (error) { toast.error('Erro ao enviar foto'); return; }
    const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(path);
    await supabase.from('stage_photos').insert({ stage_id: stageId, photo_url: publicUrl });
    toast.success('Foto registrada!');
  };

  const reportOccurrence = async (projectId: string) => {
    const text = occurrenceText[projectId];
    if (!text?.trim()) return;
    // Find active stage
    const activeStage = stages.find(s => s.project_id === projectId && s.status !== 'concluido');
    if (!activeStage) { toast.error('Nenhuma etapa ativa'); return; }
    await supabase.from('stage_comments').insert({
      stage_id: activeStage.id,
      author_id: user!.id,
      content: `⚠️ Ocorrência: ${text.trim()}`,
      has_alert: true,
    });
    setOccurrenceText(prev => ({ ...prev, [projectId]: '' }));
    toast.success('Ocorrência registrada!');
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
            const checklist = checklists[p.id] || [];
            const completedItems = checklist.filter(Boolean).length;
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
                <CardContent className="space-y-4">
                  {/* Stages */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Etapas</p>
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
                        {/* Photo upload per stage */}
                        <label className="cursor-pointer">
                          <Camera className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          <input type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(s.id, file);
                          }} />
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Checklist - FIX #13 */}
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Checklist de Instalação ({completedItems}/{CHECKLIST_ITEMS.length})
                    </p>
                    {CHECKLIST_ITEMS.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Checkbox
                          checked={checklist[i] || false}
                          onCheckedChange={() => toggleChecklist(p.id, i)}
                        />
                        <span className={`text-xs ${checklist[i] ? 'line-through text-muted-foreground' : ''}`}>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Occurrence report */}
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Registrar Ocorrência
                    </p>
                    <Textarea
                      placeholder="Descreva o problema encontrado..."
                      value={occurrenceText[p.id] || ''}
                      onChange={e => setOccurrenceText(prev => ({ ...prev, [p.id]: e.target.value }))}
                      rows={2}
                      className="text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => reportOccurrence(p.id)} disabled={!occurrenceText[p.id]?.trim()}>
                      Registrar ocorrência
                    </Button>
                  </div>
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
