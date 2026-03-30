import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Package } from 'lucide-react';

const COLORS = [
  'hsl(205, 59%, 45%)', 'hsl(145, 63%, 42%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)', 'hsl(170, 60%, 40%)',
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const Relatorios = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [budgetQuotes, setBudgetQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stones, setStones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [pRes, payRes, qRes, bqRes, cRes, sRes] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('budget_quotes').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('stones').select('id, category'),
    ]);
    setProjects(pRes.data || []);
    setPayments(payRes.data || []);
    setQuotes(qRes.data || []);
    setBudgetQuotes(bqRes.data || []);
    setClients(cRes.data || []);
    setStones(sRes.data || []);
    setLoading(false);
  };

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Monthly revenue data (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const months: { month: string; recebido: number; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const received = payments
        .filter(p => p.paid && p.paid_at && new Date(p.paid_at).getMonth() === m && new Date(p.paid_at).getFullYear() === y)
        .reduce((s, p) => s + Number(p.amount), 0);
      const projected = projects
        .filter(p => new Date(p.created_at).getMonth() === m && new Date(p.created_at).getFullYear() === y)
        .reduce((s, p) => s + Number(p.total_value || 0), 0);
      months.push({ month: label, recebido: received, total: projected });
    }
    return months;
  }, [payments, projects]);

  // Project status distribution
  const statusDistribution = useMemo(() => {
    const active = projects.filter(p => p.status === 'em_andamento' && !p.archived).length;
    const completed = projects.filter(p => p.status === 'concluido').length;
    const archived = projects.filter(p => p.archived).length;
    return [
      { name: 'Em andamento', value: active },
      { name: 'Concluído', value: completed },
      { name: 'Arquivado', value: archived },
    ].filter(d => d.value > 0);
  }, [projects]);

  // Quote conversion rate
  const quoteStats = useMemo(() => {
    const allQuotes = [...quotes, ...budgetQuotes];
    const total = allQuotes.length;
    const approved = allQuotes.filter(q => q.status === 'aprovado').length;
    const rejected = allQuotes.filter(q => q.status === 'recusado').length;
    const pending = allQuotes.filter(q => ['aguardando', 'rascunho', 'gerado', 'enviado'].includes(q.status)).length;
    return { total, approved, rejected, pending, rate: total > 0 ? ((approved / total) * 100).toFixed(1) : '0' };
  }, [quotes, budgetQuotes]);

  // Stone categories
  const stoneCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    stones.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [stones]);

  // KPIs
  const totalRevenue = payments.filter(p => p.paid).reduce((s, p) => s + Number(p.amount), 0);
  const thisMonthRevenue = payments
    .filter(p => p.paid && p.paid_at && new Date(p.paid_at).getMonth() === thisMonth && new Date(p.paid_at).getFullYear() === thisYear)
    .reduce((s, p) => s + Number(p.amount), 0);
  const lastMonthRevenue = payments
    .filter(p => {
      if (!p.paid || !p.paid_at) return false;
      const d = new Date(p.paid_at);
      const lm = thisMonth === 0 ? 11 : thisMonth - 1;
      const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
      return d.getMonth() === lm && d.getFullYear() === ly;
    })
    .reduce((s, p) => s + Number(p.amount), 0);
  const revenueGrowth = lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : null;
  const avgProjectValue = projects.length > 0 ? projects.reduce((s, p) => s + Number(p.total_value || 0), 0) / projects.length : 0;

  const tooltipStyle = {
    contentStyle: { backgroundColor: 'hsl(0 0% 10%)', border: '1px solid hsl(0 0% 17%)', borderRadius: 6 },
    labelStyle: { color: 'hsl(35 15% 90%)' },
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h2 className="text-xl font-display font-bold">Relatórios</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-muted-foreground">Faturamento total</span>
              </div>
              <p className="text-lg font-bold font-display">R$ {fmt(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {revenueGrowth && Number(revenueGrowth) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <span className="text-[11px] text-muted-foreground">Este mês</span>
              </div>
              <p className="text-lg font-bold font-display">R$ {fmt(thisMonthRevenue)}</p>
              {revenueGrowth && (
                <span className={`text-[10px] ${Number(revenueGrowth) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {Number(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}% vs mês anterior
                </span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-muted-foreground">Taxa de conversão</span>
              </div>
              <p className="text-lg font-bold font-display">{quoteStats.rate}%</p>
              <span className="text-[10px] text-muted-foreground">{quoteStats.approved} de {quoteStats.total} orçamentos</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-muted-foreground">Ticket médio</span>
              </div>
              <p className="text-lg font-bold font-display">R$ {fmt(avgProjectValue)}</p>
              <span className="text-[10px] text-muted-foreground">{projects.length} projetos</span>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="faturamento">
          <TabsList className="bg-card">
            <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
            <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="faturamento" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Faturamento mensal (últimos 6 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 17%)" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip {...tooltipStyle} formatter={(v: number) => `R$ ${fmt(v)}`} />
                      <Legend />
                      <Area type="monotone" dataKey="recebido" name="Recebido" stroke="hsl(145, 63%, 42%)" fill="hsl(145, 63%, 42%)" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="total" name="Projetado" stroke="hsl(205, 59%, 45%)" fill="hsl(205, 59%, 45%)" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projetos" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Status dos projetos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {statusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Pedras por categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stoneCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                          {stoneCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Clients summary */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold font-display text-primary">{clients.length}</p>
                    <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display text-primary">{projects.filter(p => !p.archived).length}</p>
                    <p className="text-xs text-muted-foreground">Projetos ativos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display text-primary">{stones.length}</p>
                    <p className="text-xs text-muted-foreground">Pedras no mostruário</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orcamentos" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Funil de orçamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { stage: 'Pendentes', value: quoteStats.pending },
                      { stage: 'Aprovados', value: quoteStats.approved },
                      { stage: 'Recusados', value: quoteStats.rejected },
                    ]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 17%)" />
                      <XAxis type="number" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} />
                      <YAxis type="category" dataKey="stage" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} width={80} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="value" name="Qtd" radius={[0, 4, 4, 0]}>
                        <Cell fill="hsl(38, 92%, 50%)" />
                        <Cell fill="hsl(145, 63%, 42%)" />
                        <Cell fill="hsl(0, 72%, 51%)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold font-display text-success">{quoteStats.approved}</p>
                  <p className="text-xs text-muted-foreground mt-1">Aprovados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold font-display text-warning">{quoteStats.pending}</p>
                  <p className="text-xs text-muted-foreground mt-1">Aguardando</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Relatorios;
