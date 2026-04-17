import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  payments: any[];
  purchases?: any[];
  initialBalance?: number;
}

interface DayPoint {
  date: string;
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

const CashFlowForecast = ({ payments, purchases = [], initialBalance = 0 }: Props) => {
  const data = useMemo(() => {
    const days: DayPoint[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let balance = initialBalance;

    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];

      const entradas = payments
        .filter(p => !p.paid && p.due_date === key)
        .reduce((s, p) => s + Number(p.amount || 0), 0);

      const saidas = purchases
        .filter(c => c.purchase_date === key && !c.paid)
        .reduce((s, c) => s + Number(c.amount || 0), 0);

      balance += entradas - saidas;
      days.push({
        date: key,
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        entradas,
        saidas,
        saldo: balance,
      });
    }
    return days;
  }, [payments, purchases, initialBalance]);

  const summary = useMemo(() => {
    const totalEntradas = data.reduce((s, d) => s + d.entradas, 0);
    const totalSaidas = data.reduce((s, d) => s + d.saidas, 0);
    const finalBalance = data[data.length - 1]?.saldo ?? initialBalance;
    const negativeDays = data.filter(d => d.saldo < 0);
    const firstNegative = negativeDays[0];
    const minBalance = data.reduce((m, d) => Math.min(m, d.saldo), initialBalance);
    return { totalEntradas, totalSaidas, finalBalance, firstNegative, minBalance, negativeCount: negativeDays.length };
  }, [data, initialBalance]);

  // Sample every 3 days to keep chart readable
  const chartData = data.filter((_, i) => i % 3 === 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Fluxo de caixa preditivo (90 dias)
          </CardTitle>
          {summary.firstNegative && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              Buraco no caixa em {new Date(summary.firstNegative.date).toLocaleDateString('pt-BR')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-md bg-success/10">
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] uppercase font-medium">Previsto entrar</span>
            </div>
            <p className="font-bold font-display text-sm">R$ {fmt(summary.totalEntradas)}</p>
          </div>
          <div className="p-2 rounded-md bg-destructive/10">
            <div className="flex items-center gap-1 text-destructive">
              <TrendingDown className="w-3 h-3" />
              <span className="text-[10px] uppercase font-medium">Previsto sair</span>
            </div>
            <p className="font-bold font-display text-sm">R$ {fmt(summary.totalSaidas)}</p>
          </div>
          <div className={`p-2 rounded-md ${summary.finalBalance >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
            <p className="text-[10px] uppercase font-medium text-muted-foreground">Saldo em 90d</p>
            <p className={`font-bold font-display text-sm ${summary.finalBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>R$ {fmt(summary.finalBalance)}</p>
          </div>
          <div className={`p-2 rounded-md ${summary.minBalance >= 0 ? 'bg-muted' : 'bg-destructive/10'}`}>
            <p className="text-[10px] uppercase font-medium text-muted-foreground">Pior saldo</p>
            <p className={`font-bold font-display text-sm ${summary.minBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}>R$ {fmt(summary.minBalance)}</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                formatter={(v: any) => `R$ ${fmt(Number(v))}`}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="entradas" name="Entradas" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.3)" />
              <Area type="monotone" dataKey="saidas" name="Saídas" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.3)" />
              <Line type="monotone" dataKey="saldo" name="Saldo acumulado" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {summary.firstNegative && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Atenção: previsão de saldo negativo</p>
                <p className="text-muted-foreground mt-1">
                  Em <strong>{new Date(summary.firstNegative.date).toLocaleDateString('pt-BR')}</strong> seu saldo deve ficar em <strong>R$ {fmt(summary.firstNegative.saldo)}</strong>. 
                  {summary.negativeCount} dia(s) negativo(s) nos próximos 90 dias. Antecipe cobranças ou negocie pagamentos.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowForecast;
