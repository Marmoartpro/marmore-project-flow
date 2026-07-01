import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  token: string;
  stages: any[];
  googleReviewUrl?: string | null;
}

// Show NPS only if the last stage was completed at least 7 days ago.
// Uses token-scoped RPCs — no direct table access from anon.
const NPSWidget = ({ token, stages, googleReviewUrl }: Props) => {
  const STORAGE_KEY = `nps:${token}`;
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const lastStage = stages[stages.length - 1];
  const finishedAt = lastStage?.completed_at ? new Date(lastStage.completed_at) : null;
  const daysSince = finishedAt ? Math.floor((Date.now() - finishedAt.getTime()) / (1000 * 60 * 60 * 24)) : -1;
  const eligible = daysSince >= 7;

  useEffect(() => {
    if (!eligible) { setLoading(false); return; }
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setSubmitted(true);
        setScore(parsed.score);
      }
    } catch {}
    setLoading(false);
  }, [eligible, STORAGE_KEY]);

  if (loading || !eligible) return null;

  const submit = async () => {
    if (score == null) return;
    const { error } = await (supabase as any).rpc('submit_nps', {
      _token: token,
      _score: score,
      _comment: comment.trim() || null,
    });
    if (error) {
      toast.error('Não foi possível enviar a avaliação.');
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ score })); } catch {}
    setSubmitted(true);
    toast.success('Obrigado pela avaliação!');
  };

  const trackGoogleClick = async () => {
    await (supabase as any).rpc('submit_nps', {
      _token: token,
      _score: score,
      _comment: comment.trim() || null,
      _google_reviewed: true,
    });
  };

  if (submitted) {
    const isPromoter = (score ?? 0) >= 9;
    return (
      <Card className={isPromoter ? 'border-success' : ''}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" /> Obrigado pelo feedback!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sua avaliação <strong className="text-foreground">{score}/10</strong> foi registrada.
          </p>
          {isPromoter && googleReviewUrl && (
            <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" onClick={trackGoogleClick}>
              <Button className="w-full gap-2">
                <Star className="w-4 h-4 fill-current" />
                Avaliar no Google
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          )}
          {isPromoter && !googleReviewUrl && (
            <p className="text-xs text-muted-foreground">Que bom! Compartilhe nossa marmoraria com seus amigos. 🙌</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Star className="w-4 h-4 text-warning" /> Como foi sua experiência?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          De 0 a 10, qual a chance de você nos recomendar a um amigo?
        </p>
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }).map((_, n) => (
            <button
              key={n}
              onClick={() => setScore(n)}
              className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                score === n
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70 text-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Nada provável</span>
          <span>Extremamente provável</span>
        </div>
        {score != null && (
          <>
            <Textarea
              placeholder={score >= 9 ? 'O que mais te encantou? (opcional)' : score >= 7 ? 'O que podemos melhorar? (opcional)' : 'Conte o que houve para podermos resolver. (opcional)'}
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button className="w-full" onClick={submit}>Enviar avaliação</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NPSWidget;
