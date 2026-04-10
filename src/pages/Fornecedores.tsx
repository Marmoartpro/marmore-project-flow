import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Star, Search, Truck, Phone, Mail, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Fornecedores = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareMaterial, setCompareMaterial] = useState('');
  const [form, setForm] = useState({
    company_name: '', contact_name: '', whatsapp: '', email: '',
    materials_supplied: '', avg_delivery_days: '', observations: '', rating: 3,
  });
  const [purchaseForm, setPurchaseForm] = useState({
    material: '', quantity: '', amount: '', purchase_date: new Date().toISOString().split('T')[0], project_id: '',
  });

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    const [sRes, pRes, prRes] = await Promise.all([
      supabase.from('suppliers').select('*').order('company_name'),
      supabase.from('supplier_purchases').select('*').order('purchase_date', { ascending: false }),
      supabase.from('projects').select('id, name').order('name'),
    ]);
    setSuppliers(sRes.data || []);
    setPurchases(pRes.data || []);
    setProjects(prRes.data || []);
  };

  const filtered = suppliers.filter(s => {
    if (search && !s.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (materialFilter && !s.materials_supplied?.toLowerCase().includes(materialFilter.toLowerCase())) return false;
    return true;
  });

  const resetForm = () => {
    setForm({ company_name: '', contact_name: '', whatsapp: '', email: '', materials_supplied: '', avg_delivery_days: '', observations: '', rating: 3 });
    setEditSupplier(null);
  };

  const saveSupplier = async () => {
    if (!user || !form.company_name) return;
    const payload = { ...form, owner_id: user.id, avg_delivery_days: form.avg_delivery_days ? parseInt(form.avg_delivery_days) : null };

    if (editSupplier) {
      await supabase.from('suppliers').update(payload).eq('id', editSupplier.id);
      toast.success('Fornecedor atualizado!');
    } else {
      await supabase.from('suppliers').insert(payload);
      toast.success('Fornecedor cadastrado!');
    }
    setShowForm(false);
    resetForm();
    fetchAll();
  };

  const savePurchase = async () => {
    if (!user || !selected || !purchaseForm.material) return;
    await supabase.from('supplier_purchases').insert({
      owner_id: user.id,
      supplier_id: selected.id,
      project_id: purchaseForm.project_id || null,
      material: purchaseForm.material,
      quantity: purchaseForm.quantity,
      amount: purchaseForm.amount ? parseFloat(purchaseForm.amount) : 0,
      purchase_date: purchaseForm.purchase_date,
    });
    toast.success('Compra registrada!');
    setShowPurchaseForm(false);
    setPurchaseForm({ material: '', quantity: '', amount: '', purchase_date: new Date().toISOString().split('T')[0], project_id: '' });
    fetchAll();
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-display font-bold">Fornecedores</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowCompare(true)}>
              <BarChart3 className="w-4 h-4 mr-1" /> Comparar
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Novo fornecedor
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Input placeholder="Filtrar material..." value={materialFilter} onChange={e => setMaterialFilter(e.target.value)} className="w-40" />
        </div>

        <div className="space-y-2">
          {filtered.map(s => {
            const supplierPurchases = purchases.filter(p => p.supplier_id === s.id);
            const totalSpent = supplierPurchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            return (
              <Card key={s.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelected(s)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <p className="font-medium text-sm">{s.company_name}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= s.rating ? 'text-warning fill-warning' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.contact_name} • {s.materials_supplied || 'Materiais não especificados'}</p>
                  <div className="flex gap-4 text-[11px] text-muted-foreground mt-1">
                    {s.whatsapp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.whatsapp}</span>}
                    {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                    <span>Compras: {supplierPurchases.length} (R$ {fmt(totalSpent)})</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhum fornecedor encontrado.</p>}
        </div>

        {/* Detail */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display">{selected.company_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Contato:</span> {selected.contact_name || '—'}</div>
                    <div><span className="text-muted-foreground">WhatsApp:</span> {selected.whatsapp || '—'}</div>
                    <div><span className="text-muted-foreground">E-mail:</span> {selected.email || '—'}</div>
                    <div><span className="text-muted-foreground">Prazo médio:</span> {selected.avg_delivery_days ? `${selected.avg_delivery_days} dias` : '—'}</div>
                  </div>
                  {selected.materials_supplied && <div><span className="text-muted-foreground">Materiais:</span> {selected.materials_supplied}</div>}
                  {selected.observations && <div><span className="text-muted-foreground">Obs:</span> {selected.observations}</div>}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditSupplier(selected); setForm(selected); setShowForm(true); setSelected(null); }}>Editar</Button>
                    <Button size="sm" onClick={() => setShowPurchaseForm(true)}>Registrar compra</Button>
                  </div>

                  {/* Purchase history */}
                  <div>
                    <p className="text-muted-foreground font-medium mb-2">Histórico de compras</p>
                    {purchases.filter(p => p.supplier_id === selected.id).map(p => {
                      const proj = projects.find(pr => pr.id === p.project_id);
                      return (
                        <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-border text-xs">
                          <div>
                            <span className="font-medium">{p.material}</span> {p.quantity && `(${p.quantity})`}
                            {proj && <Badge variant="outline" className="ml-2 text-[9px]">{proj.name}</Badge>}
                          </div>
                          <div className="text-right">
                            <p>R$ {fmt(Number(p.amount || 0))}</p>
                            <p className="text-muted-foreground">{p.purchase_date}</p>
                          </div>
                        </div>
                      );
                    })}
                    {purchases.filter(p => p.supplier_id === selected.id).length === 0 && (
                      <p className="text-muted-foreground text-xs">Nenhuma compra registrada.</p>
                    )}
                  </div>

                  {/* Purchase form inline */}
                  {showPurchaseForm && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Material *</Label><Input value={purchaseForm.material} onChange={e => setPurchaseForm(f => ({ ...f, material: e.target.value }))} /></div>
                        <div><Label className="text-xs">Quantidade</Label><Input value={purchaseForm.quantity} onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Valor (R$)</Label><Input type="number" step="0.01" value={purchaseForm.amount} onChange={e => setPurchaseForm(f => ({ ...f, amount: e.target.value }))} /></div>
                        <div><Label className="text-xs">Data</Label><Input type="date" value={purchaseForm.purchase_date} onChange={e => setPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))} /></div>
                      </div>
                      <div>
                        <Label className="text-xs">Projeto vinculado</Label>
                        <select value={purchaseForm.project_id} onChange={e => setPurchaseForm(f => ({ ...f, project_id: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                          <option value="">Nenhum</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={savePurchase}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowPurchaseForm(false)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Add/Edit form */}
        <Dialog open={showForm} onOpenChange={() => { setShowForm(false); resetForm(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editSupplier ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Empresa *</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Contato</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
                <div><Label className="text-xs">WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label className="text-xs">Prazo médio (dias)</Label><Input type="number" value={form.avg_delivery_days} onChange={e => setForm(f => ({ ...f, avg_delivery_days: e.target.value }))} /></div>
              </div>
              <div><Label className="text-xs">Materiais fornecidos</Label><Input value={form.materials_supplied} onChange={e => setForm(f => ({ ...f, materials_supplied: e.target.value }))} placeholder="Granito, mármore..." /></div>
              <div><Label className="text-xs">Observações</Label><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} /></div>
              <div>
                <Label className="text-xs">Avaliação</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => setForm(f => ({ ...f, rating: i }))}>
                      <Star className={`w-5 h-5 ${i <= form.rating ? 'text-warning fill-warning' : 'text-muted'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={saveSupplier}>{editSupplier ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Fornecedores;
