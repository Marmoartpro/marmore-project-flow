import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MoreVertical, Edit, Trash2, Calculator, FileText, Eye, Copy, Clock, PenTool, FileSignature, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ContratoDialog from '@/components/contrato/ContratoDialog';
import SmartBudgetGenerator from '@/components/orcamento/SmartBudgetGenerator';

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho', enviado: 'Enviado', aceito: 'Aceito', recusado: 'Recusado',
  aguardando: 'Aguardando resposta', negociando: 'Negociando',
  aprovado: 'Aprovado', perdido: 'Perdido',
};
const statusColors: Record<string, string> = {
  rascunho: 'bg-warning/20 text-warning-foreground border-warning/30',
  aguardando: 'bg-muted text-muted-foreground',
  negociando: 'bg-accent/50 text-accent-foreground',
  enviado: 'bg-accent/50 text-accent-foreground',
  aprovado: 'bg-primary/20 text-primary',
  aceito: 'bg-primary/20 text-primary',
  perdido: 'bg-destructive/20 text-destructive',
  recusado: 'bg-destructive/20 text-destructive',
};

const emptyForm = {
  client_name: '', client_whatsapp: '', environment_type: '', stone_type: '',
  estimated_value: '', status: 'aguardando', observations: '', follow_up_date: '',
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

const Orcamentos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [budgetQuotes, setBudgetQuotes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'quote' | 'budget'>('quote');
  const [form, setForm] = useState(emptyForm);
  const [mainTab, setMainTab] = useState('calculados');
  const [contratoQuote, setContratoQuote] = useState<any>(null);
  const [showSmartGenerator, setShowSmartGenerator] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => { if (user) { fetchQuotes(); fetchBudgetQuotes(); fetchClients(); fetchMaterials(); } }, [user]);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*');
    setClients(data || []);
  };

  const fetchMaterials = async () => {
    const { data } = await supabase.from('stones').select('*');
    setMaterials(data || []);
  };

  const fetchQuotes = async () => {
    const { data } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    setQuotes(data || []);
  };
  const fetchBudgetQuotes = async () => {
    const { data } = await supabase.from('budget_quotes').select('*').order('created_at', { ascending: false });
    setBudgetQuotes(data || []);
  };

  const saveQuote = async () => {
    if (!user || !form.client_name) return;
    const payload = {
      owner_id: user.id, client_name: form.client_name, client_whatsapp: form.client_whatsapp,
      environment_type: form.environment_type, stone_type: form.stone_type,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : 0,
      status: form.status, observations: form.observations, follow_up_date: form.follow_up_date || null,
    };
    if (editingId) {
      await supabase.from('quotes').update(payload).eq('id', editingId);
      toast.success('Orçamento atualizado!');
    } else {
      await supabase.from('quotes').insert(payload);
      toast.success('Orçamento cadastrado!');
    }
    setForm(emptyForm); setShowForm(false); setEditingId(null); fetchQuotes();
  };

  const startEdit = (q: any) => {
    setForm({
      client_name: q.client_name || '', client_whatsapp: q.client_whatsapp || '',
      environment_type: q.environment_type || '', stone_type: q.stone_type || '',
      estimated_value: q.estimated_value?.toString() || '', status: q.status || 'aguardando',
      observations: q.observations || '', follow_up_date: q.follow_up_date || '',
    });
    setEditingId(q.id); setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    if (deleteType === 'budget') {
      await supabase.from('budget_quotes').delete().eq('id', deleteId);
      fetchBudgetQuotes();
    } else {
      await supabase.from('quotes').delete().eq('id', deleteId);
      fetchQuotes();
    }
    setDeleteId(null); toast.success('Orçamento excluído!');
  };

  const updateBudgetStatus = async (id: string, status: string) => {
    await supabase.from('budget_quotes').update({ status }).eq('id', id);
    fetchBudgetQuotes(); toast.success('Status atualizado!');
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('quotes').update({ status }).eq('id', id);
    fetchQuotes(); toast.success('Status atualizado!');
  };

  const convertToProject = async (q: any) => {
    if (!user) return;
    const { data: project, error } = await supabase.from('projects').insert({
      owner_id: user.id, name: `Projeto ${q.client_name}`, client_name: q.client_name,
      environment_type: q.environment_type, stone_type: q.stone_type,
      total_value: Number(q.estimated_value || q.total || 0),
    }).select().single();
    if (error) { toast.error('Erro ao converter'); return; }
    if (q.quote_number) {
      await supabase.from('budget_quotes').update({ status: 'aceito' }).eq('id', q.id);
      fetchBudgetQuotes();
    } else {
      await supabase.from('quotes').update({ status: 'aprovado' }).eq('id', q.id);
      fetchQuotes();
    }
    toast.success('Convertido em projeto!'); navigate(`/projeto/${project.id}`);
  };

  // Split budget quotes
  const bqEmAndamento = budgetQuotes.filter(bq => ['rascunho', 'enviado'].includes(bq.status));
  const bqFinalizados = budgetQuotes.filter(bq => ['aceito', 'recusado', 'aprovado', 'perdido'].includes(bq.status));
  const groupedStatuses = ['aguardando', 'negociando', 'aprovado', 'perdido'];

  const requestSignature = async (bq: any, docType: string = 'orcamento') => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('digital_signatures').insert({
        owner_id: user.id,
        document_type: docType,
        document_id: bq.id,
      } as any).select('sign_token').single();
      if (error) throw error;
      const url = `${window.location.origin}/assinar/${(data as any).sign_token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link de assinatura copiado! Envie ao cliente por WhatsApp.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar link');
    }
  };

  const BudgetCard = ({ bq }: { bq: any }) => (
    <Card key={bq.id}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-medium text-sm truncate">{bq.client_name || 'Sem cliente'}</p>
            <Badge variant="outline" className="text-[10px] shrink-0">{bq.quote_number}</Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge className={`${statusColors[bq.status] || statusColors.rascunho} text-[10px] border`}>
              {statusLabels[bq.status] || bq.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/calculadora/${bq.id}`)}>
                  <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/calculadora/${bq.id}?duplicate=true`)}>
                  <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
                </DropdownMenuItem>
                {bq.status === 'rascunho' && (
                  <DropdownMenuItem onClick={() => updateBudgetStatus(bq.id, 'enviado')}>Marcar como enviado</DropdownMenuItem>
                )}
                {['rascunho', 'enviado'].includes(bq.status) && (
                  <DropdownMenuItem onClick={() => convertToProject(bq)}>Converter em projeto</DropdownMenuItem>
                )}
                {['enviado', 'aceito', 'aprovado'].includes(bq.status) && (
                  <DropdownMenuItem onClick={() => setContratoQuote(bq)}>
                    <FileSignature className="w-3.5 h-3.5 mr-2" /> Gerar Contrato
                  </DropdownMenuItem>
                )}
                {['enviado', 'aceito', 'aprovado'].includes(bq.status) && (
                  <DropdownMenuItem onClick={() => requestSignature(bq)}>
                    <PenTool className="w-3.5 h-3.5 mr-2" /> Solicitar assinatura
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { setDeleteId(bq.id); setDeleteType('budget'); }} className="text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="font-semibold text-foreground">R$ {fmt(Number(bq.total || 0))}</span>
          {bq.environment_type && <span>• {bq.environment_type}</span>}
          <span>• {daysSince(bq.created_at)} dias atrás</span>
          <span>• V{bq.version}</span>
        </div>
        {bq.status === 'rascunho' && (
          <Button size="sm" variant="outline" className="text-xs h-7 mt-2" onClick={() => navigate(`/calculadora/${bq.id}`)}>
            <Edit className="w-3 h-3 mr-1" /> Continuar editando
          </Button>
        )}
        {bq.payment_conditions && (
          <p className="text-[11px] text-muted-foreground mt-1 truncate">{bq.payment_conditions}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">Orçamentos</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/calculadora/novo?ai=true')} className="gap-1">
              <Sparkles className="w-4 h-4" /> IA
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/calculadora')}>
              <Calculator className="w-4 h-4 mr-1" /> Calculadora
            </Button>
            <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); setMainTab('rapidos'); }}>
              <Plus className="w-4 h-4 mr-1" /> Rápido
            </Button>
          </div>
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculados" className="text-xs">
              <Calculator className="w-3.5 h-3.5 mr-1" /> Calculados ({budgetQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="rapidos" className="text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" /> Rápidos ({quotes.length})
            </TabsTrigger>
          </TabsList>

          {/* Budget quotes */}
          <TabsContent value="calculados" className="space-y-3 mt-4">
            <Tabs defaultValue="andamento">
              <TabsList className="w-full grid grid-cols-2 h-8">
                <TabsTrigger value="andamento" className="text-[11px] h-7">
                  <Clock className="w-3 h-3 mr-1" /> Em andamento ({bqEmAndamento.length})
                </TabsTrigger>
                <TabsTrigger value="finalizados" className="text-[11px] h-7">
                  Finalizados ({bqFinalizados.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="andamento" className="space-y-3 mt-3">
                {bqEmAndamento.length === 0 && (
                  <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum orçamento em andamento. <button onClick={() => navigate('/calculadora')} className="text-primary underline">Criar novo</button>
                  </CardContent></Card>
                )}
                {bqEmAndamento.map(bq => <BudgetCard key={bq.id} bq={bq} />)}
              </TabsContent>
              <TabsContent value="finalizados" className="space-y-3 mt-3">
                {bqFinalizados.length === 0 && (
                  <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum orçamento finalizado ainda.
                  </CardContent></Card>
                )}
                {bqFinalizados.map(bq => <BudgetCard key={bq.id} bq={bq} />)}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Quick quotes */}
          <TabsContent value="rapidos" className="space-y-4 mt-4">
            {showForm && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-display font-semibold">{editingId ? 'Editar orçamento' : 'Novo orçamento rápido'}</p>
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
                        <SelectContent>{groupedStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Lembrar em</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} className="h-8 text-sm" /></div>
                  </div>
                  <div><Label className="text-xs">Observações</Label><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} className="text-sm" /></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveQuote} disabled={!form.client_name}>{editingId ? 'Salvar' : 'Salvar'}</Button>
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
                            <Badge className={`${statusColors[q.status]} text-[10px] border`}>{statusLabels[q.status]}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEdit(q)}><Edit className="w-3.5 h-3.5 mr-2" /> Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setDeleteId(q.id); setDeleteType('quote'); }} className="text-destructive">
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir orçamento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {contratoQuote && (
        <ContratoDialog
          open={!!contratoQuote}
          onClose={() => setContratoQuote(null)}
          budgetQuote={contratoQuote}
        />
      )}

      <SmartBudgetGenerator
        open={showSmartGenerator}
        onOpenChange={setShowSmartGenerator}
        clients={clients}
        materials={materials}
        onBudgetGenerated={fetchBudgetQuotes}
      />
    </AppLayout>
  );
};

export default Orcamentos;
