import { lazy, type ComponentType } from "react";

const RELOAD_FLAG = "lovable:chunk-reloaded";

/**
 * Limpa caches do navegador (Cache Storage) para que o index.html e os assets
 * antigos não sejam servidos novamente após o reload.
 */
async function clearCaches(): Promise<void> {
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    /* Cache Storage indisponível — ignorar */
  }
}

/** Recarrega a página com cache-busting para forçar um index.html novo. */
async function hardReload(): Promise<void> {
  await clearCaches();
  const url = new URL(window.location.href);
  url.searchParams.set("_r", Date.now().toString(36));
  window.location.replace(url.toString());
}

/**
 * React.lazy resiliente a falhas de carregamento de chunk.
 *
 * Após um novo deploy, o HTML/bundle antigo em cache aponta para chunks que não
 * existem mais. O import dinâmico falha com "Importing a module script failed"
 * e a tela fica em branco.
 *
 * Estratégia:
 * 1. Retenta o import (falhas transitórias de rede).
 * 2. Se falhar de novo, limpa caches e faz um reload único com cache-busting.
 * 3. Se já recarregou uma vez, propaga o erro para o ErrorBoundary exibir UI.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        window.sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        /* sessionStorage indisponível (modo privado) — ignorar */
      }
      return mod;
    } catch (error) {
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
          void hardReload();
          // Promise pendente: a página está sendo recarregada.
          return new Promise<{ default: T }>(() => {});
        }

        console.error("[lazyWithRetry] falha ao carregar chunk", retryError ?? error);
        throw retryError ?? error;
      }
    }
  });
}
