import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Star, Camera } from 'lucide-react';

interface StoneCardProps {
  stone: any;
  isMarmorista: boolean;
  onDetail: (s: any) => void;
  onUploadPhoto?: (s: any) => void;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const StoneCard = ({ stone: s, isMarmorista, onDetail, onUploadPhoto }: StoneCardProps) => {
  return (
    <Card className="cursor-pointer hover:border-primary/40 transition-colors overflow-hidden group" onClick={() => onDetail(s)}>
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {s.photo_url ? (
          <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
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
        {s.promo_active && s.promo_badge && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px]">{s.promo_badge}</Badge>
        )}
        {s.featured && <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-400 fill-yellow-400" />}
      </div>
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate">{s.name}</p>
        <p className="text-[11px] text-muted-foreground">{s.category}</p>
        {s.price_per_m2 > 0 && <p className="text-xs text-primary font-medium mt-1">R$ {fmt(Number(s.price_per_m2))}/m²</p>}
        <Badge variant="outline" className="text-[9px] mt-1">{s.in_stock ? 'Em estoque' : 'Sob consulta'}</Badge>
      </CardContent>
    </Card>
  );
};

export default StoneCard;
