import { supabase } from '@/integrations/supabase/client';

/**
 * Send a WhatsApp message via Twilio sandbox.
 * Requires the recipient to have joined the sandbox first:
 * Send "join <sandbox-word>" to +1 415 523 8886 on WhatsApp.
 */
export const sendWhatsApp = async (to: string, message: string) => {
  if (!to) return;
  
  // Normalize BR phone: remove spaces, dashes, add +55 if needed
  let phone = to.replace(/[\s\-()]/g, '');
  if (!phone.startsWith('+')) {
    phone = phone.startsWith('55') ? `+${phone}` : `+55${phone}`;
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { to: phone, message },
    });
    if (error) {
      console.error('WhatsApp send error:', error);
    }
    return data;
  } catch (e) {
    console.error('WhatsApp send failed:', e);
  }
};
