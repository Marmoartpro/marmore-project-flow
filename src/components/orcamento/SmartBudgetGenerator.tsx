import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Sparkles, CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Ambiente, PecaItem, newPeca, newAmbiente, newMaterialOption, PECA_TIPOS } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SmartBudgetGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stones: any[];
  onAmbientesGenerated: (ambientes: Ambiente[], resumo: string) => void;
}

interface AISummary {
  ambientes: number;
  pecas: number;
  lista: { ambiente: string; pecas: string[] }[];
  resumo: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [generatedAmbientes, setGeneratedAmbientes] = useState<Ambiente[]>([]);
  const [generatedResumo, setGeneratedResumo] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

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

        if (aiPeca.espelhoBacksplash) {
          peca.espelhoBacksplash = true;
          peca.espelhoBacksplashAltura = String(aiPeca.espelhoBacksplashAltura || '15');
        }
        if (aiPeca.saiaFrontal) {
          peca.saiaFrontal = true;
          peca.saiaFrontalAltura = String(aiPeca.saiaFrontalAltura || '10');
        }
        if (aiPeca.tipoCuba && aiPeca.tipoCuba !== 'Sem cuba') peca.tipoCuba = aiPeca.tipoCuba;
        if (aiPeca.furosTorneira && aiPeca.furosTorneira !== 'Nenhum') peca.furosTorneira = aiPeca.furosTorneira;
        if (aiPeca.rebaixoCooktop) {
          peca.rebaixoCooktop = true;
          peca.rebaixoCooktopLargura = String(aiPeca.rebaixoCooktopLargura || '');
          peca.rebaixoCooktopComprimento = String(aiPeca.rebaixoCooktopComprimento || '');
        }
        if (aiPeca.acabamentoBorda) peca.acabamentoBorda = aiPeca.acabamentoBorda;
        if (aiPeca.bordasComAcabamento) peca.bordasComAcabamento = aiPeca.bordasComAcabamento;
        if (aiPeca.tipoRebaixo && aiPeca.tipoRebaixo !== 'Sem rebaixo') {
          peca.tipoRebaixo = aiPeca.tipoRebaixo;
          peca.rebaixoComprimento = String(aiPeca.rebaixoComprimento || '');
          peca.rebaixoLargura = String(aiPeca.rebaixoLargura || '');
        }
        if (aiPeca.cantosInternos) peca.cantosInternos = String(aiPeca.cantosInternos);
        if (aiPeca.cantosExternos) peca.cantosExternos = String(aiPeca.cantosExternos);
        if (aiPeca.boleadoLados) peca.boleadoLados = String(aiPeca.boleadoLados);
        if (aiPeca.pingadeira) peca.pingadeira = true;
        if (aiPeca.encaixePorta) peca.encaixePorta = true;
        if (aiPeca.lTrecho2Largura) peca.lTrecho2Largura = String(aiPeca.lTrecho2Largura);
        if (aiPeca.lTrecho2Comprimento) peca.lTrecho2Comprimento = String(aiPeca.lTrecho2Comprimento);

        return peca;
      });

      if (amb.pecas.length === 0) {
        amb.pecas = [newPeca(pecaTipos[0] || 'Bancada')];
      }

      return amb;
    });
  };

  const generateBudget = async (useImage: boolean = false) => {
    if (!selectedMaterial) { toast.error('Selecione um material'); return; }
    if (!useImage && !measurements) { toast.error('Preencha as medidas'); return; }
    if (useImage && !uploadedImage) { toast.error('Envie uma imagem'); return; }

    setLoading(true);
    setSummary(null);
    setShowChat(false);
    setChatMessages([]);
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

      const { data, error } = await supabase.functions.invoke('generate-budget-gemini', { body: payload });
      if (error) throw new Error(error.message || 'Erro ao chamar a função');
      if (data?.error) throw new Error(data.error);

      const ambientes = buildAmbientesFromAI(data.ambientes || []);
      if (ambientes.length === 0) { toast.error('A IA não conseguiu identificar peças.'); return; }

      const summaryData: AISummary = {
        ambientes: ambientes.length,
        pecas: ambientes.reduce((s, a) => s + a.pecas.length, 0),
        lista: ambientes.map(a => ({
          ambiente: a.tipo + (a.nomeCustom ? ` (${a.nomeCustom})` : ''),
          pecas: a.pecas.map(p => `${p.nomePeca || p.tipo} ${p.largura}x${p.comprimento}cm`),
        })),
        resumo: data.resumo || '',
      };

      setSummary(summaryData);
      setGeneratedAmbientes(ambientes);
      setGeneratedResumo(data.resumo || '');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const confirmGeneration = () => {
    onAmbientesGenerated(generatedAmbientes, generatedResumo);
    toast.success(`${generatedAmbientes.length} ambiente(s) preenchido(s)!`);
    onOpenChange(false);
    setSummary(null);
    setGeneratedAmbientes([]);
    setMeasurements('');
    setUploadedImage(null);
    setChatMessages([]);
    setShowChat(false);
  };

  // Chat: refine the AI result via conversation
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const payload = {
        mode: 'chat',
        material_name: selectedStone?.name || '',
        material_price: selectedStone?.price_per_m2 || 0,
        previous_result: generatedAmbientes.length > 0 ? {
          ambientes: generatedAmbientes.map(a => ({
            tipo: a.tipo,
            pecas: a.pecas.map(p => ({
              nomePeca: p.nomePeca, tipo: p.tipo, largura: p.largura,
              comprimento: p.comprimento, quantidade: p.quantidade,
            })),
          })),
        } : null,
        chat_messages: newMessages,
        measurements: measurements || '',
      };

      const { data, error } = await supabase.functions.invoke('generate-budget-gemini', { body: payload });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data.ambientes) {
        // AI returned updated budget
        const ambientes = buildAmbientesFromAI(data.ambientes);
        setGeneratedAmbientes(ambientes);
        const summaryData: AISummary = {
          ambientes: ambientes.length,
          pecas: ambientes.reduce((s, a) => s + a.pecas.length, 0),
          lista: ambientes.map(a => ({
            ambiente: a.tipo + (a.nomeCustom ? ` (${a.nomeCustom})` : ''),
            pecas: a.pecas.map(p => `${p.nomePeca || p.tipo} ${p.largura}x${p.comprimento}cm`),
          })),
          resumo: data.resumo || generatedResumo,
        };
        setSummary(summaryData);
        if (data.resumo) setGeneratedResumo(data.resumo);
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.resposta || 'Orçamento atualizado com as correções.' }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.resposta || 'Entendi. Pode dar mais detalhes?' }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Gerador Inteligente — Preencher Orçamento com IA
          </DialogTitle>
        </DialogHeader>

        {summary ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              A IA criou {summary.pecas} peça(s) em {summary.ambientes} ambiente(s)
            </div>
            {summary.resumo && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">{summary.resumo}</p>
            )}
            <div className="space-y-2">
              {summary.lista.map((item, i) => (
                <div key={i} className="bg-muted/30 rounded-md p-2">
                  <div className="text-xs font-semibold">{item.ambiente}</div>
                  <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                    {item.pecas.map((p, j) => <li key={j}>• {p}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            {/* Chat section */}
            {showChat && (
              <div className="border border-border rounded-md p-2 space-y-2">
                <div className="text-[10px] font-medium text-muted-foreground">Converse com a IA para ajustar:</div>
                <ScrollArea className="max-h-40">
                  <div className="space-y-1.5">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`text-xs rounded-md p-2 ${msg.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-muted/50 mr-8'}`}>
                        {msg.content}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 p-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Pensando...
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="flex gap-1">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ex: Adicione uma soleira de 80cm na cozinha..."
                    className="h-8 text-xs"
                    disabled={chatLoading}
                  />
                  <Button size="icon" className="h-8 w-8 shrink-0" onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Revise os valores de mão de obra, materiais e serviços antes de gerar o PDF.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSummary(null)} className="flex-1">
                Voltar
              </Button>
              {!showChat && (
                <Button variant="outline" onClick={() => setShowChat(true)} className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" /> Conversar com IA
                </Button>
              )}
              <Button onClick={confirmGeneration} className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar e Preencher
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              A IA vai analisar as informações e preencher os ambientes e peças automaticamente.
              Você poderá editar tudo depois, incluindo valores, e gerar o PDF normalmente.
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Por Medidas</TabsTrigger>
                <TabsTrigger value="image">Por Planta/Foto</TabsTrigger>
              </TabsList>

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
                    placeholder="Ex: Cozinha com bancada de 2.50m x 0.60m com frontão de 15cm, 1 furo de torneira, cuba de embutir..."
                    value={measurements}
                    onChange={(e) => setMeasurements(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button onClick={() => generateBudget(false)} disabled={loading || !selectedMaterial || !measurements} className="w-full">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando peças...</> : <><Sparkles className="w-4 h-4 mr-2" />Preencher Orçamento com IA</>}
                </Button>
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <div className="space-y-2">
                  <Label>Planta/Foto do Projeto</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {uploadedImage ? (
                      <div className="space-y-2">
                        <img src={uploadedImage} alt="Preview" className="max-h-48 mx-auto rounded" />
                        <Button variant="outline" size="sm" onClick={() => setUploadedImage(null)}>Remover Imagem</Button>
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
                <Button onClick={() => generateBudget(true)} disabled={loading || !selectedMaterial || !uploadedImage} className="w-full">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando imagem...</> : <><Sparkles className="w-4 h-4 mr-2" />Analisar e Preencher</>}
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
