import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsApp } from '@/lib/whatsapp';

const ALERT_WORDS = ['errado', 'problema', 'incorreto', 'refazer', 'ajustar'];

interface Props {
  stageId: string;
  stageName: string;
  projectId: string;
  projectName: string;
}

const StageComments = ({ stageId, stageName, projectId, projectName }: Props) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [stageId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('stage_comments')
      .select('*')
      .eq('stage_id', stageId)
      .order('created_at');
    setComments(data || []);

    // Fetch author profiles
    const authorIds = [...new Set((data || []).map((c: any) => c.author_id))];
    if (authorIds.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name, role').in('user_id', authorIds);
      const map: Record<string, any> = {};
      profs?.forEach(p => { map[p.user_id] = p; });
      setProfiles(map);
    }
  };

  const sendComment = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    const hasAlert = ALERT_WORDS.some(w => text.toLowerCase().includes(w));

    const { error } = await supabase.from('stage_comments').insert({
      stage_id: stageId,
      author_id: user.id,
      content: text.trim(),
      has_alert: hasAlert,
    });

    if (error) {
      toast.error('Erro ao enviar comentário');
      setSending(false);
      return;
    }

    // Create notification + WhatsApp for the other party
    try {
      const { data: project } = await supabase.from('projects').select('owner_id').eq('id', projectId).single();
      if (project) {
        const isOwner = project.owner_id === user.id;
        if (isOwner) {
          // Notify architect
          const { data: invite } = await supabase.from('project_invites').select('architect_user_id').eq('project_id', projectId).eq('accepted', true).limit(1).maybeSingle();
          if (invite?.architect_user_id) {
            const msg = `${profile?.full_name || 'Marmorista'} comentou na etapa "${stageName}" do projeto "${projectName}".`;
            await supabase.from('notifications').insert({
              user_id: invite.architect_user_id,
              project_id: projectId,
              title: 'Novo comentário na etapa',
              message: msg,
            });
            // Send WhatsApp to architect
            const { data: archProfile } = await supabase.from('profiles').select('phone').eq('user_id', invite.architect_user_id).single();
            if (archProfile?.phone) {
              sendWhatsApp(archProfile.phone, `🔔 MármoreProart: ${msg}`);
            }
          }
        } else {
          // Notify owner
          const msg = `Arq. ${profile?.full_name || 'Arquiteta'} deixou um comentário na etapa "${stageName}" do projeto "${projectName}". Acesse o app para visualizar.`;
          await supabase.from('notifications').insert({
            user_id: project.owner_id,
            project_id: projectId,
            title: 'Comentário da arquiteta',
            message: msg,
          });
          // Send WhatsApp to owner
          const { data: ownerProfile } = await supabase.from('profiles').select('phone').eq('user_id', project.owner_id).single();
          if (ownerProfile?.phone) {
            sendWhatsApp(ownerProfile.phone, `🔔 MármoreProart: ${msg}`);
          }
        }
      }
    } catch {}

    setText('');
    setSending(false);
    fetchComments();
    toast.success('Comentário enviado!');
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <MessageSquare className="w-3 h-3" /> Comentários
      </p>

      {comments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map(c => {
            const author = profiles[c.author_id];
            return (
              <div key={c.id} className={`px-3 py-2 rounded-md text-sm border ${c.has_alert ? 'bg-warning/10 border-warning/30' : 'bg-muted/30 border-border'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">{author?.full_name || 'Usuário'}</span>
                  {author?.role === 'arquiteta' && <Badge variant="outline" className="text-[9px] px-1 py-0">Arq.</Badge>}
                  {c.has_alert && <AlertTriangle className="w-3 h-3 text-warning" />}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')} {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs">{c.content}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="Escreva um comentário..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          className="text-xs"
        />
        <Button size="icon" className="shrink-0 self-end" onClick={sendComment} disabled={sending || !text.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StageComments;
