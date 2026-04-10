import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, FolderPlus, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  client: any;
  projects: any[];
  quotes: any[];
  contracts: any[];
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const ClientProfileModal = ({ open, onClose, client, projects, quotes, contracts }: Props) => {
  const navigate = useNavigate();
  const [obs, setObs] = useState(client?.observations || '');
  const [saving, setSaving] = useState(false);

  if (!client) return null;

  const clientProjects = projects.filter(p => p.client_name?.toLowerCase() === client.name?.toLowerCase());
  const clientQuotes = quotes.filter(q => q.client_name?.toLowerCase() === client.name?.toLowerCase());
  const clientContracts = contracts.filter(c => c.client_name?.toLowerCase() === client.name?.toLowerCase());

  const totalInvested = clientProjects.reduce((s, p) => s + Number(p.paid_value || 0), 0);
  const totalContracted = clientProjects.reduce((s, p) => s + Number(p.total_value || 0), 0);

  const dates = clientProjects.map(p => new Date(p.created_at).getTime()).sort();
  const firstPurchase = dates.length > 0 ? new Date(dates[0]).toLocaleDateString('pt-BR') : '—';
  const lastPurchase = dates.length > 0 ? new Date(dates[dates.length - 1]).toLocaleDateString('pt-BR') : '—';

  const saveObs = async () => {
    if (client.source !== 'manual') return;
    setSaving(true);
    await supabase.from('clients').update({ observations: obs }).eq('id', client.id);
    setSaving(false);
    toast.success('Observações salvas!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-primary/10 rounded-md p-3 text-center">
              <p className="text-lg font-bold font-display">R$ {fmt(totalInvested)}</p>
              <p className="text-[10px] text-muted-foreground">Total investido</p>
            </div>
            <div className="bg-muted rounded-md p-3 text-center">
              <p className="text-lg font-bold font-display">R$ {fmt(totalContracted)}</p>
              <p className="text-[10px] text-muted-foreground">Total contratado</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span>Primeira compra: {firstPurchase}</span>
            <span>Última compra: {lastPurchase}</span>
            {client.whatsapp && <span>WhatsApp: {client.whatsapp}</span>}
            {client.email && <span>E-mail: {client.email}</span>}
          </div>

          {/* Projects */}
          {clientProjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Projetos ({clientProjects.length})</p>
              {clientProjects.map(p => (
                <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-border text-xs cursor-pointer hover:text-primary" onClick={() => { onClose(); navigate(`/projeto/${p.id}`); }}>
                  <span>{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span>R$ {fmt(Number(p.total_value || 0))}</span>
                    <Badge variant="outline" className="text-[9px]">{p.status === 'em_andamento' ? 'Ativo' : p.status === 'concluido' ? 'Concluído' : p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quotes */}
          {clientQuotes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Orçamentos ({clientQuotes.length})</p>
              {clientQuotes.map(q => (
                <div key={q.id} className="flex justify-between items-center py-1.5 border-b border-border text-xs">
                  <span>{q.quote_number || q.client_name}</span>
                  <div className="flex items-center gap-2">
                    <span>R$ {fmt(Number(q.total || q.estimated_value || 0))}</span>
                    <Badge variant="outline" className="text-[9px]">{q.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contracts */}
          {clientContracts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Contratos ({clientContracts.length})</p>
              {clientContracts.map(c => (
                <div key={c.id} className="flex justify-between items-center py-1.5 border-b border-border text-xs">
                  <span>{c.contract_number}</span>
                  <div className="flex items-center gap-2">
                    <span>R$ {fmt(Number(c.total_value || 0))}</span>
                    <Badge variant="outline" className="text-[9px]">{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Observations */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Observações do relacionamento</p>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} className="text-xs" placeholder="Notas sobre o cliente..." />
            {client.source === 'manual' && (
              <Button size="sm" variant="outline" className="text-xs h-7 mt-2 gap-1" onClick={saveObs} disabled={saving}>
                <Save className="w-3 h-3" /> Salvar observações
              </Button>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => { onClose(); navigate(`/calculadora?clientName=${encodeURIComponent(client.name)}`); }}>
              <Calculator className="w-3.5 h-3.5" /> Novo orçamento
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => { onClose(); navigate(`/projeto/novo?clientName=${encodeURIComponent(client.name)}`); }}>
              <FolderPlus className="w-3.5 h-3.5" /> Novo projeto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientProfileModal;
