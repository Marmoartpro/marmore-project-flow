import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Filter, Check } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['hsl(205 59% 45%)', 'hsl(145 60% 40%)', 'hsl(35 90% 55%)', 'hsl(0 70% 55%)'];

const Financeiro = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showReminderForm, setShowReminderForm] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState({ date: '', value: '', note: '' });
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos');

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [pRes, payRes, remRes] = await Promise.all([
      supabase.from('projects').select('*').order('name'),
      supabase.from('payments').select('*').order('due_date'),
      supabase.from('billing_reminders').select('*').eq('resolved', false),
    ]);
    setProjects(pRes.data || []);
    setPayments(payRes.data || []);
    setReminders(remRes.data || []);
  };

  const today = new Date().toISOString().split('T')[0];
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // ── KPIs ──
  const kpis = useMemo(() => {
    const totalGeral = projects.reduce((s, p) => s + Number(p.total_value || 0), 0);
    const totalPago = projects.reduce((s, p) => s + Number(p.paid_value || 0), 0);
    const totalPendente = totalGeral - totalPago;
    const atrasados = payments.filter(p => !p.paid && p.due_date && p.due_date < today);
    const totalAtrasado = atrasados.reduce((s, p) => s + Number(p.amount || 0), 0);
    const proxVencimentos = payments.filter(p => {
      if (p.paid || !p.due_date) return false;
      const d = new Date(p.due_date);
      const now = new Date();
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });
    const totalProxVencer = proxVencimentos.reduce((s, p) => s + Number(p.amount || 0), 0);
    return { totalGeral, totalPago, totalPendente, totalAtrasado, totalProxVencer, atrasados: atrasados.length, proxVencimentos: proxVencimentos.length };
  }, [projects, payments, today]);

  // ── Charts data ──
  const chartData = projects.filter(p => Number(p.total_value || 0) > 0).map(p => ({
    name: p.name?.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    total: Number(p.total_value || 0),
    recebido: Number(p.paid_value || 0),
    saldo: Number(p.total_value || 0) - Number(p.paid_value || 0),
  }));

  const statusPieData = useMemo(() => {
    let quitados = 0, emDia = 0, atrasados = 0;
    projects.forEach(p => {
      const st = getStatusLabel(p);
      if (st === 'Quitado') quitados++;
      else if (st === 'Atrasado') atrasados++;
      else emDia++;
    });
    return [
      { name: 'Quitado', value: quitados },
      { name: 'Em dia', value: emDia },
      { name: 'Atrasado', value: atrasados },
    ].filter(d => d.value > 0);
  }, [projects, payments]);

  // Fluxo de caixa mensal (últimos 6 meses)
  const cashFlowData = useMemo(() => {
    const months: { label: string; recebido: number; pendente: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const recebido = payments.filter(p => p.paid && p.paid_at && p.paid_at.startsWith(key)).reduce((s, p) => s + Number(p.amount || 0), 0);
      const pendente = payments.filter(p => !p.paid && p.due_date && p.due_date.startsWith(key)).reduce((s, p) => s + Number(p.amount || 0), 0);
      months.push({ label, recebido, pendente });
    }
    return months;
  }, [payments]);

  function getStatusLabel(p: any) {
    const paid = Number(p.paid_value || 0);
    const total = Number(p.total_value || 0);
    if (paid >= total && total > 0) return 'Quitado';
    const hasOverdue = payments.some(pay => pay.project_id === p.id && !pay.paid && pay.due_date && pay.due_date < today);
    if (hasOverdue) return 'Atrasado';
    return 'Em dia';
  }

  const getStatusBadge = (label: string) => {
    if (label === 'Quitado') return 'bg-success text-success-foreground';
    if (label === 'Atrasado') return 'bg-destructive text-destructive-foreground';
    return 'bg-primary text-primary-foreground';
  };

  // ── Filtered projects ──
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filterStatus !== 'todos' && getStatusLabel(p) !== filterStatus) return false;
      return true;
    });
  }, [projects, filterStatus, payments]);

  // ── All payments with project name ──
  const allPayments = useMemo(() => {
    return payments.map(pay => {
      const proj = projects.find(p => p.id === pay.project_id);
      return { ...pay, projectName: proj?.name || '—' };
    }).filter(pay => {
      if (selectedMonth === 'todos') return true;
      const dateField = pay.paid ? pay.paid_at : pay.due_date;
      return dateField && dateField.startsWith(selectedMonth);
    }).sort((a, b) => {
      const dA = a.due_date || a.created_at;
      const dB = b.due_date || b.created_at;
      return dA < dB ? -1 : 1;
    });
  }, [payments, projects, selectedMonth]);

  // Available months for filter
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p => {
      const d = p.due_date || p.created_at;
      if (d) set.add(d.substring(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [payments]);

  const createReminder = async (projectId: string) => {
    if (!user || !reminderForm.date) return;
    await supabase.from('billing_reminders').insert({
      owner_id: user.id,
      project_id: projectId,
      reminder_date: reminderForm.date,
      expected_value: reminderForm.value ? parseFloat(reminderForm.value) : 0,
      note: reminderForm.note,
    });
    setShowReminderForm(null);
    setReminderForm({ date: '', value: '', note: '' });
    fetchAll();
    toast.success('Cobrança registrada!');
  };

  const resolveReminder = async (id: string) => {
    await supabase.from('billing_reminders').update({ resolved: true }).eq('id', id);
    fetchAll();
    toast.success('Cobrança resolvida!');
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        <h2 className="text-xl font-display font-bold">Financeiro</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Geral</p>
              </div>
              <p className="text-lg font-bold font-display">R$ {fmt(kpis.totalGeral)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-success" />
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Recebido</p>
              </div>
              <p className="text-lg font-bold font-display text-success">R$ {fmt(kpis.totalPago)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-warning" />
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Pendente</p>
              </div>
              <p className="text-lg font-bold font-display text-warning">R$ {fmt(kpis.totalPendente)}</p>
              {kpis.proxVencimentos > 0 && (
                <p className="text-[10px] text-warning mt-1">{kpis.proxVencimentos} vencendo em 7 dias (R$ {fmt(kpis.totalProxVencer)})</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Em Atraso</p>
              </div>
              <p className="text-lg font-bold font-display text-destructive">R$ {fmt(kpis.totalAtrasado)}</p>
              {kpis.atrasados > 0 && (
                <p className="text-[10px] text-destructive mt-1">{kpis.atrasados} parcela(s)</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress bar global */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Recebimento global</span>
              <span>{kpis.totalGeral > 0 ? Math.round((kpis.totalPago / kpis.totalGeral) * 100) : 0}%</span>
            </div>
            <Progress value={kpis.totalGeral > 0 ? (kpis.totalPago / kpis.totalGeral) * 100 : 0} className="h-3" />
          </CardContent>
        </Card>

        {/* Reminders */}
        {reminders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cobranças pendentes</h3>
            {reminders.map(r => {
              const proj = projects.find(p => p.id === r.project_id);
              return (
                <div key={r.id} className="px-3 py-2 rounded-md text-sm bg-warning/10 border border-warning/30 text-warning flex justify-between items-center gap-2">
                  <span className="flex-1">{proj?.name} — R$ {fmt(Number(r.expected_value))} ({new Date(r.reminder_date + 'T00:00:00').toLocaleDateString('pt-BR')}) {r.note && `• ${r.note}`}</span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-success hover:text-success" onClick={() => resolveReminder(r.id)}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <Tabs defaultValue="visao-geral">
          <TabsList>
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
            <TabsTrigger value="projetos">Por Projeto</TabsTrigger>
          </TabsList>

          {/* ── Tab: Visão Geral ── */}
          <TabsContent value="visao-geral" className="space-y-4 mt-4">
            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fluxo de caixa */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Fluxo de Caixa (6 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
                        <Line type="monotone" dataKey="recebido" stroke="hsl(145 60% 40%)" strokeWidth={2} name="Recebido" dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="pendente" stroke="hsl(35 90% 55%)" strokeWidth={2} name="Pendente" dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Status dos Projetos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52 flex items-center justify-center">
                    {statusPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {statusPieData.map((_, i) => (
                              <Cell key={i} fill={[COLORS[1], COLORS[0], COLORS[3]][i % 3]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bar chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Total x Recebido por Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
                        <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="recebido" fill="hsl(205 59% 45%)" name="Recebido" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Tab: Parcelas ── */}
          <TabsContent value="parcelas" className="space-y-4 mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os meses</SelectItem>
                    {availableMonths.map(m => {
                      const [y, mo] = m.split('-');
                      const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      return <SelectItem key={m} value={m}>{label}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">{allPayments.length} parcela(s)</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Projeto</TableHead>
                        <TableHead className="text-xs">Descrição</TableHead>
                        <TableHead className="text-xs text-right">Valor</TableHead>
                        <TableHead className="text-xs">Vencimento</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPayments.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">Nenhuma parcela encontrada</TableCell></TableRow>
                      )}
                      {allPayments.map(pay => {
                        const isOverdue = !pay.paid && pay.due_date && pay.due_date < today;
                        return (
                          <TableRow key={pay.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                            <TableCell className="text-xs font-medium cursor-pointer hover:text-primary" onClick={() => navigate(`/projeto/${pay.project_id}`)}>{pay.projectName}</TableCell>
                            <TableCell className="text-xs">{pay.description}</TableCell>
                            <TableCell className="text-xs text-right font-medium">R$ {fmt(Number(pay.amount))}</TableCell>
                            <TableCell className="text-xs">{pay.due_date ? new Date(pay.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${pay.paid ? 'bg-success text-success-foreground' : isOverdue ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}`}>
                                {pay.paid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Por Projeto ── */}
          <TabsContent value="projetos" className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Em dia">Em dia</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Quitado">Quitado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{filteredProjects.length} projeto(s)</p>
            </div>

            <div className="space-y-2">
              {filteredProjects.map(p => {
                const st = getStatusLabel(p);
                const total = Number(p.total_value || 0);
                const paid = Number(p.paid_value || 0);
                const progress = total > 0 ? (paid / total) * 100 : 0;
                const projPayments = payments.filter(pay => pay.project_id === p.id);
                const nextDue = projPayments.filter(pay => !pay.paid && pay.due_date).sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

                return (
                  <Card key={p.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="cursor-pointer" onClick={() => navigate(`/projeto/${p.id}`)}>
                          <p className="font-medium text-sm hover:text-primary transition-colors">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.client_name || '—'}</p>
                        </div>
                        <Badge className={getStatusBadge(st) + ' text-[10px]'}>{st}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                        <span>Total: R$ {fmt(total)}</span>
                        <span className="text-success">Pago: R$ {fmt(paid)}</span>
                        <span className="text-warning">Saldo: R$ {fmt(total - paid)}</span>
                      </div>

                      <Progress value={progress} className="h-2 mb-2" />

                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-muted-foreground">
                          {projPayments.length > 0 && <span>{projPayments.filter(p => p.paid).length}/{projPayments.length} parcelas pagas</span>}
                          {nextDue && (
                            <span className="ml-2">• Próx. venc: {new Date(nextDue.due_date + 'T00:00:00').toLocaleDateString('pt-BR')} (R$ {fmt(Number(nextDue.amount))})</span>
                          )}
                        </div>
                      </div>

                      {showReminderForm === p.id ? (
                        <div className="space-y-2 pt-2 mt-2 border-t border-border">
                          <div className="grid grid-cols-2 gap-2">
                            <div><Label className="text-xs">Data</Label><Input type="date" value={reminderForm.date} onChange={e => setReminderForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-xs" /></div>
                            <div><Label className="text-xs">Valor</Label><Input type="number" step="0.01" value={reminderForm.value} onChange={e => setReminderForm(f => ({ ...f, value: e.target.value }))} className="h-8 text-xs" /></div>
                          </div>
                          <Textarea placeholder="Nota..." value={reminderForm.note} onChange={e => setReminderForm(f => ({ ...f, note: e.target.value }))} rows={2} className="text-xs" />
                          <div className="flex gap-2">
                            <Button size="sm" className="text-xs h-7" onClick={() => createReminder(p.id)}>Salvar</Button>
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowReminderForm(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs h-7 mt-2" onClick={() => setShowReminderForm(p.id)}>
                          Registrar cobrança
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
