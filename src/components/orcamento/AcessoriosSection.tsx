import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import { AcessorioItem, newAcessorio, fmt } from './types';

interface Props {
  acessorios: AcessorioItem[];
  onUpdate: (acessorios: AcessorioItem[]) => void;
}

const AcessoriosSection = ({ acessorios, onUpdate }: Props) => {
  const updateItem = (id: string, field: keyof AcessorioItem, value: string) => {
    onUpdate(acessorios.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const total = acessorios.reduce((sum, a) => {
    return sum + (parseInt(a.quantidade) || 1) * (parseFloat(a.valorUnitario) || 0);
  }, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary" /> Acessórios e Itens Avulsos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="hidden sm:grid grid-cols-[1fr_70px_100px_30px] gap-2 text-[10px] text-muted-foreground uppercase font-medium">
          <span>Item</span><span>Qtd</span><span>Valor un.</span><span></span>
        </div>
        {acessorios.map(a => (
          <div key={a.id} className="grid grid-cols-[1fr_70px_100px_30px] gap-2">
            <Input value={a.nome} onChange={e => updateItem(a.id, 'nome', e.target.value)} className="h-7 text-xs" placeholder="Cuba, torneira, sifão..." />
            <Input type="number" min="1" value={a.quantidade} onChange={e => updateItem(a.id, 'quantidade', e.target.value)} className="h-7 text-xs" />
            <Input type="number" step="0.01" value={a.valorUnitario} onChange={e => updateItem(a.id, 'valorUnitario', e.target.value)} className="h-7 text-xs" placeholder="R$" />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onUpdate(acessorios.filter(x => x.id !== a.id))} disabled={acessorios.length <= 1}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onUpdate([...acessorios, newAcessorio()])}>
            <Plus className="w-3 h-3 mr-1" /> Adicionar item
          </Button>
          {total > 0 && <span className="text-xs font-medium text-primary">Total: R$ {fmt(total)}</span>}
        </div>
      </CardContent>
    </Card>
  );
};

export default AcessoriosSection;
