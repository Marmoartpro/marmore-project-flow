import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  useEffect(() => {
    if (!authLoading && !user && token) {
      navigate(`/login?invite=${token}`);
    }
  }, [authLoading, user, token]);

  useEffect(() => {
    if (user && invite && !invite.accepted && invite.status !== 'aceito') {
      acceptInvite();
    }
  }, [user, invite]);

  const fetchInvite = async () => {
    if (!token) return;
    const { data } = await supabase.rpc('get_project_invite_by_token', { invite_token_param: token });
    if (data && data.length > 0) {
      setInvite(data[0]);
    }
    setLoading(false);
  };

  const acceptInvite = async () => {
    if (!invite || !user || accepting) return;
    setAccepting(true);

    try {
      const { data: projectId, error } = await supabase.rpc('accept_project_invite', { invite_token_param: token! });
      if (error) throw error;

      await refreshProfile();
      toast.success('Convite aceito! Bem-vinda ao projeto.');
      navigate(`/projeto/${projectId}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aceitar convite');
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Convite não encontrado ou inválido.</p>
            <Button className="mt-4" onClick={() => navigate('/login')}>Ir para login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date() && invite.status !== 'aceito') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Este convite expirou. Solicite um novo link ao marmorista.</p>
            <Button className="mt-4" onClick={() => navigate('/login')}>Ir para login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full animate-fade-in">
        <CardHeader>
          <CardTitle className="font-display text-center">Convite de Projeto</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <h2 className="text-xl font-display font-bold">{invite.project_name}</h2>
            <p className="text-muted-foreground">{invite.client_name}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Você foi convidada para colaborar neste projeto como arquiteta.
          </p>
          {invite.accepted || invite.status === 'aceito' ? (
            <div>
              <p className="text-green-400 font-medium">Convite já aceito!</p>
              <Button className="mt-2" onClick={() => navigate(`/projeto/${invite.project_id}`)}>
                Abrir projeto
              </Button>
            </div>
          ) : (
            <Button onClick={acceptInvite} className="w-full" disabled={accepting}>
              {accepting ? 'Aceitando...' : 'Aceitar convite'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAccept;
