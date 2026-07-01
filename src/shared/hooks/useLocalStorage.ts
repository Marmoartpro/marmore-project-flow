import { useEffect, useState } from "react";

/** localStorage tipado com sincronização de estado. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / private-mode — silencioso */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
