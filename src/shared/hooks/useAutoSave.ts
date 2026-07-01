import { useEffect, useRef, useState } from "react";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void> | void;
  /** Delay em ms (default: 15000). */
  delay?: number;
  /** Só dispara se true (ex.: `dirty`). */
  enabled?: boolean;
}

/**
 * Auto-save com debounce. Retorna `{ saving, savedAt }` para exibir status na UI.
 * Preserva o comportamento existente do projeto (15s p/ orçamentos, 30s p/ outros forms).
 */
export function useAutoSave<T>({ data, onSave, delay = 15000, enabled = true }: UseAutoSaveOptions<T>) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        await onSave(data);
        setSavedAt(new Date());
      } finally {
        setSaving(false);
      }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, delay]);

  return { saving, savedAt };
}
