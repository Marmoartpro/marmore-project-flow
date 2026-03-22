import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Plus } from 'lucide-react';
import { toast } from 'sonner';

const Calculadora = () => {
  const { user } = useAuth();
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [pricePerM2, setPricePerM2] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [stones, setStones] = useState<any[]>([]);
  const [selectedStone, setSelectedStone] = useState('');
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('projects').select('id, name').order('name').then(({ data }) => setProjects(data || []));
      supabase.from('stones').select('id, name, price_per_m2').order('name').then(({ data }) => setStones(data || []));
    }
  }, [user]);

  const w = parseFloat(width) || 0;
  const l = parseFloat(length) || 0;
  const qty = parseInt(quantity) || 1;
  const price = parseFloat(pricePerM2) || 0;

  const areaPerPiece = w * l;
  const totalArea = areaPerPiece * qty;
  const margin = totalArea * 0.10;
  const totalWithMargin = totalArea + margin;
  const totalCost = totalWithMargin * price;

  const handleStoneSelect = (stoneId: string) => {
    setSelectedStone(stoneId);
    const stone = stones.find(s => s.id === stoneId);
    if (stone && stone.price_per_m2) {
      setPricePerM2(stone.price_per_m2.toString());
    }
  };

  const addToProject = async () => {
    if (!user || !selectedProject || totalArea === 0) return;
    const stone = stones.find(s => s.id === selectedStone);
    await supabase.from('project_materials').insert({
      project_id: selectedProject,
      owner_id: user.id,
      description: stone ? stone.name : `Material ${w}m × ${l}m`,
      width_m: w,
      length_m: l,
      quantity: qty,
      area_m2: totalArea,
      area_with_margin: totalWithMargin,
      price_per_m2: price,
      total_cost: totalCost,
    });
    toast.success('Material adicionado ao projeto!');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-xl mx-auto">
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" /> Calculadora de Material
        </h2>

        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Stone selector */}
            {stones.length > 0 && (
              <div>
                <Label className="text-xs">Pedra do mostruário (opcional)</Label>
                <select value={selectedStone} onChange={e => handleStoneSelect(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Selecione...</option>
                  {stones.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.price_per_m2 > 0 ? `(R$ ${fmt(Number(s.price_per_m2))}/m²)` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Largura (m)</Label>
                <Input type="number" step="0.01" value={width} onChange={e => { setWidth(e.target.value); setCalculated(true); }} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Comprimento (m)</Label>
                <Input type="number" step="0.01" value={length} onChange={e => { setLength(e.target.value); setCalculated(true); }} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Quantidade</Label>
                <Input type="number" min="1" value={quantity} onChange={e => { setQuantity(e.target.value); setCalculated(true); }} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Preço por m² (R$)</Label>
              <Input type="number" step="0.01" value={pricePerM2} onChange={e => { setPricePerM2(e.target.value); setCalculated(true); }} placeholder="0.00" />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {calculated && totalArea > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground">Área por peça</p>
                <p className="text-lg font-bold font-display">{fmt(areaPerPiece)} m²</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground">Área total ({qty} peça{qty > 1 ? 's' : ''})</p>
                <p className="text-lg font-bold font-display">{fmt(totalArea)} m²</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground">Margem de segurança (10%)</p>
                <p className="text-lg font-bold font-display text-warning">+{fmt(margin)} m²</p>
              </CardContent>
            </Card>
            <Card className="border-primary/40">
              <CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground">Total a comprar</p>
                <p className="text-lg font-bold font-display text-primary">{fmt(totalWithMargin)} m²</p>
              </CardContent>
            </Card>
            {price > 0 && (
              <Card className="col-span-2 border-primary/40">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] text-muted-foreground">Custo total estimado</p>
                  <p className="text-2xl font-bold font-display text-primary">R$ {fmt(totalCost)}</p>
                  <p className="text-[11px] text-muted-foreground">{fmt(totalWithMargin)} m² × R$ {fmt(price)}/m²</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Add to project */}
        {calculated && totalArea > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Adicionar ao projeto</p>
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Selecione um projeto...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button className="w-full" disabled={!selectedProject} onClick={addToProject}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar ao projeto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Calculadora;
