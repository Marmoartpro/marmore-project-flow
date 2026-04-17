import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bell, Mail, MessageCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ALL_EVENTS, EVENT_LABELS, NotifyEvent } from '@/lib/notifications';

type Channels = { app: boolean; email: boolean; whatsapp: boolean };
type PrefsMap = Record<NotifyEvent, Channels>;

const defaultPrefs = (): PrefsMap => {
  const map: any = {};
  ALL_EVENTS.forEach(e => { map[e] = { app: true, email: true, whatsapp: true }; });
  return map;
};

const NotificationPreferences = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<PrefsMap>(defaultPrefs());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('event_type, channel_app, channel_email, channel_whatsapp')
        .eq('user_id', user.id);
      const next = defaultPrefs();
      data?.forEach(row => {
        if ((ALL_EVENTS as string[]).includes(row.event_type)) {
          next[row.event_type as NotifyEvent] = {
            app: row.channel_app,
            email: row.channel_email,
            whatsapp: row.channel_whatsapp,
          };
        }
      });
      setPrefs(next);
      setLoading(false);
    })();
  }, [user]);

  const toggle = (event: NotifyEvent, channel: keyof Channels) => {
    setPrefs(p => ({ ...p, [event]: { ...p[event], [channel]: !p[event][channel] } }));
  };

  const setAllForEvent = (event: NotifyEvent, value: boolean) => {
    setPrefs(p => ({ ...p, [event]: { app: value, email: value, whatsapp: value } }));
  };

  const setAllForChannel = (channel: keyof Channels, value: boolean) => {
    setPrefs(p => {
      const next = { ...p };
      ALL_EVENTS.forEach(e => { next[e] = { ...next[e], [channel]: value }; });
      return next;
    });
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const rows = ALL_EVENTS.map(event => ({
      user_id: user.id,
      event_type: event,
      channel_app: prefs[event].app,
      channel_email: prefs[event].email,
      channel_whatsapp: prefs[event].whatsapp,
    }));
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(rows, { onConflict: 'user_id,event_type' });
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar preferências');
      console.error(error);
    } else {
      toast.success('Preferências salvas!');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              Escolha por quais canais quer receber cada tipo de aviso.
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </Card>
        ) : (
          <>
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Atalhos rápidos</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setAllForChannel('app', true)}>
                  <Bell className="w-3 h-3 mr-1" /> Ativar todos no App
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAllForChannel('email', true)}>
                  <Mail className="w-3 h-3 mr-1" /> Ativar todos por E-mail
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAllForChannel('whatsapp', true)}>
                  <MessageCircle className="w-3 h-3 mr-1" /> Ativar todos por WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAllForChannel('email', false)}>
                  Desativar e-mails
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAllForChannel('whatsapp', false)}>
                  Desativar WhatsApp
                </Button>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_120px_120px_140px] px-5 py-3 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                <div>Evento</div>
                <div className="text-center flex items-center justify-center gap-1"><Bell className="w-3 h-3" /> App</div>
                <div className="text-center flex items-center justify-center gap-1"><Mail className="w-3 h-3" /> E-mail</div>
                <div className="text-center flex items-center justify-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</div>
              </div>
              {ALL_EVENTS.map((event, idx) => (
                <div
                  key={event}
                  className={`px-5 py-3 ${idx > 0 ? 'border-t border-border' : ''} grid md:grid-cols-[1fr_120px_120px_140px] gap-3 items-center`}
                >
                  <div>
                    <p className="text-sm font-medium">{EVENT_LABELS[event]}</p>
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground hover:text-foreground md:hidden mt-1"
                      onClick={() => setAllForEvent(event, !(prefs[event].app && prefs[event].email && prefs[event].whatsapp))}
                    >
                      Alternar todos
                    </button>
                  </div>
                  <div className="flex md:justify-center items-center gap-2">
                    <Switch checked={prefs[event].app} onCheckedChange={() => toggle(event, 'app')} />
                    <span className="text-xs text-muted-foreground md:hidden">App</span>
                  </div>
                  <div className="flex md:justify-center items-center gap-2">
                    <Switch checked={prefs[event].email} onCheckedChange={() => toggle(event, 'email')} />
                    <span className="text-xs text-muted-foreground md:hidden">E-mail</span>
                  </div>
                  <div className="flex md:justify-center items-center gap-2">
                    <Switch checked={prefs[event].whatsapp} onCheckedChange={() => toggle(event, 'whatsapp')} />
                    <span className="text-xs text-muted-foreground md:hidden">WhatsApp</span>
                  </div>
                </div>
              ))}
            </Card>

            <div className="flex justify-end sticky bottom-4">
              <Button onClick={save} disabled={saving} size="lg" className="shadow-lg">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar preferências'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              💡 Dica: e-mails saem de <strong>notify@marmoartpro.online</strong>. WhatsApp usa o número cadastrado no seu perfil.
            </p>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default NotificationPreferences;
