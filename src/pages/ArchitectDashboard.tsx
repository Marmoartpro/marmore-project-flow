import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, LogOut, Package, Bell, Camera, Filter as FilterIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [fullPhoto, setFullPhoto] = useState<any>(null);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    const { data: projs } = await supabase.from('projects').select('*');
    setProjects(projs || []);

    const { data: notifs } = await supabase.from('notifications').select('*').eq('read', false).order('created_at', { ascending: false }).limit(10);
    setNotifications(notifs || []);

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

      const stageIds = (stRes.data || []).map(s => s.id);
      if (stageIds.length > 0) {
        const { data: photoData } = await supabase.from('stage_photos').select('*').in('stage_id', stageIds).order('created_at', { ascending: false });
        setPhotos(photoData || []);
      }
    }
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(n => n.filter(x => x.id !== id));
  };

  const project = projects[0];
  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-muted-foreground">Você ainda não tem acesso a nenhum projeto.</p>
            <p className="text-sm text-muted-foreground">Solicite um link de convite ao seu marmorista.</p>
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
  const getLastPhoto = (stageId: string) => photos.find(p => p.stage_id === stageId);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-display font-bold">MármoreProart</h1>
        <div className="flex items-center gap-2">
          <button className="relative" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell className="w-5 h-5 text-muted-foreground" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center">{notifications.length}</span>
            )}
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/mostruario')}>
            <Package className="w-4 h-4 mr-1" /> Mostruário
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      {/* Notifications dropdown */}
      {showNotifs && notifications.length > 0 && (
        <div className="px-4 py-2 bg-card border-b border-border space-y-1">
          {notifications.map(n => (
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

        {/* Donut + Financial */}
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
              {projectStages.map((s) => {
                const isCurrent = s.id === currentStage?.id;
                const isDone = s.status === 'concluida';
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone ? 'bg-success text-success-foreground' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>{s.stage_number}</div>
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
                  {photo && <img src={photo.photo_url} alt="" className="w-full h-24 object-cover rounded-md" />}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gallery */}
        {photos.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Galeria da obra</p>
                <div className="flex gap-2">
                  <Select value={galleryFilter} onValueChange={setGalleryFilter}>
                    <SelectTrigger className="h-7 w-28 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {projectStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(galleryFilter === 'all' ? photos : photos.filter(p => p.stage_id === galleryFilter))
                  .slice(0, showAllPhotos ? undefined : 6)
                  .map(p => {
                    const stage = projectStages.find(s => s.id === p.stage_id);
                    return (
                      <div key={p.id} className="relative cursor-pointer group" onClick={() => setFullPhoto(p)}>
                        <img src={p.photo_url} alt="" className="w-full aspect-square object-cover rounded-md" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity">
                          {stage?.name} • {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {photos.length > 6 && !showAllPhotos && (
                <Button size="sm" variant="ghost" className="w-full text-xs mt-2" onClick={() => setShowAllPhotos(true)}>
                  Ver todas as fotos ({photos.length})
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fullscreen photo */}
        {fullPhoto && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center" onClick={() => setFullPhoto(null)}>
            <img src={fullPhoto.photo_url} alt="" className="max-w-full max-h-[80vh] object-contain" />
            <div className="text-white text-center mt-3">
              <p className="text-sm font-medium">{projectStages.find(s => s.id === fullPhoto.stage_id)?.name}</p>
              <p className="text-xs text-white/60">{new Date(fullPhoto.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        )}

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
