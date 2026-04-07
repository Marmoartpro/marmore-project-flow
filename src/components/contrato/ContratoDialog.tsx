import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Save, AlertTriangle, Download, PenTool, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateContratoEmpreitadaPdf } from './generateContratoPdf';
import { toast } from 'sonner';
import { Ambiente, calcAmbienteArea, fmt } from '@/components/orcamento/types';

interface Props {
  open: boolean;
  onClose: () => void;
  budgetQuote: any;
}

const ContratoDialog = ({ open, onClose, budgetQuote }: Props) => {
  const { user, profile } = useAuth();
  const d = budgetQuote?.data as any || {};
  const [tab, setTab] = useState('cliente');
  const [saving, setSaving] = useState(false);
  const [showPostActions, setShowPostActions] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');

  // Client fields
  const [clientCpf, setClientCpf] = useState('');
  const [clientRg, setClientRg] = useState('');
  const [clientAddressStreet, setClientAddressStreet] = useState('');
  const [clientAddressNumber, setClientAddressNumber] = useState('');
  const [clientAddressNeighborhood, setClientAddressNeighborhood] = useState('');
  const [clientAddressCity, setClientAddressCity] = useState('');
  const [clientAddressState, setClientAddressState] = useState('');
  const [clientAddressCep, setClientAddressCep] = useState('');

  // Contract settings (loaded from DB)
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

  // Load client data + contract settings
  useEffect(() => {
    if (!open || !user || !budgetQuote) return;
    loadClientData();
    loadContractSettings();
  }, [open, user, budgetQuote]);

  const loadClientData = async () => {
    if (!budgetQuote?.client_name) return;
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('owner_id', user!.id)
      .ilike('name', budgetQuote.client_name)
      .maybeSingle();
    if (client) {
      setClientCpf((client as any).cpf || '');
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
      setClausulasAdicionais((data as any).clausulas_adicionais || '');
    } else {
      // Use profile data as fallback
      setContractorName((profile as any)?.full_name || '');
    }
  };

  const missingClientData = !clientCpf || !clientAddressStreet || !clientAddressCity;

  const buildScope = (): string => {
    if (!d.ambientes) return '';
    return (d.ambientes as Ambiente[]).map(amb => {
      const name = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
      const area = calcAmbienteArea(amb);
      const matNames = amb.materialOptions?.map(m => m.nome).filter(Boolean).join(', ') || '';
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
      amb.pecas.forEach(p => { if (p.material) materials.add(p.material); });
    });
    return Array.from(materials).join('\n');
  };

  const getServiceType = (): string => {
    const envType = d.ambientes?.[0]?.tipo || budgetQuote?.environment_type || 'Bancada';
    return envType;
  };

  const getMaterialName = (): string => {
    if (!d.ambientes) return 'Pedra Natural';
    const mat = d.ambientes[0]?.pecas?.[0]?.material;
    return mat || 'Pedra Natural';
  };

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
        cpf: clientCpf, rg: clientRg,
        address_street: clientAddressStreet, address_number: clientAddressNumber,
        address_neighborhood: clientAddressNeighborhood, address_city: clientAddressCity,
        address_state: clientAddressState, address_cep: clientAddressCep,
      };

      if (existingClient) {
        await supabase.from('clients').update(clientUpdate as any).eq('id', existingClient.id);
      } else {
        await supabase.from('clients').insert({
          owner_id: user.id, name: budgetQuote.client_name, ...clientUpdate,
        } as any);
      }

      const scope = buildScope();
      const contractPayload = {
        owner_id: user.id,
        budget_quote_id: budgetQuote.id,
        client_name: budgetQuote.client_name,
        client_cpf_cnpj: clientCpf,
        client_address: clientFullAddress,
        client_phone: '',
        company_name: contractorName,
        company_cnpj: contractorCpf,
        company_address: contractorAddress,
        company_responsible: contractorName,
        company_phone: '',
        contract_number: contractNumber,
        contract_date: new Date().toISOString().split('T')[0],
        total_value: budgetQuote.total,
        payment_conditions: budgetQuote.payment_conditions || '',
        scope_description: scope,
        exclusions: '',
        cancellation_policy: `Cláusula penal de ${clausulaPenal}%`,
        additional_clauses: clausulasAdicionais,
        status: 'gerado',
        data: { ambientes: d.ambientes },
      };

      await supabase.from('contracts').insert(contractPayload as any);

      const hash = await generateContratoEmpreitadaPdf({
        clientName: budgetQuote.client_name,
        clientCpf,
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
        totalValue: budgetQuote.total,
        paymentConditions: budgetQuote.payment_conditions || '',
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
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Gerar Contrato de Empreitada — {contractNumber}
          </DialogTitle>
        </DialogHeader>

        {missingClientData && (
          <div className="flex items-center gap-2 bg-warning/10 text-warning-foreground border border-warning/30 rounded-md p-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Complete os dados do cliente para gerar o contrato.
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="cliente" className="text-[11px]">Cliente</TabsTrigger>
            <TabsTrigger value="contratada" className="text-[11px]">Contratada</TabsTrigger>
            <TabsTrigger value="clausulas" className="text-[11px]">Cláusulas</TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[55vh] pr-4 mt-3">
            <TabsContent value="cliente" className="space-y-3 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs">Nome</Label><Input value={budgetQuote?.client_name || ''} disabled className="h-8 text-sm bg-muted" /></div>
                <div><Label className="text-xs">CPF *</Label><Input value={clientCpf} onChange={e => setClientCpf(e.target.value)} className="h-8 text-sm" placeholder="000.000.000-00" /></div>
                <div><Label className="text-xs">RG</Label><Input value={clientRg} onChange={e => setClientRg(e.target.value)} className="h-8 text-sm" /></div>
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
                <div><Label className="text-xs">CPF</Label><Input value={contractorCpf} onChange={e => setContractorCpf(e.target.value)} className="h-8 text-sm" /></div>
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

              <div className="bg-muted/50 rounded-md p-3 mt-4">
                <p className="text-xs font-semibold">Valor total: <span className="text-primary">R$ {fmt(Number(budgetQuote?.total || 0))}</span></p>
                {budgetQuote?.payment_conditions && (
                  <p className="text-xs text-muted-foreground mt-1">Pagamento: {budgetQuote.payment_conditions}</p>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveAndGenerate} disabled={saving || missingClientData}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Gerando...' : 'Gerar Contrato PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContratoDialog;
