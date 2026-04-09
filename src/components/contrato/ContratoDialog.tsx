import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Save, AlertTriangle, Download, Send, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateContratoEmpreitadaPdf } from './generateContratoPdf';
import { toast } from 'sonner';
import { Ambiente, calcAmbienteArea, fmt } from '@/components/orcamento/types';

interface Props {
  open: boolean;
  onClose: () => void;
  budgetQuote: any;
  existingContract?: any;
}

const ContratoDialog = ({ open, onClose, budgetQuote, existingContract }: Props) => {
  const { user, profile } = useAuth();
  const d = budgetQuote?.data as any || {};
  const [tab, setTab] = useState('cliente');
  const [saving, setSaving] = useState(false);
  const [showPostActions, setShowPostActions] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');

  // Editable contract fields
  const [clientName, setClientName] = useState('');
  const [clientTipo, setClientTipo] = useState<'pf' | 'pj'>('pf');
  const [clientCpfCnpj, setClientCpfCnpj] = useState('');
  const [clientRg, setClientRg] = useState('');
  const [clientAddressStreet, setClientAddressStreet] = useState('');
  const [clientAddressNumber, setClientAddressNumber] = useState('');
  const [clientAddressNeighborhood, setClientAddressNeighborhood] = useState('');
  const [clientAddressCity, setClientAddressCity] = useState('');
  const [clientAddressState, setClientAddressState] = useState('');
  const [clientAddressCep, setClientAddressCep] = useState('');

  // Editable value & payment
  const [totalValue, setTotalValue] = useState(0);
  const [paymentConditions, setPaymentConditions] = useState('');

  // Contract settings (loaded from DB)
  const [contractorTipo, setContractorTipo] = useState<'pf' | 'pj'>('pf');
  const [contractorName, setContractorName] = useState('');
  const [contractorCpf, setContractorCpf] = useState('');
  const [contractorAddress, setContractorAddress] = useState('');
  const [comarca, setComarca] = useState('Sertãozinho/SP');
  const [multaInadimpl, setMultaInadimpl] = useState(2);
  const [jurosMora, setJurosMora] = useState(1);
  const [honorarios, setHonorarios] = useState(20);
  const [clausulaPenal, setClausulaPenal] = useState(10);
  const [test1Nome, setTest1Nome] = useState('');
  const [test1Cpf, setTest1Cpf] = useState('');
  const [test2Nome, setTest2Nome] = useState('');
  const [test2Cpf, setTest2Cpf] = useState('');
  const [clausulasAdicionais, setClausulasAdicionais] = useState('');

  // AI review
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiReview, setAiReview] = useState('');

  useEffect(() => {
    if (!open || !user || !budgetQuote) return;
    setClientName(existingContract?.client_name || budgetQuote?.client_name || '');
    setTotalValue(Number(existingContract?.total_value || budgetQuote?.total || 0));
    setPaymentConditions(existingContract?.payment_conditions || budgetQuote?.payment_conditions || '');
    setAiReview('');
    if (existingContract) {
      loadExistingContract();
    } else {
      loadClientData();
    }
    loadContractSettings();
  }, [open, user, budgetQuote]);

  const loadExistingContract = () => {
    const ec = existingContract;
    const cpfCnpj = ec.client_cpf_cnpj || '';
    setClientTipo(cpfCnpj.replace(/\D/g, '').length > 11 ? 'pj' : 'pf');
    setClientCpfCnpj(cpfCnpj);
    setClientRg('');
    setClientAddressStreet(ec.client_address || '');
    setClientAddressNumber('');
    setClientAddressNeighborhood('');
    setClientAddressCity('');
    setClientAddressState('');
    setClientAddressCep('');
    setClausulasAdicionais(ec.additional_clauses || '');
    loadClientData();
  };

  const loadClientData = async () => {
    if (!budgetQuote?.client_name) return;
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('owner_id', user!.id)
      .ilike('name', budgetQuote.client_name)
      .maybeSingle();
    if (client) {
      const cpf = (client as any).cpf || '';
      if (!existingContract) {
        setClientTipo(cpf.replace(/\D/g, '').length > 11 ? 'pj' : 'pf');
        setClientCpfCnpj(cpf);
      }
      setClientRg((client as any).rg || '');
      setClientAddressStreet((client as any).address_street || '');
      setClientAddressNumber((client as any).address_number || '');
      setClientAddressNeighborhood((client as any).address_neighborhood || '');
      setClientAddressCity((client as any).address_city || client.city || '');
      setClientAddressState((client as any).address_state || '');
      setClientAddressCep((client as any).address_cep || '');
    }
  };

  const loadContractSettings = async () => {
    const { data } = await supabase
      .from('contract_settings')
      .select('*')
      .eq('owner_id', user!.id)
      .maybeSingle();
    if (data) {
      // Always load contractor data from settings (user's saved defaults)
      setContractorTipo((data as any).contractor_tipo || 'pf');
      setContractorName((data as any).contractor_name || '');
      setContractorCpf((data as any).contractor_cpf || '');
      setContractorAddress((data as any).contractor_address || '');
      setComarca((data as any).comarca || 'Sertãozinho/SP');
      setMultaInadimpl(Number((data as any).multa_inadimplemento) || 2);
      setJurosMora(Number((data as any).juros_mora) || 1);
      setHonorarios(Number((data as any).honorarios_advocaticios) || 20);
      setClausulaPenal(Number((data as any).clausula_penal_rescisao) || 10);
      setTest1Nome((data as any).testemunha1_nome || '');
      setTest1Cpf((data as any).testemunha1_cpf || '');
      setTest2Nome((data as any).testemunha2_nome || '');
      setTest2Cpf((data as any).testemunha2_cpf || '');
      if (!existingContract) setClausulasAdicionais((data as any).clausulas_adicionais || '');
    } else {
      setContractorName((profile as any)?.full_name || '');
    }
  };

  const missingClientData = !clientCpfCnpj || !clientAddressStreet || !clientAddressCity;

  const buildScope = (): string => {
    if (!d.ambientes) return '';
    return (d.ambientes as Ambiente[]).map(amb => {
      const name = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
      const area = calcAmbienteArea(amb);
      const pecas = amb.pecas.map(p => {
        const nome = p.nomePeca || p.tipo;
        const acab = p.acabamentoBorda || '';
        return `${nome} (${p.comprimento}×${p.largura} cm)${acab ? ` — ${acab}` : ''}`;
      }).join('; ');
      return `${name}: ${pecas}. Área total: ${fmt(area)} m².`;
    }).join('\n');
  };

  const buildMaterialsList = (): string => {
    if (!d.ambientes) return '';
    const materials = new Set<string>();
    (d.ambientes as Ambiente[]).forEach(amb => {
      amb.materialOptions?.forEach(m => { if (m.stoneName) materials.add(m.stoneName); });
    });
    return Array.from(materials).join('\n');
  };

  const getServiceType = (): string => d.ambientes?.[0]?.tipo || budgetQuote?.environment_type || 'Bancada';
  const getMaterialName = (): string => d.ambientes?.[0]?.pecas?.[0]?.material || 'Pedra Natural';
  const hasInstallation = (): boolean => {
    if (!d.ambientes) return false;
    return (d.ambientes as Ambiente[]).some(amb => parseFloat(String(amb.maoDeObra?.instalacao || '0')) > 0);
  };

  const clientFullAddress = [
    clientAddressStreet,
    clientAddressNumber ? `nº ${clientAddressNumber}` : '',
    clientAddressNeighborhood ? `Bairro ${clientAddressNeighborhood}` : '',
    clientAddressCity,
    clientAddressState,
    clientAddressCep ? `CEP ${clientAddressCep}` : '',
  ].filter(Boolean).join(', ');

  const contractNumber = `CTR-${budgetQuote?.quote_number || 'NOVO'}`;

  const handleAIReview = async () => {
    setAiReviewing(true);
    setAiReview('');
    try {
      const scope = buildScope();
      const prompt = `Você é um advogado especialista em contratos de empreitada para marmorarias. Revise o seguinte contrato e aponte problemas, sugestões de melhoria e inconsistências. Seja direto e prático.

DADOS DO CONTRATO:
- Contratante: ${clientName} (${clientTipo === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'})
- ${clientTipo === 'pf' ? 'CPF' : 'CNPJ'}: ${clientCpfCnpj}
- Endereço: ${clientFullAddress}
- Contratada: ${contractorName}, CPF: ${contractorCpf}
- Endereço Contratada: ${contractorAddress}
- Valor Total: R$ ${fmt(totalValue)}
- Condições de Pagamento: ${paymentConditions || 'Não informado'}
- Multa: ${multaInadimpl}%, Juros: ${jurosMora}%/mês, Honorários: ${honorarios}%
- Comarca: ${comarca}

ESCOPO:
${scope}

MATERIAIS:
${buildMaterialsList()}

CLÁUSULAS ADICIONAIS:
${clausulasAdicionais || 'Nenhuma'}

Responda em formato de lista com ✅ para itens OK e ⚠️ para pontos de atenção.`;

      const response = await supabase.functions.invoke('generate-budget-gemini', {
        body: {
          mode: 'chat',
          chat_history: [{ role: 'user', content: prompt }],
          budget_data: {},
        },
      });

      if (response.error) throw response.error;
      const text = response.data?.reply || response.data?.message || 'Sem resposta da IA.';
      setAiReview(text);
    } catch (err: any) {
      toast.error('Erro na revisão da IA');
      setAiReview('Erro ao revisar. Tente novamente.');
    } finally {
      setAiReviewing(false);
    }
  };

  const handleSaveAndGenerate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save client data
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('owner_id', user.id)
        .ilike('name', budgetQuote.client_name)
        .maybeSingle();

      const clientUpdate = {
        cpf: clientCpfCnpj, rg: clientRg,
        address_street: clientAddressStreet, address_number: clientAddressNumber,
        address_neighborhood: clientAddressNeighborhood, address_city: clientAddressCity,
        address_state: clientAddressState, address_cep: clientAddressCep,
      };

      if (existingClient) {
        await supabase.from('clients').update(clientUpdate as any).eq('id', existingClient.id);
      } else {
        await supabase.from('clients').insert({
          owner_id: user.id, name: clientName, ...clientUpdate,
        } as any);
      }

      const scope = buildScope();
      const contractPayload = {
        owner_id: user.id,
        budget_quote_id: budgetQuote.id,
        client_name: clientName,
        client_cpf_cnpj: clientCpfCnpj,
        client_address: clientFullAddress,
        client_phone: '',
        company_name: contractorName,
        company_cnpj: contractorCpf,
        company_address: contractorAddress,
        company_responsible: contractorName,
        company_phone: '',
        contract_number: contractNumber,
        contract_date: new Date().toISOString().split('T')[0],
        total_value: totalValue,
        payment_conditions: paymentConditions,
        scope_description: scope,
        exclusions: '',
        cancellation_policy: `Cláusula penal de ${clausulaPenal}%`,
        additional_clauses: clausulasAdicionais,
        status: 'gerado',
        data: { ambientes: d.ambientes },
      };

      if (existingContract?.id) {
        await supabase.from('contracts').update(contractPayload as any).eq('id', existingContract.id);
      } else {
        await supabase.from('contracts').insert(contractPayload as any);
      }

      const hash = await generateContratoEmpreitadaPdf({
        clientName,
        clientCpf: clientCpfCnpj,
        clientRg,
        clientAddress: clientFullAddress,
        contractorName,
        contractorCpf,
        contractorAddress,
        contractNumber,
        contractDate: new Date().toISOString().split('T')[0],
        serviceType: getServiceType(),
        materialName: getMaterialName(),
        scopeDescription: scope,
        includesInstallation: hasInstallation(),
        materialsList: buildMaterialsList(),
        totalValue,
        paymentConditions,
        multaInadimplemento: multaInadimpl,
        jurosMora,
        honorariosAdvocaticios: honorarios,
        clausulaPenalRescisao: clausulaPenal,
        comarca,
        testemunha1Nome: test1Nome,
        testemunha1Cpf: test1Cpf,
        testemunha2Nome: test2Nome,
        testemunha2Cpf: test2Cpf,
        clausulasAdicionais,
        logoUrl: (profile as any)?.company_logo_url || null,
        clientTipo,
      });

      setGeneratedHash(hash);
      toast.success('Contrato gerado com sucesso!');
      setShowPostActions(true);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar contrato');
    } finally {
      setSaving(false);
    }
  };

  const requestSignature = async () => {
    if (!user || !budgetQuote) return;
    try {
      const { data: contract } = await supabase
        .from('contracts')
        .select('id')
        .eq('budget_quote_id', budgetQuote.id)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!contract) { toast.error('Contrato não encontrado'); return; }

      const { data, error } = await supabase.from('digital_signatures').insert({
        owner_id: user.id,
        document_type: 'contrato',
        document_id: contract.id,
      } as any).select('sign_token').single();

      if (error) throw error;
      const url = `${window.location.origin}/assinar/${(data as any).sign_token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link de assinatura copiado! Envie ao cliente.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar link');
    }
  };

  if (showPostActions) {
    return (
      <Dialog open={open} onOpenChange={() => { onClose(); setShowPostActions(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Contrato Gerado!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">O PDF foi baixado. O que deseja fazer agora?</p>
            <p className="text-[10px] text-muted-foreground font-mono break-all">Hash SHA256: {generatedHash}</p>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={requestSignature}>
                <Send className="w-4 h-4 mr-2" /> Enviar para o cliente assinar
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => { onClose(); setShowPostActions(false); }}>
                <Download className="w-4 h-4 mr-2" /> Já baixei o PDF — fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-5 h-5 text-primary" /> {existingContract ? 'Editar' : 'Gerar'} Contrato — {contractNumber}
          </DialogTitle>
        </DialogHeader>

        {missingClientData && (
          <div className="flex items-center gap-2 bg-warning/10 text-warning-foreground border border-warning/30 rounded-md p-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Complete os dados do cliente para gerar o contrato.
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="cliente" className="text-[11px]">Cliente</TabsTrigger>
            <TabsTrigger value="contratada" className="text-[11px]">Contratada</TabsTrigger>
            <TabsTrigger value="valores" className="text-[11px]">Valores</TabsTrigger>
            <TabsTrigger value="clausulas" className="text-[11px]">Cláusulas</TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[55vh] pr-4 mt-3">
            <TabsContent value="cliente" className="space-y-3 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Nome completo do contratante</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} className="h-8 text-sm" placeholder="Nome completo para o contrato" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Tipo de pessoa</Label>
                  <Select value={clientTipo} onValueChange={(v: 'pf' | 'pj') => { setClientTipo(v); setClientCpfCnpj(''); }}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pf">Pessoa Física (CPF)</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica (CNPJ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{clientTipo === 'pf' ? 'CPF' : 'CNPJ'} *</Label>
                  <Input
                    value={clientCpfCnpj}
                    onChange={e => setClientCpfCnpj(e.target.value)}
                    className="h-8 text-sm"
                    placeholder={clientTipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>
                {clientTipo === 'pf' && (
                  <div>
                    <Label className="text-xs">RG</Label>
                    <Input value={clientRg} onChange={e => setClientRg(e.target.value)} className="h-8 text-sm" />
                  </div>
                )}
                {clientTipo === 'pj' && (
                  <div>
                    <Label className="text-xs">Inscrição Estadual</Label>
                    <Input value={clientRg} onChange={e => setClientRg(e.target.value)} className="h-8 text-sm" placeholder="Opcional" />
                  </div>
                )}
                <div className="col-span-2"><Label className="text-xs">Rua / Avenida *</Label><Input value={clientAddressStreet} onChange={e => setClientAddressStreet(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Número</Label><Input value={clientAddressNumber} onChange={e => setClientAddressNumber(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Bairro</Label><Input value={clientAddressNeighborhood} onChange={e => setClientAddressNeighborhood(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Cidade *</Label><Input value={clientAddressCity} onChange={e => setClientAddressCity(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Estado</Label><Input value={clientAddressState} onChange={e => setClientAddressState(e.target.value)} className="h-8 text-sm" placeholder="SP" /></div>
                <div><Label className="text-xs">CEP</Label><Input value={clientAddressCep} onChange={e => setClientAddressCep(e.target.value)} className="h-8 text-sm" placeholder="00000-000" /></div>
              </div>
            </TabsContent>

            <TabsContent value="contratada" className="space-y-3 mt-0">
              <p className="text-xs text-muted-foreground">Dados carregados das configurações. Edite aqui para este contrato.</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome completo</Label><Input value={contractorName} onChange={e => setContractorName(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">CPF / CNPJ</Label><Input value={contractorCpf} onChange={e => setContractorCpf(e.target.value)} className="h-8 text-sm" /></div>
                <div className="col-span-2"><Label className="text-xs">Endereço completo</Label><Input value={contractorAddress} onChange={e => setContractorAddress(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Comarca do Foro</Label><Input value={comarca} onChange={e => setComarca(e.target.value)} className="h-8 text-sm" /></div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mt-4">Testemunhas</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Testemunha 1 — Nome</Label><Input value={test1Nome} onChange={e => setTest1Nome(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Testemunha 1 — CPF</Label><Input value={test1Cpf} onChange={e => setTest1Cpf(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Testemunha 2 — Nome</Label><Input value={test2Nome} onChange={e => setTest2Nome(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Testemunha 2 — CPF</Label><Input value={test2Cpf} onChange={e => setTest2Cpf(e.target.value)} className="h-8 text-sm" /></div>
              </div>
            </TabsContent>

            <TabsContent value="valores" className="space-y-3 mt-0">
              <p className="text-xs text-muted-foreground">Altere o valor final e as condições de pagamento caso tenha havido negociação.</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs">Valor total do contrato (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={totalValue}
                    onChange={e => setTotalValue(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm font-semibold"
                  />
                  {totalValue !== Number(budgetQuote?.total || 0) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Valor original do orçamento: R$ {fmt(Number(budgetQuote?.total || 0))}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Condições de pagamento</Label>
                  <Textarea
                    value={paymentConditions}
                    onChange={e => setPaymentConditions(e.target.value)}
                    rows={3}
                    className="text-sm"
                    placeholder="Ex: 50% na aprovação e 50% na entrega..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clausulas" className="space-y-3 mt-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Percentuais configuráveis</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Multa inadimpl. (%)</Label><Input type="number" value={multaInadimpl} onChange={e => setMultaInadimpl(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Juros mora (%/mês)</Label><Input type="number" value={jurosMora} onChange={e => setJurosMora(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Honorários adv. (%)</Label><Input type="number" value={honorarios} onChange={e => setHonorarios(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Cláusula penal (%)</Label><Input type="number" value={clausulaPenal} onChange={e => setClausulaPenal(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
              </div>
              <div>
                <Label className="text-xs">Cláusulas adicionais</Label>
                <Textarea value={clausulasAdicionais} onChange={e => setClausulasAdicionais(e.target.value)} rows={3} className="text-sm" placeholder="Texto livre para cláusulas extras..." />
              </div>

              {/* AI Review */}
              <div className="border border-border rounded-md p-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIReview}
                  disabled={aiReviewing}
                  className="w-full"
                >
                  {aiReviewing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  {aiReviewing ? 'Revisando...' : 'Revisão IA do contrato'}
                </Button>
                {aiReview && (
                  <div className="bg-muted/50 rounded-md p-3 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {aiReview}
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveAndGenerate} disabled={saving || missingClientData}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : existingContract ? 'Salvar e Gerar PDF' : 'Gerar Contrato PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContratoDialog;
