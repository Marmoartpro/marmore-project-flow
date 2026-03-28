import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = ['Todos', 'Granito', 'Mármore', 'Quartzito', 'Quartzo Artificial', 'Lâmina Ultracompacta'];

const COLOR_TONES = [
  { label: 'Claras', value: 'clara', keywords: ['branco', 'bege', 'claro', 'creme', 'polar', 'puro', 'dallas', 'botticino', 'calacatta', 'sirius', 'persa white', 'silver'] },
  { label: 'Escuras', value: 'escura', keywords: ['preto', 'escuro', 'negro', 'antracite', 'profundo', 'kelya', 'laurent', 'nebula', 'skyfall'] },
  { label: 'Coloridas', value: 'colorida', keywords: ['azul', 'verde', 'vermelho', 'rosa', 'marrom', 'caramelo', 'esmeralda', 'imperial', 'amazônia', 'labrador', 'rosso', 'guatemala', 'balmoral', 'iracema', 'siena'] },
];

const USAGE_FILTERS = [
  { label: 'Cozinha', value: 'cozinha' },
  { label: 'Banheiro', value: 'banheiro' },
  { label: 'Área externa', value: 'externa' },
  { label: 'Fachada', value: 'fachada' },
  { label: 'Lavabo', value: 'lavabo' },
  { label: 'Piso', value: 'piso' },
];

interface StoneFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  colorTone: string;
  setColorTone: (v: string) => void;
  usageFilter: string;
  setUsageFilter: (v: string) => void;
  stockFilter: string;
  setStockFilter: (v: string) => void;
}

const StoneFilters = ({
  search, setSearch, category, setCategory,
  colorTone, setColorTone, usageFilter, setUsageFilter,
  stockFilter, setStockFilter,
}: StoneFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilters = [colorTone, usageFilter, stockFilter].filter(Boolean).length;

  const clearAll = () => {
    setColorTone('');
    setUsageFilter('');
    setStockFilter('');
    setCategory('Todos');
    setSearch('');
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar pedra..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-10" />
        {(search || activeFilters > 0) && (
          <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={clearAll}>
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} className="text-xs whitespace-nowrap" onClick={() => setCategory(c)}>
            {c}
          </Button>
        ))}
      </div>

      {/* Toggle advanced filters */}
      <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setShowAdvanced(!showAdvanced)}>
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filtros
        {activeFilters > 0 && <Badge className="h-4 w-4 p-0 text-[9px] flex items-center justify-center">{activeFilters}</Badge>}
      </Button>

      {showAdvanced && (
        <div className="space-y-2 p-3 rounded-lg border border-border bg-card/50 animate-in slide-in-from-top-2">
          {/* Color tone */}
          <div>
            <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Tonalidade</p>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_TONES.map(t => (
                <Button key={t.value} size="sm" variant={colorTone === t.value ? 'default' : 'outline'} className="text-[11px] h-7" onClick={() => setColorTone(colorTone === t.value ? '' : t.value)}>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Usage */}
          <div>
            <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Indicação de uso</p>
            <div className="flex gap-1.5 flex-wrap">
              {USAGE_FILTERS.map(u => (
                <Button key={u.value} size="sm" variant={usageFilter === u.value ? 'default' : 'outline'} className="text-[11px] h-7" onClick={() => setUsageFilter(usageFilter === u.value ? '' : u.value)}>
                  {u.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Stock */}
          <div>
            <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Disponibilidade</p>
            <div className="flex gap-1.5">
              <Button size="sm" variant={stockFilter === 'in_stock' ? 'default' : 'outline'} className="text-[11px] h-7" onClick={() => setStockFilter(stockFilter === 'in_stock' ? '' : 'in_stock')}>
                Em estoque
              </Button>
              <Button size="sm" variant={stockFilter === 'consulta' ? 'default' : 'outline'} className="text-[11px] h-7" onClick={() => setStockFilter(stockFilter === 'consulta' ? '' : 'consulta')}>
                Sob consulta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { COLOR_TONES, CATEGORIES };
export default StoneFilters;
