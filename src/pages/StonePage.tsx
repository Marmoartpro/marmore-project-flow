import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Sparkles, Wand2 } from 'lucide-react';
import ARViewer from '@/components/mostruario/ARViewer';
import Visualization3D from '@/components/mostruario/Visualization3D';

const StonePage = () => {
  const { stoneId } = useParams();
  const [stone, setStone] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [arOpen, setArOpen] = useState(false);
  const [vizOpen, setVizOpen] = useState(false);

  useEffect(() => {
    if (stoneId) fetchStone();
  }, [stoneId]);

  const fetchStone = async () => {
    const [sRes, pRes] = await Promise.all([
      supabase.from('stones').select('*').eq('id', stoneId).single(),
      supabase.from('stone_photos').select('*').eq('stone_id', stoneId!).order('created_at'),
    ]);
    setStone(sRes.data);
    setPhotos(pRes.data || []);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Carregando...</div>;
  if (!stone) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Pedra não encontrada.</div>;

  const whatsappContact = () => {
    const msg = encodeURIComponent(`Olá! Tenho interesse na pedra ${stone.name}. Pode me passar mais informações?`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <h1 className="text-lg font-display font-bold text-center">Ficha Técnica</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {stone.photo_url && (
          <img src={stone.photo_url} alt={stone.name} className="w-full rounded-lg object-cover max-h-80 cursor-pointer" onClick={() => setFullscreen(stone.photo_url)} />
        )}

        <div>
          <h2 className="text-2xl font-display font-bold">{stone.name}</h2>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge variant="outline">{stone.category}</Badge>
            {stone.in_stock ? <Badge className="bg-success/20 text-success border-success/30">Em estoque</Badge> : <Badge variant="outline">Sob consulta</Badge>}
            {stone.promo_active && stone.promo_badge && <Badge className="bg-destructive/20 text-destructive border-destructive/30">{stone.promo_badge}</Badge>}
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {stone.origin && <div><span className="text-muted-foreground">Origem:</span> {stone.origin}</div>}
              {stone.colors && <div><span className="text-muted-foreground">Cores:</span> {stone.colors}</div>}
              {stone.thicknesses && <div><span className="text-muted-foreground">Espessuras:</span> {stone.thicknesses}</div>}
              {stone.finishes && <div><span className="text-muted-foreground">Acabamentos:</span> {stone.finishes}</div>}
            </div>
            {stone.usage_indication && <div><span className="text-muted-foreground">Indicação de uso:</span> {stone.usage_indication}</div>}
          </CardContent>
        </Card>

        {stone.pros && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-success mb-1">✅ Prós</p>
              <p className="text-sm">{stone.pros}</p>
            </CardContent>
          </Card>
        )}

        {stone.cons && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-destructive mb-1">⚠️ Contras</p>
              <p className="text-sm">{stone.cons}</p>
            </CardContent>
          </Card>
        )}

        {photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Galeria</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <img key={p.id} src={p.photo_url} alt="" className="w-full aspect-square object-cover rounded-md cursor-pointer hover:opacity-80" onClick={() => setFullscreen(p.photo_url)} />
              ))}
            </div>
          </div>
        )}

        {stone.observations && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stone.observations}</p>
            </CardContent>
          </Card>
        )}

        {stone.photo_url && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant="outline" className="w-full gap-2" onClick={() => setArOpen(true)}>
              <Sparkles className="w-4 h-4" /> Ver no ambiente (câmera)
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={() => setVizOpen(true)}>
              <Wand2 className="w-4 h-4" /> Visualização 3D com IA
            </Button>
          </div>
        )}

        <Button className="w-full gap-2" onClick={whatsappContact}>
          <MessageSquare className="w-4 h-4" /> Entrar em contato via WhatsApp
        </Button>
      </div>

      {arOpen && stone.photo_url && (
        <ARViewer textureUrl={stone.photo_url} stoneName={stone.name} onClose={() => setArOpen(false)} />
      )}

      {vizOpen && stone.photo_url && (
        <Visualization3D stoneImageUrl={stone.photo_url} stoneName={stone.name} onClose={() => setVizOpen(false)} />
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setFullscreen(null)}>
          <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-white" onClick={() => setFullscreen(null)}>
            <X className="w-6 h-6" />
          </Button>
          <img src={fullscreen} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
};

export default StonePage;
