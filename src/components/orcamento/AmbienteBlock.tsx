import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import PecaForm from './PecaForm';
import MaterialOptions from './MaterialOptions';
import MaoDeObraSection from './MaoDeObraSection';
import AlertasOrcamento from './AlertasOrcamento';
import {
  Ambiente, PecaItem, MaterialOption, MaoDeObra, Instalacao,
  PECA_TIPOS, newPeca, newMaterialOption,
  calcAmbienteArea, calcAmbienteAreaCompra, calcAmbienteLaborCost,
  calcAmbienteInstallCost, gerarAlertas, fmt,
} from './types';

interface Props {
  ambiente: Ambiente;
  stones: any[];
  onUpdate: (amb: Ambiente) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const AmbienteBlock = ({ ambiente, stones, onUpdate, onRemove, canRemove }: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const pecaTipos = PECA_TIPOS[ambiente.tipo] || PECA_TIPOS['Ambiente Personalizado'];
  const areaLiq = calcAmbienteArea(ambiente);
  const areaCompra = calcAmbienteAreaCompra(ambiente);
  const laborCost = calcAmbienteLaborCost(ambiente);
  const installCost = calcAmbienteInstallCost(ambiente);
  const alertas = gerarAlertas([{ ...ambiente, id: ambiente.id, tipo: ambiente.tipo, nomeCustom: ambiente.nomeCustom, pecas: ambiente.pecas, materialOptions: ambiente.materialOptions, maoDeObra: ambiente.maoDeObra, instalacao: ambiente.instalacao }]);

  const updatePeca = (pecaId: string, field: keyof PecaItem, value: any) => {
    onUpdate({
      ...ambiente,
      pecas: ambiente.pecas.map(p => p.id === pecaId ? { ...p, [field]: value } : p),
    });
  };

  const addPeca = () => {
    onUpdate({ ...ambiente, pecas: [...ambiente.pecas, newPeca(pecaTipos[0])] });
  };

  const removePeca = (pecaId: string) => {
    if (ambiente.pecas.length <= 1) return;
    onUpdate({ ...ambiente, pecas: ambiente.pecas.filter(p => p.id !== pecaId) });
  };

  const updateMaterialOption = (optIndex: number, field: keyof MaterialOption, value: any) => {
    const updated = [...ambiente.materialOptions];
    updated[optIndex] = { ...updated[optIndex], [field]: value };
    onUpdate({ ...ambiente, materialOptions: updated });
  };

  const updateMaterialOptionBatch = (optIndex: number, fields: Partial<MaterialOption>) => {
    const updated = [...ambiente.materialOptions];
    updated[optIndex] = { ...updated[optIndex], ...fields };
    onUpdate({ ...ambiente, materialOptions: updated });
  };

  const addMaterialOption = () => {
    if (ambiente.materialOptions.length >= 3) return;
    const labels = ['Opção A', 'Opção B', 'Opção C'];
    onUpdate({
      ...ambiente,
      materialOptions: [...ambiente.materialOptions, newMaterialOption(labels[ambiente.materialOptions.length])],
    });
  };

  const removeMaterialOption = (optIndex: number) => {
    if (ambiente.materialOptions.length <= 1) return;
    onUpdate({
      ...ambiente,
      materialOptions: ambiente.materialOptions.filter((_, i) => i !== optIndex),
    });
  };

  const updateMO = (field: keyof MaoDeObra, value: any) => {
    onUpdate({ ...ambiente, maoDeObra: { ...ambiente.maoDeObra, [field]: value } });
  };

  const updateInst = (field: keyof Instalacao, value: any) => {
    onUpdate({ ...ambiente, instalacao: { ...ambiente.instalacao, [field]: value } });
  };

  const displayName = ambiente.tipo === 'Ambiente Personalizado' && ambiente.nomeCustom
    ? ambiente.nomeCustom : ambiente.tipo;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <CardTitle className="text-sm font-display">{displayName}</CardTitle>
            {ambiente.tipo === 'Ambiente Personalizado' && (
              <Input
                value={ambiente.nomeCustom}
                onChange={e => onUpdate({ ...ambiente, nomeCustom: e.target.value })}
                className="h-7 text-xs max-w-[200px]"
                placeholder="Nome do ambiente"
              />
            )}
            {areaLiq > 0 && (
              <span className="text-[10px] text-muted-foreground">
                ({fmt(areaLiq)} m² líq. → {fmt(areaCompra)} m² compra)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            {canRemove && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onRemove}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4">
          {/* Alertas */}
          <AlertasOrcamento alertas={alertas} />

          {/* Peças */}
          <div className="space-y-2">
            {ambiente.pecas.map(peca => (
              <PecaForm
                key={peca.id}
                peca={peca}
                pecaTipos={pecaTipos}
                ambienteTipo={ambiente.tipo}
                onChange={(field, value) => updatePeca(peca.id, field, value)}
                onRemove={() => removePeca(peca.id)}
                canRemove={ambiente.pecas.length > 1}
              />
            ))}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addPeca}>
              <Plus className="w-3 h-3 mr-1" /> Adicionar peça
            </Button>
          </div>

          {/* Material options */}
          <MaterialOptions
            ambiente={ambiente}
            stones={stones}
            onUpdateOption={updateMaterialOption}
            onUpdateOptionBatch={updateMaterialOptionBatch}
            onAddOption={addMaterialOption}
            onRemoveOption={removeMaterialOption}
          />

          {/* Labor & Installation */}
          <MaoDeObraSection
            maoDeObra={ambiente.maoDeObra}
            instalacao={ambiente.instalacao}
            onChangeMO={updateMO}
            onChangeInst={updateInst}
          />

          {/* Subtotals */}
          {areaLiq > 0 && (
            <div className="bg-muted/50 rounded-md p-2 text-[11px] flex flex-wrap gap-3">
              <span>Serviços: <b>R$ {fmt(laborCost)}</b></span>
              <span>Instalação: <b>R$ {fmt(installCost)}</b></span>
              {ambiente.instalacao.semInstalacao && <span className="text-warning italic">Sem instalação</span>}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AmbienteBlock;
