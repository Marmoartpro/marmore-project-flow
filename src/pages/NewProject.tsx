import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Dados do projeto', 'Escopo', 'Convidar arquiteta'];

const NewProject = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', client_name: '', environment_type: '', deadline: '', address: '',
    total_value: '', down_payment: '', payment_method: '',
    stone_type: '', stone_color: '', thickness: '', finish: '', pieces: '', observations: '',
    architect_name: '', architect_email: '', architect_phone: '', architect_office: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: project, error } = await supabase.from('projects').insert({
        owner_id: user.id,
        name: form.name,
        client_name: form.client_name,
        environment_type: form.environment_type,
        deadline: form.deadline || null,
        address: form.address,
        stone_type: form.stone_type,
        stone_color: form.stone_color,
        thickness: form.thickness,
        finish: form.finish,
        pieces: form.pieces,
        observations: form.observations,
        total_value: form.total_value ? parseFloat(form.total_value) : 0,
        down_payment: form.down_payment ? parseFloat(form.down_payment) : 0,
        payment_method: form.payment_method || null,
      }).select().single();

      if (error) throw error;

      // Auto-create client
      if (form.client_name) {
        await supabase.from('clients').insert({
          owner_id: user.id,
          name: form.client_name,
          project_id: project.id,
        });
      }

      if (form.architect_email) {
        await supabase.from('project_invites').insert({
          project_id: project.id,
          architect_name: form.architect_name,
          architect_email: form.architect_email,
          architect_phone: form.architect_phone,
          architect_office: form.architect_office,
        });
      }

      toast.success('Projeto criado com sucesso!');
      navigate(`/projeto/${project.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-display font-bold">Novo projeto</h1>
            <p className="text-sm text-muted-foreground">Passo {step + 1} de 3</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
              <p className={`text-xs mt-1 ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</p>
            </div>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="font-display">{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Nome do projeto *</Label>
                  <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Cozinha Apt. 302" required />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input value={form.client_name} onChange={e => update('client_name', e.target.value)} placeholder="Nome do cliente" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de ambiente</Label>
                    <Input value={form.environment_type} onChange={e => update('environment_type', e.target.value)} placeholder="Cozinha, banheiro..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Input type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Endereço da obra" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Valor total (R$)</Label>
                    <Input type="number" step="0.01" value={form.total_value} onChange={e => update('total_value', e.target.value)} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Entrada (R$)</Label>
                    <Input type="number" step="0.01" value={form.down_payment} onChange={e => update('down_payment', e.target.value)} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Input value={form.payment_method} onChange={e => update('payment_method', e.target.value)} placeholder="PIX, boleto..." />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de pedra</Label>
                    <Input value={form.stone_type} onChange={e => update('stone_type', e.target.value)} placeholder="Mármore, granito..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <Input value={form.stone_color} onChange={e => update('stone_color', e.target.value)} placeholder="Branco Paraná..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Espessura</Label>
                    <Input value={form.thickness} onChange={e => update('thickness', e.target.value)} placeholder="2cm, 3cm..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Acabamento</Label>
                    <Input value={form.finish} onChange={e => update('finish', e.target.value)} placeholder="Polido, levigado..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Peças</Label>
                  <Input value={form.pieces} onChange={e => update('pieces', e.target.value)} placeholder="Bancada, rodapé, soleira..." />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={form.observations} onChange={e => update('observations', e.target.value)} placeholder="Observações adicionais..." rows={3} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  Convide a arquiteta responsável pelo projeto. Um link de convite será gerado automaticamente.
                </p>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.architect_name} onChange={e => update('architect_name', e.target.value)} placeholder="Nome da arquiteta" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.architect_email} onChange={e => update('architect_email', e.target.value)} placeholder="arquiteta@email.com" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={form.architect_phone} onChange={e => update('architect_phone', e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label>Escritório</Label>
                    <Input value={form.architect_office} onChange={e => update('architect_office', e.target.value)} placeholder="Nome do escritório" />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {step > 0 ? 'Voltar' : 'Cancelar'}
              </Button>
              {step < 2 ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 0 && !form.name}>
                  Próximo <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || !form.name}>
                  <Check className="w-4 h-4 mr-1" /> {loading ? 'Criando...' : 'Criar projeto'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewProject;
