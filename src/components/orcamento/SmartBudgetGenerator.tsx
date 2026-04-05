import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SmartBudgetGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  materials: any[];
  onBudgetGenerated?: () => void;
}

export default function SmartBudgetGenerator({
  open,
  onOpenChange,
  clients,
  materials,
  onBudgetGenerated,
}: SmartBudgetGeneratorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedBudget, setGeneratedBudget] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('manual');

  const selectedMaterialData = materials.find((m) => m.id === selectedMaterial);
  const selectedClientData = clients.find((c) => c.id === selectedClient);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateBudget = async (useImage: boolean = false) => {
    if (!user || !selectedClient || !selectedMaterial) {
      toast.error('Preencha cliente e material');
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
        client_id: selectedClient,
        material_id: selectedMaterial,
        material_price: selectedMaterialData?.price_per_m2 || 0,
        measurements: measurements || 'Analisar imagem anexa',
        service_type: 'Corte e Acabamento padrão',
        image_base64: useImage ? uploadedImage : null,
      };

      // Chamar a Edge Function do Supabase
      const { data, error } = await supabase.functions.invoke('generate-budget-gemini', {
        body: payload,
      });

      if (error) throw error;

      setGeneratedBudget(data);
      toast.success('Orçamento gerado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar orçamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveBudget = async () => {
    if (!user || !generatedBudget) return;

    try {
      const { error } = await supabase.from('budget_quotes').insert({
        owner_id: user.id,
        client_name: selectedClientData?.name || '',
        environment_type: 'Não especificado',
        stone_type: selectedMaterialData?.name || '',
        total: generatedBudget.total_price,
        status: 'rascunho',
        quote_number: `AI-${Date.now()}`,
        version: 1,
        payment_conditions: 'A definir',
      });

      if (error) throw error;

      toast.success('Orçamento salvo como rascunho!');
      setGeneratedBudget(null);
      setMeasurements('');
      setUploadedImage(null);
      setSelectedClient('');
      setSelectedMaterial('');
      onOpenChange(false);
      onBudgetGenerated?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar orçamento');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Gerador Inteligente de Orçamentos
          </DialogTitle>
        </DialogHeader>

        {!generatedBudget ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Por Medidas</TabsTrigger>
              <TabsTrigger value="image">Por Planta/Foto</TabsTrigger>
            </TabsList>

            {/* Aba: Por Medidas */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} - R$ {m.price_per_m2}/m²
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Medidas e Descrição</Label>
                <Textarea
                  placeholder="Ex: Bancada de 2.5m x 0.6m com frontão de 15cm, ilha de 1.8m x 0.9m..."
                  value={measurements}
                  onChange={(e) => setMeasurements(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={() => generateBudget(false)}
                disabled={loading || !selectedClient || !selectedMaterial || !measurements}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando orçamento...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Orçamento
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Aba: Por Planta/Foto */}
            <TabsContent value="image" className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} - R$ {m.price_per_m2}/m²
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Planta/Foto do Projeto</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {uploadedImage ? (
                    <div className="space-y-2">
                      <img
                        src={uploadedImage}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadedImage(null)}
                      >
                        Remover Imagem
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Clique ou arraste uma imagem aqui
                        </span>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button
                onClick={() => generateBudget(true)}
                disabled={loading || !selectedClient || !selectedMaterial || !uploadedImage}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando imagem...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analisar e Gerar
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Área Total</p>
                    <p className="text-lg font-semibold">
                      {generatedBudget.total_area_m2} m²
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Custo Material</p>
                    <p className="text-lg font-semibold">
                      R$ {generatedBudget.material_cost.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mão de Obra</p>
                    <p className="text-lg font-semibold">
                      R$ {generatedBudget.labor_cost.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preço Final</p>
                    <p className="text-xl font-bold text-primary">
                      R$ {generatedBudget.total_price.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Detalhes</p>
                  <p className="text-sm">{generatedBudget.description}</p>
                </div>

                {generatedBudget.items && generatedBudget.items.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Itens</p>
                    <ul className="text-sm space-y-1">
                      {generatedBudget.items.map((item: any, i: number) => (
                        <li key={i}>
                          • {item.name}: {item.area} m²
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setGeneratedBudget(null)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button onClick={saveBudget} className="flex-1">
                Salvar como Rascunho
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
