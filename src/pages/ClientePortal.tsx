import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Circle, Clock, DollarSign, FileText, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const ClientePortal = () => {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, [token]);

  const fetchData = async () => {
    if (!token) return;
    // FIX #1: Use client_access_token instead of project id
    const { data: proj } = await (supabase as any).from('projects').select('*').eq('client_access_token', token).maybeSingle();
    if (!proj) { setLoading(false); return; }
    setProject(proj);

    const [stRes, payRes, conRes] = await Promise.all([
      supabase.from('project_stages').select('*').eq('project_id', proj.id).order('stage_number'),
      supabase.from('payments').select('*').eq('project_id', proj.id).order('due_date'),
      supabase.from('contracts').select('*').eq('owner_id', proj.owner_id).limit(1),
    ]);
    setStages(stRes.data || []);
    setPayments(payRes.data || []);
    if (conRes.data?.[0]) setContract(conRes.data[0]);

    // Fetch photos for stages
    const stageIds = (stRes.data || []).map((s: any) => s.id);
    if (stageIds.length > 0) {
      const { data: ph } = await supabase.from('stage_photos').select('*, project_stages(name)').in('stage_id', stageIds);
      setPhotos(ph || []);
    }

    // Fetch messages
    const { data: msgs } = await supabase.from('messages').select('*').eq('project_id', proj.id).order('created_at');
    setMessages(msgs || []);

    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !project) return;
    await supabase.from('messages').insert({
      project_id: project.id,
      sender_id: project.owner_id, // client messages appear as from project context
      content: `[Cliente] ${newMessage.trim()}`,
    });
    setNewMessage('');
    toast.success('Mensagem enviada!');
    // Refresh messages
    const { data: msgs } = await supabase.from('messages').select('*').eq('project_id', project.id).order('created_at');
    setMessages(msgs || []);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Projeto não encontrado.</div>;

  const completed = stages.filter(s => s.status === 'concluido').length;
  const progress = stages.length > 0 ? (completed / stages.length) * 100 : 0;
  const totalPaid = payments.filter(p => p.paid).reduce((s, p) => s + Number(p.amount), 0);
  const totalDue = payments.filter(p => !p.paid).reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 py-4">
        <h1 className="text-xl font-display font-bold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.client_name}</p>
      </header>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Progress */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Progresso</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground">{completed} de {stages.length} etapas concluídas</p>
            <div className="space-y-2">
              {stages.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  {s.status === 'concluido' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                   s.status === 'em_andamento' ? <Clock className="w-5 h-5 text-yellow-500" /> :
                   <Circle className="w-5 h-5 text-muted-foreground" />}
                  <span className={`text-sm ${s.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>{s.name}</span>
                  {s.completed_at && <span className="text-[10px] text-muted-foreground ml-auto">{new Date(s.completed_at).toLocaleDateString('pt-BR')}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        {photos.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Fotos da Obra</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(p => (
                  <div key={p.id} className="aspect-square rounded-md overflow-hidden">
                    <img src={p.photo_url} alt={p.caption || ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" /> Pagamentos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-1 p-3 rounded-md bg-green-500/10 text-center">
                <p className="text-xs text-muted-foreground">Pago</p>
                <p className="font-bold text-green-500">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex-1 p-3 rounded-md bg-yellow-500/10 text-center">
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="font-bold text-yellow-500">R$ {totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b pb-2">
                <div>
                  <p>{p.description}</p>
                  {p.due_date && <p className="text-[10px] text-muted-foreground">Vence: {new Date(p.due_date).toLocaleDateString('pt-BR')}</p>}
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <Badge variant={p.paid ? 'default' : 'secondary'} className="text-[10px]">{p.paid ? 'Pago' : 'Pendente'}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contract */}
        {contract?.signed_pdf_url && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Contrato</CardTitle></CardHeader>
            <CardContent>
              <a href={contract.signed_pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                Baixar contrato assinado (PDF)
              </a>
            </CardContent>
          </Card>
        )}

        {/* Messages - FIX #10 */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Recados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {messages.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {messages.map(m => (
                  <div key={m.id} className={`text-sm p-2 rounded-md ${m.content.startsWith('[Cliente]') ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'}`}>
                    <p>{m.content.replace('[Cliente] ', '')}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="Enviar mensagem para a marmoraria..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientePortal;
