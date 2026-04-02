import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateContratoPdf } from './generateContratoPdf';
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

  const [clientCpfCnpj, setClientCpfCnpj] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyAddress, setCompanyAddress] = useState(d.enderecoEmpresa || '');
  const [companyResponsible, setCompanyResponsible] = useState(d.nomeResponsavel || '');
  const [companyPhone, setCompanyPhone] = useState(d.telefoneEmpresa || (profile as any)?.phone || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [warrantyDays, setWarrantyDays] = useState('90');
  const [exclusions, setExclusions] = useState('Cubas, torneiras, rejunte e instalação hidráulica não estão inclusos nesta proposta.');
  const [cancellationPolicy, setCancellationPolicy] = useState('Em caso de cancelamento após aprovação, será cobrada multa de 30% sobre o valor total do contrato.');
  const [additionalClauses, setAdditionalClauses] = useState('');
  const [saving, setSaving] = useState(false);

  const companyName = d.nomeEmpresa || 'Marmoraria Artesanal';

  // Build scope description from ambientes
  const buildScope = (): string => {
    if (!d.ambientes) return '';
    return (d.ambientes as Ambiente[]).map(amb => {
      const name = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
      const area = calcAmbienteArea(amb);
      const pecas = amb.pecas.map(p => `${p.nomePeca || p.tipo} (${p.comprimento}×${p.largura} cm)`).join(', ');
      return `${name}: ${pecas}. Área total: ${fmt(area)} m².`;
    }).join('\n');
  };

  const contractNumber = `CTR-${budgetQuote?.quote_number || 'NOVO'}`;

  const handleSaveAndGenerate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const scope = buildScope();
      const payload = {
        owner_id: user.id,
        budget_quote_id: budgetQuote.id,
        client_name: budgetQuote.client_name,
        client_cpf_cnpj: clientCpfCnpj,
        client_address: clientAddress,
        client_phone: clientPhone,
        company_name: companyName,
        company_cnpj: companyCnpj,
        company_address: companyAddress,
        company_responsible: companyResponsible,
        company_phone: companyPhone,
        contract_number: contractNumber,
        contract_date: new Date().toISOString().split('T')[0],
        start_date: startDate || null,
        end_date: endDate || null,
        warranty_days: parseInt(warrantyDays) || 90,
        total_value: budgetQuote.total,
        payment_conditions: budgetQuote.payment_conditions || '',
        scope_description: scope,
        exclusions,
        cancellation_policy: cancellationPolicy,
        additional_clauses: additionalClauses,
        status: 'gerado',
        data: { ambientes: d.ambientes },
      };

      await supabase.from('contracts').insert(payload as any);

      await generateContratoPdf({
        contractNumber,
        contractDate: new Date().toISOString().split('T')[0],
        companyName,
        companyCnpj,
        companyAddress,
        companyResponsible,
        companyPhone,
        clientName: budgetQuote.client_name,
        clientCpfCnpj,
        clientAddress,
        clientPhone,
        scopeDescription: scope,
        totalValue: budgetQuote.total,
        paymentConditions: budgetQuote.payment_conditions || '',
        startDate,
        endDate,
        warrantyDays: parseInt(warrantyDays) || 90,
        exclusions,
        cancellationPolicy,
        additionalClauses,
        logoUrl: (profile as any)?.company_logo_url || null,
      });

      toast.success('Contrato salvo e PDF gerado!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar contrato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Gerar Contrato — {contractNumber}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dados da Marmoraria</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">CNPJ</Label><Input value={companyCnpj} onChange={e => setCompanyCnpj(e.target.value)} className="h-8 text-sm" placeholder="00.000.000/0000-00" /></div>
                <div><Label className="text-xs">Responsável</Label><Input value={companyResponsible} onChange={e => setCompanyResponsible(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Endereço</Label><Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Telefone</Label><Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="h-8 text-sm" /></div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dados do Cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome</Label><Input value={budgetQuote?.client_name || ''} disabled className="h-8 text-sm bg-muted" /></div>
                <div><Label className="text-xs">CPF/CNPJ</Label><Input value={clientCpfCnpj} onChange={e => setClientCpfCnpj(e.target.value)} className="h-8 text-sm" placeholder="000.000.000-00" /></div>
                <div><Label className="text-xs">Endereço</Label><Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Telefone</Label><Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="h-8 text-sm" /></div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Prazos</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Início previsto</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Entrega prevista</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Garantia (dias)</Label><Input type="number" value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)} className="h-8 text-sm" /></div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Cláusulas</p>
              <div><Label className="text-xs">O que NÃO está incluso</Label><Textarea value={exclusions} onChange={e => setExclusions(e.target.value)} rows={2} className="text-sm" /></div>
              <div><Label className="text-xs">Política de cancelamento</Label><Textarea value={cancellationPolicy} onChange={e => setCancellationPolicy(e.target.value)} rows={2} className="text-sm" /></div>
              <div><Label className="text-xs">Cláusulas adicionais (opcional)</Label><Textarea value={additionalClauses} onChange={e => setAdditionalClauses(e.target.value)} rows={2} className="text-sm" /></div>
            </div>

            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-xs font-semibold">Valor total: <span className="text-primary">R$ {(budgetQuote?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
              {budgetQuote?.payment_conditions && (
                <p className="text-xs text-muted-foreground mt-1">Pagamento: {budgetQuote.payment_conditions}</p>
              )}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveAndGenerate} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Gerando...' : 'Salvar e Gerar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContratoDialog;
