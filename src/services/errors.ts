import { PostgrestError } from "@supabase/supabase-js";

/**
 * Normaliza erros do Supabase e re-lança com mensagem em PT.
 * Use nos services: `if (error) throw handleSupabaseError(error, "listar pedras")`.
 */
export function handleSupabaseError(error: PostgrestError | Error | null, context: string): Error {
  if (!error) return new Error(`Erro desconhecido ao ${context}`);
  const msg = "message" in error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[Supabase] ${context}:`, error);
  return new Error(`Falha ao ${context}: ${msg}`);
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: Error };
