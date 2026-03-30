import { supabase } from '@/integrations/supabase/client';
import { sendWhatsApp } from '@/lib/whatsapp';

type NotifyEvent = 
  | 'stage_completed'
  | 'payment_received'
  | 'payment_overdue'
  | 'quote_approved'
  | 'quote_rejected'
  | 'new_comment'
  | 'invite_accepted';

interface NotifyOptions {
  event: NotifyEvent;
  projectId?: string;
  userId: string;
  title: string;
  message: string;
  whatsappTo?: string;
}

const EVENT_LABELS: Record<NotifyEvent, string> = {
  stage_completed: 'Etapa concluída',
  payment_received: 'Pagamento recebido',
  payment_overdue: 'Pagamento atrasado',
  quote_approved: 'Orçamento aprovado',
  quote_rejected: 'Orçamento recusado',
  new_comment: 'Novo comentário',
  invite_accepted: 'Convite aceito',
};

/**
 * Send a multi-channel notification (in-app + optional WhatsApp)
 */
export const notify = async ({ event, projectId, userId, title, message, whatsappTo }: NotifyOptions) => {
  // In-app notification
  await supabase.from('notifications').insert({
    user_id: userId,
    project_id: projectId || null,
    title,
    message,
  });

  // WhatsApp (if phone provided)
  if (whatsappTo) {
    const whatsappMsg = `📋 *${title}*\n${message}`;
    try {
      await sendWhatsApp(whatsappTo, whatsappMsg);
    } catch (e) {
      console.error('WhatsApp notification failed:', e);
    }
  }
};

/**
 * Notify project owner about a stage completion
 */
export const notifyStageCompleted = async (projectId: string, stageName: string, ownerId: string, ownerPhone?: string) => {
  await notify({
    event: 'stage_completed',
    projectId,
    userId: ownerId,
    title: 'Etapa concluída',
    message: `A etapa "${stageName}" foi concluída.`,
    whatsappTo: ownerPhone,
  });
};

/**
 * Notify about payment received
 */
export const notifyPaymentReceived = async (projectId: string, description: string, amount: number, ownerId: string, ownerPhone?: string) => {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  await notify({
    event: 'payment_received',
    projectId,
    userId: ownerId,
    title: 'Pagamento confirmado',
    message: `${description} — R$ ${fmt(amount)}`,
    whatsappTo: ownerPhone,
  });
};

/**
 * Notify about quote status change
 */
export const notifyQuoteStatus = async (status: 'approved' | 'rejected', clientName: string, ownerId: string, ownerPhone?: string) => {
  const event = status === 'approved' ? 'quote_approved' : 'quote_rejected';
  const title = status === 'approved' ? '🎉 Orçamento aprovado!' : 'Orçamento recusado';
  const message = `O orçamento de ${clientName} foi ${status === 'approved' ? 'aprovado' : 'recusado'}.`;
  await notify({
    event,
    userId: ownerId,
    title,
    message,
    whatsappTo: ownerPhone,
  });
};
