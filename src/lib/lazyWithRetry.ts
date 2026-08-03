import { lazy, type ComponentType } from "react";

const RELOAD_FLAG = "lovable:chunk-reloaded";

/**
 * React.lazy com resiliência a falhas de carregamento de chunk.
 *
 * Motivo: após um novo deploy, o HTML/bundle antigo em cache aponta para chunks
 * que não existem mais no servidor. O import dinâmico falha com
 * "Importing a module script failed" e a tela fica em branco.
 *
 * Estratégia:
 * 1. Tenta o import novamente uma vez (cobre falhas transitórias de rede).
 * 2. Se falhar de novo, força um reload único da página (busca o index.html novo).
 *    Uma flag em sessionStorage evita loop infinito de reload.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // Import bem-sucedido: limpa a flag para permitir recuperação futura.
      try {
        window.sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        /* sessionStorage indisponível (modo privado) — ignorar */
      }
      return mod;
    } catch (error) {
      // Segunda tentativa: falhas de rede transitórias costumam passar aqui.
      try {
        return await factory();
      } catch (retryError) {
        let alreadyReloaded = false;
        try {
          alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG) === "1";
          if (!alreadyReloaded) window.sessionStorage.setItem(RELOAD_FLAG, "1");
        } catch {
          /* ignorar */
        }

        if (!alreadyReloaded) {
          window.location.reload();
          // Promise pendente: a página está sendo recarregada.
          return new Promise<{ default: T }>(() => {});
        }

        console.error("[lazyWithRetry] falha ao carregar chunk", retryError ?? error);
        throw retryError;
      }
    }
  });
}
