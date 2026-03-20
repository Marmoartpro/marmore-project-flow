import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, MapPin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  projectId: string;
}

const ProjectPlant = ({ projectId }: Props) => {
  const { user } = useAuth();
  const [plantUrl, setPlantUrl] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlant();
    fetchAnnotations();
  }, [projectId]);

  const fetchPlant = async () => {
    const { data } = await supabase.storage.from('project-files').list(`plants/${projectId}`);
    if (data && data.length > 0) {
      const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(`plants/${projectId}/${data[0].name}`);
      setPlantUrl(publicUrl);
    }
  };

  const fetchAnnotations = async () => {
    const { data } = await supabase
      .from('plant_annotations')
      .select('*, profiles:author_id(full_name)')
      .eq('project_id', projectId)
      .order('created_at');
    setAnnotations(data || []);
  };

  const uploadPlant = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `plants/${projectId}/planta.${ext}`;
    await supabase.storage.from('project-files').upload(path, file, { upsert: true });
    fetchPlant();
    toast.success('Planta enviada!');
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickPos({ x, y });
  };

  const addAnnotation = async () => {
    if (!clickPos || !newComment.trim() || !user) return;
    await supabase.from('plant_annotations').insert({
      project_id: projectId,
      x_position: clickPos.x,
      y_position: clickPos.y,
      comment: newComment.trim(),
      author_id: user.id,
    });
    setClickPos(null);
    setNewComment('');
    fetchAnnotations();
    toast.success('Marcação adicionada!');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {!plantUrl ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Envie a planta do projeto</p>
            <label className="cursor-pointer">
              <Button asChild>
                <span>Selecionar arquivo</span>
              </Button>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadPlant(file);
              }} />
            </label>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">Planta</CardTitle>
              <p className="text-xs text-muted-foreground">Clique na imagem para adicionar marcação</p>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={imageRef} className="relative cursor-crosshair" onClick={handleImageClick}>
              <img src={plantUrl} alt="Planta" className="w-full rounded-md border border-border" />
              
              {annotations.map((ann, i) => (
                <div
                  key={ann.id}
                  className="absolute group"
                  style={{ left: `${ann.x_position}%`, top: `${ann.y_position}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shadow-md">
                    {i + 1}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 min-w-[150px]">
                    <div className="bg-card border border-border rounded-md p-2 text-xs shadow-lg">
                      <p className="font-medium">{ann.comment}</p>
                    </div>
                  </div>
                </div>
              ))}

              {clickPos && (
                <div
                  className="absolute z-20"
                  style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%`, transform: 'translate(-50%, -100%)' }}
                >
                  <div className="bg-card border border-border rounded-md p-2 shadow-lg flex gap-2 min-w-[200px]">
                    <Input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Comentário..."
                      className="text-xs h-8"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && addAnnotation()}
                    />
                    <Button size="sm" className="h-8" onClick={addAnnotation}>
                      <MapPin className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Annotation list */}
            {annotations.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Marcações</p>
                {annotations.map((ann, i) => (
                  <div key={ann.id} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p>{ann.comment}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-3 h-3 mr-1" /> Trocar planta</span>
                </Button>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadPlant(file);
                }} />
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectPlant;
