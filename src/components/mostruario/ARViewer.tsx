import { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface Props {
  textureUrl: string;
  stoneName: string;
  onClose: () => void;
}

const ARViewer = ({ textureUrl, stoneName, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [opacity, setOpacity] = useState(70);
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.name === 'NotAllowedError'
          ? 'Permissão da câmera negada. Habilite nas configurações do navegador.'
          : 'Não foi possível acessar a câmera neste dispositivo.'
      );
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const flipCamera = () => {
    setFacingMode(m => (m === 'environment' ? 'user' : 'environment'));
  };

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const tex = new Image();
    tex.crossOrigin = 'anonymous';
    tex.onload = () => {
      ctx.save();
      ctx.globalAlpha = opacity / 100;
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      const s = scale / 100;
      const tw = w * s;
      const th = (tex.height / tex.width) * tw;
      const pattern = ctx.createPattern(tex, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(-w, -h, w * 2, h * 2);
      } else {
        ctx.drawImage(tex, -tw / 2, -th / 2, tw, th);
      }
      ctx.restore();

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, h - 50, w, 50);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(stoneName, 16, h - 18);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCaptured(dataUrl);
    };
    tex.onerror = () => toast.error('Erro ao carregar textura da pedra');
    tex.src = textureUrl;
  };

  const sharePhoto = async () => {
    if (!captured) return;
    try {
      const blob = await (await fetch(captured)).blob();
      const file = new File([blob], `${stoneName}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: stoneName, text: `${stoneName} no ambiente` });
      } else {
        const a = document.createElement('a');
        a.href = captured;
        a.download = `${stoneName}.jpg`;
        a.click();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (captured) {
    return (
      <div className="fixed inset-0 z-[70] bg-black flex flex-col">
        <div className="flex items-center justify-between p-4 bg-black/80">
          <span className="text-white text-sm">Pré-visualização</span>
          <Button size="icon" variant="ghost" className="text-white" onClick={() => setCaptured(null)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <img src={captured} alt="Captura" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="p-4 grid grid-cols-2 gap-2 bg-black/80">
          <Button variant="outline" onClick={() => setCaptured(null)}>
            Tirar outra
          </Button>
          <Button onClick={sharePhoto} className="gap-2">
            <Share2 className="w-4 h-4" /> Compartilhar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <p className="text-white text-xs opacity-70">Ver no ambiente</p>
          <p className="text-white text-sm font-semibold">{stoneName}</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={flipCamera}>
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-white mb-3">{error}</p>
              <Button variant="outline" onClick={() => startCamera(facingMode)}>
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${textureUrl})`,
                backgroundSize: `${scale}%`,
                backgroundRepeat: 'repeat',
                opacity: opacity / 100,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center',
                mixBlendMode: 'multiply',
              }}
            />
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="bg-black/90 p-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <span>Opacidade</span>
            <span>{opacity}%</span>
          </div>
          <Slider value={[opacity]} onValueChange={v => setOpacity(v[0])} min={10} max={100} step={5} />
        </div>
        <div>
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <span>Escala da textura</span>
            <span>{scale}%</span>
          </div>
          <Slider value={[scale]} onValueChange={v => setScale(v[0])} min={20} max={300} step={10} />
        </div>
        <div>
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <span>Rotação</span>
            <span>{rotation}°</span>
          </div>
          <Slider value={[rotation]} onValueChange={v => setRotation(v[0])} min={0} max={360} step={5} />
        </div>
        <Button className="w-full gap-2 mt-2" onClick={capture} disabled={!!error}>
          <Camera className="w-4 h-4" /> Capturar foto
        </Button>
        <p className="text-[10px] text-white/40 text-center">
          Visualização aproximada — não substitui amostra física
        </p>
      </div>
    </div>
  );
};

export default ARViewer;
