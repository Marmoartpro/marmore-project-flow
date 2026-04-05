import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, BrainCircuit, AlertTriangle, Lightbulb, CheckCircle2, Scissors, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Ambiente, AcessorioItem, calcAmbienteAreaCompra, calcAmbienteLaborCost, calcAmbienteMaterialCost, calcAmbienteInstallCost, calcMetrosLinearesBorda } from './types';
import { Badge } from '@/components/ui/badge';

interface AIReviewButtonProps {
  ambientes: Ambiente[];
  acessorios: AcessorioItem[];
  margemLucro?: number;
  onScrollToAmbiente?: (ambienteIndex: number) => void;
  onScrollToField?: (ambienteIndex: number, pecaIndex: number, field: string) => void;
}

interface ReviewResult {
  alertas: { tipo: 'erro' | 'aviso' | 'dica'; mensagem: string }[];
  otimizacoes: { peca: string; sugestao: string; economia_estimada: number | null; campo?: string; ambiente_idx?: number; peca_idx?: number }[];
  aproveitamento_chapa: { observacao: string };
}

const computeHash = (ambientes: Ambiente[]): string => {
  const len = JSON.stringify(ambientes).length;
  const pecaCount = ambientes.flatMap(a => a.pecas).length;
  return `${len}-${pecaCount}`;
};

export default function AIReviewButton({ ambientes, acessorios, margemLucro = 30, onScrollToAmbiente, onScrollToField }: AIReviewButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [open, setOpen] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const lastHash = useRef<string>('');
  const cachedResult = useRef<ReviewResult | null>(null);

  const buildReviewPayload = () => {
    // OTIMIZAÇÃO IA 3: Include pricing context
    const ambientesComContexto = ambientes.map((amb, i) => ({
      tipo: amb.tipo,
      pecas: amb.pecas.map(p => ({
        nomePeca: p.nomePeca,
        tipo: p.tipo,
        formato: p.formato,
        largura: p.largura,
        comprimento: p.comprimento,
        quantidade: p.quantidade,
        tipoCuba: p.tipoCuba,
        tipoRebaixo: p.tipoRebaixo,
        acabamentoBorda: p.acabamentoBorda,
        bordasComAcabamento: p.bordasComAcabamento,
        furosTorneira: p.furosTorneira,
        espelhoBacksplash: p.espelhoBacksplash,
        saiaFrontal: p.saiaFrontal,
        rebaixoCooktop: p.rebaixoCooktop,
      })),
      materialOptions: amb.materialOptions.map(m => ({
        stoneName: m.stoneName,
        pricePerM2: m.pricePerM2,
        materialDoCliente: m.materialDoCliente,
      })),
      custoMaterial: calcAmbienteMaterialCost(amb, 0),
      custoMaoDeObra: calcAmbienteLaborCost(amb),
      custoInstalacao: calcAmbienteInstallCost(amb),
      areaCompra: calcAmbienteAreaCompra(amb),
    }));

    const totalGeral = ambientesComContexto.reduce((s, a) => s + a.custoMaterial + a.custoMaoDeObra + a.custoInstalacao, 0);
    const totalAcessorios = acessorios.reduce((s, a) => s + (parseFloat(a.valorUnitario) || 0) * (parseInt(a.quantidade) || 1), 0);

    return {
      ambientes: ambientesComContexto,
      acessorios,
      totalGeral: totalGeral + totalAcessorios,
      margemLucro,
    };
  };

  const handleReview = async (forceRefresh = false) => {
    if (ambientes.length === 0) {
      toast.error('Adicione peças antes de revisar');
      return;
    }

    // OTIMIZAÇÃO IA 2: Cache check
    const currentHash = computeHash(ambientes);
    if (!forceRefresh && currentHash === lastHash.current && cachedResult.current) {
      setResult(cachedResult.current);
      setIsCached(true);
      setOpen(true);
      return;
    }

    setLoading(true);
    setOpen(true);
    setIsCached(false);
    try {
      const payload = buildReviewPayload();
      const { data, error } = await supabase.functions.invoke('generate-budget-gemini', {
        body: { mode: 'review', ...payload },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const reviewResult = data as ReviewResult;
      setResult(reviewResult);
      lastHash.current = currentHash;
      cachedResult.current = reviewResult;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao revisar');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (o: ReviewResult['otimizacoes'][0]) => {
    if (o.ambiente_idx != null && o.peca_idx != null && o.campo && onScrollToField) {
      onScrollToField(o.ambiente_idx, o.peca_idx, o.campo);
      toast.info(`Navegando para o campo "${o.campo}" da peça "${o.peca}". Aplique a sugestão manualmente.`);
    } else if (o.ambiente_idx != null && onScrollToAmbiente) {
      onScrollToAmbiente(o.ambiente_idx);
      toast.info(`Navegando para o ambiente. Revise a sugestão: ${o.sugestao}`);
    } else {
      toast.info(o.sugestao);
    }
  };

  const iconFor = (tipo: string) => {
    if (tipo === 'erro') return <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />;
    if (tipo === 'aviso') return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
    return <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />;
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => handleReview(false)} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-1" />}
        Revisar com IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              Revisão Inteligente do Orçamento
            </DialogTitle>
          </DialogHeader>

          {isCached && (
            <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
              <Badge variant="secondary" className="text-[10px]">Resultado em cache</Badge>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReview(true)} disabled={loading}>
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                Reanalisar
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analisando valores, medidas e cortes...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {result.alertas && result.alertas.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Alertas
                  </h4>
                  {result.alertas.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs bg-muted/50 rounded-md p-2">
                      {iconFor(a.tipo)}
                      <span>{a.mensagem}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.otimizacoes && result.otimizacoes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" /> Sugestões de Otimização
                  </h4>
                  {result.otimizacoes.map((o, i) => (
                    <div key={i} className="text-xs bg-muted/50 rounded-md p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">{o.peca}</div>
                          <div className="text-muted-foreground">{o.sugestao}</div>
                          {o.economia_estimada != null && o.economia_estimada > 0 && (
                            <div className="text-green-600 mt-1">
                              Economia estimada: R$ {o.economia_estimada.toFixed(2)}
                            </div>
                          )}
                        </div>
                        {(onScrollToAmbiente || onScrollToField) && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] shrink-0" onClick={() => handleApplySuggestion(o)}>
                            <Zap className="w-3 h-3 mr-1" /> Ir para campo
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.aproveitamento_chapa?.observacao && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1">
                    <Scissors className="w-4 h-4" /> Aproveitamento de Chapa
                  </h4>
                  <div className="text-xs bg-muted/50 rounded-md p-2">
                    {result.aproveitamento_chapa.observacao}
                  </div>
                </div>
              )}

              {(!result.alertas || result.alertas.length === 0) &&
               (!result.otimizacoes || result.otimizacoes.length === 0) && (
                <div className="flex items-center gap-2 text-sm text-green-600 py-4">
                  <CheckCircle2 className="w-5 h-5" />
                  Orçamento parece consistente! Nenhum problema encontrado.
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
