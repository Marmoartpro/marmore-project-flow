import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjects from "./tools/list-projects";
import listClients from "./tools/list-clients";
import listQuotes from "./tools/list-quotes";
import listStones from "./tools/list-stones";
import createClientTool from "./tools/create-client";
import createQuote from "./tools/create-quote";

// Import-safe: no env reads, no I/O, no throws at module top level.
// Use VITE_SUPABASE_PROJECT_ID (inlined at build time by Vite) to build the
// direct supabase.co issuer required by RFC 8414 discovery.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "marmoreproart-mcp",
  title: "MármoreProart",
  version: "0.1.0",
  instructions:
    "Ferramentas do MármoreProart (gestão de marmoraria). Use list_projects, list_clients, list_quotes e list_stones para consultar dados do usuário logado. Use create_client para cadastrar novos clientes e create_quote para criar novos orçamentos. Todos os dados respeitam as permissões do usuário (RLS).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProjects, listClients, listQuotes, listStones, createClientTool, createQuote],
});
