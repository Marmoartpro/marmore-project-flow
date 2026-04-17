import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import CubaEsculpidaFields from './CubaEsculpidaFields';
import PecaPreview from './PecaPreview';
import {
  PecaItem, CubaEsculpidaData, Abertura,
  TIPO_CUBA, TIPO_REBAIXO, ACABAMENTO_BORDA,
  BORDAS_COM_ACABAMENTO, FUROS_TORNEIRA, FORMATOS_PECA, PADROES_PISO,
  SAIA_OPCOES,
  calcPecaAreaLiquida, calcPecaAreaCompra, calcMetrosLinearesBorda,
  calcCubaEsculpida, fmt, newAbertura,
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
  const areaLiq = calcPecaAreaLiquida(peca);
  const areaCompra = calcPecaAreaCompra(peca);
  const mlBorda = calcMetrosLinearesBorda(peca);

  const is = (...tipos: string[]) => tipos.includes(peca.tipo);
  const showCuba = is('Bancada', 'Bancada Gourmet', 'Bancada com Cooktop', 'Lavatório', 'Lavabo Externo',
    'Bancada de Banheiro', 'Bancada Suspensa', 'Tampo Cuba Dupla', 'Bancada Tanque', 'Ilha Gourmet', 'Península',
    'Bancada de Churrasqueira');
  const showRebaixo = is('Bancada', 'Bancada Gourmet', 'Bancada com Cooktop', 'Bancada de Banheiro',
    'Bancada Suspensa', 'Tampo Cuba Dupla', 'Ilha Gourmet', 'Península', 'Bancada de Churrasqueira');
  const showBorda = is('Bancada', 'Bancada Gourmet', 'Bancada com Cooktop', 'Lavatório', 'Lavabo Externo',
    'Bancada de Banheiro', 'Bancada Suspensa', 'Tampo Cuba Dupla', 'Soleira', 'Soleira de Box',
    'Borda de Piscina', 'Escada/Degrau', 'Espelho de Escada', 'Peitoril', 'Calha/Pingadeira',
    'Tampo de Mesa', 'Mesa de Mármore', 'Ilha Gourmet', 'Península', 'Frontão', 'Frontão de Banheira',
    'Bancada de Churrasqueira', 'Tampo de Grelha');
  const showFuros = is('Bancada', 'Bancada Gourmet', 'Bancada com Cooktop', 'Lavatório', 'Lavabo Externo',
    'Bancada de Banheiro', 'Bancada Suspensa', 'Tampo Cuba Dupla', 'Ilha Gourmet', 'Península',
    'Bancada de Churrasqueira');
  const showBacksplash = is('Bancada', 'Bancada Gourmet', 'Bancada com Cooktop', 'Bancada de Banheiro',
    'Bancada Suspensa', 'Tampo Cuba Dupla', 'Lavatório', 'Lavabo Externo', 'Bancada Tanque',
    'Ilha Gourmet', 'Península', 'Bancada de Churrasqueira');
  const showCooktop = is('Bancada', 'Bancada Gourmet', 'Bancada com Cooktop', 'Ilha Gourmet', 'Península');
  const showIlhargas = is('Bancada', 'Bancada Gourmet', 'Bancada com Cooktop', 'Bancada de Banheiro',
    'Bancada Suspensa', 'Bancada Tanque', 'Lavatório', 'Lavabo Externo', 'Ilha Gourmet', 'Península',
    'Bancada de Churrasqueira');
  const isPiscina = is('Borda de Piscina');
  const isEscada = is('Escada/Degrau', 'Espelho de Escada', 'Rodapé Escada');
  const isSoleira = is('Soleira', 'Soleira de Box');
  const isPeitoril = is('Peitoril', 'Calha/Pingadeira');
  const isRodape = is('Rodapé/Filete', 'Rodapé Escada');
  const isRevestimento = is('Revestimento de Parede');
  const isPiso = is('Piso');
  const isTampo = is('Tampo de Mesa', 'Mesa de Mármore');
  const isNicho = is('Nicho Embutido', 'Nicho de Box');
  const isBox = is('Box - Piso');
  const showFormato = is('Tampo de Mesa', 'Mesa de Mármore', 'Peça Personalizada', 'Piso',
    'Lareira', 'Revestimento de Parede');
  const showPrateleira = is('Lavatório', 'Lavabo Externo', 'Bancada de Banheiro', 'Bancada Suspensa');

  const handleCubaEsculpidaChange = (field: keyof CubaEsculpidaData, value: string) => {
    onChange('cubaEsculpida', { ...peca.cubaEsculpida, [field]: value });
  };

  const addAbertura = () => {
    onChange('aberturas', [...(peca.aberturas || []), newAbertura()]);
  };
  const removeAbertura = (id: string) => {
    onChange('aberturas', (peca.aberturas || []).filter(a => a.id !== id));
  };
  const updateAbertura = (id: string, field: keyof Abertura, value: string) => {
    onChange('aberturas', (peca.aberturas || []).map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const isChanfrado45 = peca.acabamentoBorda === 'Chanfrado 45°';

  return (
    <div className="border border-border rounded-md p-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-[10px] text-primary font-semibold">Nome da peça *</Label>
            <Input value={peca.nomePeca || ''} onChange={e => onChange('nomePeca', e.target.value)}
              className="h-8 text-xs border-primary/30" placeholder="Ex: Bancada principal" />
          </div>
          <div>
            <Label className="text-[10px]">Tipo de peça</Label>
            <select value={peca.tipo} onChange={e => onChange('tipo', e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
              {pecaTipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {showFormato && (
            <div>
              <Label className="text-[10px]">Formato</Label>
              <select value={peca.formato} onChange={e => onChange('formato', e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                {FORMATOS_PECA.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          )}

          {/* Dimensions based on format */}
          {peca.formato === 'redondo' ? (
            <div>
              <Label className="text-[10px]">Raio (cm)</Label>
              <Input type="number" step="0.1" value={peca.raio}
                onChange={e => onChange('raio', e.target.value)} className="h-8 text-xs" />
            </div>
          ) : peca.formato === 'semicircular' || peca.formato === 'setor_circular' ? (
            <>
              <div>
                <Label className="text-[10px]">Raio (cm)</Label>
                <Input type="number" step="0.1" value={peca.raio}
                  onChange={e => onChange('raio', e.target.value)} className="h-8 text-xs" />
              </div>
              {peca.formato === 'setor_circular' && (
                <div>
                  <Label className="text-[10px]">Ângulo (°)</Label>
                  <Input type="number" step="1" value={peca.angulo}
                    onChange={e => onChange('angulo', e.target.value)} className="h-8 text-xs" />
                </div>
              )}
            </>
          ) : peca.formato === 'triangular' ? (
            <>
              <div>
                <Label className="text-[10px]">Base (cm)</Label>
                <Input type="number" step="0.1" value={peca.comprimento}
                  onChange={e => onChange('comprimento', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Altura (cm)</Label>
                <Input type="number" step="0.1" value={peca.alturaForma}
                  onChange={e => onChange('alturaForma', e.target.value)} className="h-8 text-xs" />
              </div>
            </>
          ) : peca.formato === 'trapezoidal' ? (
            <>
              <div>
                <Label className="text-[10px]">Base maior (cm)</Label>
                <Input type="number" step="0.1" value={peca.baseMaior}
                  onChange={e => onChange('baseMaior', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Base menor (cm)</Label>
                <Input type="number" step="0.1" value={peca.baseMenor}
                  onChange={e => onChange('baseMenor', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Altura (cm)</Label>
                <Input type="number" step="0.1" value={peca.alturaForma}
                  onChange={e => onChange('alturaForma', e.target.value)} className="h-8 text-xs" />
              </div>
            </>
          ) : peca.formato === 'irregular' ? (
            <div>
              <Label className="text-[10px]">Área manual (cm²)</Label>
              <Input type="number" step="1" value={peca.areaManualCm2}
                onChange={e => onChange('areaManualCm2', e.target.value)} className="h-8 text-xs" />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-[10px]">Larg. (cm)</Label>
                <Input type="number" step="0.1" value={peca.largura}
                  onChange={e => onChange('largura', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Comp. (cm)</Label>
                <Input type="number" step="0.1" value={peca.comprimento}
                  onChange={e => onChange('comprimento', e.target.value)} className="h-8 text-xs" />
              </div>
            </>
          )}

          <div>
            <Label className="text-[10px]">Qtd</Label>
            <Input type="number" min="1" value={peca.quantidade}
              onChange={e => onChange('quantidade', e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        {canRemove && (
          <Button size="icon" variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 mt-4"
            onClick={onRemove}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* L-Shape second segment */}
      {peca.formato === 'l_shape' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div className="col-span-full text-[10px] font-medium text-muted-foreground">Trecho 2 do L:</div>
          <div>
            <Label className="text-[10px]">Larg. trecho 2 (cm)</Label>
            <Input type="number" step="0.1" value={peca.lTrecho2Largura}
              onChange={e => onChange('lTrecho2Largura', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Comp. trecho 2 (cm)</Label>
            <Input type="number" step="0.1" value={peca.lTrecho2Comprimento}
              onChange={e => onChange('lTrecho2Comprimento', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Posição do L</Label>
            <select value={peca.lPosicao || 'superior_direito'} onChange={e => onChange('lPosicao', e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
              <option value="superior_direito">Canto superior direito</option>
              <option value="superior_esquerdo">Canto superior esquerdo</option>
              <option value="inferior_direito">Canto inferior direito</option>
              <option value="inferior_esquerdo">Canto inferior esquerdo</option>
            </select>
          </div>
        </div>
      )}

      {/* Descrição */}
      <div>
        <Label className="text-[10px]">Descrição</Label>
        <Input value={peca.descricao} onChange={e => onChange('descricao', e.target.value)}
          className="h-8 text-xs" placeholder="Descrição opcional da peça" />
      </div>

      {/* Soleira/Peitoril method */}
      {(isSoleira || isPeitoril) && (
        <div className="flex gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input type="radio" name={`calc-${peca.id}`} checked={peca.metodoCalculo === 'area'}
              onChange={() => onChange('metodoCalculo', 'area')} /> Por área (m²)
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name={`calc-${peca.id}`} checked={peca.metodoCalculo === 'ml'}
              onChange={() => onChange('metodoCalculo', 'ml')} /> Por metro linear
          </label>
        </div>
      )}

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
            {peca.tipoCuba !== 'Sem cuba' && peca.tipoCuba !== 'Cuba esculpida' && (
              <div>
                <Label className="text-[10px]">Valor cuba (R$)</Label>
                <Input type="number" step="0.01" value={peca.valorCuba}
                  onChange={e => onChange('valorCuba', e.target.value)} className="h-8 text-xs" />
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
            {/* Rebaixo americano / italiano = por m² */}
            {peca.tipoRebaixo !== 'Sem rebaixo' && peca.tipoRebaixo !== 'Rebaixo tradicional' && (
              <>
                <div>
                  <Label className="text-[10px]">Valor rebaixo (R$/m²)</Label>
                  <Input type="number" step="0.01" value={peca.valorRebaixo}
                    onChange={e => onChange('valorRebaixo', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Comp. rebaixo (cm)</Label>
                  <Input type="number" step="0.1" value={peca.rebaixoComprimento}
                    onChange={e => onChange('rebaixoComprimento', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Larg. rebaixo (cm)</Label>
                  <Input type="number" step="0.1" value={peca.rebaixoLargura}
                    onChange={e => onChange('rebaixoLargura', e.target.value)} className="h-8 text-xs" />
                </div>
                {(parseFloat(peca.rebaixoComprimento) > 0 && parseFloat(peca.rebaixoLargura) > 0) && (
                  <div className="col-span-full text-[10px] text-muted-foreground">
                    Área do rebaixo: <b className="text-foreground">{fmt(parseFloat(peca.rebaixoComprimento) * parseFloat(peca.rebaixoLargura) / 10000)} m²</b>
                  </div>
                )}
              </>
            )}
            {/* Rebaixo tradicional = filete por ml */}
            {peca.tipoRebaixo === 'Rebaixo tradicional' && (
              <>
                <div>
                  <Label className="text-[10px]">Metros lineares do filete (ml)</Label>
                  <Input type="number" step="0.01" value={peca.rebaixoTradicionalML}
                    onChange={e => onChange('rebaixoTradicionalML', e.target.value)} className="h-8 text-xs" placeholder="0,00" />
                </div>
                <div>
                  <Label className="text-[10px]">Valor do filete (R$/ml)</Label>
                  <Input type="number" step="0.01" value={peca.valorRebaixoTradicionalML}
                    onChange={e => onChange('valorRebaixoTradicionalML', e.target.value)} className="h-8 text-xs" />
                </div>
                {(parseFloat(peca.rebaixoTradicionalML) > 0 && parseFloat(peca.valorRebaixoTradicionalML) > 0) && (
                  <div className="col-span-full text-[10px] text-muted-foreground">
                    Custo do filete: <b className="text-foreground">R$ {fmt((parseFloat(peca.valorRebaixoTradicionalML) || 0) * (parseFloat(peca.rebaixoTradicionalML) || 0))}</b>
                  </div>
                )}
              </>
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
              <select
                value={peca.bordasLadosAtivo ? '__avancado__' : peca.bordasComAcabamento}
                onChange={e => {
                  if (e.target.value === '__avancado__') {
                    onChange('bordasLadosAtivo', true);
                  } else {
                    onChange('bordasLadosAtivo', false);
                    onChange('bordasComAcabamento', e.target.value);
                  }
                }}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                {BORDAS_COM_ACABAMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="__avancado__">⚙️ Selecionar lados individualmente…</option>
              </select>
            </div>
            {peca.bordasLadosAtivo && (
              <div className="col-span-full bg-muted/30 rounded-md p-2 space-y-1">
                <div className="text-[10px] font-medium text-muted-foreground">
                  Marque os lados que terão acabamento:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!peca.bordaFrente}
                      onChange={e => onChange('bordaFrente', e.target.checked)} />
                    Frente
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!peca.bordaFundo}
                      onChange={e => onChange('bordaFundo', e.target.checked)} />
                    Fundo
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!peca.bordaEsquerda}
                      onChange={e => onChange('bordaEsquerda', e.target.checked)} />
                    Lateral Esq.
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!peca.bordaDireita}
                      onChange={e => onChange('bordaDireita', e.target.checked)} />
                    Lateral Dir.
                  </label>
                </div>
              </div>
            )}
            {(isPiscina || peca.acabamentoBorda !== 'Reto') && (
              <div>
                <Label className="text-[10px]">
                  {isChanfrado45 ? 'Valor chanfrado 45° (R$/ml)' : 'Valor acab. (R$/ml)'}
                </Label>
                <Input type="number" step="0.01" value={peca.valorAcabamentoBorda}
                  onChange={e => onChange('valorAcabamentoBorda', e.target.value)} className="h-8 text-xs" />
              </div>
            )}
            {isChanfrado45 && mlBorda > 0 && (
              <div className="col-span-full text-[10px] text-muted-foreground">
                Total ml de chanfrado: <b className="text-foreground">{fmt(mlBorda)} ml</b>
                {parseFloat(peca.valorAcabamentoBorda) > 0 && (
                  <> × R$ {fmt(parseFloat(peca.valorAcabamentoBorda))} = <b className="text-foreground">R$ {fmt(mlBorda * (parseFloat(peca.valorAcabamentoBorda) || 0))}</b></>
                )}
              </div>
            )}
            {/* Preview visual da peça com bordas marcadas */}
            <div className="col-span-full flex flex-col items-center gap-1 pt-1">
              <PecaPreview peca={peca} />
              {mlBorda > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Perímetro com acabamento: <b className="text-foreground">{fmt(mlBorda)} ml</b>
                </span>
              )}
            </div>
          </>
        )}

        {showFuros && (
          <>
            <div>
              <Label className="text-[10px]">Furos torneira</Label>
              <select value={peca.furosTorneira} onChange={e => onChange('furosTorneira', e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                {FUROS_TORNEIRA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {peca.furosTorneira !== 'Nenhum' && (
              <div>
                <Label className="text-[10px]">Valor/furo (R$)</Label>
                <Input type="number" step="0.01" value={peca.valorFuroTorneira}
                  onChange={e => onChange('valorFuroTorneira', e.target.value)} className="h-8 text-xs" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Cuba esculpida details */}
      {peca.tipoCuba === 'Cuba esculpida' && showCuba && (
        <CubaEsculpidaFields data={peca.cubaEsculpida} onChange={handleCubaEsculpidaChange} />
      )}
      {peca.tipoCuba === 'Cuba esculpida' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Valor escultura (R$/m²)</Label>
            <Input type="number" step="0.01" value={peca.valorCuba}
              onChange={e => onChange('valorCuba', e.target.value)} className="h-8 text-xs" />
          </div>
          {calcCubaEsculpida(peca.cubaEsculpida).totalM2 > 0 && (
            <div className="flex items-end text-[10px] text-muted-foreground pb-1">
              Custo total: <b className="text-foreground ml-1">R$ {fmt((parseFloat(peca.valorCuba) || 0) * calcCubaEsculpida(peca.cubaEsculpida).totalM2)}</b>
            </div>
          )}
        </div>
      )}

      {/* Cuba dimensions for all non-esculpida types — including Qtd cubas */}
      {['Cuba de embutir', 'Cuba colada por baixo (undermount)', 'Cuba sobreposta', 'Cuba flush'].includes(peca.tipoCuba) && showCuba && (
        <div className="grid grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div className="col-span-3 text-[10px] font-medium text-muted-foreground">Dimensões da cuba (para cálculo de recorte):</div>
          <div>
            <Label className="text-[10px]">Comp. cuba (cm)</Label>
            <Input type="number" step="0.1" value={peca.cubaEsculpida.compExterno}
              onChange={e => handleCubaEsculpidaChange('compExterno', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Larg. cuba (cm)</Label>
            <Input type="number" step="0.1" value={peca.cubaEsculpida.largExterno}
              onChange={e => handleCubaEsculpidaChange('largExterno', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Qtd cubas</Label>
            <Input type="number" min="1" max="4" value={peca.cubaEsculpida.quantidade}
              onChange={e => handleCubaEsculpidaChange('quantidade', e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* Backsplash, Saia, Cooktop, Ilhargas checkboxes */}
      <div className="flex flex-wrap gap-4 text-xs">
        {showBacksplash && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={peca.espelhoBacksplash}
              onChange={e => onChange('espelhoBacksplash', e.target.checked)} />
            Espelho (backsplash)
            {peca.espelhoBacksplash && (
              <Input type="number" step="0.1" value={peca.espelhoBacksplashAltura}
                onChange={e => onChange('espelhoBacksplashAltura', e.target.value)}
                className="h-6 w-16 text-xs ml-1" placeholder="Alt. cm" />
            )}
          </label>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={peca.saiaFrontal}
            onChange={e => onChange('saiaFrontal', e.target.checked)} />
          Saia frontal
          {peca.saiaFrontal && (
            <Input type="number" step="0.1" value={peca.saiaFrontalAltura}
              onChange={e => onChange('saiaFrontalAltura', e.target.value)}
              className="h-6 w-16 text-xs ml-1" placeholder="Alt. cm" />
          )}
        </label>
        {showCooktop && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={peca.rebaixoCooktop}
              onChange={e => onChange('rebaixoCooktop', e.target.checked)} />
            Recorte cooktop
          </label>
        )}
        {showIlhargas && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={peca.ilhargas}
              onChange={e => onChange('ilhargas', e.target.checked)} />
            Ilhargas / pés revestidos
          </label>
        )}
        {showPrateleira && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={peca.prateleira}
              onChange={e => onChange('prateleira', e.target.checked)} />
            Prateleira inferior
          </label>
        )}
      </div>

      {/* Saia options (independent from bordas) */}
      {peca.saiaFrontal && (
        <div className="grid grid-cols-2 gap-2 bg-muted/30 rounded-md p-2">
          <div>
            <Label className="text-[10px]">Lados com saia</Label>
            <select value={peca.saiaOpcao || 'Só frente'} onChange={e => onChange('saiaOpcao', e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
              {SAIA_OPCOES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Cooktop dimensions */}
      {peca.rebaixoCooktop && showCooktop && (
        <div className="grid grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div>
            <Label className="text-[10px]">Larg. cooktop (cm)</Label>
            <Input type="number" step="0.1" value={peca.rebaixoCooktopLargura}
              onChange={e => onChange('rebaixoCooktopLargura', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Comp. cooktop (cm)</Label>
            <Input type="number" step="0.1" value={peca.rebaixoCooktopComprimento}
              onChange={e => onChange('rebaixoCooktopComprimento', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Valor recorte (R$)</Label>
            <Input type="number" step="0.01" value={peca.valorRecorteCooktop}
              onChange={e => onChange('valorRecorteCooktop', e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* Ilhargas details */}
      {peca.ilhargas && showIlhargas && (
        <div className="grid grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div>
            <Label className="text-[10px]">Qtd ilhargas</Label>
            <Input type="number" min="1" value={peca.ilhargasQtd}
              onChange={e => onChange('ilhargasQtd', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Altura (cm)</Label>
            <Input type="number" step="0.1" value={peca.ilhargasAltura}
              onChange={e => onChange('ilhargasAltura', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Largura (cm)</Label>
            <Input type="number" step="0.1" value={peca.ilhargasLargura}
              onChange={e => onChange('ilhargasLargura', e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* Prateleira inferior */}
      {peca.prateleira && showPrateleira && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div>
            <Label className="text-[10px]">Larg. prateleira (cm)</Label>
            <Input type="number" step="0.1" value={peca.prateleiraLargura}
              onChange={e => onChange('prateleiraLargura', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Comp. prateleira (cm)</Label>
            <Input type="number" step="0.1" value={peca.prateleiraComprimento}
              onChange={e => onChange('prateleiraComprimento', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className="flex items-center gap-2 text-[10px]">
              <input type="checkbox" checked={peca.prateleiraComSaia}
                onChange={e => onChange('prateleiraComSaia', e.target.checked)} />
              Saia da prateleira
            </label>
            {peca.prateleiraComSaia && (
              <Input type="number" step="0.1" value={peca.prateleiraAltura}
                onChange={e => onChange('prateleiraAltura', e.target.value)}
                className="h-7 text-xs" placeholder="Altura saia (cm)" />
            )}
          </div>
        </div>
      )}

      {/* ═══ PISCINA ═══ */}
      {isPiscina && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-blue-50 dark:bg-blue-950/20 rounded-md p-2">
          <div className="col-span-full text-[10px] font-medium text-muted-foreground">Detalhes Piscina:</div>
          <div>
            <Label className="text-[10px]">Cantos internos (90°)</Label>
            <Input type="number" min="0" value={peca.cantosInternos}
              onChange={e => onChange('cantosInternos', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">R$/canto interno</Label>
            <Input type="number" step="0.01" value={peca.valorCantoInterno}
              onChange={e => onChange('valorCantoInterno', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Cantos externos (90°)</Label>
            <Input type="number" min="0" value={peca.cantosExternos}
              onChange={e => onChange('cantosExternos', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">R$/canto externo</Label>
            <Input type="number" step="0.01" value={peca.valorCantoExterno}
              onChange={e => onChange('valorCantoExterno', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Prof. submersa (cm)</Label>
            <Input type="number" step="0.1" value={peca.profundidadeSubmersa}
              onChange={e => onChange('profundidadeSubmersa', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="col-span-full flex items-center gap-2">
            <label className="text-[10px] flex items-center gap-1">
              <input type="checkbox" checked={peca.canaletaEscoamento}
                onChange={e => onChange('canaletaEscoamento', e.target.checked)} />
              Canaleta de escoamento
            </label>
          </div>
          {peca.canaletaEscoamento && (
            <>
              <div>
                <Label className="text-[10px]">Metros canaleta</Label>
                <Input type="number" step="0.1" value={peca.canaletaMetros}
                  onChange={e => onChange('canaletaMetros', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">R$/metro canaleta</Label>
                <Input type="number" step="0.01" value={peca.valorCanaletaMetro}
                  onChange={e => onChange('valorCanaletaMetro', e.target.value)} className="h-8 text-xs" />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ ESCADA ═══ */}
      {isEscada && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div className="col-span-full text-[10px] font-medium text-muted-foreground">Detalhes Escada/Degrau:</div>
          <div>
            <Label className="text-[10px]">Altura espelho (cm)</Label>
            <Input type="number" step="0.1" value={peca.alturaEspelho}
              onChange={e => onChange('alturaEspelho', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="col-span-full flex flex-wrap gap-4">
            <label className="text-[10px] flex items-center gap-1">
              <input type="checkbox" checked={peca.frisosAntiderrapante}
                onChange={e => onChange('frisosAntiderrapante', e.target.checked)} />
              Frisos antiderrapante
            </label>
          </div>
          {peca.frisosAntiderrapante && (
            <>
              <div>
                <Label className="text-[10px]">Frisos/degrau</Label>
                <Input type="number" min="1" value={peca.qtdFrisosPorDegrau}
                  onChange={e => onChange('qtdFrisosPorDegrau', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">R$/metro friso</Label>
                <Input type="number" step="0.01" value={peca.valorFrisoMetro}
                  onChange={e => onChange('valorFrisoMetro', e.target.value)} className="h-8 text-xs" />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ SOLEIRA / PEITORIL extras ═══ */}
      {(isSoleira || isPeitoril) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div>
            <Label className="text-[10px]">Boleado (lados)</Label>
            <select value={peca.boleadoLados} onChange={e => onChange('boleadoLados', e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
              <option value="0">Sem boleado</option>
              <option value="1">1 lado</option>
              <option value="2">2 lados</option>
            </select>
          </div>
          {parseInt(peca.boleadoLados) > 0 && (
            <div>
              <Label className="text-[10px]">R$/metro boleado</Label>
              <Input type="number" step="0.01" value={peca.valorBoleadoMetro}
                onChange={e => onChange('valorBoleadoMetro', e.target.value)} className="h-8 text-xs" />
            </div>
          )}
          {isPeitoril && (
            <>
              <div className="col-span-full flex items-center gap-4">
                <label className="text-[10px] flex items-center gap-1">
                  <input type="checkbox" checked={peca.pingadeira}
                    onChange={e => onChange('pingadeira', e.target.checked)} />
                  Pingadeira
                </label>
              </div>
              {peca.pingadeira && (
                <div>
                  <Label className="text-[10px]">R$/metro pingadeira</Label>
                  <Input type="number" step="0.01" value={peca.valorPingadeiraMetro}
                    onChange={e => onChange('valorPingadeiraMetro', e.target.value)} className="h-8 text-xs" />
                </div>
              )}
            </>
          )}
          {isSoleira && (
            <>
              <div className="col-span-full flex items-center gap-4">
                <label className="text-[10px] flex items-center gap-1">
                  <input type="checkbox" checked={peca.encaixePorta}
                    onChange={e => onChange('encaixePorta', e.target.checked)} />
                  Encaixe em porta
                </label>
              </div>
              {peca.encaixePorta && (
                <>
                  <div>
                    <Label className="text-[10px]">Prof. encaixe (cm)</Label>
                    <Input type="number" step="0.1" value={peca.profundidadeEncaixe}
                      onChange={e => onChange('profundidadeEncaixe', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Valor encaixe (R$)</Label>
                    <Input type="number" step="0.01" value={peca.valorEncaixe}
                      onChange={e => onChange('valorEncaixe', e.target.value)} className="h-8 text-xs" />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ RODAPÉ ═══ */}
      {isRodape && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div>
            <Label className="text-[10px]">Cantos internos</Label>
            <Input type="number" min="0" value={peca.rodapeCantosInternos}
              onChange={e => onChange('rodapeCantosInternos', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Cantos externos</Label>
            <Input type="number" min="0" value={peca.rodapeCantosExternos}
              onChange={e => onChange('rodapeCantosExternos', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">R$/canto</Label>
            <Input type="number" step="0.01" value={peca.valorCantoRodape}
              onChange={e => onChange('valorCantoRodape', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Acab. superior (R$/m)</Label>
            <Input type="number" step="0.01" value={peca.valorAcabSuperior}
              onChange={e => onChange('valorAcabSuperior', e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* ═══ REVESTIMENTO ═══ */}
      {isRevestimento && (
        <div className="space-y-2 bg-muted/30 rounded-md p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground">Aberturas (janelas, portas) a descontar:</span>
            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={addAbertura}>
              <Plus className="w-3 h-3 mr-1" /> Abertura
            </Button>
          </div>
          {(peca.aberturas || []).map(ab => (
            <div key={ab.id} className="flex items-center gap-2">
              <Input value={ab.descricao} onChange={e => updateAbertura(ab.id, 'descricao', e.target.value)}
                className="h-7 text-xs flex-1" placeholder="Ex: Janela" />
              <Input type="number" step="0.1" value={ab.largura}
                onChange={e => updateAbertura(ab.id, 'largura', e.target.value)}
                className="h-7 text-xs w-20" placeholder="Larg cm" />
              <Input type="number" step="0.1" value={ab.altura}
                onChange={e => updateAbertura(ab.id, 'altura', e.target.value)}
                className="h-7 text-xs w-20" placeholder="Alt cm" />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeAbertura(ab.id)}>
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <label className="text-[10px] flex items-center gap-1">
            <input type="checkbox" checked={peca.painelRipado}
              onChange={e => onChange('painelRipado', e.target.checked)} />
            Painel ripado / recortes decorativos
          </label>
          {peca.painelRipado && (
            <div>
              <Label className="text-[10px]">Valor serviço recortes (R$)</Label>
              <Input type="number" step="0.01" value={peca.valorRecorteDecorat}
                onChange={e => onChange('valorRecorteDecorat', e.target.value)} className="h-8 text-xs" />
            </div>
          )}
        </div>
      )}

      {/* ═══ PISO ═══ */}
      {isPiso && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div>
            <Label className="text-[10px]">Padrão do piso</Label>
            <select value={peca.padraoPiso} onChange={e => onChange('padraoPiso', e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
              {PADROES_PISO.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="col-span-full flex items-center gap-4">
            <label className="text-[10px] flex items-center gap-1">
              <input type="checkbox" checked={peca.rodapeIntegrado}
                onChange={e => onChange('rodapeIntegrado', e.target.checked)} />
              Rodapé integrado
            </label>
          </div>
          {peca.rodapeIntegrado && (
            <>
              <div>
                <Label className="text-[10px]">Perímetro ambiente (cm)</Label>
                <Input type="number" step="1" value={peca.perimetroAmbiente}
                  onChange={e => onChange('perimetroAmbiente', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Largura portas (cm)</Label>
                <Input type="number" step="1" value={peca.larguraPortas}
                  onChange={e => onChange('larguraPortas', e.target.value)} className="h-8 text-xs" />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ TAMPO DE MESA ═══ */}
      {isTampo && (
        <div className="grid grid-cols-2 gap-2 bg-muted/30 rounded-md p-2">
          <label className="text-[10px] flex items-center gap-1 col-span-full">
            <input type="checkbox" checked={peca.furoColuna}
              onChange={e => onChange('furoColuna', e.target.checked)} />
            Furo central para coluna
          </label>
          {peca.furoColuna && (
            <>
              <div>
                <Label className="text-[10px]">Diâmetro furo (cm)</Label>
                <Input type="number" step="0.1" value={peca.diametroFuro}
                  onChange={e => onChange('diametroFuro', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Valor serviço (R$)</Label>
                <Input type="number" step="0.01" value={peca.valorFuroColuna}
                  onChange={e => onChange('valorFuroColuna', e.target.value)} className="h-8 text-xs" />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ NICHO EMBUTIDO ═══ */}
      {isNicho && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 rounded-md p-2">
          <div className="col-span-full text-[10px] font-medium text-muted-foreground">
            Larg e Comp acima = largura e altura do fundo. Profundidade abaixo:
          </div>
          <div>
            <Label className="text-[10px]">Profundidade (cm)</Label>
            <Input type="number" step="0.1" value={peca.nichoProfundidade}
              onChange={e => onChange('nichoProfundidade', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Prateleiras internas</Label>
            <Input type="number" min="0" value={peca.nichoQtdPrateleiras}
              onChange={e => onChange('nichoQtdPrateleiras', e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Valor serviço/nicho (R$)</Label>
            <Input type="number" step="0.01" value={peca.valorServicoNicho}
              onChange={e => onChange('valorServicoNicho', e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* ═══ BOX BANHEIRO ═══ */}
      {isBox && (
        <div className="space-y-2 bg-muted/30 rounded-md p-2">
          <div className="text-[10px] font-medium text-muted-foreground">Detalhes do Box:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Paredes revestidas</Label>
              <select value={peca.paredesBox} onChange={e => onChange('paredesBox', e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="0">Nenhuma</option>
                <option value="1">1 parede</option>
                <option value="2">2 paredes</option>
                <option value="3">3 paredes</option>
              </select>
            </div>
            {parseInt(peca.paredesBox) > 0 && (
              <>
                <div>
                  <Label className="text-[10px]">Altura paredes (cm)</Label>
                  <Input type="number" step="0.1" value={peca.alturaParede}
                    onChange={e => onChange('alturaParede', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Larg. parede 1 (cm)</Label>
                  <Input type="number" step="0.1" value={peca.larguraParede1}
                    onChange={e => onChange('larguraParede1', e.target.value)} className="h-8 text-xs" />
                </div>
                {parseInt(peca.paredesBox) >= 2 && (
                  <div>
                    <Label className="text-[10px]">Larg. parede 2 (cm)</Label>
                    <Input type="number" step="0.1" value={peca.larguraParede2}
                      onChange={e => onChange('larguraParede2', e.target.value)} className="h-8 text-xs" />
                  </div>
                )}
                {parseInt(peca.paredesBox) >= 3 && (
                  <div>
                    <Label className="text-[10px]">Larg. parede 3 (cm)</Label>
                    <Input type="number" step="0.1" value={peca.larguraParede3}
                      onChange={e => onChange('larguraParede3', e.target.value)} className="h-8 text-xs" />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="text-[10px] flex items-center gap-1">
              <input type="checkbox" checked={peca.bancoBox}
                onChange={e => onChange('bancoBox', e.target.checked)} />
              Banco/assento no box
            </label>
            <label className="text-[10px] flex items-center gap-1">
              <input type="checkbox" checked={peca.raloLinear}
                onChange={e => onChange('raloLinear', e.target.checked)} />
              Ralo linear esculpido
            </label>
          </div>

          {peca.bancoBox && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px]">Larg. banco (cm)</Label>
                <Input type="number" step="0.1" value={peca.bancoLargura}
                  onChange={e => onChange('bancoLargura', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Comp. banco (cm)</Label>
                <Input type="number" step="0.1" value={peca.bancoComprimento}
                  onChange={e => onChange('bancoComprimento', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Altura banco (cm)</Label>
                <Input type="number" step="0.1" value={peca.bancoAltura}
                  onChange={e => onChange('bancoAltura', e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          )}

          {peca.raloLinear && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px]">Comp. ralo (cm)</Label>
                <Input type="number" step="0.1" value={peca.raloComprimento}
                  onChange={e => onChange('raloComprimento', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Larg. canal (cm)</Label>
                <Input type="number" step="0.1" value={peca.raloLargura}
                  onChange={e => onChange('raloLargura', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Valor serviço (R$)</Label>
                <Input type="number" step="0.01" value={peca.valorServicoRalo}
                  onChange={e => onChange('valorServicoRalo', e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          )}

          {/* Nicho no box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Nichos no box</Label>
              <Input type="number" min="0" value={peca.nichoBoxQtd}
                onChange={e => onChange('nichoBoxQtd', e.target.value)} className="h-8 text-xs" />
            </div>
            {(parseInt(peca.nichoBoxQtd) || 0) > 0 && (
              <>
                <div>
                  <Label className="text-[10px]">Larg. nicho (cm)</Label>
                  <Input type="number" step="0.1" value={peca.nichoBoxLargura}
                    onChange={e => onChange('nichoBoxLargura', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Alt. nicho (cm)</Label>
                  <Input type="number" step="0.1" value={peca.nichoBoxAltura}
                    onChange={e => onChange('nichoBoxAltura', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Prof. nicho (cm)</Label>
                  <Input type="number" step="0.1" value={peca.nichoBoxProfundidade}
                    onChange={e => onChange('nichoBoxProfundidade', e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">R$/nicho serviço</Label>
                  <Input type="number" step="0.01" value={peca.valorServicoNichoBox}
                    onChange={e => onChange('valorServicoNichoBox', e.target.value)} className="h-8 text-xs" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ AREA SUMMARY ═══ */}
      {areaLiq > 0 && (
        <div className="text-[11px] text-muted-foreground flex flex-wrap gap-3 bg-primary/5 rounded-md p-2">
          <span className="font-medium">m² líquido: <b className="text-foreground">{fmt(areaLiq)}</b></span>
          <span className="font-medium">m² compra (+desp.): <b className="text-primary">{fmt(areaCompra)}</b></span>
          {mlBorda > 0 && <span>Borda: <b>{fmt(mlBorda)} ml</b></span>}
        </div>
      )}
    </div>
  );
};

export default PecaForm;
