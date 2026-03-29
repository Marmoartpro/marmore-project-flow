import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Percent, Tag } from 'lucide-react';
import { fmt } from './types';

interface Props {
  subtotalMaterials: number;
  subtotalLabor: number;
  subtotalAccessories: number;
  subtotalInstallation: number;
  margemMaterial: number;
  setMargemMaterial: (v: number) => void;
  margemServicos: number;
  setMargemServicos: (v: number) => void;
  margemAcessorios: number;
  setMargemAcessorios: (v: number) => void;
  margemInstalacao: number;
  setMargemInstalacao: (v: number) => void;
  descontoValor: string;
  descontoTipo: 'percent' | 'reais';
  setDescontoValor: (v: string) => void;
  setDescontoTipo: (v: 'percent' | 'reais') => void;
  condicoesPagamento: string;
  setCondicoesPagamento: (v: string) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;
}

const MarginSlider = ({ label, value, onChange, subtotal }: { label: string; value: number; onChange: (v: number) => void; subtotal: number }) => {
  const valorMargem = subtotal * (value / 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">{value}%</Badge>
          <span className="text-[10px] text-primary font-semibold">+R$ {fmt(valorMargem)}</span>
        </div>
      </div>
      <Slider value={[value]} onValueChange={v => onChange(v[0])} min={0} max={100} step={1} className="h-4" />
    </div>
  );
};

const TotaisSection = ({
  subtotalMaterials, subtotalLabor, subtotalAccessories, subtotalInstallation,
  margemMaterial, setMargemMaterial,
  margemServicos, setMargemServicos,
  margemAcessorios, setMargemAcessorios,
  margemInstalacao, setMargemInstalacao,
  descontoValor, descontoTipo, setDescontoValor, setDescontoTipo,
  condicoesPagamento, setCondicoesPagamento,
  observacoes, setObservacoes,
}: Props) => {
  const materialComMargem = subtotalMaterials * (1 + margemMaterial / 100);
  const servicosComMargem = subtotalLabor * (1 + margemServicos / 100);
  const acessoriosComMargem = subtotalAccessories * (1 + margemAcessorios / 100);
  const instalacaoComMargem = subtotalInstallation * (1 + margemInstalacao / 100);

  const totalBruto = materialComMargem + servicosComMargem + acessoriosComMargem + instalacaoComMargem;
  const desconto = descontoTipo === 'percent'
    ? totalBruto * ((parseFloat(descontoValor) || 0) / 100)
    : (parseFloat(descontoValor) || 0);
  const totalFinal = totalBruto - desconto;
  const totalMargem = (subtotalMaterials * margemMaterial / 100) + (subtotalLabor * margemServicos / 100) +
    (subtotalAccessories * margemAcessorios / 100) + (subtotalInstallation * margemInstalacao / 100);

  // Suggested payment split
  const entrada = totalFinal * 0.4;
  const parcela = totalFinal * 0.3;
  const saldo = totalFinal * 0.3;

  return (
    <div className="space-y-4">
      {/* Per-section margins */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-primary" />
            <Label className="text-xs font-semibold">Margem de Lucro por Seção</Label>
            <Badge variant="secondary" className="text-[10px] ml-auto">
              Total margem: R$ {fmt(totalMargem)}
            </Badge>
          </div>
          <MarginSlider label="Material (Pedra)" value={margemMaterial} onChange={setMargemMaterial} subtotal={subtotalMaterials} />
          <MarginSlider label="Serviços (Mão de obra)" value={margemServicos} onChange={setMargemServicos} subtotal={subtotalLabor} />
          <MarginSlider label="Acessórios" value={margemAcessorios} onChange={setMargemAcessorios} subtotal={subtotalAccessories} />
          <MarginSlider label="Instalação" value={margemInstalacao} onChange={setMargemInstalacao} subtotal={subtotalInstallation} />
        </CardContent>
      </Card>

      {/* Discount — highlighted as "pagamento à vista" */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-green-600" />
            <Label className="text-xs font-semibold text-green-700">Desconto para Pagamento à Vista</Label>
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" step="0.01" value={descontoValor} onChange={e => setDescontoValor(e.target.value)} className="h-8 text-sm w-28" placeholder="0" />
            <select value={descontoTipo} onChange={e => setDescontoTipo(e.target.value as any)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs">
              <option value="percent">%</option>
              <option value="reais">R$</option>
            </select>
            {desconto > 0 && (
              <Badge variant="destructive" className="text-xs">
                -R$ {fmt(desconto)}
              </Badge>
            )}
          </div>
          {desconto > 0 && (
            <p className="text-[11px] text-green-700 mt-2 font-medium">
              Valor à vista: R$ {fmt(totalFinal)} (economia de R$ {fmt(desconto)} para o cliente)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Material</p>
            <p className="text-xs text-muted-foreground line-through">R$ {fmt(subtotalMaterials)}</p>
            <p className="text-sm font-bold font-display">R$ {fmt(materialComMargem)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Serviços</p>
            <p className="text-xs text-muted-foreground line-through">R$ {fmt(subtotalLabor)}</p>
            <p className="text-sm font-bold font-display">R$ {fmt(servicosComMargem)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Acessórios</p>
            <p className="text-xs text-muted-foreground line-through">R$ {fmt(subtotalAccessories)}</p>
            <p className="text-sm font-bold font-display">R$ {fmt(acessoriosComMargem)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Instalação</p>
            <p className="text-xs text-muted-foreground line-through">R$ {fmt(subtotalInstallation)}</p>
            <p className="text-sm font-bold font-display">R$ {fmt(instalacaoComMargem)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Lucro Total</p>
            <p className="text-sm font-bold font-display text-primary">R$ {fmt(totalMargem)}</p>
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
