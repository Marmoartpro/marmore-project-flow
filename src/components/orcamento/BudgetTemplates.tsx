import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChefHat, Bath, Droplet, Flame, UtensilsCrossed,
  Waves, Footprints, Mountain, Sparkles,
} from 'lucide-react';
import { Ambiente, newAmbiente, newPeca } from './types';

interface Template {
  key: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: 'Bancadas' | 'Banheiro' | 'Escadas/Revestimentos' | 'Áreas Externas';
  build: () => Ambiente[];
}

const mkPeca = (
  nome: string, largura: number, comprimento: number, qtd = 1,
  espessura = '2cm', tipo = 'Bancada',
) => ({
  ...newPeca(tipo),
  nomePeca: nome,
  tipo,
  largura: String(largura),
  comprimento: String(comprimento),
  quantidade: String(qtd),
} as any);

const TEMPLATES: Template[] = [
  /* ───── BANCADAS AVANÇADAS ───── */
  {
    key: 'cozinha-completa',
    name: 'Cozinha Completa',
    description: 'Bancada principal + ilha + cooktop + cuba',
    icon: ChefHat, color: 'text-orange-400', category: 'Bancadas',
    build: () => {
      const amb = newAmbiente('Cozinha');
      amb.pecas = [
        mkPeca('Bancada principal', 60, 300, 1, '2cm', 'Bancada'),
        mkPeca('Ilha central', 90, 200, 1, '2cm', 'Ilha Gourmet'),
        mkPeca('Bancada com cooktop', 60, 120, 1, '2cm', 'Bancada com Cooktop'),
      ];
      return [amb];
    },
  },
  {
    key: 'ilha-gourmet-premium',
    name: 'Ilha Gourmet Premium',
    description: 'Ilha grande + península + frontão',
    icon: UtensilsCrossed, color: 'text-amber-500', category: 'Bancadas',
    build: () => {
      const amb = newAmbiente('Área Gourmet');
      amb.pecas = [
        mkPeca('Ilha gourmet', 100, 280, 1, '3cm', 'Ilha Gourmet'),
        mkPeca('Península', 60, 200, 1, '3cm', 'Península'),
        mkPeca('Frontão', 12, 280, 1, '2cm', 'Frontão'),
      ];
      return [amb];
    },
  },
  {
    key: 'bancada-com-cooktop',
    name: 'Bancada com Cooktop',
    description: 'Bancada reta com recorte de cooktop e frontão',
    icon: ChefHat, color: 'text-red-400', category: 'Bancadas',
    build: () => {
      const amb = newAmbiente('Cozinha');
      amb.pecas = [
        mkPeca('Bancada cooktop', 60, 240, 1, '2cm', 'Bancada com Cooktop'),
        mkPeca('Frontão', 10, 240, 1, '2cm', 'Frontão'),
      ];
      return [amb];
    },
  },

  /* ───── BANHEIRO COMPLETO ───── */
  {
    key: 'banheiro-master',
    name: 'Banheiro Master',
    description: 'Bancada cuba dupla + saia + soleira + nicho de box',
    icon: Bath, color: 'text-blue-400', category: 'Banheiro',
    build: () => {
      const amb = newAmbiente('Banheiro Suíte');
      amb.pecas = [
        mkPeca('Bancada cuba dupla', 55, 240, 1, '2cm', 'Tampo Cuba Dupla'),
        mkPeca('Saia frontal', 10, 240, 1, '2cm', 'Frontão'),
        mkPeca('Soleira porta', 15, 90, 1, '2cm', 'Soleira'),
        mkPeca('Nicho de box', 30, 40, 2, '2cm', 'Nicho de Box'),
      ];
      return [amb];
    },
  },
  {
    key: 'banheiro-suspenso',
    name: 'Banheiro Suspenso',
    description: 'Bancada suspensa + frontão de banheira + soleira box',
    icon: Sparkles, color: 'text-cyan-400', category: 'Banheiro',
    build: () => {
      const amb = newAmbiente('Banheiro Suíte');
      amb.pecas = [
        mkPeca('Bancada suspensa', 50, 180, 1, '2cm', 'Bancada Suspensa'),
        mkPeca('Frontão da banheira', 60, 180, 1, '2cm', 'Frontão de Banheira'),
        mkPeca('Soleira de box', 12, 90, 1, '2cm', 'Soleira de Box'),
      ];
      return [amb];
    },
  },
  {
    key: 'lavabo',
    name: 'Lavabo',
    description: 'Bancada compacta com cuba + frontão',
    icon: Droplet, color: 'text-cyan-300', category: 'Banheiro',
    build: () => {
      const amb = newAmbiente('Lavabo');
      amb.pecas = [
        mkPeca('Bancada lavabo', 45, 100, 1, '2cm', 'Lavatório'),
        mkPeca('Frontão', 10, 100, 1, '2cm', 'Frontão'),
      ];
      return [amb];
    },
  },

  /* ───── ESCADAS E REVESTIMENTOS ───── */
  {
    key: 'escadaria-completa',
    name: 'Escadaria Completa',
    description: 'Degraus + espelhos + rodapé escada (12 degraus)',
    icon: Footprints, color: 'text-stone-400', category: 'Escadas/Revestimentos',
    build: () => {
      const amb = newAmbiente('Escadaria');
      amb.pecas = [
        mkPeca('Degraus', 30, 120, 12, '2cm', 'Escada/Degrau'),
        mkPeca('Espelhos de escada', 18, 120, 12, '2cm', 'Espelho de Escada'),
        mkPeca('Rodapé escada', 7, 120, 12, '2cm', 'Rodapé Escada'),
      ];
      return [amb];
    },
  },
  {
    key: 'revestimento-parede',
    name: 'Revestimento de Parede',
    description: 'Painel decorativo de parede 3m × 2,5m',
    icon: Mountain, color: 'text-slate-400', category: 'Escadas/Revestimentos',
    build: () => {
      const amb = newAmbiente('Sala / Estar');
      amb.pecas = [
        mkPeca('Revestimento parede', 250, 300, 1, '2cm', 'Revestimento de Parede'),
      ];
      return [amb];
    },
  },
  {
    key: 'lareira',
    name: 'Lareira',
    description: 'Revestimento de lareira + bancada de apoio',
    icon: Flame, color: 'text-red-500', category: 'Escadas/Revestimentos',
    build: () => {
      const amb = newAmbiente('Sala / Estar');
      amb.pecas = [
        mkPeca('Revestimento lareira', 150, 200, 1, '3cm', 'Lareira'),
        mkPeca('Bancada apoio', 30, 150, 1, '3cm', 'Bancada'),
      ];
      return [amb];
    },
  },

  /* ───── ÁREAS EXTERNAS E CHURRASQUEIRA ───── */
  {
    key: 'churrasqueira',
    name: 'Churrasqueira Completa',
    description: 'Bancada + tampo grelha + revestimento parede',
    icon: Flame, color: 'text-orange-500', category: 'Áreas Externas',
    build: () => {
      const amb = newAmbiente('Churrasqueira');
      amb.pecas = [
        mkPeca('Bancada churrasqueira', 60, 200, 1, '2cm', 'Bancada de Churrasqueira'),
        mkPeca('Tampo da grelha', 50, 80, 1, '3cm', 'Tampo de Grelha'),
        mkPeca('Revestimento parede', 100, 200, 1, '2cm', 'Revestimento de Parede'),
      ];
      return [amb];
    },
  },
  {
    key: 'area-gourmet',
    name: 'Área Gourmet Externa',
    description: 'Cozinha externa + churrasqueira + lavabo',
    icon: UtensilsCrossed, color: 'text-emerald-400', category: 'Áreas Externas',
    build: () => {
      const cz = newAmbiente('Área Gourmet');
      cz.pecas = [
        mkPeca('Bancada gourmet', 60, 280, 1, '2cm', 'Bancada Gourmet'),
        mkPeca('Ilha gourmet', 90, 220, 1, '3cm', 'Ilha Gourmet'),
      ];
      const ch = newAmbiente('Churrasqueira');
      ch.pecas = [
        mkPeca('Bancada churrasqueira', 60, 180, 1, '2cm', 'Bancada de Churrasqueira'),
        mkPeca('Tampo grelha', 50, 70, 1, '3cm', 'Tampo de Grelha'),
      ];
      const lv = newAmbiente('Área Externa');
      lv.pecas = [mkPeca('Lavabo externo', 40, 80, 1, '2cm', 'Lavabo Externo')];
      return [cz, ch, lv];
    },
  },
  {
    key: 'borda-piscina',
    name: 'Borda de Piscina',
    description: 'Borda 12m + escada submersa + soleira',
    icon: Waves, color: 'text-sky-400', category: 'Áreas Externas',
    build: () => {
      const amb = newAmbiente('Área da Piscina');
      amb.pecas = [
        mkPeca('Borda piscina', 30, 1200, 1, '3cm', 'Borda de Piscina'),
        mkPeca('Degrau submerso', 30, 200, 3, '3cm', 'Escada/Degrau'),
        mkPeca('Soleira acesso', 15, 200, 1, '3cm', 'Soleira'),
      ];
      return [amb];
    },
  },
];

const CATEGORY_ORDER: Template['category'][] = [
  'Bancadas', 'Banheiro', 'Escadas/Revestimentos', 'Áreas Externas',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (ambientes: Ambiente[]) => void;
}

const BudgetTemplates = ({ open, onClose, onApply }: Props) => {
  const handlePick = (t: Template) => {
    onApply(t.build());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Templates rápidos</DialogTitle>
          <DialogDescription>
            Comece com um modelo pré-configurado. Você pode editar todas as peças depois.
          </DialogDescription>
        </DialogHeader>

        {CATEGORY_ORDER.map(cat => {
          const items = TEMPLATES.filter(t => t.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {cat}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(t => {
                  const Icon = t.icon;
                  return (
                    <Card
                      key={t.key}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handlePick(t)}
                    >
                      <CardContent className="p-4 flex gap-3 items-start">
                        <div className={`p-2 rounded-md bg-muted ${t.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-display font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </DialogContent>
    </Dialog>
  );
};

export default BudgetTemplates;
