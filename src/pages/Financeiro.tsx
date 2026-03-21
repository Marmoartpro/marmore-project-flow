import { useEffect, useState } from 'react';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const Financeiro = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showReminderForm, setShowReminderForm] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState({ date: '', value: '', note: '' });

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [pRes, payRes, remRes] = await Promise.all([
      supabase.from('projects').select('*').order('name'),
      supabase.from('payments').select('*'),
      supabase.from('billing_reminders').select('*').eq('resolved', false),
    ]);
    setProjects(pRes.data || []);
    setPayments(payRes.data || []);
    setReminders(remRes.data || []);
  };

  const today = new Date().toISOString().split('T')[0];

  const chartData = projects.map(p => ({
    name: p.name?.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
    total: Number(p.total_value || 0),
    recebido: Number(p.paid_value || 0),
  }));

  const getStatus = (p: any) => {
    const paid = Number(p.paid_value || 0);
    const total = Number(p.total_value || 0);
    if (paid >= total && total > 0) return { label: 'Quitado', color: 'bg-success text-success-foreground' };
    const hasOverdue = payments.some(pay => pay.project_id === p.id && !pay.paid && pay.due_date && pay.due_date < today);
    if (hasOverdue) return { label: 'Atrasado', color: 'bg-destructive text-destructive-foreground' };
    return { label: 'Em dia', color: 'bg-primary text-primary-foreground' };
  };

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

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h2 className="text-xl font-display font-bold">Financeiro</h2>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">Total x Recebido por projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 17%)" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(0 0% 10%)', border: '1px solid hsl(0 0% 17%)', borderRadius: 6 }}
                      labelStyle={{ color: 'hsl(35 15% 90%)' }}
                    />
                    <Bar dataKey="total" fill="hsl(0 0% 30%)" name="Total" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recebido" fill="hsl(205 59% 45%)" name="Recebido" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reminders */}
        {reminders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cobranças pendentes</h3>
            {reminders.map(r => {
              const proj = projects.find(p => p.id === r.project_id);
              return (
                <div key={r.id} className="px-3 py-2 rounded-md text-sm bg-warning/10 border border-warning/30 text-warning flex justify-between items-center">
                  <span>{proj?.name} — R$ {fmt(Number(r.expected_value))} ({r.reminder_date}) {r.note && `• ${r.note}`}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Projects list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Todos os projetos</h3>
          {projects.map(p => {
            const st = getStatus(p);
            const total = Number(p.total_value || 0);
            const paid = Number(p.paid_value || 0);
            return (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="cursor-pointer" onClick={() => navigate(`/projeto/${p.id}`)}>
                      <p className="font-medium text-sm hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.client_name || '—'}</p>
                    </div>
                    <Badge className={st.color + ' text-[10px]'}>{st.label}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                    <span>Total: R$ {fmt(total)}</span>
                    <span>Pago: R$ {fmt(paid)}</span>
                    <span>Saldo: R$ {fmt(total - paid)}</span>
                  </div>
                  {showReminderForm === p.id ? (
                    <div className="space-y-2 pt-2 border-t border-border">
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
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowReminderForm(p.id)}>
                      Registrar cobrança
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
