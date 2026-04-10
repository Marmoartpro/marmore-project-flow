import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Props {
  open: boolean;
  onClose: () => void;
  contract: any;
}

const AditivoDialog = ({ open, onClose, contract }: Props) => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    descricao: '',
    valorAdicional: '',
    novaDataEntrega: '',
    novaCondicaoPagamento: '',
  });
  const [saving, setSaving] = useState(false);

  const existingAditivos = (contract?.data as any)?.aditivos || [];
  const aditivoNumber = existingAditivos.length + 1;

  const generatePdf = (aditivo: any) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`ADITIVO Nº ${String(aditivoNumber).padStart(2, '0')}`, margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ao Contrato Nº ${contract.contract_number}`, margin, y);
    y += 12;

    doc.setFontSize(9);
    const addParagraph = (text: string) => {
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    };

    addParagraph(`As partes abaixo qualificadas, de comum acordo, resolvem aditar o contrato de prestação de serviços nº ${contract.contract_number}, celebrado em ${new Date(contract.contract_date).toLocaleDateString('pt-BR')}, conforme as seguintes condições:`);

    addParagraph(`CONTRATANTE: ${contract.client_name}`);
    addParagraph(`CONTRATADA: ${contract.company_name || ''}`);

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULA PRIMEIRA — OBJETO DO ADITIVO', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    addParagraph(aditivo.descricao);

    if (aditivo.valorAdicional) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA SEGUNDA — VALOR', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      const sinal = parseFloat(aditivo.valorAdicional) >= 0 ? 'acrescido' : 'reduzido';
      const novoTotal = Number(contract.total_value) + parseFloat(aditivo.valorAdicional);
      addParagraph(`O valor do contrato original fica ${sinal} em R$ ${Math.abs(parseFloat(aditivo.valorAdicional)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, passando o valor total para R$ ${novoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
    }

    if (aditivo.novaDataEntrega) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA TERCEIRA — PRAZO', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      addParagraph(`A nova data de entrega fica estabelecida para ${new Date(aditivo.novaDataEntrega + 'T00:00:00').toLocaleDateString('pt-BR')}.`);
    }

    if (aditivo.novaCondicaoPagamento) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA QUARTA — PAGAMENTO', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      addParagraph(aditivo.novaCondicaoPagamento);
    }

    y += 6;
    addParagraph(`As demais cláusulas do contrato original permanecem inalteradas.`);
    y += 6;
    addParagraph(`Data: ${new Date().toLocaleDateString('pt-BR')}`);

    y += 10;
    doc.text('_______________________________', margin, y);
    doc.text('_______________________________', 110, y);
    y += 5;
    doc.text('CONTRATANTE', margin, y);
    doc.text('CONTRATADA', 110, y);

    doc.save(`Aditivo_${String(aditivoNumber).padStart(2, '0')}_${contract.contract_number}.pdf`);
  };

  const save = async () => {
    if (!form.descricao) { toast.error('Descreva a alteração'); return; }
    setSaving(true);

    const aditivo = {
      numero: aditivoNumber,
      ...form,
      data: new Date().toISOString(),
    };

    const updatedAditivos = [...existingAditivos, aditivo];
    const newTotal = form.valorAdicional ? Number(contract.total_value) + parseFloat(form.valorAdicional) : contract.total_value;

    await supabase.from('contracts').update({
      data: { ...(contract.data as any || {}), aditivos: updatedAditivos },
      total_value: newTotal,
      ...(form.novaDataEntrega ? { end_date: form.novaDataEntrega } : {}),
      ...(form.novaCondicaoPagamento ? { payment_conditions: form.novaCondicaoPagamento } : {}),
    }).eq('id', contract.id);

    generatePdf(aditivo);
    toast.success('Aditivo gerado e salvo!');
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            Aditivo Nº {String(aditivoNumber).padStart(2, '0')} — {contract?.contract_number}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Descrição da alteração *</Label>
            <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} placeholder="Descreva o que será alterado..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Valor adicional/redução (R$)</Label>
              <Input type="number" step="0.01" value={form.valorAdicional} onChange={e => setForm(f => ({ ...f, valorAdicional: e.target.value }))} placeholder="Ex: 1500 ou -500" />
            </div>
            <div>
              <Label className="text-xs">Nova data de entrega</Label>
              <Input type="date" value={form.novaDataEntrega} onChange={e => setForm(f => ({ ...f, novaDataEntrega: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Nova condição de pagamento</Label>
            <Input value={form.novaCondicaoPagamento} onChange={e => setForm(f => ({ ...f, novaCondicaoPagamento: e.target.value }))} placeholder="Deixe vazio para manter" />
          </div>

          {existingAditivos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Aditivos anteriores</p>
              {existingAditivos.map((a: any, i: number) => (
                <div key={i} className="text-xs py-1 border-b border-border">
                  <span className="font-medium">Aditivo {String(a.numero).padStart(2, '0')}</span> — {new Date(a.data).toLocaleDateString('pt-BR')}
                  {a.valorAdicional && <span className="ml-2">R$ {parseFloat(a.valorAdicional).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.descricao}>{saving ? 'Salvando...' : 'Gerar aditivo'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AditivoDialog;
