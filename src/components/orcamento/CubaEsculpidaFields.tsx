import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import type { CubaEsculpidaData, CubaEsculpidaCalc } from './types';
import { calcCubaEsculpida, fmt } from './types';

interface Props {
  data: CubaEsculpidaData;
  onChange: (field: keyof CubaEsculpidaData, value: string) => void;
}

const CubaEsculpidaFields = ({ data, onChange }: Props) => {
  const calc: CubaEsculpidaCalc = calcCubaEsculpida(data);
  const hasData = calc.totalM2 > 0;

  return (
    <div className="space-y-3 bg-muted/30 rounded-md p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <Info className="w-3.5 h-3.5" />
        Cuba Esculpida — Medidas Obrigatórias
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px]">Comp. externo (cm)</Label>
          <Input type="number" step="0.1" value={data.compExterno}
            onChange={e => onChange('compExterno', e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Larg. externo (cm)</Label>
          <Input type="number" step="0.1" value={data.largExterno}
            onChange={e => onChange('largExterno', e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Comp. interno (cm)</Label>
          <Input type="number" step="0.1" value={data.compInterno}
            onChange={e => onChange('compInterno', e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Larg. interno (cm)</Label>
          <Input type="number" step="0.1" value={data.largInterno}
            onChange={e => onChange('largInterno', e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Profundidade (cm)</Label>
          <Input type="number" step="0.1" value={data.profundidade}
            onChange={e => onChange('profundidade', e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Espessura parede (cm)</Label>
          <Input type="number" step="0.1" value={data.espessuraParede}
            onChange={e => onChange('espessuraParede', e.target.value)} className="h-8 text-xs" />
        </div>
      </div>

      <div>
        <Label className="text-[10px]">Quantidade de cubas</Label>
        <Input type="number" min="1" max="4" value={data.quantidade}
          onChange={e => onChange('quantidade', e.target.value)} className="h-8 text-xs w-20" />
      </div>

      {hasData && (
        <Alert className="bg-primary/5 border-primary/20">
          <AlertDescription className="text-[11px] space-y-1">
            <div className="font-semibold text-primary mb-1">Resumo da Escultura Interna:</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span>Parede frontal:</span><span className="font-medium">{fmt(calc.paredeFrontal)} m²</span>
              <span>Parede traseira:</span><span className="font-medium">{fmt(calc.paredeTraseira)} m²</span>
              <span>Parede lateral esq.:</span><span className="font-medium">{fmt(calc.paredeLateralEsq)} m²</span>
              <span>Parede lateral dir.:</span><span className="font-medium">{fmt(calc.paredeLateralDir)} m²</span>
              <span>Fundo da cuba:</span><span className="font-medium">{fmt(calc.fundo)} m²</span>
            </div>
            <div className="border-t border-primary/20 pt-1 mt-1 flex justify-between font-semibold text-primary">
              <span>Total escultura: {fmt(calc.totalM2)} m²</span>
              <span>Volume: {calc.volumeCm3.toLocaleString('pt-BR')} cm³</span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CubaEsculpidaFields;
