import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, AlertTriangle, FileText, TrendingUp, Copy, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [projRes, payRes, quoteRes, remRes, stageRes, invRes, notRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('billing_reminders').select('*').eq('resolved', false),
      supabase.from('project_stages').select('*'),
      supabase.from('project_invites').select('*, projects(name)').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('read', false).order('created_at', { ascending: false }),
    ]);
    setProjects(projRes.data || []);
    setPayments(payRes.data || []);
    setQuotes(quoteRes.data || []);
    setReminders(remRes.data || []);
    setStages(stageRes.data || []);
    setInvites(invRes.data || []);
    setNotifications(notRes.data || []);
    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const totalReceivable = projects.reduce((s, p) => s + (Number(p.total_value || 0) - Number(p.paid_value || 0)), 0);
  const receivedThisMonth = payments
    .filter(p => p.paid && p.paid_at && new Date(p.paid_at).getMonth() === thisMonth && new Date(p.paid_at).getFullYear() === thisYear)
    .reduce((s, p) => s + Number(p.amount), 0);
  const overduePayments = payments.filter(p => !p.paid && p.due_date && p.due_date < today);
  const overdueTotal = overduePayments.reduce((s, p) => s + Number(p.amount), 0);
  const openQuotes = quotes.filter(q => q.status === 'aguardando' || q.status === 'negociando');
  const openQuotesValue = openQuotes.reduce((s, q) => s + Number(q.estimated_value || 0), 0);

  const projectStageMap: Record<string, string> = {};
  const activeProjects = projects.filter(p => p.status === 'em_andamento');
  activeProjects.forEach(p => {
    const pStages = stages.filter(s => s.project_id === p.id).sort((a, b) => a.stage_number - b.stage_number);
    const current = pStages.find(s => s.status !== 'concluida') || pStages[pStages.length - 1];
    projectStageMap[p.id] = current?.name || '';
  });

  const getPaymentStatus = (projectId: string) => {
    const projectPayments = payments.filter(p => p.project_id === projectId);
    const hasOverdue = projectPayments.some(p => !p.paid && p.due_date && p.due_date < today);
    if (hasOverdue) return { label: 'Atrasado', color: 'bg-destructive text-destructive-foreground' };
    return { label: 'Em dia', color: 'bg-success text-success-foreground' };
  };

  const getProjectProgress = (projectId: string) => {
    const pStages = stages.filter(s => s.project_id === projectId);
    if (pStages.length === 0) return 0;
    return (pStages.filter(s => s.status === 'concluida').length / pStages.length) * 100;
  };

  const alerts: { type: 'danger' | 'warning' | 'info'; text: string }[] = [];
  overduePayments.forEach(p => {
    const proj = projects.find(pr => pr.id === p.project_id);
    alerts.push({ type: 'danger', text: `Parcela atrasada: ${p.description} — R$ ${Number(p.amount).toFixed(2)} (${proj?.name || ''})` });
  });
  payments.filter(p => !p.paid && p.due_date === today).forEach(p => {
    const proj = projects.find(pr => pr.id === p.project_id);
    alerts.push({ type: 'warning', text: `Vence hoje: ${p.description} — R$ ${Number(p.amount).toFixed(2)} (${proj?.name || ''})` });
  });
  quotes.filter(q => q.follow_up_date && q.follow_up_date <= today && (q.status === 'aguardando' || q.status === 'negociando')).forEach(q => {
    alerts.push({ type: 'warning', text: `Retornar contato — ${q.client_name}` });
  });
  notifications.forEach(n => {
    alerts.push({ type: 'info', text: n.message || n.title });
  });

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    toast.success('Link copiado!');
  };

  const resendInvite = async (inviteId: string) => {
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    await supabase.from('project_invites').update({
      invite_token: newToken,
      status: 'pendente',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', inviteId);
    toast.success('Novo link gerado!');
    fetchAll();
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(n => n.filter(x => x.id !== id));
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div></AppLayout>;

  return (
    <AppLayout alertCount={alerts.length}>
      <div className="p-4 md:p-6 space-y-6">
        <h2 className="text-xl font-display font-bold">Olá, {profile?.full_name || 'Usuário'}</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/20"><DollarSign className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total a receber</p>
                <p className="text-lg font-bold font-display">R$ {fmt(totalReceivable)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/20"><TrendingUp className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground">Recebido no mês</p>
                <p className="text-lg font-bold font-display">R$ {fmt(receivedThisMonth)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-destructive/20"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground">Em atraso</p>
                <p className="text-lg font-bold font-display">R$ {fmt(overdueTotal)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/20"><FileText className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground">Orçamentos abertos</p>
                <p className="text-lg font-bold font-display">{openQuotes.length} <span className="text-sm font-normal text-muted-foreground">({fmt(openQuotesValue)})</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts + Notifications */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alertas do dia</h3>
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-md text-sm border flex items-center justify-between ${
                  a.type === 'danger' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                  a.type === 'info' ? 'bg-primary/10 border-primary/30 text-primary' :
                  'bg-warning/10 border-warning/30 text-warning'
                }`}
              >
                <span>{a.text}</span>
                {a.type === 'info' && (
                  <button onClick={() => { const n = notifications.find(x => x.message === a.text || x.title === a.text); if (n) markNotificationRead(n.id); }}
                    className="text-xs opacity-60 hover:opacity-100 ml-2">✓</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Invites sent */}
        {invites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Convites enviados</h3>
            {invites.map(inv => {
              const isAccepted = inv.accepted || inv.status === 'aceito';
              const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date() && !isAccepted;
              return (
                <Card key={inv.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.architect_name || inv.architect_email}</p>
                      <p className="text-xs text-muted-foreground truncate">{(inv.projects as any)?.name} • {new Date(inv.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] ${isAccepted ? 'bg-success text-success-foreground' : isExpired ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}`}>
                        {isAccepted ? 'Aceito' : isExpired ? 'Expirado' : 'Aguardando'}
                      </Badge>
                      {!isAccepted && (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyInviteLink(inv.invite_token)} title="Copiar link">
                            <Copy className="w-3 h-3" />
                          </Button>
                          {isExpired && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => resendInvite(inv.id)} title="Reenviar">
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Active projects */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Projetos ativos</h3>
          {activeProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum projeto ativo.</p>
          ) : (
            <div className="space-y-2">
              {activeProjects.map(p => {
                const status = getPaymentStatus(p.id);
                const progress = getProjectProgress(p.id);
                return (
                  <Card key={p.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/projeto/${p.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.client_name || 'Sem cliente'}</p>
                        </div>
                        <Badge className={status.color + ' text-[10px]'}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{projectStageMap[p.id]}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
