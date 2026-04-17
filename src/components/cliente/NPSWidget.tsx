import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  ownerId: string;
  stages: any[];
  googleReviewUrl?: string | null;
}

// Show NPS only if the last stage was completed at least 7 days ago
const NPSWidget = ({ projectId, ownerId, stages, googleReviewUrl }: Props) => {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const lastStage = stages[stages.length - 1];
  const finishedAt = lastStage?.completed_at ? new Date(lastStage.completed_at) : null;
  const daysSince = finishedAt ? Math.floor((Date.now() - finishedAt.getTime()) / (1000 * 60 * 60 * 24)) : -1;
  const eligible = daysSince >= 7;

  useEffect(() => {
    if (!eligible) { setLoading(false); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from('nps_responses')
        .select('id, score')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSubmitted(true);
        setScore(data.score);
        setExistingId(data.id);
      }
      setLoading(false);
    })();
  }, [projectId, eligible]);

  if (loading || !eligible) return null;

  const submit = async () => {
    if (score == null) return;
    const { data, error } = await (supabase as any).from('nps_responses').insert({
      project_id: projectId,
      owner_id: ownerId,
      score,
      comment: comment.trim() || null,
      would_recommend: score >= 9,
    }).select('id').single();
    if (error) {
      toast.error('Não foi possível enviar a avaliação.');
      return;
    }
    setExistingId(data?.id || null);
    setSubmitted(true);
    toast.success('Obrigado pela avaliação!');
  };

  const trackGoogleClick = async () => {
    if (!existingId) return;
    await (supabase as any).from('nps_responses').update({ google_review_clicked: true }).eq('id', existingId);
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
