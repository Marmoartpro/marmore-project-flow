import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Star, Camera } from 'lucide-react';

interface StoneCardProps {
  stone: any;
  isMarmorista: boolean;
  onDetail: (s: any) => void;
  onUploadPhoto?: (s: any) => void;
  /** Índice na grade — usado para stagger de entrada (teto em 20). */
  index?: number;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const StoneCard = ({ stone: s, isMarmorista, onDetail, onUploadPhoto, index = 0 }: StoneCardProps) => {
  const delay = Math.min(index, 20) * 30;
  const stockVariant = s.in_stock ? 'success' : 'secondary';

  return (
    <Card
      onClick={() => onDetail(s)}
      className="group relative cursor-pointer overflow-hidden rounded-lg border-border p-0 shadow-elev-sm transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-primary/40 hover:shadow-elev-lg focus-visible:ring-2 focus-visible:ring-ring animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="aspect-[4/5] bg-muted relative overflow-hidden">
        {s.photo_url ? (
          <img
            src={s.photo_url}
            alt={s.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 bg-gradient-surface">
            <Package className="w-8 h-8 text-muted-foreground" />
            {isMarmorista && (
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-7 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onUploadPhoto?.(s);
                }}
              >
                <Camera className="w-3 h-3" />
                Adicionar foto da chapa
              </Button>
            )}
          </div>
        )}

        {/* Gradient overlay for legibility over any photo */}
        {s.photo_url && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
        )}

        {/* Top-left promo badge */}
        {s.promo_active && s.promo_badge && (
          <Badge variant="destructive" className="absolute top-2 left-2 text-[10px] shadow-elev-sm">
            {s.promo_badge}
          </Badge>
        )}

        {/* Top-right featured star + stock chip */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {s.featured && (
            <div className="rounded-full bg-black/40 backdrop-blur px-1.5 py-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            </div>
          )}
          <Badge variant={stockVariant as any} className="text-[10px] shadow-elev-sm">
            {s.in_stock ? 'Estoque' : 'Sob consulta'}
          </Badge>
        </div>

        {/* Bottom text over image */}
        {s.photo_url && (
          <div className="absolute inset-x-0 bottom-0 p-3 space-y-0.5 text-white">
            <p className="text-sm font-semibold leading-tight truncate drop-shadow">{s.name}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] opacity-85 truncate">{s.category}</span>
              {s.price_per_m2 > 0 && (
                <span className="text-xs font-semibold text-primary-foreground bg-primary/80 backdrop-blur px-1.5 py-0.5 rounded">
                  R$ {fmt(Number(s.price_per_m2))}/m²
                </span>
              )}
            </div>
          </div>
        )}

        {/* Fallback text block when no photo */}
        {!s.photo_url && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-card/95 backdrop-blur border-t border-border">
            <p className="font-medium text-sm truncate">{s.name}</p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[11px] text-muted-foreground truncate">{s.category}</span>
              {s.price_per_m2 > 0 && (
                <span className="text-xs text-primary font-semibold">R$ {fmt(Number(s.price_per_m2))}/m²</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default memo(StoneCard, (prev, next) =>
  prev.stone.id === next.stone.id &&
  prev.stone.photo_url === next.stone.photo_url &&
  prev.stone.name === next.stone.name &&
  prev.stone.price_per_m2 === next.stone.price_per_m2 &&
  prev.stone.in_stock === next.stone.in_stock &&
  prev.stone.featured === next.stone.featured &&
  prev.stone.promo_active === next.stone.promo_active &&
  prev.isMarmorista === next.isMarmorista &&
  prev.index === next.index
);
