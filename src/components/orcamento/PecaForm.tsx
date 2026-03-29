import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  PecaItem, TIPO_CUBA, TIPO_REBAIXO, ACABAMENTO_BORDA,
  BORDAS_COM_ACABAMENTO, FUROS_TORNEIRA, calcPecaArea, fmt,
} from './types';

interface Props {
  peca: PecaItem;
  pecaTipos: string[];
  ambienteTipo?: string;
  onChange: (field: keyof PecaItem, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const PecaForm = ({ peca, pecaTipos, ambienteTipo, onChange, onRemove, canRemove }: Props) => {
  const area = calcPecaArea(peca);
  const showCuba = ['Bancada', 'Lavatório', 'Bancada de Banheiro', 'Bancada Tanque'].includes(peca.tipo);
  const showRebaixo = ['Bancada', 'Bancada de Banheiro'].includes(peca.tipo);
  const showBorda = ['Bancada', 'Lavatório', 'Bancada de Banheiro', 'Soleira', 'Borda de Piscina', 'Escada/Degrau'].includes(peca.tipo);
  const showFuros = ['Bancada', 'Lavatório', 'Bancada de Banheiro'].includes(peca.tipo);
  // Espelho disponível para bancadas e banheiros
  const showBacksplash = ['Bancada', 'Bancada de Banheiro', 'Lavatório', 'Bancada Tanque'].includes(peca.tipo);
  const showCooktop = peca.tipo === 'Bancada';
  // Piscina: mostrar valor por metro do acabamento
  const isPiscina = peca.tipo === 'Borda de Piscina' || peca.tipo === 'Escada/Degrau';

  return (
    <div className="border border-border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <Label className="text-[10px]">Tipo de peça</Label>
            <select value={peca.tipo} onChange={e => onChange('tipo', e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
              {pecaTipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[10px]">Larg. (m)</Label>
            <Input type="number" step="0.01" value={peca.largura} onChange={e => onChange('largura', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Comp. (m)</Label>
            <Input type="number" step="0.01" value={peca.comprimento} onChange={e => onChange('comprimento', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Qtd</Label>
            <Input type="number" min="1" value={peca.quantidade} onChange={e => onChange('quantidade', e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        {canRemove && (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 mt-4" onClick={onRemove}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div>
        <Label className="text-[10px]">Descrição</Label>
        <Input value={peca.descricao} onChange={e => onChange('descricao', e.target.value)} className="h-8 text-xs" placeholder="Descrição opcional da peça" />
      </div>

      {/* Technical details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {showCuba && (
          <>
            <div>
              <Label className="text-[10px]">Tipo de cuba</Label>
              <select value={peca.tipoCuba} onChange={e => onChange('tipoCuba', e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                {TIPO_CUBA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {peca.tipoCuba !== 'Sem cuba' && (
              <div>
                <Label className="text-[10px]">Valor cuba (R$)</Label>
                <Input type="number" step="0.01" value={peca.valorCuba} onChange={e => onChange('valorCuba', e.target.value)}
                  className="h-8 text-xs" placeholder="0,00" />
              </div>
            )}
          </>
        )}
        {showRebaixo && (
          <>
            <div>
              <Label className="text-[10px]">Rebaixo área pia</Label>
              <select value={peca.tipoRebaixo} onChange={e => onChange('tipoRebaixo', e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                {TIPO_REBAIXO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {peca.tipoRebaixo !== 'Sem rebaixo' && (
              <div>
                <Label className="text-[10px]">Valor rebaixo (R$)</Label>
                <Input type="number" step="0.01" value={peca.valorRebaixo} onChange={e => onChange('valorRebaixo', e.target.value)}
                  className="h-8 text-xs" placeholder="0,00" />
              </div>
            )}
          </>
        )}
        {showBorda && (
          <>
            <div>
              <Label className="text-[10px]">Acabamento borda</Label>
              <select value={peca.acabamentoBorda} onChange={e => onChange('acabamentoBorda', e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                {ACABAMENTO_BORDA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px]">Bordas com acabamento</Label>
              <select value={peca.bordasComAcabamento} onChange={e => onChange('bordasComAcabamento', e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                {BORDAS_COM_ACABAMENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {(isPiscina || peca.acabamentoBorda !== 'Reto') && (
              <div>
                <Label className="text-[10px]">Valor acabamento (R$/m)</Label>
                <Input type="number" step="0.01" value={peca.valorAcabamentoBorda} onChange={e => onChange('valorAcabamentoBorda', e.target.value)}
                  className="h-8 text-xs" placeholder="0,00" />
              </div>
            )}
          </>
        )}
        {showFuros && (
          <div>
            <Label className="text-[10px]">Furos torneira</Label>
            <select value={peca.furosTorneira} onChange={e => onChange('furosTorneira', e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
              {FUROS_TORNEIRA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Backsplash & Saia */}
      <div className="flex flex-wrap gap-4 text-xs">
        {showBacksplash && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={peca.espelhoBacksplash} onChange={e => onChange('espelhoBacksplash', e.target.checked)} />
            Espelho (backsplash)
            {peca.espelhoBacksplash && (
              <Input type="number" step="0.01" value={peca.espelhoBacksplashAltura} onChange={e => onChange('espelhoBacksplashAltura', e.target.value)}
                className="h-6 w-16 text-xs ml-1" placeholder="Alt. cm" />
            )}
          </label>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={peca.saiaFrontal} onChange={e => onChange('saiaFrontal', e.target.checked)} />
          Saia frontal
          {peca.saiaFrontal && (
            <Input type="number" step="0.01" value={peca.saiaFrontalAltura} onChange={e => onChange('saiaFrontalAltura', e.target.value)}
              className="h-6 w-16 text-xs ml-1" placeholder="Alt. cm" />
          )}
        </label>
        {showCooktop && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={peca.rebaixoCooktop} onChange={e => onChange('rebaixoCooktop', e.target.checked)} />
            Rebaixo cooktop
          </label>
        )}
      </div>

      {/* Area info */}
      {area > 0 && (
        <div className="text-[11px] text-muted-foreground flex gap-3">
          <span>Área: {fmt(area)} m²</span>
          <span>+10%: {fmt(area * 1.1)} m²</span>
        </div>
      )}
    </div>
  );
};

export default PecaForm;
