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
  name: "list_quotes",
  title: "Listar orçamentos",
  description: "Lista os orçamentos do usuário autenticado (mais recentes primeiro).",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20),
    client_id: z.string().uuid().optional().describe("Filtrar por cliente."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, client_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    let q = sb(ctx).from("quotes").select("*").order("created_at", { ascending: false }).limit(limit);
    if (client_id) q = q.eq("client_id", client_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { quotes: data },
    };
  },
});
