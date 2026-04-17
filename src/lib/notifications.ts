import { supabase } from '@/integrations/supabase/client';
import { sendWhatsApp } from '@/lib/whatsapp';

export type NotifyEvent =
  | 'new_message'
  | 'stage_completed'
  | 'stage_comment'
  | 'plant_comment'
  | 'payment_due'
  | 'payment_received'
  | 'payment_overdue'
  | 'quote_approved'
  | 'quote_rejected'
  | 'invite_accepted';

export const EVENT_LABELS: Record<NotifyEvent, string> = {
  new_message: 'Novo recado no chat do projeto',
  stage_completed: 'Etapa concluída (com foto)',
  stage_comment: 'Comentário em uma etapa',
  plant_comment: 'Anotação na planta do projeto',
  payment_due: 'Pagamento próximo do vencimento',
  payment_received: 'Pagamento recebido / confirmado',
  payment_overdue: 'Pagamento atrasado',
  quote_approved: 'Orçamento aprovado',
  quote_rejected: 'Orçamento recusado',
  invite_accepted: 'Convite aceito (arquiteta / equipe)',
};

export const ALL_EVENTS = Object.keys(EVENT_LABELS) as NotifyEvent[];

interface NotifyOptions {
  event: NotifyEvent;
  userId: string;          // recipient
  title: string;
  message: string;
  projectId?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  /** Override: skip preference lookup (used internally for tests) */
  forceChannels?: { app?: boolean; email?: boolean; whatsapp?: boolean };
}

interface ChannelPrefs {
  app: boolean;
  email: boolean;
  whatsapp: boolean;
}

/**
 * Look up the recipient's channel preferences for a given event.
 * Defaults: all channels ON when no row exists (opt-out model).
 */
const getChannelPrefs = async (userId: string, event: NotifyEvent): Promise<ChannelPrefs> => {
  const { data } = await supabase
    .from('notification_preferences')
    .select('channel_app, channel_email, channel_whatsapp')
    .eq('user_id', userId)
    .eq('event_type', event)
    .maybeSingle();
  if (!data) return { app: true, email: true, whatsapp: true };
  return {
    app: data.channel_app,
    email: data.channel_email,
    whatsapp: data.channel_whatsapp,
  };
};

/**
 * Look up recipient contact info (email + phone + name).
 */
const getRecipientContact = async (userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('user_id', userId)
    .maybeSingle();

  // Email comes from auth — we use the team_members table as a proxy when available,
  // since the client SDK can't query auth.users directly.
  const { data: tm } = await supabase
    .from('team_members')
    .select('email')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    name: profile?.full_name || undefined,
    phone: profile?.phone || undefined,
    email: tm?.email || undefined,
  };
};

/**
 * Multi-channel notification dispatcher.
 * Respects per-user, per-event channel preferences.
 */
export const notify = async (opts: NotifyOptions) => {
  const { event, userId, title, message, projectId, ctaUrl, ctaLabel, forceChannels } = opts;

  const prefs = forceChannels
    ? { app: !!forceChannels.app, email: !!forceChannels.email, whatsapp: !!forceChannels.whatsapp }
    : await getChannelPrefs(userId, event);

  const contact = (prefs.email || prefs.whatsapp) ? await getRecipientContact(userId) : { name: undefined, phone: undefined, email: undefined };

  // 1. In-app
  if (prefs.app) {
    await supabase.from('notifications').insert({
      user_id: userId,
      project_id: projectId || null,
      title,
      message,
    });
  }

  // 2. E-mail (transactional)
  if (prefs.email && contact.email) {
    try {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'app-notification',
          recipientEmail: contact.email,
          idempotencyKey: `notif-${event}-${userId}-${Date.now()}`,
          templateData: {
            title,
            message,
            recipientName: contact.name,
            ctaUrl: ctaUrl || `${window.location.origin}/dashboard`,
            ctaLabel: ctaLabel || 'Abrir aplicativo',
          },
        },
      });
    } catch (e) {
      console.error('[notify] email failed', e);
    }
  }

  // 3. WhatsApp
  if (prefs.whatsapp && contact.phone) {
    try {
      await sendWhatsApp(contact.phone, `🔔 *${title}*\n${message}`);
    } catch (e) {
      console.error('[notify] whatsapp failed', e);
    }
  }
};

// ---------- Convenience wrappers (backward compatible) ----------

export const notifyStageCompleted = (projectId: string, stageName: string, ownerId: string) =>
  notify({
    event: 'stage_completed',
    projectId,
    userId: ownerId,
    title: 'Etapa concluída',
    message: `A etapa "${stageName}" foi concluída.`,
  });

export const notifyPaymentReceived = (projectId: string, description: string, amount: number, ownerId: string) => {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  return notify({
    event: 'payment_received',
    projectId,
    userId: ownerId,
    title: 'Pagamento confirmado',
    message: `${description} — R$ ${fmt(amount)}`,
  });
};

export const notifyQuoteStatus = (status: 'approved' | 'rejected', clientName: string, ownerId: string) => {
  const event: NotifyEvent = status === 'approved' ? 'quote_approved' : 'quote_rejected';
  const title = status === 'approved' ? '🎉 Orçamento aprovado!' : 'Orçamento recusado';
  return notify({
    event,
    userId: ownerId,
    title,
    message: `O orçamento de ${clientName} foi ${status === 'approved' ? 'aprovado' : 'recusado'}.`,
  });
};
