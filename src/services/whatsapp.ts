import { supabase } from "@/services/supabase";

/**
 * Envia mensagem WhatsApp via Twilio.
 * O destinatário precisa ter entrado no sandbox: enviar "join <sandbox-word>" para +1 415 523 8886.
 */
export const sendWhatsApp = async (to: string, message: string) => {
  if (!to) return;

  let phone = to.replace(/[\s\-()]/g, "");
  if (!phone.startsWith("+")) {
    phone = phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { to: phone, message },
    });
    if (error) console.error("WhatsApp send error:", error);
    return data;
  } catch (e) {
    console.error("WhatsApp send failed:", e);
  }
};
