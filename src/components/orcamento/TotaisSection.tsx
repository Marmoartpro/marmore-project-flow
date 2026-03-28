import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { fmt } from './types';

interface Props {
  subtotalMaterials: number;
  subtotalLabor: number;
  subtotalAccessories: number;
  subtotalInstallation: number;
  margemLucro: number;
  setMargemLucro: (v: number) => void;
  descontoValor: string;
  descontoTipo: 'percent' | 'reais';
  setDescontoValor: (v: string) => void;
  setDescontoTipo: (v: 'percent' | 'reais') => void;
  condicoesPagamento: string;
  setCondicoesPagamento: (v: string) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;
}

const TotaisSection = ({
  subtotalMaterials, subtotalLabor, subtotalAccessories, subtotalInstallation,
  margemLucro, setMargemLucro,
  descontoValor, descontoTipo, setDescontoValor, setDescontoTipo,
  condicoesPagamento, setCondicoesPagamento,
  observacoes, setObservacoes,
}: Props) => {
  const subtotalBase = subtotalMaterials + subtotalLabor + subtotalAccessories + subtotalInstallation;
  const valorMargem = subtotalBase * (margemLucro / 100);
  const totalBruto = subtotalBase + valorMargem;
  const desconto = descontoTipo === 'percent'
    ? totalBruto * ((parseFloat(descontoValor) || 0) / 100)
    : (parseFloat(descontoValor) || 0);
  const totalFinal = totalBruto - desconto;

  // Suggested payment split
  const entrada = totalFinal * 0.4;
  const parcela = totalFinal * 0.3;
  const saldo = totalFinal * 0.3;

  return (
    <div className="space-y-4">
      {/* Margin slider */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Margem de Lucro</Label>
            <span className="text-sm font-bold text-primary">{margemLucro}%</span>
          </div>
          <Slider value={[margemLucro]} onValueChange={v => setMargemLucro(v[0])} min={0} max={100} step={1} />
          <p className="text-[10px] text-muted-foreground">Valor da margem: R$ {fmt(valorMargem)}</p>
        </CardContent>
      </Card>

      {/* Discount */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0">Desconto</Label>
            <Input type="number" step="0.01" value={descontoValor} onChange={e => setDescontoValor(e.target.value)} className="h-8 text-sm w-28" placeholder="0" />
            <select value={descontoTipo} onChange={e => setDescontoTipo(e.target.value as any)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs">
              <option value="percent">%</option>
              <option value="reais">R$</option>
            </select>
            {desconto > 0 && <span className="text-xs text-destructive">-R$ {fmt(desconto)}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Materiais</p>
            <p className="text-sm font-bold font-display">R$ {fmt(subtotalMaterials)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Mão de obra</p>
            <p className="text-sm font-bold font-display">R$ {fmt(subtotalLabor)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Acessórios</p>
            <p className="text-sm font-bold font-display">R$ {fmt(subtotalAccessories)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Instalação</p>
            <p className="text-sm font-bold font-display">R$ {fmt(subtotalInstallation)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Margem ({margemLucro}%)</p>
            <p className="text-sm font-bold font-display text-primary">R$ {fmt(valorMargem)}</p>
          </CardContent>
        </Card>
        <Card className="border-[hsl(205,59%,45%)]/60 bg-[hsl(205,59%,45%)]/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Geral</p>
            <p className="text-lg font-bold font-display" style={{ color: '#2E7DB5' }}>R$ {fmt(totalFinal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment conditions */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Label className="text-xs font-medium">Condições de Pagamento</Label>
          {totalFinal > 0 && (
            <div className="text-[11px] text-muted-foreground space-y-1">
              <p>Sugestão: Entrada 40% (R$ {fmt(entrada)}) | Parcela intermediária 30% (R$ {fmt(parcela)}) | Saldo 30% (R$ {fmt(saldo)})</p>
            </div>
          )}
          <Textarea value={condicoesPagamento} onChange={e => setCondicoesPagamento(e.target.value)} rows={2} className="text-sm"
            placeholder="Entrada 40%, parcela intermediária 30%, saldo na conclusão 30%" />
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <Label className="text-xs font-medium">Observações Importantes</Label>
          <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} className="text-sm"
            placeholder="Observações técnicas, notas sobre materiais, condições especiais..." />
        </CardContent>
      </Card>
    </div>
  );
};

export default TotaisSection;
