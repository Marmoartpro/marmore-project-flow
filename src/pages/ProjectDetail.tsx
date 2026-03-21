import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import ProjectOverview from '@/components/project/ProjectOverview';
import ProjectEvolution from '@/components/project/ProjectEvolution';
import ProjectPayments from '@/components/project/ProjectPayments';
import ProjectMessages from '@/components/project/ProjectMessages';
import ProjectPlant from '@/components/project/ProjectPlant';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single();
    setProject(data);
    const { data: inv } = await supabase.from('project_invites').select('*').eq('project_id', id).limit(1).maybeSingle();
    setInvite(inv);
    setLoading(false);
  };

  const copyInviteLink = () => {
    if (!invite) return;
    const link = `${window.location.origin}/invite/${invite.invite_token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de convite copiado!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Projeto não encontrado</div>;

  const isOwner = project.owner_id === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(isOwner ? '/dashboard' : '/architect')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-display font-bold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">{project.client_name}</p>
              </div>
            </div>
            {isOwner && invite && (
              <Button variant="outline" size="sm" onClick={copyInviteLink}>
                <Share2 className="w-4 h-4 mr-1" /> Copiar link
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4 bg-card">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="evolution">Evolução</TabsTrigger>
            <TabsTrigger value="plant">Planta</TabsTrigger>
            <TabsTrigger value="payments">Pagamento</TabsTrigger>
            <TabsTrigger value="messages">Recados</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><ProjectOverview project={project} invite={invite} isOwner={isOwner} /></TabsContent>
          <TabsContent value="evolution"><ProjectEvolution projectId={project.id} isOwner={isOwner} /></TabsContent>
          <TabsContent value="plant"><ProjectPlant projectId={project.id} /></TabsContent>
          <TabsContent value="payments"><ProjectPayments project={project} isOwner={isOwner} onUpdate={fetchProject} /></TabsContent>
          <TabsContent value="messages"><ProjectMessages projectId={project.id} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProjectDetail;
