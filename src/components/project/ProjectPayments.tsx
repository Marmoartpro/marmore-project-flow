import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Check, Upload, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { notifyPaymentReceived } from '@/lib/notifications';

interface Props {
  project: any;
  isOwner: boolean;
  onUpdate: () => void;
}

const ProjectPayments = ({ project, isOwner, onUpdate }: Props) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', due_date: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [project.id]);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at');
    setPayments(data || []);
    setLoading(false);
  };

  const totalValue = Number(project.total_value || 0);
  const paidTotal = payments.filter(p => p.paid).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = totalValue - paidTotal;
  const progress = totalValue > 0 ? (paidTotal / totalValue) * 100 : 0;

  const addPayment = async () => {
    if (!form.description || !form.amount) return;
    await supabase.from('payments').insert({
      project_id: project.id,
      description: form.description,
      amount: parseFloat(form.amount),
      due_date: form.due_date || null,
    });
    setForm({ description: '', amount: '', due_date: '' });
    setShowForm(false);
    fetchPayments();
    toast.success('Parcela adicionada!');
  };

  const markAsPaid = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    await supabase.from('payments').update({
      paid: true,
      paid_at: new Date().toISOString(),
    }).eq('id', paymentId);

    // Update project paid_value
    const newPaid = payments.filter(p => p.paid || p.id === paymentId)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    await supabase.from('projects').update({ paid_value: newPaid }).eq('id', project.id);

    // Send notification on payment confirmed
    if (payment) {
      await notifyPaymentReceived(project.id, payment.description, Number(payment.amount), project.owner_id);
    }

    fetchPayments();
    onUpdate();
    toast.success('Pagamento confirmado!');
  };

  const uploadReceipt = async (paymentId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `receipts/${project.id}/${paymentId}/${Date.now()}.${ext}`;
    await supabase.storage.from('project-files').upload(path, file);
    const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(path);
    await supabase.from('payments').update({ receipt_url: publicUrl }).eq('id', paymentId);
    fetchPayments();
    toast.success('Comprovante enviado!');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold font-display">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="text-lg font-bold font-display text-success">R$ {paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className="text-lg font-bold font-display text-warning">R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}% pago</p>
        </CardContent>
      </Card>

      {/* Payment list */}
      <div className="space-y-2">
        {payments.map(payment => (
          <Card key={payment.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{payment.description}</p>
                  <Badge className={payment.paid ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                    {payment.paid ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {payment.due_date && ` • Vencimento: ${new Date(payment.due_date).toLocaleDateString('pt-BR')}`}
                </p>
                {payment.receipt_url && (
                  <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                    Ver comprovante
                  </a>
                )}
              </div>
              {isOwner && !payment.paid && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => markAsPaid(payment.id)}>
                    <Check className="w-3 h-3" />
                  </Button>
                  <label className="cursor-pointer">
                    <Button size="sm" variant="ghost" asChild>
                      <span><Upload className="w-3 h-3" /></span>
                    </Button>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadReceipt(payment.id, file);
                    }} />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add payment form */}
      {isOwner && (
        <>
          {!showForm ? (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova parcela
            </Button>
          ) : (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: 1ª parcela" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addPayment} disabled={!form.description || !form.amount}>Adicionar</Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectPayments;
