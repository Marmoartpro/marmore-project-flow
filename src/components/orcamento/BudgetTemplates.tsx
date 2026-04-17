import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ChefHat, Bath, Droplet, Flame, UtensilsCrossed } from 'lucide-react';
import { Ambiente, newAmbiente, newPeca } from './types';

interface Template {
  key: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  build: () => Ambiente[];
}

const mkPeca = (nome: string, largura: number, comprimento: number, qtd = 1, espessura = '2cm') => ({
  ...newPeca(),
  nomePeca: nome,
  largura,
  comprimento,
  quantidade: qtd,
  espessura,
});

const TEMPLATES: Template[] = [
  {
    key: 'cozinha-completa',
    name: 'Cozinha Completa',
    description: 'Bancada principal + ilha + cooktop + cuba esculpida',
    icon: ChefHat,
    color: 'text-orange-400',
    build: () => {
      const amb = newAmbiente('Cozinha');
      amb.pecas = [
        mkPeca('Bancada principal', 60, 300),
        mkPeca('Ilha central', 90, 200),
        mkPeca('Recorte cooktop', 50, 80),
      ];
      return [amb];
    },
  },
  {
    key: 'banheiro-master',
    name: 'Banheiro Master',
    description: 'Bancada dupla com cubas + saia frontal + soleira',
    icon: Bath,
    color: 'text-blue-400',
    build: () => {
      const amb = newAmbiente('Banheiro');
      amb.pecas = [
        mkPeca('Bancada dupla', 55, 240),
        mkPeca('Saia frontal', 10, 240),
        mkPeca('Soleira porta', 15, 90),
      ];
      return [amb];
    },
  },
  {
    key: 'lavabo',
    name: 'Lavabo',
    description: 'Bancada compacta com cuba + frontão',
    icon: Droplet,
    color: 'text-cyan-400',
    build: () => {
      const amb = newAmbiente('Lavabo');
      amb.pecas = [
        mkPeca('Bancada lavabo', 45, 100),
        mkPeca('Frontão', 10, 100),
      ];
      return [amb];
    },
  },
  {
    key: 'churrasqueira',
    name: 'Churrasqueira',
    description: 'Bancada apoio + tampo grelha + revestimento parede',
    icon: Flame,
    color: 'text-red-400',
    build: () => {
      const amb = newAmbiente('Churrasqueira');
      amb.pecas = [
        mkPeca('Bancada apoio', 60, 200),
        mkPeca('Tampo da grelha', 50, 80),
        mkPeca('Revestimento parede', 100, 200),
      ];
      return [amb];
    },
  },
  {
    key: 'area-gourmet',
    name: 'Área Gourmet',
    description: 'Bancada + ilha + churrasqueira + lavabo apoio',
    icon: UtensilsCrossed,
    color: 'text-emerald-400',
    build: () => {
      const cz = newAmbiente('Cozinha');
      cz.pecas = [
        mkPeca('Bancada gourmet', 60, 280),
        mkPeca('Ilha gourmet', 90, 220),
      ];
      const ch = newAmbiente('Churrasqueira');
      ch.pecas = [
        mkPeca('Bancada churrasqueira', 60, 180),
        mkPeca('Tampo grelha', 50, 70),
      ];
      const lv = newAmbiente('Lavabo');
      lv.pecas = [mkPeca('Cuba apoio gourmet', 40, 80)];
      return [cz, ch, lv];
    },
  },
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Templates rápidos</DialogTitle>
          <DialogDescription>
            Comece com um modelo pré-configurado. Você pode editar todas as peças depois.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map(t => {
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
      </DialogContent>
    </Dialog>
  );
};

export default BudgetTemplates;
