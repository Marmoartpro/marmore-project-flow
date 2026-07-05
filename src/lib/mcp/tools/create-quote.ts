import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_quote",
  title: "Criar orçamento",
  description:
    "Cria um novo orçamento (quote) no MármoreProart para o usuário autenticado. Salva os dados via Supabase respeitando RLS (owner_id = usuário logado).",
  inputSchema: {
    client_name: z.string().trim().min(1).describe("Nome do cliente."),
    client_whatsapp: z.string().optional().describe("WhatsApp do cliente (com DDD, ex: +5511999999999)."),
    environment_type: z
      .string()
      .optional()
      .describe("Tipo de ambiente (ex: cozinha, banheiro, área externa)."),
    stone_type: z.string().optional().describe("Tipo de pedra (ex: mármore, quartzo, quartzito)."),
    estimated_value: z
      .number()
      .nonnegative()
      .optional()
      .describe("Valor estimado em reais."),
    status: z
      .enum(["aguardando", "aprovado", "recusado", "expirado"])
      .optional()
      .describe("Status do orçamento. Padrão: aguardando."),
    sent_date: z
      .string()
      .optional()
      .describe("Data de envio no formato YYYY-MM-DD. Padrão: hoje."),
    follow_up_date: z
      .string()
      .optional()
      .describe("Data para follow-up no formato YYYY-MM-DD."),
    observations: z.string().optional().describe("Observações internas sobre o orçamento."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }

    const payload: Record<string, unknown> = {
      owner_id: ctx.getUserId(),
      client_name: input.client_name,
      client_whatsapp: input.client_whatsapp ?? null,
      environment_type: input.environment_type ?? null,
      stone_type: input.stone_type ?? null,
      estimated_value: input.estimated_value ?? 0,
      status: input.status ?? "aguardando",
      observations: input.observations ?? null,
      follow_up_date: input.follow_up_date ?? null,
    };
    if (input.sent_date) payload.sent_date = input.sent_date;

    const { data, error } = await sb(ctx).from("quotes").insert(payload).select().single();

    if (error) {
      return {
        content: [{ type: "text", text: `Erro ao criar orçamento: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Orçamento criado para "${data.client_name}" (id: ${data.id}, valor estimado: R$ ${Number(
            data.estimated_value ?? 0,
          ).toFixed(2)}, status: ${data.status}).`,
        },
      ],
      structuredContent: { quote: data },
    };
  },
});
