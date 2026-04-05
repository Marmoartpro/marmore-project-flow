import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, BrainCircuit, AlertTriangle, Lightbulb, CheckCircle2, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Ambiente, AcessorioItem } from './types';

interface AIReviewButtonProps {
  ambientes: Ambiente[];
  acessorios: AcessorioItem[];
}

interface ReviewResult {
  alertas: { tipo: 'erro' | 'aviso' | 'dica'; mensagem: string }[];
  otimizacoes: { peca: string; sugestao: string; economia_estimada: number | null }[];
  aproveitamento_chapa: { observacao: string };
}

export default function AIReviewButton({ ambientes, acessorios }: AIReviewButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleReview = async () => {
    if (ambientes.length === 0) {
      toast.error('Adicione peças antes de revisar');
      return;
    }

    setLoading(true);
    setOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-budget-gemini', {
        body: { mode: 'review', ambientes, acessorios },
        headers: { Authorization: '' },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setResult(data as ReviewResult);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao revisar');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const iconFor = (tipo: string) => {
    if (tipo === 'erro') return <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />;
    if (tipo === 'aviso') return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
    return <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />;
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleReview} disabled={loading}>
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

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analisando valores, medidas e cortes...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Alertas */}
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

              {/* Otimizações */}
              {result.otimizacoes && result.otimizacoes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" /> Sugestões de Otimização
                  </h4>
                  {result.otimizacoes.map((o, i) => (
                    <div key={i} className="text-xs bg-muted/50 rounded-md p-2">
                      <div className="font-medium">{o.peca}</div>
                      <div className="text-muted-foreground">{o.sugestao}</div>
                      {o.economia_estimada != null && o.economia_estimada > 0 && (
                        <div className="text-green-600 mt-1">
                          Economia estimada: R$ {o.economia_estimada.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Aproveitamento de chapa */}
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
