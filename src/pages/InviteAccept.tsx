import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  useEffect(() => {
    if (!authLoading && !user && token) {
      navigate(`/login?invite=${token}`);
    }
  }, [authLoading, user, token]);

  const fetchInvite = async () => {
    if (!token) return;
    const { data } = await supabase
      .from('project_invites')
      .select('*, projects(name, client_name)')
      .eq('invite_token', token)
      .single();
    setInvite(data);
    setLoading(false);
  };

  const acceptInvite = async () => {
    if (!invite || !user) return;
    
    // Update invite
    await supabase.from('project_invites').update({
      accepted: true,
      architect_user_id: user.id,
    }).eq('id', invite.id);

    // Update profile to arquiteta role
    await supabase.from('profiles').update({
      role: 'arquiteta' as any,
    }).eq('user_id', user.id);

    toast.success('Convite aceito! Bem-vinda ao projeto.');
    navigate(`/projeto/${invite.project_id}`);
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
            <Button className="mt-4" onClick={() => navigate('/dashboard')}>Ir para o início</Button>
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
            <h2 className="text-xl font-display font-bold">{(invite.projects as any)?.name}</h2>
            <p className="text-muted-foreground">{(invite.projects as any)?.client_name}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Você foi convidada para colaborar neste projeto como arquiteta.
          </p>
          {invite.accepted ? (
            <div>
              <p className="text-success font-medium">Convite já aceito!</p>
              <Button className="mt-2" onClick={() => navigate(`/projeto/${invite.project_id}`)}>
                Abrir projeto
              </Button>
            </div>
          ) : (
            <Button onClick={acceptInvite} className="w-full">
              Aceitar convite
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAccept;
