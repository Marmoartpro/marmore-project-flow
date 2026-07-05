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
  name: "create_client",
  title: "Criar cliente",
  description: "Cadastra um novo cliente para o usuário autenticado.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Nome completo do cliente."),
    email: z.string().email().optional(),
    phone: z.string().optional().describe("Telefone (com DDD)."),
    address: z.string().optional(),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const { data, error } = await sb(ctx)
      .from("clients")
      .insert({ ...input, user_id: ctx.getUserId() })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Cliente criado: ${data.name} (${data.id})` }],
      structuredContent: { client: data },
    };
  },
});
