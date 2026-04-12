import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import RoleBadge from '@/components/RoleBadge';
import { toast } from 'sonner';
import { CheckCircle, Shield } from 'lucide-react';

const PERM_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', projetos: 'Projetos', projetos_financeiro: 'Financeiro de projetos',
  orcamentos: 'Orçamentos', orcamentos_editar: 'Editar orçamentos', clientes: 'Clientes',
  financeiro: 'Financeiro', mostruario: 'Mostruário', fornecedores: 'Fornecedores',
  contratos: 'Contratos', relatorios: 'Relatórios', equipe: 'Equipe', estoque: 'Estoque',
  calculadora: 'Calculadora', projetos_cliente: 'Portal do cliente',
};

const TeamInviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => { fetchInvite(); }, [token]);

  useEffect(() => {
    if (user && invite && !invite.accepted_at) {
      acceptInvite();
    }
  }, [user, invite]);

  const fetchInvite = async () => {
    if (!token) return;
    const { data } = await supabase.rpc('get_team_invite_by_token', { token_param: token });
    if (data && data.length > 0) {
      setInvite(data[0]);
      setFullName(data[0].name || '');
      setWhatsapp(data[0].whatsapp || '');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccepting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      // Try auto sign-in
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) {
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
        setAccepting(false);
        return;
      }
      // accept will happen via useEffect when user becomes set
    } catch (err: any) {
      toast.error(err.message);
      setAccepting(false);
    }
  };

  const acceptInvite = async () => {
    if (!token || accepting) return;
    setAccepting(true);
    try {
      const { error } = await supabase.rpc('accept_team_invite', { token_param: token });
      if (error) throw error;
      toast.success('Bem-vindo à equipe!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md"><CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Convite não encontrado ou inválido.</p>
          <Button className="mt-4" onClick={() => navigate('/login')}>Ir para login</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date() && !invite.accepted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md"><CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Este convite expirou. Solicite um novo link.</p>
          <Button className="mt-4" onClick={() => navigate('/login')}>Ir para login</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (invite.accepted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md"><CardContent className="py-8 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="text-green-500 font-medium">Convite já aceito!</p>
          <Button onClick={() => navigate('/')}>Entrar no app</Button>
        </CardContent></Card>
      </div>
    );
  }

  const activePerms = Object.entries(invite.permissions || {}).filter(([, v]) => v === true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full animate-fade-in">
        <CardHeader className="text-center">
          <Shield className="w-10 h-10 mx-auto text-primary mb-2" />
          <CardTitle className="font-display">Convite de Equipe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Você foi convidado por</p>
            <p className="font-bold text-lg">{invite.owner_name || 'MármoreProart'}</p>
            <div className="flex justify-center"><RoleBadge role={invite.role} /></div>
          </div>

          {activePerms.length > 0 && (
            <div className="border rounded-md p-3">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Você terá acesso a:</p>
              <div className="flex flex-wrap gap-1">
                {activePerms.map(([key]) => (
                  <Badge key={key} variant="secondary" className="text-[10px]">
                    {PERM_LABELS[key] || key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {user ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Clique para aceitar com sua conta atual</p>
              <Button onClick={acceptInvite} className="w-full" disabled={accepting}>
                {accepting ? 'Aceitando...' : 'Aceitar convite'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Crie sua conta para entrar na equipe</p>
              <div><Label>Nome completo</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
              <div><Label>E-mail</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div><Label>WhatsApp</Label><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} /></div>
              <div><Label>Senha</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></div>
              <Button type="submit" className="w-full" disabled={accepting}>
                {accepting ? 'Criando conta...' : 'Criar conta e aceitar'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Já tem conta? <button type="button" onClick={() => navigate(`/login?team=${token}`)} className="text-primary underline">Entrar</button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamInviteAccept;
