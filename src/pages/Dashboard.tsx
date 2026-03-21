import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle, FileText, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [projRes, payRes, quoteRes, remRes, stageRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('billing_reminders').select('*').eq('resolved', false),
      supabase.from('project_stages').select('*'),
    ]);
    setProjects(projRes.data || []);
    setPayments(payRes.data || []);
    setQuotes(quoteRes.data || []);
    setReminders(remRes.data || []);
    setStages(stageRes.data || []);
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

  // Get current stage name per project
  const projectStageMap: Record<string, string> = {};
  const activeProjects = projects.filter(p => p.status === 'em_andamento');
  activeProjects.forEach(p => {
    const pStages = stages.filter(s => s.project_id === p.id).sort((a, b) => a.stage_number - b.stage_number);
    const current = pStages.find(s => s.status !== 'concluida') || pStages[pStages.length - 1];
    projectStageMap[p.id] = current?.name || '';
  });

  // Get invite info - we'll simplify by checking project payment status
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

  // Alerts
  const alerts: { type: 'danger' | 'warning'; text: string }[] = [];
  overduePayments.forEach(p => {
    const proj = projects.find(pr => pr.id === p.project_id);
    alerts.push({ type: 'danger', text: `Parcela atrasada: ${p.description} — R$ ${Number(p.amount).toFixed(2)} (${proj?.name || ''})` });
  });
  // Due today
  payments.filter(p => !p.paid && p.due_date === today).forEach(p => {
    const proj = projects.find(pr => pr.id === p.project_id);
    alerts.push({ type: 'warning', text: `Vence hoje: ${p.description} — R$ ${Number(p.amount).toFixed(2)} (${proj?.name || ''})` });
  });
  // Follow-up reminders
  quotes.filter(q => q.follow_up_date && q.follow_up_date <= today && (q.status === 'aguardando' || q.status === 'negociando')).forEach(q => {
    alerts.push({ type: 'warning', text: `Retornar contato — ${q.client_name}` });
  });

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
              <div className="p-2.5 rounded-lg bg-primary/20">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total a receber</p>
                <p className="text-lg font-bold font-display">R$ {fmt(totalReceivable)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/20">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Recebido no mês</p>
                <p className="text-lg font-bold font-display">R$ {fmt(receivedThisMonth)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Em atraso</p>
                <p className="text-lg font-bold font-display">R$ {fmt(overdueTotal)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/20">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Orçamentos abertos</p>
                <p className="text-lg font-bold font-display">{openQuotes.length} <span className="text-sm font-normal text-muted-foreground">({fmt(openQuotesValue)})</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alertas do dia</h3>
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-md text-sm border ${
                  a.type === 'danger' ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-warning/10 border-warning/30 text-warning'
                }`}
              >
                {a.text}
              </div>
            ))}
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
                  <Card
                    key={p.id}
                    className="cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => navigate(`/projeto/${p.id}`)}
                  >
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
