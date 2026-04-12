import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Login = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const teamToken = searchParams.get('team');
  const [isSignUp, setIsSignUp] = useState(!!inviteToken || !!teamToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in and has invite token, go to invite page
  useEffect(() => {
    if (user && inviteToken) {
      navigate(`/invite/${inviteToken}`);
    } else if (user && !inviteToken) {
      navigate('/');
    }
  }, [user, inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: inviteToken
              ? `${window.location.origin}/invite/${inviteToken}`
              : window.location.origin,
          },
        });
        if (error) throw error;
        
        if (inviteToken) {
          // Try to sign in immediately (for auto-confirm enabled)
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (!loginError) {
            navigate(`/invite/${inviteToken}`);
            return;
          }
        }
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (inviteToken) {
          navigate(`/invite/${inviteToken}`);
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">MármoreProart</h1>
          <p className="text-muted-foreground mt-2">Gestão de projetos de marmoraria</p>
        </div>

        {inviteToken && (
          <div className="mb-4 p-3 rounded-md bg-primary/10 border border-primary/30 text-center text-sm text-primary">
            {isSignUp ? 'Crie sua conta para acessar o projeto' : 'Entre com sua conta para aceitar o convite'}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display">{isSignUp ? 'Criar conta' : 'Entrar'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Preencha os dados para criar sua conta' : 'Entre com seu e-mail e senha'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
