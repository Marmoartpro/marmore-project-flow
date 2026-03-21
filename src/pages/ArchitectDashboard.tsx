import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const stageIcons = ['🪨', '📐', '✂️', '🔧', '✨'];

const ArchitectDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    const { data: projs } = await supabase.from('projects').select('*');
    setProjects(projs || []);
    if (projs && projs.length > 0) {
      const projectIds = projs.map(p => p.id);
      const [stRes, payRes, msgRes] = await Promise.all([
        supabase.from('project_stages').select('*').in('project_id', projectIds).order('stage_number'),
        supabase.from('payments').select('*').in('project_id', projectIds),
        supabase.from('messages').select('*').in('project_id', projectIds).order('created_at', { ascending: false }).limit(1),
      ]);
      setStages(stRes.data || []);
      setPayments(payRes.data || []);
      setLastMessage(msgRes.data?.[0] || null);
      
      // Get latest photos per stage
      const stageIds = (stRes.data || []).map(s => s.id);
      if (stageIds.length > 0) {
        const { data: photoData } = await supabase.from('stage_photos').select('*').in('stage_id', stageIds).order('created_at', { ascending: false });
        setPhotos(photoData || []);
      }
    }
  };

  // We show first project for simplicity
  const project = projects[0];
  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-sm">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhum projeto vinculado.</p>
            <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sair</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectStages = stages.filter(s => s.project_id === project.id).sort((a, b) => a.stage_number - b.stage_number);
  const completed = projectStages.filter(s => s.status === 'concluida').length;
  const pending = projectStages.length - completed;
  const totalValue = Number(project.total_value || 0);
  const paidValue = Number(project.paid_value || 0);
  const progress = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;

  const chartData = [
    { name: 'Concluídas', value: completed, color: 'hsl(145 63% 42%)' },
    { name: 'Pendentes', value: pending, color: 'hsl(0 0% 25%)' },
  ];

  const currentStage = projectStages.find(s => s.status !== 'concluida') || projectStages[projectStages.length - 1];

  const getLastPhoto = (stageId: string) => {
    return photos.find(p => p.stage_id === stageId);
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-display font-bold">MármoreProart</h1>
        <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Welcome card */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary font-display">{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Bem-vinda,</p>
              <p className="font-display font-bold text-lg">{profile?.full_name || 'Arquiteta'}</p>
              <p className="text-sm text-muted-foreground">{project.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Donut chart + Financial */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-xs text-muted-foreground mb-2">Progresso geral</p>
              <div className="w-28 h-28 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" innerRadius={30} outerRadius={50} paddingAngle={2} strokeWidth={0}>
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold font-display">{completed}/{projectStages.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Financeiro</p>
              <p className="text-lg font-bold font-display">R$ {fmt(totalValue)}</p>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2 mb-1">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Pago: R$ {fmt(paidValue)}</span>
                <span>Saldo: R$ {fmt(totalValue - paidValue)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-3">Linha do tempo</p>
            <div className="flex items-center gap-1">
              {projectStages.map((s, i) => {
                const isCurrent = s.id === currentStage?.id;
                const isDone = s.status === 'concluida';
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone ? 'bg-success text-success-foreground' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {s.stage_number}
                    </div>
                    <p className="text-[9px] text-center mt-1 text-muted-foreground leading-tight">{s.name}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stage cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projectStages.map((s, i) => {
            const photo = getLastPhoto(s.id);
            const isDone = s.status === 'concluida';
            const isActive = s.status === 'em_andamento';
            return (
              <Card key={s.id} className={`overflow-hidden ${!isDone && !isActive ? 'opacity-50' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{stageIcons[i]}</span>
                    <p className="text-sm font-medium flex-1">{s.name}</p>
                    <Badge className={`text-[10px] ${isDone ? 'bg-success text-success-foreground' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {isDone ? 'Concluída' : isActive ? 'Em andamento' : 'Pendente'}
                    </Badge>
                  </div>
                  {photo && (
                    <img src={photo.photo_url} alt="" className="w-full h-24 object-cover rounded-md" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick message */}
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/projeto/${project.id}`)}>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Último recado</p>
              <p className="text-sm truncate">{lastMessage?.content || 'Nenhuma mensagem'}</p>
            </div>
            <Button size="sm" variant="outline" className="text-xs">Responder</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArchitectDashboard;
