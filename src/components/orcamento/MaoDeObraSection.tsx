import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MaoDeObra, Instalacao } from './types';

interface Props {
  maoDeObra: MaoDeObra;
  instalacao: Instalacao;
  onChangeMO: (field: keyof MaoDeObra, value: any) => void;
  onChangeInst: (field: keyof Instalacao, value: any) => void;
}

const MaoDeObraSection = ({ maoDeObra, instalacao, onChangeMO, onChangeInst }: Props) => (
  <div className="space-y-3">
    <Label className="text-xs font-medium">Mão de Obra</Label>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div>
        <Label className="text-[10px]">Corte (R$)</Label>
        <div className="flex gap-1">
          <Input type="number" step="0.01" value={maoDeObra.corte} onChange={e => onChangeMO('corte', e.target.value)} className="h-7 text-xs" />
          <select value={maoDeObra.corteTipo} onChange={e => onChangeMO('corteTipo', e.target.value)}
            className="h-7 rounded-md border border-input bg-background px-1 text-[10px] w-14">
            <option value="fixo">fixo</option>
            <option value="m2">/m²</option>
          </select>
        </div>
      </div>
      <div>
        <Label className="text-[10px]">Polimento (R$)</Label>
        <div className="flex gap-1">
          <Input type="number" step="0.01" value={maoDeObra.polimento} onChange={e => onChangeMO('polimento', e.target.value)} className="h-7 text-xs" />
          <select value={maoDeObra.polimentoTipo} onChange={e => onChangeMO('polimentoTipo', e.target.value)}
            className="h-7 rounded-md border border-input bg-background px-1 text-[10px] w-14">
            <option value="fixo">fixo</option>
            <option value="m2">/m²</option>
          </select>
        </div>
      </div>
      <div>
        <Label className="text-[10px]">Instalação (R$)</Label>
        <div className="flex gap-1">
          <Input type="number" step="0.01" value={maoDeObra.instalacao} onChange={e => onChangeMO('instalacao', e.target.value)} className="h-7 text-xs" />
          <select value={maoDeObra.instalacaoTipo} onChange={e => onChangeMO('instalacaoTipo', e.target.value)}
            className="h-7 rounded-md border border-input bg-background px-1 text-[10px] w-14">
            <option value="fixo">fixo</option>
            <option value="m2">/m²</option>
          </select>
        </div>
      </div>
      <div>
        <Label className="text-[10px]">Visita técnica (R$)</Label>
        <Input type="number" step="0.01" value={maoDeObra.visitaTecnica} onChange={e => onChangeMO('visitaTecnica', e.target.value)} className="h-7 text-xs" />
      </div>
    </div>

    <Label className="text-xs font-medium">Instalação e Logística</Label>
    <div className="flex items-center gap-2 mb-2">
      <label className="text-[10px] flex items-center gap-1">
        <input type="checkbox" checked={instalacao.semInstalacao} onChange={e => onChangeInst('semInstalacao', e.target.checked)} />
        Sem instalação neste ambiente
      </label>
    </div>
    {!instalacao.semInstalacao && (
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px]">Medição (R$)</Label>
          <Input type="number" step="0.01" value={instalacao.medicao} onChange={e => onChangeInst('medicao', e.target.value)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Transporte (R$)</Label>
          <Input type="number" step="0.01" value={instalacao.transporte} onChange={e => onChangeInst('transporte', e.target.value)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Mão de obra inst. (R$)</Label>
          <Input type="number" step="0.01" value={instalacao.maoDeObra} onChange={e => onChangeInst('maoDeObra', e.target.value)} className="h-7 text-xs" />
        </div>
      </div>
    )}
  </div>
);

export default MaoDeObraSection;
