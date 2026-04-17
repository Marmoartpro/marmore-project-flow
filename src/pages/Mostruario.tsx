import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Maximize2, X, Edit, Upload, Trash2, Image, Share2, Presentation, Sparkles, Wand2 } from 'lucide-react';
import ShareStoneModal from '@/components/mostruario/ShareStoneModal';
import ARViewer from '@/components/mostruario/ARViewer';
import Visualization3D from '@/components/mostruario/Visualization3D';
import { toast } from 'sonner';
import StoneFilters, { COLOR_TONES, CATEGORIES } from '@/components/mostruario/StoneFilters';
import StoneCard from '@/components/mostruario/StoneCard';
import PresentationMode from '@/components/mostruario/PresentationMode';

const Mostruario = () => {
  const { user, profile } = useAuth();
  const [stones, setStones] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [colorTone, setColorTone] = useState('');
  const [usageFilter, setUsageFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editStone, setEditStone] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [shareStoneData, setShareStoneData] = useState<any>(null);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [presentationStart, setPresentationStart] = useState(0);
  const [arStone, setArStone] = useState<any>(null);
  const [vizStone, setVizStone] = useState<any>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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

  const fetchGalleryPhotos = async (stoneId: string) => {
    const { data } = await supabase.from('stone_photos').select('*').eq('stone_id', stoneId).order('created_at');
    setGalleryPhotos(data || []);
  };

  const filtered = stones.filter(s => {
    if (category !== 'Todos' && s.category !== category) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (colorTone) {
      const tone = COLOR_TONES.find(t => t.value === colorTone);
      if (tone) {
        const text = `${s.name} ${s.colors || ''}`.toLowerCase();
        if (!tone.keywords.some(k => text.includes(k))) return false;
      }
    }
    if (usageFilter) {
      const usage = (s.usage_indication || '').toLowerCase();
      if (!usage.includes(usageFilter)) return false;
    }
    if (stockFilter === 'in_stock' && !s.in_stock) return false;
    if (stockFilter === 'consulta' && s.in_stock) return false;
    return true;
  });

  const resetForm = () => {
    setForm({ name: '', category: 'Granito', origin: '', colors: '', thicknesses: '', finishes: '',
      usage_indication: '', price_per_m2: '', promo_badge: '', promo_active: false,
      pros: '', cons: '', observations: '', photo_url: '', in_stock: true, featured: false });
    setEditStone(null);
    setGalleryPhotos([]);
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
    fetchGalleryPhotos(s.id);
    setShowForm(true);
  };

  const uploadCoverPhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        toast.error('Formato não suportado. Use JPG, PNG ou WEBP.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      const compressed = await compressImage(file);
      const path = `stones/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('mostruario').upload(path, compressed);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('mostruario').getPublicUrl(path);
      setForm(f => ({ ...f, photo_url: urlData.publicUrl }));
      toast.success('Foto de capa enviada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar foto');
    } finally { setUploading(false); }
  };

  const uploadGalleryPhotos = async (files: FileList) => {
    if (!user || !editStone) return;
    setUploadingGallery(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) continue;
        if (file.size > 10 * 1024 * 1024) continue;
        const path = `stones/${user.id}/gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('mostruario').upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('mostruario').getPublicUrl(path);
        await supabase.from('stone_photos').insert({ stone_id: editStone.id, owner_id: user.id, photo_url: urlData.publicUrl });
      }
      toast.success('Fotos adicionadas!');
      fetchGalleryPhotos(editStone.id);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar fotos');
    } finally { setUploadingGallery(false); }
  };

  const deleteGalleryPhoto = async (photoId: string) => {
    await supabase.from('stone_photos').delete().eq('id', photoId);
    setGalleryPhotos(prev => prev.filter(p => p.id !== photoId));
    toast.success('Foto removida');
  };

  const saveStone = async () => {
    if (!user || !form.name) return;
    const payload = { ...form, owner_id: user.id, price_per_m2: form.price_per_m2 ? parseFloat(form.price_per_m2) : 0 };
    try {
      if (editStone) {
        // If the stone belongs to another user (global/seed), clone it as own
        if (editStone.owner_id !== user.id) {
          const { id, ...cloneData } = payload as any;
          const { data: newStone, error } = await supabase.from('stones').insert({ ...cloneData, is_global: false }).select().single();
          if (error) throw error;
          // Copy gallery photos to new stone
          if (newStone && galleryPhotos.length > 0) {
            for (const p of galleryPhotos) {
              await supabase.from('stone_photos').insert({ stone_id: newStone.id, owner_id: user.id, photo_url: p.photo_url });
            }
          }
          toast.success('Pedra personalizada e salva!');
        } else {
          const { error } = await supabase.from('stones').update(payload).eq('id', editStone.id);
          if (error) throw error;
          toast.success('Pedra atualizada!');
        }
      } else {
        const { data, error } = await supabase.from('stones').insert(payload).select().single();
        if (error) throw error;
        if (data) setEditStone(data);
        toast.success('Pedra cadastrada! Agora você pode adicionar fotos à galeria.');
      }
      setShowForm(false);
      resetForm();
      fetchStones();
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível salvar. Verifique sua conexão ou tente novamente.');
    }
  };

  const deleteStone = async (id: string) => {
    if (!user) return;
    const stone = stones.find(s => s.id === id);
    if (stone && stone.owner_id !== user.id) {
      toast.error('Você só pode excluir pedras que você cadastrou.');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir esta pedra?')) return;
    try {
      const { error: photoErr } = await supabase.from('stone_photos').delete().eq('stone_id', id);
      if (photoErr) throw photoErr;
      const { error: stoneErr } = await supabase.from('stones').delete().eq('id', id);
      if (stoneErr) throw stoneErr;
      toast.success('Pedra excluída');
      setShowForm(false);
      resetForm();
      fetchStones();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir pedra. Verifique se ela pertence a você.');
    }
  };

  const openDetail = async (s: any) => {
    setSelected(s);
    fetchGalleryPhotos(s.id);
  };

  const shareStone = (s: any) => {
    const url = `${window.location.origin}/mostruario?pedra=${s.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link da pedra copiado!');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Both roles use AppLayout now
  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-display font-bold">Mostruário</h2>
          <div className="flex gap-2">
            {filtered.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => { setPresentationStart(0); setPresentationOpen(true); }}>
                <Presentation className="w-4 h-4 mr-1" /> Apresentação
              </Button>
            )}
            {isMarmorista && (
              <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Nova pedra
              </Button>
            )}
          </div>
        </div>

        <StoneFilters
          search={search} setSearch={setSearch}
          category={category} setCategory={setCategory}
          colorTone={colorTone} setColorTone={setColorTone}
          usageFilter={usageFilter} setUsageFilter={setUsageFilter}
          stockFilter={stockFilter} setStockFilter={setStockFilter}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(s => (
            <StoneCard
              key={s.id}
              stone={s}
              isMarmorista={isMarmorista}
              onDetail={openDetail}
              onUploadPhoto={(stone) => { openEdit(stone); }}
            />
          ))}
        </div>

        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhuma pedra encontrada.</p>}

        {/* Detail modal */}
        <Dialog open={!!selected && !fullscreen} onOpenChange={() => { setSelected(null); setGalleryPhotos([]); }}>
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
                {galleryPhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Galeria de fotos</p>
                    <div className="grid grid-cols-3 gap-2">
                      {galleryPhotos.map(p => (
                        <img key={p.id} src={p.photo_url} alt="" className="w-full aspect-square object-cover rounded-md cursor-pointer hover:opacity-80" onClick={() => { setSelected({ ...selected, photo_url: p.photo_url }); setFullscreen(true); }} />
                      ))}
                    </div>
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
                  {selected.pros && <div><p className="text-muted-foreground font-medium mb-1">Prós</p><p className="text-green-400">{selected.pros}</p></div>}
                  {selected.cons && <div><p className="text-muted-foreground font-medium mb-1">Contras</p><p className="text-red-400">{selected.cons}</p></div>}
                  {selected.observations && <div><span className="text-muted-foreground">Observações:</span> {selected.observations}</div>}
                  <div className="grid grid-cols-2 gap-2">
                    {selected.photo_url && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setArStone(selected)}>
                        <Sparkles className="w-3.5 h-3.5" /> Ver no ambiente
                      </Button>
                    )}
                    {selected.photo_url && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setVizStone(selected)}>
                        <Wand2 className="w-3.5 h-3.5" /> Visualização 3D IA
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="col-span-2 gap-1" onClick={() => setShareStoneData(selected)}>
                      <Share2 className="w-3.5 h-3.5" /> Compartilhar
                    </Button>
                  </div>
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
        {isMarmorista && (
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

                {/* Cover photo */}
                <div className="space-y-2">
                  <Label className="text-xs">Foto de capa</Label>
                  {form.photo_url ? (
                    <div className="relative">
                      <img src={form.photo_url} alt="" className="w-full h-40 object-cover rounded-md" />
                      <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6" onClick={() => setForm(f => ({ ...f, photo_url: '' }))}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => coverInputRef.current?.click()}>
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">{uploading ? 'Enviando...' : 'Clique para enviar foto de capa'}</p>
                    </div>
                  )}
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadCoverPhoto(e.target.files[0])} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Preço por m² (R$)</Label><Input type="number" step="0.01" value={form.price_per_m2} onChange={e => setForm(f => ({ ...f, price_per_m2: e.target.value }))} /></div>
                  <div><Label className="text-xs">Badge promoção</Label><Input value={form.promo_badge} onChange={e => setForm(f => ({ ...f, promo_badge: e.target.value }))} placeholder="Ex: -20%" /></div>
                </div>
                <div><Label className="text-xs">Prós</Label><Textarea value={form.pros} onChange={e => setForm(f => ({ ...f, pros: e.target.value }))} rows={2} /></div>
                <div><Label className="text-xs">Contras</Label><Textarea value={form.cons} onChange={e => setForm(f => ({ ...f, cons: e.target.value }))} rows={2} /></div>
                <div><Label className="text-xs">Observações</Label><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} /></div>
                <div className="flex gap-4 items-center text-sm flex-wrap">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.in_stock} onChange={e => setForm(f => ({ ...f, in_stock: e.target.checked }))} /> Em estoque</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Destaque</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.promo_active} onChange={e => setForm(f => ({ ...f, promo_active: e.target.checked }))} /> Promoção ativa</label>
                </div>

                {/* Gallery */}
                {editStone && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1"><Image className="w-3 h-3" /> Galeria de fotos</Label>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}>
                        <Upload className="w-3 h-3 mr-1" /> {uploadingGallery ? 'Enviando...' : 'Adicionar fotos'}
                      </Button>
                      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && uploadGalleryPhotos(e.target.files)} />
                    </div>
                    {galleryPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {galleryPhotos.map(p => (
                          <div key={p.id} className="relative group">
                            <img src={p.photo_url} alt="" className="w-full aspect-square object-cover rounded-md" />
                            <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteGalleryPhoto(p.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhuma foto na galeria</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={saveStone}>{editStone ? 'Salvar alterações' : 'Cadastrar pedra'}</Button>
                  {editStone && (
                    <Button variant="destructive" size="icon" onClick={() => deleteStone(editStone.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ShareStoneModal open={!!shareStoneData} onClose={() => setShareStoneData(null)} stone={shareStoneData} />

      {arStone && (
        <ARViewer textureUrl={arStone.photo_url} stoneName={arStone.name} onClose={() => setArStone(null)} />
      )}

      {presentationOpen && (
        <PresentationMode
          stones={filtered}
          initialIndex={presentationStart}
          onClose={() => setPresentationOpen(false)}
        />
      )}
    </AppLayout>
  );
};

export default Mostruario;
