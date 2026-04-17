import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, MailX, AlertCircle, Loader2 } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = 'validating' | 'valid' | 'already' | 'invalid' | 'submitting' | 'done' | 'error';

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('validating');

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const json = await res.json();
        if (json.valid) setState('valid');
        else if (json.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      } catch {
        setState('error');
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState('submitting');
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON },
          body: JSON.stringify({ token }),
        }
      );
      const json = await res.json();
      if (json.success || json.reason === 'already_unsubscribed') setState('done');
      else setState('error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-xl font-display font-bold">MármoreProArt</h1>

        {state === 'validating' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Validando link...</p>
          </>
        )}
        {state === 'valid' && (
          <>
            <MailX className="w-12 h-12 mx-auto text-foreground" />
            <h2 className="text-lg font-semibold">Cancelar inscrição de e-mails?</h2>
            <p className="text-sm text-muted-foreground">
              Você não receberá mais notificações por e-mail do MármoreProArt. Pode reativar a qualquer momento nas configurações da sua conta.
            </p>
            <Button onClick={confirm} className="w-full">Confirmar cancelamento</Button>
          </>
        )}
        {state === 'submitting' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin" />
            <p className="text-sm text-muted-foreground">Processando...</p>
          </>
        )}
        {state === 'done' && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h2 className="text-lg font-semibold">Pronto!</h2>
            <p className="text-sm text-muted-foreground">Você foi removido(a) da nossa lista de e-mails.</p>
          </>
        )}
        {state === 'already' && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h2 className="text-lg font-semibold">Você já cancelou</h2>
            <p className="text-sm text-muted-foreground">Esta inscrição já havia sido cancelada anteriormente.</p>
          </>
        )}
        {(state === 'invalid' || state === 'error') && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Link inválido</h2>
            <p className="text-sm text-muted-foreground">
              Este link de cancelamento expirou ou não é válido. Use o botão "Cancelar inscrição" no rodapé do e-mail mais recente.
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default Unsubscribe;
