import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Download, Send, FileSignature, PenTool, FilePlus } from 'lucide-react';
import AditivoDialog from '@/components/contrato/AditivoDialog';
import { toast } from 'sonner';
import ContratoDialog from '@/components/contrato/ContratoDialog';
import { generateContratoEmpreitadaPdf } from '@/components/contrato/generateContratoPdf';
import { Ambiente, calcAmbienteArea, fmt } from '@/components/orcamento/types';

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho', gerado: 'Gerado', assinado: 'Assinado', cancelado: 'Cancelado',
};
const statusColors: Record<string, string> = {
  rascunho: 'bg-warning/20 text-warning-foreground border-warning/30',
  gerado: 'bg-primary/20 text-primary border-primary/30',
  assinado: 'bg-green-500/20 text-green-700 border-green-500/30',
  cancelado: 'bg-destructive/20 text-destructive border-destructive/30',
};

const Contratos = () => {
  const { user, profile } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [aditivoContract, setAditivoContract] = useState<any>(null);

  useEffect(() => { if (user) fetchContracts(); }, [user]);

  const fetchContracts = async () => {
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false });
    setContracts(data || []);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('contracts').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchContracts();
    toast.success('Contrato excluído!');
  };

  const redownloadPdf = async (contract: any) => {
    try {
      const d = contract.data as any || {};
      const buildScope = (): string => {
        if (!d.ambientes) return contract.scope_description || '';
        return (d.ambientes as Ambiente[]).map(amb => {
          const name = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
          const area = calcAmbienteArea(amb);
          const pecas = amb.pecas.map((p: any) => {
            const nome = p.nomePeca || p.tipo;
            return `${nome} (${p.comprimento}×${p.largura} cm)`;
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
      const hasInstallation = (): boolean => {
        if (!d.ambientes) return false;
        return (d.ambientes as Ambiente[]).some(amb => parseFloat(String(amb.maoDeObra?.instalacao || '0')) > 0);
      };

      await generateContratoEmpreitadaPdf({
        clientName: contract.client_name,
        clientCpf: contract.client_cpf_cnpj || '',
        clientRg: '',
        clientAddress: contract.client_address || '',
        contractorName: contract.company_name || '',
        contractorCpf: contract.company_cnpj || '',
        contractorAddress: contract.company_address || '',
        contractNumber: contract.contract_number,
        contractDate: contract.contract_date,
        serviceType: d.ambientes?.[0]?.tipo || 'Bancada',
        materialName: d.ambientes?.[0]?.pecas?.[0]?.material || 'Pedra Natural',
        scopeDescription: buildScope(),
        includesInstallation: hasInstallation(),
        materialsList: buildMaterialsList(),
        totalValue: contract.total_value,
        paymentConditions: contract.payment_conditions || '',
        multaInadimplemento: 2,
        jurosMora: 1,
        honorariosAdvocaticios: 20,
        clausulaPenalRescisao: 10,
        comarca: 'Sertãozinho/SP',
        testemunha1Nome: '',
        testemunha1Cpf: '',
        testemunha2Nome: '',
        testemunha2Cpf: '',
        clausulasAdicionais: contract.additional_clauses || '',
        logoUrl: (profile as any)?.company_logo_url || null,
      });
      toast.success('PDF baixado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar PDF');
    }
  };

  const requestSignature = async (contract: any) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('digital_signatures').insert({
        owner_id: user.id,
        document_type: 'contrato',
        document_id: contract.id,
      } as any).select('sign_token').single();
      if (error) throw error;
      const url = `${window.location.origin}/assinar/${(data as any).sign_token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link de assinatura copiado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar link');
    }
  };

  const openEditContract = async (contract: any) => {
    // Load associated budget_quote to populate ContratoDialog
    let budgetQuote = null;
    if (contract.budget_quote_id) {
      const { data } = await supabase
        .from('budget_quotes')
        .select('*')
        .eq('id', contract.budget_quote_id)
        .maybeSingle();
      budgetQuote = data;
    }
    // Build a synthetic budgetQuote-like object for the dialog
    setEditingContract({
      ...contract,
      _budgetQuote: budgetQuote || {
        id: contract.budget_quote_id,
        client_name: contract.client_name,
        total: contract.total_value,
        payment_conditions: contract.payment_conditions,
        quote_number: contract.contract_number?.replace('CTR-', ''),
        data: contract.data,
      },
    });
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">Contratos</h2>
          <Badge variant="outline" className="text-xs">{contracts.length} contratos</Badge>
        </div>

        {contracts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              Nenhum contrato gerado ainda. Gere contratos a partir dos orçamentos aprovados.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contracts.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium text-sm truncate">{c.client_name || 'Sem cliente'}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{c.contract_number}</Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge className={`${statusColors[c.status] || statusColors.gerado} text-[10px] border`}>
                        {statusLabels[c.status] || c.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditContract(c)}>
                            <Edit className="w-3.5 h-3.5 mr-2" /> Editar contrato
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => redownloadPdf(c)}>
                            <Download className="w-3.5 h-3.5 mr-2" /> Baixar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => requestSignature(c)}>
                            <PenTool className="w-3.5 h-3.5 mr-2" /> Enviar para assinar
                          </DropdownMenuItem>
                          {c.status === 'assinado' && (
                            <DropdownMenuItem onClick={() => setAditivoContract(c)}>
                              <FilePlus className="w-3.5 h-3.5 mr-2" /> Gerar aditivo
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setDeleteId(c.id)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="font-semibold text-foreground">R$ {fmt(Number(c.total_value || 0))}</span>
                    <span>• {new Date(c.contract_date).toLocaleDateString('pt-BR')}</span>
                    {c.company_name && <span>• {c.company_name}</span>}
                  </div>
                  {c.status === 'assinado' && (c as any).signed_pdf_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 mt-2 gap-1"
                      onClick={() => window.open((c as any).signed_pdf_url, '_blank')}
                    >
                      <Download className="w-3 h-3" /> Baixar PDF assinado
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir contrato</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingContract && (
        <ContratoDialog
          open={!!editingContract}
          onClose={() => { setEditingContract(null); fetchContracts(); }}
          budgetQuote={editingContract._budgetQuote}
          existingContract={editingContract}
        />
      )}

      {aditivoContract && (
        <AditivoDialog
          open={!!aditivoContract}
          onClose={() => { setAditivoContract(null); fetchContracts(); }}
          contract={aditivoContract}
        />
      )}
    </AppLayout>
  );
};

export default Contratos;
