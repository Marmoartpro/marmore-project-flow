import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, DollarSign } from 'lucide-react';
import type { Ambiente, ResumoMaterial } from './types';
import { calcResumoConsumo, calcAmbienteLaborCost, calcAmbienteInstallCost, fmt, ceilMoney } from './types';

interface Props {
  ambientes: Ambiente[];
  subtotalMaterials: number;
  subtotalLabor: number;
  subtotalAccessories: number;
  subtotalInstallation: number;
  margemMaterial: number;
  margemServicos: number;
  margemAcessorios: number;
  margemInstalacao: number;
  m2PorChapa?: number;
}

const ResumoConsumo = ({
  ambientes, subtotalMaterials, subtotalLabor, subtotalAccessories,
  subtotalInstallation, margemMaterial, margemServicos, margemAcessorios,
  margemInstalacao, m2PorChapa = 6,
}: Props) => {
  const resumo = calcResumoConsumo(ambientes, 0, m2PorChapa);
  if (resumo.length === 0) return null;

  const custoTotalMaterial = resumo.reduce((s, r) => s + r.custoTotal, 0);
  const custoTotalServicos = subtotalLabor;
  const custoTotalAcessorios = subtotalAccessories;
  const custoTotalInstalacao = subtotalInstallation;
  const custoTotal = custoTotalMaterial + custoTotalServicos + custoTotalAcessorios + custoTotalInstalacao;

  const margemTotalMat = subtotalMaterials * (margemMaterial / 100);
  const margemTotalServ = subtotalLabor * (margemServicos / 100);
  const margemTotalAcc = subtotalAccessories * (margemAcessorios / 100);
  const margemTotalInst = subtotalInstallation * (margemInstalacao / 100);
  const lucroEstimado = margemTotalMat + margemTotalServ + margemTotalAcc + margemTotalInst;

  return (
    <Card className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-600" />
          Resumo de Consumo de Material
          <Badge variant="outline" className="text-[9px] text-orange-700 border-orange-300">
            INTERNO — NÃO APARECE NO PDF
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Per-stone breakdown */}
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-1.5 font-medium">Material</th>
                <th className="text-right px-2 py-1.5 font-medium">m² Líquido</th>
                <th className="text-right px-2 py-1.5 font-medium">m² Compra</th>
                <th className="text-right px-2 py-1.5 font-medium">R$/m²</th>
                <th className="text-right px-2 py-1.5 font-medium">Custo</th>
                <th className="text-right px-2 py-1.5 font-medium">Chapas</th>
              </tr>
            </thead>
            <tbody>
              {resumo.map(r => (
                <tr key={r.stoneId} className="border-t border-border">
                  <td className="px-2 py-1.5 font-medium">{r.stoneName}</td>
                  <td className="text-right px-2 py-1.5">{fmt(r.totalM2Liquido)}</td>
                  <td className="text-right px-2 py-1.5 text-primary font-medium">{fmt(r.totalM2Compra)}</td>
                  <td className="text-right px-2 py-1.5">R$ {fmt(r.pricePerM2)}</td>
                  <td className="text-right px-2 py-1.5 font-medium">R$ {fmt(r.custoTotal)}</td>
                  <td className="text-right px-2 py-1.5">
                    <Badge variant="secondary" className="text-[9px]">{r.chapasNecessarias}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-background rounded-md p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Custo Material</p>
            <p className="text-xs font-bold">R$ {fmt(custoTotalMaterial)}</p>
          </div>
          <div className="bg-background rounded-md p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Custo Serviços</p>
            <p className="text-xs font-bold">R$ {fmt(custoTotalServicos)}</p>
          </div>
          <div className="bg-background rounded-md p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Custo Total</p>
            <p className="text-xs font-bold text-orange-700">R$ {fmt(custoTotal)}</p>
          </div>
          <div className="bg-background rounded-md p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <p className="text-[9px] text-muted-foreground">Lucro Estimado</p>
            </div>
            <p className="text-xs font-bold text-green-600">R$ {fmt(lucroEstimado)}</p>
          </div>
        </div>

        {/* Slab optimization suggestions */}
        {resumo.filter(r => r.chapasNecessarias > 0).map(r => (
          <p key={r.stoneId} className="text-[10px] text-muted-foreground">
            💡 {r.stoneName}: precisa de ~{r.chapasNecessarias} chapa(s) de {m2PorChapa}m²
            (total {fmt(r.totalM2Compra)} m² com desperdício).
          </p>
        ))}
      </CardContent>
    </Card>
  );
};

export default ResumoConsumo;
