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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  aguardando: 'Aguardando resposta',
  negociando: 'Negociando',
  aprovado: 'Aprovado',
  perdido: 'Perdido',
};
const statusColors: Record<string, string> = {
  aguardando: 'bg-muted text-muted-foreground',
  negociando: 'bg-warning text-warning-foreground',
  aprovado: 'bg-success text-success-foreground',
  perdido: 'bg-destructive text-destructive-foreground',
};

const emptyForm = {
  client_name: '', client_whatsapp: '', environment_type: '', stone_type: '',
  estimated_value: '', status: 'aguardando', observations: '', follow_up_date: '',
};

const Orcamentos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { if (user) fetchQuotes(); }, [user]);

  const fetchQuotes = async () => {
    const { data } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    setQuotes(data || []);
  };

  const saveQuote = async () => {
    if (!user || !form.client_name) return;
    const payload = {
      owner_id: user.id,
      client_name: form.client_name,
      client_whatsapp: form.client_whatsapp,
      environment_type: form.environment_type,
      stone_type: form.stone_type,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : 0,
      status: form.status,
      observations: form.observations,
      follow_up_date: form.follow_up_date || null,
    };
    if (editingId) {
      await supabase.from('quotes').update(payload).eq('id', editingId);
      toast.success('Orçamento atualizado!');
    } else {
      await supabase.from('quotes').insert(payload);
      toast.success('Orçamento cadastrado!');
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    fetchQuotes();
  };

  const startEdit = (q: any) => {
    setForm({
      client_name: q.client_name || '',
      client_whatsapp: q.client_whatsapp || '',
      environment_type: q.environment_type || '',
      stone_type: q.stone_type || '',
      estimated_value: q.estimated_value?.toString() || '',
      status: q.status || 'aguardando',
      observations: q.observations || '',
      follow_up_date: q.follow_up_date || '',
    });
    setEditingId(q.id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('quotes').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchQuotes();
    toast.success('Orçamento excluído!');
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('quotes').update({ status }).eq('id', id);
    fetchQuotes();
    toast.success('Status atualizado!');
  };

  const convertToProject = async (q: any) => {
    if (!user) return;
    const { data: project, error } = await supabase.from('projects').insert({
      owner_id: user.id,
      name: `Projeto ${q.client_name}`,
      client_name: q.client_name,
      environment_type: q.environment_type,
      stone_type: q.stone_type,
      total_value: Number(q.estimated_value || 0),
    }).select().single();
    if (error) { toast.error('Erro ao converter'); return; }
    await supabase.from('quotes').update({ status: 'aprovado' }).eq('id', q.id);
    toast.success('Convertido em projeto!');
    navigate(`/projeto/${project.id}`);
  };

  const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  const groupedStatuses = ['aguardando', 'negociando', 'aprovado', 'perdido'];
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">Orçamentos</h2>
          <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">{editingId ? 'Editar orçamento' : 'Novo orçamento'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome do cliente *</Label><Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">WhatsApp</Label><Input value={form.client_whatsapp} onChange={e => setForm(f => ({ ...f, client_whatsapp: e.target.value }))} className="h-8 text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">Tipo de ambiente</Label><Input value={form.environment_type} onChange={e => setForm(f => ({ ...f, environment_type: e.target.value }))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Tipo de pedra</Label><Input value={form.stone_type} onChange={e => setForm(f => ({ ...f, stone_type: e.target.value }))} className="h-8 text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label className="text-xs">Valor estimado</Label><Input type="number" step="0.01" value={form.estimated_value} onChange={e => setForm(f => ({ ...f, estimated_value: e.target.value }))} className="h-8 text-sm" /></div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {groupedStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Lembrar em</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} className="h-8 text-sm" /></div>
              </div>
              <div><Label className="text-xs">Observações</Label><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} className="text-sm" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveQuote} disabled={!form.client_name}>{editingId ? 'Salvar alterações' : 'Salvar'}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {groupedStatuses.map(status => {
          const filtered = quotes.filter(q => q.status === status);
          if (filtered.length === 0) return null;
          return (
            <div key={status} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{statusLabels[status]} ({filtered.length})</h3>
              {filtered.map(q => (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{q.client_name}</p>
                      <div className="flex items-center gap-1">
                        <Badge className={statusColors[q.status] + ' text-[10px]'}>{statusLabels[q.status]}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(q)}>
                              <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(q.id)} className="text-destructive">
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      <span>R$ {fmt(Number(q.estimated_value || 0))}</span>
                      {q.environment_type && <span>• {q.environment_type}</span>}
                      <span>• {daysSince(q.sent_date || q.created_at)} dias</span>
                    </div>
                    {(q.status === 'aguardando' || q.status === 'negociando') && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="text-xs h-7" onClick={() => convertToProject(q)}>Fechar como projeto</Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(q.id, 'perdido')}>Perdido</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir orçamento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Orcamentos;
