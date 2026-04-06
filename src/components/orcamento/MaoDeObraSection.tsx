import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { MaoDeObra, Instalacao, ServicoCustom } from './types';
import { newServicoCustom } from './types';

interface Props {
  maoDeObra: MaoDeObra;
  instalacao: Instalacao;
  onChangeMO: (field: keyof MaoDeObra, value: any) => void;
  onChangeInst: (field: keyof Instalacao, value: any) => void;
}

const MaoDeObraSection = ({ maoDeObra, instalacao, onChangeMO, onChangeInst }: Props) => {
  const servicosCustom = maoDeObra.servicosCustom || [];

  const addServico = () => {
    onChangeMO('servicosCustom', [...servicosCustom, newServicoCustom()]);
  };

  const updateServico = (id: string, field: keyof ServicoCustom, value: any) => {
    onChangeMO('servicosCustom', servicosCustom.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeServico = (id: string) => {
    onChangeMO('servicosCustom', servicosCustom.filter(s => s.id !== id));
  };

  return (
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
              <option value="ml">/ml</option>
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

      {/* Corte 45° e Chanfrado 45° */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <Label className="text-[10px]">Corte 45° (R$)</Label>
          <div className="flex gap-1">
            <Input type="number" step="0.01" value={maoDeObra.corte45 || ''} onChange={e => onChangeMO('corte45', e.target.value)} className="h-7 text-xs" />
            <select value={maoDeObra.corte45Tipo || 'ml'} onChange={e => onChangeMO('corte45Tipo', e.target.value)}
              className="h-7 rounded-md border border-input bg-background px-1 text-[10px] w-14">
              <option value="fixo">fixo</option>
              <option value="ml">/ml</option>
            </select>
          </div>
        </div>
        {(maoDeObra.corte45Tipo || 'ml') === 'ml' && (
          <div>
            <Label className="text-[10px]">Metros lineares 45°</Label>
            <Input type="number" step="0.01" value={maoDeObra.corte45Metros || ''} onChange={e => onChangeMO('corte45Metros', e.target.value)}
              className="h-7 text-xs" placeholder="0,00" />
          </div>
        )}
        <div>
          <Label className="text-[10px]">Chanfrado 45° (R$/ml)</Label>
          <div className="flex gap-1">
            <Input type="number" step="0.01" value={maoDeObra.polimentoChanfradoML || ''} onChange={e => onChangeMO('polimentoChanfradoML', e.target.value)} className="h-7 text-xs" />
            <select value={maoDeObra.polimentoChanfradoTipo || 'ml'} onChange={e => onChangeMO('polimentoChanfradoTipo', e.target.value)}
              className="h-7 rounded-md border border-input bg-background px-1 text-[10px] w-14">
              <option value="fixo">fixo</option>
              <option value="ml">/ml</option>
            </select>
          </div>
        </div>
      </div>

      {/* Serviços customizados */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-medium">Serviços adicionais</Label>
          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={addServico}>
            <Plus className="w-3 h-3 mr-1" /> Serviço
          </Button>
        </div>
        {servicosCustom.map(s => (
          <div key={s.id} className="flex items-center gap-2">
            <Input value={s.descricao} onChange={e => updateServico(s.id, 'descricao', e.target.value)}
              className="h-7 text-xs flex-1" placeholder="Descrição do serviço" />
            <Input type="number" step="0.01" value={s.valor} onChange={e => updateServico(s.id, 'valor', e.target.value)}
              className="h-7 text-xs w-24" placeholder="R$" />
            <select value={s.tipo} onChange={e => updateServico(s.id, 'tipo', e.target.value)}
              className="h-7 rounded-md border border-input bg-background px-1 text-[10px] w-14">
              <option value="fixo">fixo</option>
              <option value="m2">/m²</option>
              <option value="ml">/ml</option>
            </select>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeServico(s.id)}>
              <Trash2 className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
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
};

export default MaoDeObraSection;
