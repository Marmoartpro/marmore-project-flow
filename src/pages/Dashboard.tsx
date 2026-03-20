import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, FolderOpen, DollarSign, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const totalValue = projects.reduce((sum, p) => sum + Number(p.total_value || 0), 0);
  const totalPaid = projects.reduce((sum, p) => sum + Number(p.paid_value || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'em_andamento').length;

  const statusLabel: Record<string, string> = {
    em_andamento: 'Em andamento',
    concluido: 'Concluído',
    pausado: 'Pausado',
  };

  const statusColor: Record<string, string> = {
    em_andamento: 'bg-accent text-accent-foreground',
    concluido: 'bg-success text-success-foreground',
    pausado: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">MármoreProart</h1>
            <p className="text-sm text-muted-foreground">
              Olá, {profile?.full_name || 'Usuário'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/projeto/novo')} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Novo projeto
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/20">
                <FolderOpen className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projetos ativos</p>
                <p className="text-2xl font-bold font-display">{activeProjects}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/20">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total recebido</p>
                <p className="text-2xl font-bold font-display">
                  R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/20">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">A receber</p>
                <p className="text-2xl font-bold font-display">
                  R$ {(totalValue - totalPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project List */}
        <div>
          <h2 className="text-xl font-display font-semibold mb-4">Seus projetos</h2>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum projeto ainda</p>
                <Button onClick={() => navigate('/projeto/novo')}>
                  <Plus className="w-4 h-4 mr-1" /> Criar primeiro projeto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/projeto/${project.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-display">{project.name}</CardTitle>
                      <Badge className={statusColor[project.status] || 'bg-muted'}>
                        {statusLabel[project.status] || project.status}
                      </Badge>
                    </div>
                    <CardDescription>{project.client_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {project.environment_type || 'Sem tipo'}
                      </span>
                      {project.deadline && (
                        <span className="text-muted-foreground">
                          Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    {Number(project.total_value) > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Pagamento</span>
                          <span className="font-medium">
                            {Math.round((Number(project.paid_value) / Number(project.total_value)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (Number(project.paid_value) / Number(project.total_value)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
