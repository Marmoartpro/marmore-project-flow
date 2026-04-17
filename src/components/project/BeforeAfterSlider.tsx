import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  projectId: string;
}

const BeforeAfterSlider = ({ projectId }: Props) => {
  const { user } = useAuth();
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [pos, setPos] = useState(50);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data: stages } = await supabase
      .from('project_stages')
      .select('id, stage_number')
      .eq('project_id', projectId)
      .order('stage_number');
    if (!stages || stages.length === 0) { setLoading(false); return; }

    const firstId = stages[0].id;
    const lastId = stages[stages.length - 1].id;

    const [{ data: firstPhotos }, { data: lastPhotos }] = await Promise.all([
      supabase.from('stage_photos').select('photo_url, created_at').eq('stage_id', firstId).order('created_at').limit(1),
      supabase.from('stage_photos').select('photo_url, created_at').eq('stage_id', lastId).order('created_at', { ascending: false }).limit(1),
    ]);
    setBefore(firstPhotos?.[0]?.photo_url || null);
    setAfter(lastPhotos?.[0]?.photo_url || null);
    setLoading(false);
  };

  const exportToPortfolio = async () => {
    if (!user || !before || !after) return;
    setExporting(true);
    try {
      const pairId = crypto.randomUUID();
      await supabase.from('portfolio_photos').insert([
        { owner_id: user.id, project_id: projectId, photo_url: before, is_before: true, pair_id: pairId, caption: 'Antes' },
        { owner_id: user.id, project_id: projectId, photo_url: after, is_before: false, pair_id: pairId, caption: 'Depois' },
      ]);
      toast.success('Comparativo enviado ao portfólio!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return null;

  if (!before || !after) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Antes & Depois</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Faça upload de pelo menos 1 foto na <strong>Chegada da chapa</strong> e 1 foto no <strong>Acabamento final</strong> para gerar o comparativo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Antes & Depois</CardTitle>
          <Button size="sm" variant="outline" onClick={exportToPortfolio} disabled={exporting}>
            <Share2 className="w-3.5 h-3.5 mr-1" /> {exporting ? 'Enviando...' : 'Enviar ao portfólio'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted select-none">
          <img src={after} alt="Depois" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <img src={before} alt="Antes" className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">ANTES</div>
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">DEPOIS</div>
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
            style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              <span className="text-black text-xs font-bold">⇄</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={e => setPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            aria-label="Comparar antes e depois"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">Arraste o controle para comparar</p>
      </CardContent>
    </Card>
  );
};

export default BeforeAfterSlider;
