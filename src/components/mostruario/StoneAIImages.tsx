import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, History, Upload } from 'lucide-react';
import { toast } from 'sonner';

type Kind = 'chapa' | 'cozinha' | 'banheiro';
const LABELS: Record<Kind, string> = { chapa: 'Chapa', cozinha: 'Aplicação Cozinha', banheiro: 'Aplicação Banheiro' };
const FIELDS: Record<Kind, string> = {
  chapa: 'imagem_chapa_ia', cozinha: 'imagem_cozinha_ia', banheiro: 'imagem_banheiro_ia',
};

interface Props {
  stone: any;
  canManage: boolean;
  onUpdated?: (next: any) => void;
}

const StoneAIImages = ({ stone, canManage, onUpdated }: Props) => {
  const [busy, setBusy] = useState<Kind | 'all' | null>(null);
  const [historyOpen, setHistoryOpen] = useState<Kind | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const aiFlags = stone.imagens_geradas_por_ia || {};

  const generate = async (kinds: Kind[]) => {
    setBusy(kinds.length === 1 ? kinds[0] : 'all');
    try {
      const { data, error } = await supabase.functions.invoke('generate-stone-images', {
        body: { stone_id: stone.id, kinds },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const errs = data?.errors || {};
      const okCount = Object.keys(data?.results || {}).length;
      const failCount = Object.keys(errs).length;
      if (okCount) toast.success(`${okCount} imagem(ns) gerada(s). ${data.remaining} restantes este mês.`);
      if (failCount) toast.error(`${failCount} falha(s): ${Object.values(errs)[0]}`);
      // refresh stone
      const { data: fresh } = await supabase.from('stones').select('*').eq('id', stone.id).single();
      if (fresh) onUpdated?.(fresh);
    } catch (e: any) {
      toast.error(e.message || 'Falha ao gerar imagens');
    } finally {
      setBusy(null);
    }
  };

  const openHistory = async (kind: Kind) => {
    setHistoryOpen(kind);
    const { data } = await supabase
      .from('ai_image_generations')
      .select('*')
      .eq('stone_id', stone.id)
      .eq('kind', kind)
      .order('created_at', { ascending: false })
      .limit(3);
    setHistory(data || []);
  };

  const pickFromHistory = async (kind: Kind, url: string) => {
    await supabase.from('stones').update({ [FIELDS[kind]]: url }).eq('id', stone.id);
    const { data: fresh } = await supabase.from('stones').select('*').eq('id', stone.id).single();
    if (fresh) onUpdated?.(fresh);
    toast.success('Versão selecionada');
    setHistoryOpen(null);
  };

  const renderImage = (kind: Kind) => {
    const url = stone[FIELDS[kind]];
    const isAI = !!aiFlags?.[kind];
    return (
      <div className="space-y-2">
        {url ? (
          <div className="relative">
            <img src={url} alt={LABELS[kind]} className="w-full rounded-md object-cover max-h-80" />
            {isAI && (
              <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white/80 px-2 py-0.5 rounded">
                Imagem ilustrativa gerada por IA
              </span>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-md p-8 text-center text-xs text-muted-foreground">
            Nenhuma imagem para "{LABELS[kind]}" ainda.
          </div>
        )}
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => generate([kind])} disabled={busy !== null}>
              {busy === kind ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
              {url ? 'Gerar nova versão' : 'Gerar com IA'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openHistory(kind)}>
              <History className="w-3 h-3 mr-1" /> Histórico
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => generate(['chapa', 'cozinha', 'banheiro'])} disabled={busy !== null}>
            {busy === 'all' ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Gerar 3 imagens IA
          </Button>
        </div>
      )}
      <Tabs defaultValue="chapa">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="chapa">Chapa</TabsTrigger>
          <TabsTrigger value="cozinha">Cozinha</TabsTrigger>
          <TabsTrigger value="banheiro">Banheiro</TabsTrigger>
        </TabsList>
        <TabsContent value="chapa">{renderImage('chapa')}</TabsContent>
        <TabsContent value="cozinha">{renderImage('cozinha')}</TabsContent>
        <TabsContent value="banheiro">{renderImage('banheiro')}</TabsContent>
      </Tabs>

      {historyOpen && (
        <div className="border border-border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Últimas versões — {LABELS[historyOpen]}</p>
            <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(null)}>Fechar</Button>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem histórico ainda.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {history.map(h => (
                <button key={h.id} onClick={() => pickFromHistory(historyOpen, h.image_url)} className="block hover:opacity-80">
                  <img src={h.image_url} alt="" className="w-full aspect-square object-cover rounded" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(h.created_at).toLocaleString('pt-BR')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoneAIImages;
