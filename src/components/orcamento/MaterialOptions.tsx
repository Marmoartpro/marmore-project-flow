import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { MaterialOption, calcAmbienteArea, calcAmbienteAreaCompra, calcAmbienteInstallCost, fmt } from './types';
import type { Ambiente } from './types';

interface Props {
  ambiente: Ambiente;
  stones: any[];
  onUpdateOption: (optIndex: number, field: keyof MaterialOption, value: any) => void;
  onUpdateOptionBatch: (optIndex: number, fields: Partial<MaterialOption>) => void;
  onAddOption: () => void;
  onRemoveOption: (optIndex: number) => void;
}

const OPTION_LABELS = ['Opção A', 'Opção B', 'Opção C'];

const MaterialOptions = ({ ambiente, stones, onUpdateOption, onUpdateOptionBatch, onAddOption, onRemoveOption }: Props) => {
  const areaLiq = calcAmbienteArea(ambiente);
  const areaCompra = calcAmbienteAreaCompra(ambiente);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">
          Opções de Material
          {areaLiq > 0 && (
            <span className="text-[10px] text-muted-foreground ml-2">
              ({fmt(areaLiq)} m² líquido → {fmt(areaCompra)} m² compra)
            </span>
          )}
        </Label>
        {ambiente.materialOptions.length < 3 && (
          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={onAddOption}>
            <Plus className="w-3 h-3 mr-1" /> Opção
          </Button>
        )}
      </div>

      {ambiente.materialOptions.map((opt, i) => {
        const materialCost = opt.materialDoCliente ? 0 : areaCompra * opt.pricePerM2;

        return (
          <div key={opt.id} className="border border-border rounded-md p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">{OPTION_LABELS[i] || `Opção ${i + 1}`}</span>
              <div className="flex items-center gap-2">
                <label className="text-[10px] flex items-center gap-1">
                  <input type="checkbox" checked={opt.materialDoCliente}
                    onChange={e => onUpdateOption(i, 'materialDoCliente', e.target.checked)} />
                  Material do cliente
                </label>
                {ambiente.materialOptions.length > 1 && (
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onRemoveOption(i)}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            {opt.materialDoCliente ? (
              <p className="text-[10px] text-warning italic">
                Material fornecido pelo cliente — valor R$ 0,00.
              </p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <select value={opt.stoneId}
                    onChange={e => {
                      const stone = stones.find(s => s.id === e.target.value);
                      onUpdateOptionBatch(i, {
                        stoneId: e.target.value,
                        stoneName: stone?.name || '',
                        pricePerM2: Number(stone?.price_per_m2 || 0),
                      });
                    }}
                    className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="">Selecione pedra...</option>
                    {stones.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.price_per_m2 > 0 ? `(R$ ${fmt(Number(s.price_per_m2))}/m²)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {opt.stoneId && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-muted-foreground whitespace-nowrap">R$/m²:</label>
                    <input type="number" step="0.01" min="0"
                      value={opt.pricePerM2 || ''}
                      onChange={e => onUpdateOption(i, 'pricePerM2', Number(e.target.value) || 0)}
                      className="w-24 h-7 rounded-md border border-input bg-background px-2 text-xs" />
                    {materialCost > 0 && (
                      <span className="text-xs font-medium text-primary whitespace-nowrap">= R$ {fmt(materialCost)}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Comparison table */}
      {ambiente.materialOptions.length > 1 && areaLiq > 0 && (
        <div className="border border-primary/30 rounded-md overflow-x-auto rounded-md">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-primary/10">
                <th className="text-left px-2 py-1">Opção</th>
                <th className="text-right px-2 py-1">Material</th>
                <th className="text-right px-2 py-1">Serviços</th>
                <th className="text-right px-2 py-1">Instalação</th>
                <th className="text-right px-2 py-1 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {ambiente.materialOptions.map((opt, i) => {
                const matCost = opt.materialDoCliente ? 0 : areaCompra * opt.pricePerM2;
                const laborCost = (parseFloat(ambiente.maoDeObra.corte) || 0) +
                  (parseFloat(ambiente.maoDeObra.polimento) || 0) +
                  (parseFloat(ambiente.maoDeObra.visitaTecnica) || 0);
                const installCost = calcAmbienteInstallCost(ambiente);
                return (
                  <tr key={opt.id} className="border-t border-border">
                    <td className="px-2 py-1">{OPTION_LABELS[i]}: {opt.materialDoCliente ? 'Cliente' : (opt.stoneName || '—')}</td>
                    <td className="text-right px-2 py-1">R$ {fmt(matCost)}</td>
                    <td className="text-right px-2 py-1">R$ {fmt(laborCost)}</td>
                    <td className="text-right px-2 py-1">R$ {fmt(installCost)}</td>
                    <td className="text-right px-2 py-1 font-bold text-primary">R$ {fmt(matCost + laborCost + installCost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MaterialOptions;
