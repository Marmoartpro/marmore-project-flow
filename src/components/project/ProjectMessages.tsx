import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface Props {
  projectId: string;
}

const ProjectMessages = ({ projectId }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');
    setMessages(data || []);

    // Fetch profiles
    const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
    if (senderIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .in('user_id', senderIds);
      const map: Record<string, any> = {};
      profs?.forEach(p => { map[p.user_id] = p; });
      setProfiles(map);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    await supabase.from('messages').insert({
      project_id: projectId,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-220px)]">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhuma mensagem ainda. Envie o primeiro recado!</p>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            const profile = profiles[msg.sender_id];
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  <p className="text-xs font-medium opacity-70 mb-1">
                    {profile?.full_name || 'Usuário'}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-[10px] opacity-50 mt-1">
                    {new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-3">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva um recado..."
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={!newMessage.trim()} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProjectMessages;
