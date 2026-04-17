import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stone {
  id: string;
  name: string;
  category?: string;
  origin?: string;
  photo_url?: string | null;
  colors?: string;
  thicknesses?: string;
  finishes?: string;
  price_per_m2?: number;
}

interface Props {
  stones: Stone[];
  initialIndex?: number;
  onClose: () => void;
}

const PresentationMode = ({ stones, initialIndex = 0, onClose }: Props) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const stone = stones[index];

  const next = () => {
    setZoom(1);
    setIndex(i => (i + 1) % stones.length);
  };
  const prev = () => {
    setZoom(1);
    setIndex(i => (i - 1 + stones.length) % stones.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stones.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  if (!stone) return null;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white text-sm">
          {index + 1} / {stones.length}
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setZoom(z => Math.max(z - 0.25, 1))}>
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}>
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {stone.photo_url ? (
          <img
            src={stone.photo_url}
            alt={stone.name}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        ) : (
          <div className="text-white/40 text-lg">Sem foto</div>
        )}
      </div>

      {stones.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Próxima"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent text-white">
        <h2 className="text-3xl font-display font-bold">{stone.name}</h2>
        <p className="text-white/70 mt-1">
          {[stone.category, stone.origin].filter(Boolean).join(' • ')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs">
          {stone.colors && <div><span className="text-white/50">Cores:</span> {stone.colors}</div>}
          {stone.thicknesses && <div><span className="text-white/50">Espessuras:</span> {stone.thicknesses}</div>}
          {stone.finishes && <div><span className="text-white/50">Acabamentos:</span> {stone.finishes}</div>}
          {stone.price_per_m2 && Number(stone.price_per_m2) > 0 && (
            <div className="text-base font-bold"><span className="text-white/50 text-xs font-normal">Preço/m²:</span> R$ {fmt(Number(stone.price_per_m2))}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresentationMode;
