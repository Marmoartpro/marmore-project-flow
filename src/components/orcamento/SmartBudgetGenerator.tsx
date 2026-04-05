import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Ambiente, PecaItem, newPeca, newAmbiente, newMaterialOption, PECA_TIPOS } from './types';

interface SmartBudgetGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stones: any[];
  onAmbientesGenerated: (ambientes: Ambiente[], resumo: string) => void;
}

export default function SmartBudgetGenerator({
  open,
  onOpenChange,
  stones,
  onAmbientesGenerated,
}: SmartBudgetGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('manual');

  const selectedStone = stones.find((s) => s.id === selectedMaterial);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setUploadedImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const buildAmbientesFromAI = (aiAmbientes: any[]): Ambiente[] => {
    return aiAmbientes.map((aiAmb: any) => {
      const tipo = aiAmb.tipo || 'Ambiente Personalizado';
      const amb = newAmbiente(tipo);

      // Set material if selected
      if (selectedStone) {
        amb.materialOptions = [
          {
            ...newMaterialOption('Opção A'),
            stoneId: selectedStone.id,
            stoneName: selectedStone.name,
            pricePerM2: selectedStone.price_per_m2 || 0,
          },
        ];
      }

      // Build pecas from AI
      const pecaTipos = PECA_TIPOS[tipo] || PECA_TIPOS['Ambiente Personalizado'];
      amb.pecas = (aiAmb.pecas || []).map((aiPeca: any) => {
        const pecaTipo = pecaTipos.includes(aiPeca.tipo) ? aiPeca.tipo : (pecaTipos[0] || 'Peça Personalizada');
        const peca = newPeca(pecaTipo);

        peca.nomePeca = aiPeca.nomePeca || aiPeca.nome || '';
        peca.tipo = pecaTipo;
        peca.descricao = aiPeca.descricao || '';
        peca.formato = aiPeca.formato || 'retangular';
        peca.largura = String(aiPeca.largura || '');
        peca.comprimento = String(aiPeca.comprimento || '');
        peca.quantidade = String(aiPeca.quantidade || '1');

        // Optional fields
        if (aiPeca.espelhoBacksplash) {
          peca.espelhoBacksplash = true;
          peca.espelhoBacksplashAltura = String(aiPeca.espelhoBacksplashAltura || '15');
        }
        if (aiPeca.saiaFrontal) {
          peca.saiaFrontal = true;
          peca.saiaFrontalAltura = String(aiPeca.saiaFrontalAltura || '10');
        }
        if (aiPeca.tipoCuba && aiPeca.tipoCuba !== 'Sem cuba') {
          peca.tipoCuba = aiPeca.tipoCuba;
        }
        if (aiPeca.furosTorneira && aiPeca.furosTorneira !== 'Nenhum') {
          peca.furosTorneira = aiPeca.furosTorneira;
        }
        if (aiPeca.rebaixoCooktop) {
          peca.rebaixoCooktop = true;
          peca.rebaixoCooktopLargura = String(aiPeca.rebaixoCooktopLargura || '');
          peca.rebaixoCooktopComprimento = String(aiPeca.rebaixoCooktopComprimento || '');
        }
        if (aiPeca.acabamentoBorda) peca.acabamentoBorda = aiPeca.acabamentoBorda;
        if (aiPeca.bordasComAcabamento) peca.bordasComAcabamento = aiPeca.bordasComAcabamento;

        return peca;
      });

      if (amb.pecas.length === 0) {
        amb.pecas = [newPeca(pecaTipos[0] || 'Bancada')];
      }

      return amb;
    });
  };

  const generateBudget = async (useImage: boolean = false) => {
    if (!selectedMaterial) {
      toast.error('Selecione um material');
      return;
    }
    if (!useImage && !measurements) {
      toast.error('Preencha as medidas');
      return;
    }
    if (useImage && !uploadedImage) {
      toast.error('Envie uma imagem');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        mode: 'generate',
        material_name: selectedStone?.name || '',
        material_price: selectedStone?.price_per_m2 || 0,
        stone_id: selectedMaterial,
        measurements: measurements || 'Analisar imagem anexa',
        service_type: 'Corte e Acabamento padrão',
        image_base64: useImage ? uploadedImage : null,
      };

      const { data, error } = await supabase.functions.invoke('generate-budget-gemini', {
        body: payload,
        headers: { Authorization: '' },
      });

      if (error) throw new Error(error.message || 'Erro ao chamar a função');
      if (data?.error) throw new Error(data.error);

      const ambientes = buildAmbientesFromAI(data.ambientes || []);

      if (ambientes.length === 0) {
        toast.error('A IA não conseguiu identificar peças. Tente ser mais específico.');
        return;
      }

      onAmbientesGenerated(ambientes, data.resumo || '');
      toast.success(`${ambientes.length} ambiente(s) gerado(s) pela IA! Revise e ajuste os valores.`);
      onOpenChange(false);

      // Reset
      setMeasurements('');
      setUploadedImage(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar orçamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Gerador Inteligente — Preencher Orçamento com IA
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          A IA vai analisar as informações e preencher os ambientes e peças automaticamente. 
          Você poderá editar tudo depois, incluindo valores, e gerar o PDF normalmente.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Por Medidas</TabsTrigger>
            <TabsTrigger value="image">Por Planta/Foto</TabsTrigger>
          </TabsList>

          {/* Common material selector */}
          <div className="space-y-2 mt-4">
            <Label>Material Base</Label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um material do mostruário" />
              </SelectTrigger>
              <SelectContent>
                {stones.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} - R$ {s.price_per_m2}/m²
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label>Medidas e Descrição do Projeto</Label>
              <Textarea
                placeholder="Ex: Cozinha com bancada de 2.50m x 0.60m com frontão de 15cm, 1 furo de torneira, cuba de embutir. Banheiro com bancada de 1.20m x 0.50m com espelho..."
                value={measurements}
                onChange={(e) => setMeasurements(e.target.value)}
                rows={5}
              />
            </div>
            <Button
              onClick={() => generateBudget(false)}
              disabled={loading || !selectedMaterial || !measurements}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando peças...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Preencher Orçamento com IA</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label>Planta/Foto do Projeto</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {uploadedImage ? (
                  <div className="space-y-2">
                    <img src={uploadedImage} alt="Preview" className="max-h-48 mx-auto rounded" />
                    <Button variant="outline" size="sm" onClick={() => setUploadedImage(null)}>
                      Remover Imagem
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique ou arraste uma imagem aqui</span>
                    </div>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <Button
              onClick={() => generateBudget(true)}
              disabled={loading || !selectedMaterial || !uploadedImage}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando imagem...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Analisar e Preencher</>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
