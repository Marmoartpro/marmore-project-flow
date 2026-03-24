import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface PieceLine {
  id: string;
  name: string;
  width: string;
  length: string;
  quantity: string;
  stoneId: string;
}

const newLine = (): PieceLine => ({
  id: crypto.randomUUID(),
  name: '',
  width: '',
  length: '',
  quantity: '1',
  stoneId: '',
});

const Calculadora = () => {
  const { user } = useAuth();
  const [lines, setLines] = useState<PieceLine[]>([newLine()]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [stones, setStones] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from('projects').select('id, name').order('name').then(({ data }) => setProjects(data || []));
      supabase.from('stones').select('id, name, price_per_m2, category').order('name').then(({ data }) => setStones(data || []));
    }
  }, [user]);

  const updateLine = (id: string, field: keyof PieceLine, value: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const getStonePrice = (stoneId: string) => {
    const stone = stones.find(s => s.id === stoneId);
    return Number(stone?.price_per_m2 || 0);
  };

  const getStoneName = (stoneId: string) => {
    return stones.find(s => s.id === stoneId)?.name || '';
  };

  const calcLine = (l: PieceLine) => {
    const w = parseFloat(l.width) || 0;
    const len = parseFloat(l.length) || 0;
    const qty = parseInt(l.quantity) || 1;
    const price = getStonePrice(l.stoneId);
    const area = w * len * qty;
    const areaMargin = area * 1.1;
    const cost = areaMargin * price;
    return { area, areaMargin, cost, price };
  };

  const totalArea = lines.reduce((s, l) => s + calcLine(l).area, 0);
  const totalAreaMargin = lines.reduce((s, l) => s + calcLine(l).areaMargin, 0);
  const totalCost = lines.reduce((s, l) => s + calcLine(l).cost, 0);
  const hasData = totalArea > 0;

  const addAllToProject = async () => {
    if (!user || !selectedProject || !hasData) return;
    const inserts = lines
      .filter(l => calcLine(l).area > 0)
      .map(l => {
        const c = calcLine(l);
        const w = parseFloat(l.width) || 0;
        const len = parseFloat(l.length) || 0;
        const qty = parseInt(l.quantity) || 1;
        return {
          project_id: selectedProject,
          owner_id: user.id,
          description: l.name || getStoneName(l.stoneId) || `Peça ${w}m × ${len}m`,
          width_m: w,
          length_m: len,
          quantity: qty,
          area_m2: c.area,
          area_with_margin: c.areaMargin,
          price_per_m2: c.price,
          total_cost: c.cost,
        };
      });
    const { error } = await supabase.from('project_materials').insert(inserts);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success(`${inserts.length} peça(s) adicionada(s) ao projeto!`);
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" /> Calculadora de Material
        </h2>

        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_60px_1fr_40px] gap-2 text-[10px] text-muted-foreground font-medium uppercase">
              <span>Peça</span><span>Larg. (m)</span><span>Comp. (m)</span><span>Qtd</span><span>Pedra</span><span></span>
            </div>

            {lines.map((l, i) => {
              const c = calcLine(l);
              return (
                <div key={l.id} className="space-y-2 sm:space-y-0">
                  <div className="grid grid-cols-2 sm:grid-cols-[1fr_80px_80px_60px_1fr_40px] gap-2">
                    <Input
                      placeholder={`Peça ${i + 1}`}
                      value={l.name}
                      onChange={e => updateLine(l.id, 'name', e.target.value)}
                      className="h-8 text-sm col-span-2 sm:col-span-1"
                    />
                    <Input
                      type="number" step="0.01" placeholder="0.00"
                      value={l.width}
                      onChange={e => updateLine(l.id, 'width', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number" step="0.01" placeholder="0.00"
                      value={l.length}
                      onChange={e => updateLine(l.id, 'length', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number" min="1" placeholder="1"
                      value={l.quantity}
                      onChange={e => updateLine(l.id, 'quantity', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <select
                      value={l.stoneId}
                      onChange={e => updateLine(l.id, 'stoneId', e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs col-span-2 sm:col-span-1"
                    >
                      <option value="">Selecione pedra...</option>
                      {stones.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.price_per_m2 > 0 ? `(R$ ${fmt(Number(s.price_per_m2))}/m²)` : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLine(l.id)}
                      disabled={lines.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {c.area > 0 && (
                    <div className="text-[11px] text-muted-foreground pl-1 flex gap-3">
                      <span>Área: {fmt(c.area)} m²</span>
                      <span>+10%: {fmt(c.areaMargin)} m²</span>
                      {c.price > 0 && <span className="text-primary font-medium">R$ {fmt(c.cost)}</span>}
                    </div>
                  )}
                </div>
              );
            })}

            <Button size="sm" variant="outline" onClick={() => setLines(prev => [...prev, newLine()])}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar peça
            </Button>
          </CardContent>
        </Card>

        {/* Totals */}
        {hasData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Área total</p>
                <p className="text-lg font-bold font-display">{fmt(totalArea)} m²</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Margem (10%)</p>
                <p className="text-lg font-bold font-display text-warning">+{fmt(totalAreaMargin - totalArea)} m²</p>
              </CardContent>
            </Card>
            <Card className="border-primary/40">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Total a comprar</p>
                <p className="text-lg font-bold font-display text-primary">{fmt(totalAreaMargin)} m²</p>
              </CardContent>
            </Card>
            {totalCost > 0 && (
              <Card className="border-primary/40">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Custo total</p>
                  <p className="text-lg font-bold font-display text-primary">R$ {fmt(totalCost)}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Add to project */}
        {hasData && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Adicionar ao projeto</p>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione um projeto...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button className="w-full" disabled={!selectedProject} onClick={addAllToProject}>
                <Save className="w-4 h-4 mr-1" /> Adicionar todas as peças ao projeto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Calculadora;
