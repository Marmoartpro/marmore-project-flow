import { useRef, useState } from 'react';
import { X, Upload, Sparkles, Download, Share2, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/compressImage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  stoneImageUrl: string;
  stoneName: string;
  onClose: () => void;
}

const SURFACES = [
  { value: 'bancada', label: 'Bancada de cozinha' },
  { value: 'ilha', label: 'Ilha / cooktop' },
  { value: 'lavatorio', label: 'Lavatório / banheiro' },
  { value: 'mesa', label: 'Mesa / aparador' },
  { value: 'piso', label: 'Piso' },
  { value: 'parede', label: 'Parede / revestimento' },
];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const Visualization3D = ({ stoneImageUrl, stoneName, onClose }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ambient, setAmbient] = useState<string | null>(null);
  const [surface, setSurface] = useState('bancada');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    try {
      const compressed = await compressImage(file, 1280, 0.85);
      const url = await fileToDataUrl(compressed);
      setAmbient(url);
      setResult(null);
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível ler a foto');
    }
  };

  const generate = async () => {
    if (!ambient) {
      toast.error('Envie uma foto do ambiente primeiro');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-3d-visualization', {
        body: { ambientImage: ambient, stoneImage: stoneImageUrl, surface, stoneName },
      });

      if (error) {
        const ctx: any = (error as any).context;
        const status = ctx?.status;
        if (status === 429) toast.error('Muitas requisições. Aguarde alguns segundos.');
        else if (status === 402) toast.error('Créditos de IA esgotados.');
        else toast.error(error.message || 'Falha ao gerar visualização');
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.imageUrl) {
        setResult(data.imageUrl);
        toast.success('Visualização gerada!');
      } else {
        toast.error('A IA não retornou uma imagem');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao gerar visualização');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `${stoneName.replace(/\s+/g, '-')}-visualizacao.jpg`;
    a.click();
  };

  const share = async () => {
    if (!result) return;
    try {
      const blob = await (await fetch(result)).blob();
      const file = new File([blob], `${stoneName}.jpg`, { type: blob.type || 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: stoneName, text: `Visualização com ${stoneName}` });
      } else {
        download();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground">Visualização 3D com IA</p>
          <p className="text-sm font-semibold">{stoneName}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {!ambient ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Envie a foto do seu ambiente</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cozinha, banheiro, sala — quanto mais nítida a superfície, melhor o resultado
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Seu ambiente</p>
                <img src={ambient} alt="Ambiente" className="w-full aspect-square object-cover rounded-md border border-border" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pedra escolhida</p>
                <img src={stoneImageUrl} alt={stoneName} className="w-full aspect-square object-cover rounded-md border border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Aplicar pedra em:</Label>
              <Select value={surface} onValueChange={setSurface} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SURFACES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => { setAmbient(null); setResult(null); }} disabled={loading}>
                <RotateCcw className="w-4 h-4" /> Trocar foto
              </Button>
              <Button onClick={generate} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Gerando...' : (result ? 'Gerar novamente' : 'Aplicar pedra')}
              </Button>
            </div>

            {loading && (
              <p className="text-xs text-muted-foreground text-center animate-pulse">
                A IA está aplicando a pedra no seu ambiente — pode levar 10-25 segundos
              </p>
            )}

            {result && (
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                  <img src={result} alt="Resultado" className="w-full rounded-md border border-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={download} className="gap-2">
                    <Download className="w-4 h-4" /> Baixar
                  </Button>
                  <Button onClick={share} className="gap-2">
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Visualização gerada por IA — pode haver pequenas variações em relação ao acabamento real
                </p>
              </div>
            )}
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
};

export default Visualization3D;
