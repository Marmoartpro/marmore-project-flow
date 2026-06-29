import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  stones: any[];
  onDone: () => void;
}

const BatchAIGenerator = ({ stones, onDone }: Props) => {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [done, setDone] = useState(0);
  const [errors, setErrors] = useState<{ name: string; error: string }[]>([]);

  const pending = stones.filter(s => !s.imagem_chapa_ia || !s.imagem_cozinha_ia || !s.imagem_banheiro_ia);

  const start = async () => {
    setRunning(true);
    setCancel(false);
    setDone(0);
    setErrors([]);
    const errs: { name: string; error: string }[] = [];

    for (let i = 0; i < pending.length; i++) {
      if (cancel) break;
      const s = pending[i];
      const kinds: string[] = [];
      if (!s.imagem_chapa_ia) kinds.push('chapa');
      if (!s.imagem_cozinha_ia) kinds.push('cozinha');
      if (!s.imagem_banheiro_ia) kinds.push('banheiro');
      try {
        const { data, error } = await supabase.functions.invoke('generate-stone-images', {
          body: { stone_id: s.id, kinds },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const errKeys = Object.keys(data?.errors || {});
        if (errKeys.length) errs.push({ name: s.name, error: Object.values(data.errors)[0] as string });
      } catch (e: any) {
        errs.push({ name: s.name, error: e.message || 'erro' });
        if (e.message?.includes('Limite mensal')) {
          toast.error('Limite mensal atingido. Abortando lote.');
          break;
        }
      }
      setDone(i + 1);
      setErrors([...errs]);
      await new Promise(r => setTimeout(r, 2000));
    }
    setRunning(false);
    onDone();
    toast.success(`Lote concluído: ${done + 1 - errs.length}/${pending.length} pedras OK.`);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="w-4 h-4 mr-1" /> Gerar imagens IA em lote ({pending.length})
      </Button>
      <Dialog open={open} onOpenChange={(o) => !running && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Gerar imagens IA em lote</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {pending.length} pedras precisam de uma ou mais imagens IA (chapa, cozinha, banheiro).
              O processo roda uma pedra por vez com pausa de 2s entre cada para não sobrecarregar a API.
              <br />
              <strong className="text-foreground">Atenção:</strong> cada imagem consome créditos da workspace.
              Você pode cancelar a qualquer momento.
            </p>
            {running && (
              <div className="space-y-2">
                <Progress value={(done / Math.max(pending.length, 1)) * 100} />
                <p className="text-xs">Gerando imagens: {done} de {pending.length} pedras processadas</p>
              </div>
            )}
            {errors.length > 0 && (
              <div className="max-h-32 overflow-auto text-xs border border-border rounded p-2 space-y-1">
                <p className="font-medium text-destructive">Falhas:</p>
                {errors.map((e, i) => <p key={i}>• {e.name}: {e.error}</p>)}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {running ? (
                <Button variant="destructive" size="sm" onClick={() => setCancel(true)}>
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Fechar</Button>
                  <Button size="sm" onClick={start} disabled={pending.length === 0}>
                    <Sparkles className="w-4 h-4 mr-1" /> Iniciar geração
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchAIGenerator;
