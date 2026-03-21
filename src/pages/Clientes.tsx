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
import { Plus, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const Clientes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', whatsapp: '', email: '', city: '', service_type: '', observations: '' });

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    const [cRes, pRes, qRes] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('projects').select('id, name, client_name, status, total_value'),
      supabase.from('quotes').select('id, client_name, status, estimated_value'),
    ]);
    
    // Build unified client list from clients table + projects + quotes
    const existingClients = cRes.data || [];
    const projectClients = (pRes.data || []).filter(p => p.client_name && !existingClients.some(c => c.name?.toLowerCase() === p.client_name?.toLowerCase()));
    const quoteClients = (qRes.data || []).filter(q => q.client_name && !existingClients.some(c => c.name?.toLowerCase() === q.client_name?.toLowerCase()) && !projectClients.some(p => p.client_name?.toLowerCase() === q.client_name?.toLowerCase()));

    const all = [
      ...existingClients.map(c => ({ ...c, source: 'manual' as const })),
      ...projectClients.map(p => ({ id: p.id, name: p.client_name, source: 'project' as const, project_id: p.id, status: p.status, total_value: p.total_value })),
      ...quoteClients.map(q => ({ id: q.id, name: q.client_name, source: 'quote' as const, quote_id: q.id, status: q.status, total_value: q.estimated_value })),
    ];
    setClients(all);
    setProjects(pRes.data || []);
    setQuotes(qRes.data || []);
  };

  const createClient = async () => {
    if (!user || !form.name) return;
    await supabase.from('clients').insert({ owner_id: user.id, ...form });
    setForm({ name: '', whatsapp: '', email: '', city: '', service_type: '', observations: '' });
    setShowForm(false);
    fetchAll();
    toast.success('Cliente adicionado!');
  };

  const filtered = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  const getStatusInfo = (c: any) => {
    if (c.source === 'quote') return { label: 'Orçamento', color: 'bg-muted text-muted-foreground' };
    if (c.status === 'concluido') return { label: 'Concluído', color: 'bg-success text-success-foreground' };
    if (c.status === 'em_andamento') return { label: 'Em andamento', color: 'bg-primary text-primary-foreground' };
    return { label: 'Cliente', color: 'bg-muted text-muted-foreground' };
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">Clientes</h2>
          <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Novo cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className="h-8 text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Cidade</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="h-8 text-sm" /></div>
              </div>
              <div><Label className="text-xs">Tipo de serviço</Label><Input value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">Observações</Label><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} className="text-sm" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={createClient} disabled={!form.name}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {filtered.map(c => {
            const st = getStatusInfo(c);
            return (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <div className="text-xs text-muted-foreground space-x-2">
                      {c.whatsapp && <span>{c.whatsapp}</span>}
                      {c.service_type && <span>• {c.service_type}</span>}
                      {c.total_value && <span>• R$ {Number(c.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={st.color + ' text-[10px]'}>{st.label}</Badge>
                    {c.project_id && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate(`/projeto/${c.project_id}`)}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente encontrado.</p>}
        </div>
      </div>
    </AppLayout>
  );
};

export default Clientes;
