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
import { Search, Plus, Star, Maximize2, X, Edit, Package } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Todos', 'Granito', 'Mármore', 'Quartzito', 'Quartzo Artificial', 'Lâmina Ultracompacta'];

const Mostruario = () => {
  const { user, profile } = useAuth();
  const [stones, setStones] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState<any>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editStone, setEditStone] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', category: 'Granito', origin: '', colors: '', thicknesses: '', finishes: '',
    usage_indication: '', price_per_m2: '', promo_badge: '', promo_active: false,
    pros: '', cons: '', observations: '', photo_url: '', in_stock: true, featured: false,
  });

  const isMarmorista = profile?.role === 'marmorista';

  useEffect(() => { fetchStones(); }, []);

  const fetchStones = async () => {
    const { data } = await supabase.from('stones').select('*').order('featured', { ascending: false }).order('name');
    setStones(data || []);
  };

  const filtered = stones.filter(s => {
    if (category !== 'Todos' && s.category !== category) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const resetForm = () => {
    setForm({ name: '', category: 'Granito', origin: '', colors: '', thicknesses: '', finishes: '',
      usage_indication: '', price_per_m2: '', promo_badge: '', promo_active: false,
      pros: '', cons: '', observations: '', photo_url: '', in_stock: true, featured: false });
    setEditStone(null);
  };

  const openEdit = (s: any) => {
    setForm({
      name: s.name, category: s.category, origin: s.origin || '', colors: s.colors || '',
      thicknesses: s.thicknesses || '', finishes: s.finishes || '', usage_indication: s.usage_indication || '',
      price_per_m2: s.price_per_m2?.toString() || '', promo_badge: s.promo_badge || '',
      promo_active: s.promo_active || false, pros: s.pros || '', cons: s.cons || '',
      observations: s.observations || '', photo_url: s.photo_url || '', in_stock: s.in_stock ?? true,
      featured: s.featured || false,
    });
    setEditStone(s);
    setShowForm(true);
  };

  const saveStone = async () => {
    if (!user || !form.name) return;
    const payload = {
      ...form,
      owner_id: user.id,
      price_per_m2: form.price_per_m2 ? parseFloat(form.price_per_m2) : 0,
    };

    if (editStone) {
      await supabase.from('stones').update(payload).eq('id', editStone.id);
      toast.success('Pedra atualizada!');
    } else {
      await supabase.from('stones').insert(payload);
      toast.success('Pedra cadastrada!');
    }
    setShowForm(false);
    resetForm();
    fetchStones();
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Architect layout wrapper
  const Wrapper = isMarmorista ? AppLayout : ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <h1 className="text-base font-display font-bold">Mostruário</h1>
      </header>
      <div>{children}</div>
    </div>
  );

  return (
    <Wrapper>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-display font-bold">Mostruário</h2>
          {isMarmorista && (
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Nova pedra
            </Button>
          )}
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar pedra..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} className="text-xs whitespace-nowrap" onClick={() => setCategory(c)}>
                {c}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(s => (
            <Card key={s.id} className="cursor-pointer hover:border-primary/40 transition-colors overflow-hidden group" onClick={() => setSelected(s)}>
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-muted-foreground" /></div>
                )}
                {s.promo_active && s.promo_badge && (
                  <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px]">{s.promo_badge}</Badge>
                )}
                {s.featured && (
                  <Star className="absolute top-2 right-2 w-4 h-4 text-warning fill-warning" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{s.category}</p>
                {s.price_per_m2 > 0 && (
                  <p className="text-xs text-primary font-medium mt-1">R$ {fmt(Number(s.price_per_m2))}/m²</p>
                )}
                <Badge variant="outline" className="text-[9px] mt-1">{s.in_stock ? 'Em estoque' : 'Sob consulta'}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhuma pedra encontrada.</p>}

        {/* Detail modal */}
        <Dialog open={!!selected && !fullscreen} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display flex items-center gap-2">
                    {selected.name}
                    {isMarmorista && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { openEdit(selected); setSelected(null); }}>
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </DialogTitle>
                </DialogHeader>
                {selected.photo_url && (
                  <div className="relative">
                    <img src={selected.photo_url} alt="" className="w-full rounded-md" />
                    <Button size="icon" variant="outline" className="absolute top-2 right-2 h-7 w-7" onClick={() => setFullscreen(true)}>
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Categoria:</span> {selected.category}</div>
                    <div><span className="text-muted-foreground">Origem:</span> {selected.origin || '—'}</div>
                    <div><span className="text-muted-foreground">Cores:</span> {selected.colors || '—'}</div>
                    <div><span className="text-muted-foreground">Espessuras:</span> {selected.thicknesses || '—'}</div>
                    <div><span className="text-muted-foreground">Acabamentos:</span> {selected.finishes || '—'}</div>
                    <div><span className="text-muted-foreground">Preço/m²:</span> {selected.price_per_m2 > 0 ? `R$ ${fmt(Number(selected.price_per_m2))}` : '—'}</div>
                  </div>
                  {selected.usage_indication && <div><span className="text-muted-foreground">Indicação de uso:</span> {selected.usage_indication}</div>}
                  {selected.pros && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Prós</p>
                      <p className="text-success">{selected.pros}</p>
                    </div>
                  )}
                  {selected.cons && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Contras</p>
                      <p className="text-destructive">{selected.cons}</p>
                    </div>
                  )}
                  {selected.observations && <div><span className="text-muted-foreground">Observações:</span> {selected.observations}</div>}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Fullscreen */}
        {fullscreen && selected && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setFullscreen(false)}>
            <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-white" onClick={() => setFullscreen(false)}>
              <X className="w-6 h-6" />
            </Button>
            {selected.photo_url && <img src={selected.photo_url} alt="" className="max-w-full max-h-full object-contain" />}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-white text-xl font-display font-bold">{selected.name}</p>
              <p className="text-white/60">{selected.category} • {selected.origin}</p>
            </div>
          </div>
        )}

        {/* Add/Edit form */}
        <Dialog open={showForm} onOpenChange={() => { setShowForm(false); resetForm(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editStone ? 'Editar pedra' : 'Nova pedra'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                    {CATEGORIES.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Origem</Label><Input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} /></div>
                <div><Label className="text-xs">Cores</Label><Input value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Espessuras</Label><Input value={form.thicknesses} onChange={e => setForm(f => ({ ...f, thicknesses: e.target.value }))} /></div>
                <div><Label className="text-xs">Acabamentos</Label><Input value={form.finishes} onChange={e => setForm(f => ({ ...f, finishes: e.target.value }))} /></div>
              </div>
              <div><Label className="text-xs">Indicação de uso</Label><Input value={form.usage_indication} onChange={e => setForm(f => ({ ...f, usage_indication: e.target.value }))} /></div>
              <div><Label className="text-xs">URL da foto</Label><Input value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Preço por m² (R$)</Label><Input type="number" step="0.01" value={form.price_per_m2} onChange={e => setForm(f => ({ ...f, price_per_m2: e.target.value }))} /></div>
                <div><Label className="text-xs">Badge promoção</Label><Input value={form.promo_badge} onChange={e => setForm(f => ({ ...f, promo_badge: e.target.value }))} placeholder="Ex: -20%" /></div>
              </div>
              <div><Label className="text-xs">Prós</Label><Textarea value={form.pros} onChange={e => setForm(f => ({ ...f, pros: e.target.value }))} rows={2} /></div>
              <div><Label className="text-xs">Contras</Label><Textarea value={form.cons} onChange={e => setForm(f => ({ ...f, cons: e.target.value }))} rows={2} /></div>
              <div><Label className="text-xs">Observações</Label><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} /></div>
              <div className="flex gap-4 items-center text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.in_stock} onChange={e => setForm(f => ({ ...f, in_stock: e.target.checked }))} /> Em estoque</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Destaque</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.promo_active} onChange={e => setForm(f => ({ ...f, promo_active: e.target.checked }))} /> Promoção ativa</label>
              </div>
              <Button className="w-full" onClick={saveStone}>{editStone ? 'Salvar alterações' : 'Cadastrar pedra'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Wrapper>
  );
};

export default Mostruario;
