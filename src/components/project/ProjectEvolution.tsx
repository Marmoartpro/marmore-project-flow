import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Circle, Clock, Upload } from 'lucide-react';
import { toast } from 'sonner';
import StageComments from './StageComments';
import { notifyStageCompleted } from '@/lib/notifications';

interface Props {
  projectId: string;
  projectName?: string;
  isOwner: boolean;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pendente: { label: 'Pendente', icon: Circle, color: 'bg-muted text-muted-foreground' },
  em_andamento: { label: 'Em andamento', icon: Clock, color: 'bg-accent text-accent-foreground' },
  concluida: { label: 'Concluída', icon: CheckCircle, color: 'bg-success text-success-foreground' },
};

const ProjectEvolution = ({ projectId, projectName = '', isOwner }: Props) => {
  const [stages, setStages] = useState<any[]>([]);
  const [photos, setPhotos] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [projectId]);

  const fetchStages = async () => {
    const { data } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_number');
    setStages(data || []);

    if (data) {
      const stageIds = data.map(s => s.id);
      const { data: photoData } = await supabase
        .from('stage_photos')
        .select('*')
        .in('stage_id', stageIds)
        .order('created_at');

      const grouped: Record<string, any[]> = {};
      photoData?.forEach(p => {
        if (!grouped[p.stage_id]) grouped[p.stage_id] = [];
        grouped[p.stage_id].push(p);
      });
      setPhotos(grouped);
    }
    setLoading(false);
  };

  const canActivate = (stage: any) => {
    if (stage.stage_number === 1) return true;
    const prev = stages.find(s => s.stage_number === stage.stage_number - 1);
    return prev?.status === 'concluida';
  };

  const updateStatus = async (stageId: string, newStatus: string) => {
    await supabase.from('project_stages').update({
      status: newStatus,
      completed_at: newStatus === 'concluida' ? new Date().toISOString() : null,
    }).eq('id', stageId);
    
    // FIX #17: Send notification on stage completion
    if (newStatus === 'concluida') {
      const stage = stages.find(s => s.id === stageId);
      if (stage) {
        const { data: proj } = await supabase.from('projects').select('owner_id').eq('id', projectId).single();
        if (proj) {
          await notifyStageCompleted(projectId, stage.name, proj.owner_id);
        }
      }
    }
    
    fetchStages();
    toast.success('Status atualizado!');
  };

  const handlePhotoUpload = async (stageId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `stages/${stageId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('project-files').upload(path, file);
    if (uploadError) { toast.error('Erro ao enviar foto'); return; }
    const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(path);
    await supabase.from('stage_photos').insert({ stage_id: stageId, photo_url: publicUrl });
    fetchStages();
    toast.success('Foto adicionada!');
  };

  const handleDescUpdate = async (stageId: string, description: string) => {
    await supabase.from('project_stages').update({ description }).eq('id', stageId);
    toast.success('Descrição salva!');
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-1">
        {stages.map(stage => (
          <div key={stage.id} className="flex-1">
            <div className={`h-2 rounded-full transition-colors ${
              stage.status === 'concluida' ? 'bg-success' :
              stage.status === 'em_andamento' ? 'bg-accent' : 'bg-muted'
            }`} />
          </div>
        ))}
      </div>

      {stages.map((stage) => {
        const config = statusConfig[stage.status];
        const Icon = config.icon;
        const isActive = canActivate(stage);
        const stagePhotos = photos[stage.id] || [];

        return (
          <Card key={stage.id} className={!isActive && stage.status === 'pendente' ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span>{stage.stage_number}. {stage.name}</span>
                </CardTitle>
                <Badge className={config.color}>{config.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isOwner && isActive && (
                <div className="flex gap-2 flex-wrap">
                  {stage.status === 'pendente' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(stage.id, 'em_andamento')}>
                      Iniciar
                    </Button>
                  )}
                  {stage.status === 'em_andamento' && (
                    <Button size="sm" onClick={() => updateStatus(stage.id, 'concluida')}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Concluir
                    </Button>
                  )}
                </div>
              )}

              <Textarea
                placeholder="Descrição / observações desta etapa..."
                defaultValue={stage.description || ''}
                onBlur={(e) => isOwner && handleDescUpdate(stage.id, e.target.value)}
                readOnly={!isOwner}
                rows={2}
                className="text-sm"
              />

              {stagePhotos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {stagePhotos.map(photo => (
                    <a key={photo.id} href={photo.photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={photo.photo_url} alt="Foto" className="w-20 h-20 object-cover rounded-md border border-border" />
                    </a>
                  ))}
                </div>
              )}

              {isOwner && isActive && (
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Enviar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(stage.id, file);
                    }}
                  />
                </label>
              )}

              {/* Comments section */}
              <StageComments
                stageId={stage.id}
                stageName={stage.name}
                projectId={projectId}
                projectName={projectName}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProjectEvolution;
