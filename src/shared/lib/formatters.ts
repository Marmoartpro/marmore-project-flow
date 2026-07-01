/** Formatação BRL. */
export const formatBRL = (v: number, opts?: { withSymbol?: boolean; digits?: number }) => {
  const digits = opts?.digits ?? 2;
  const s = v.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return opts?.withSymbol === false ? s : `R$ ${s}`;
};

export const formatNumber = (v: number, digits = 2) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Data em pt-BR curta (dd/mm/aaaa). */
export const formatDate = (d: Date | string | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR");
};

/** Data + hora em pt-BR (dd/mm/aaaa HH:mm). */
export const formatDateTime = (d: Date | string | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

/** Máscara de telefone BR ((11) 91234-5678). */
export const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return raw;
};

/** Máscara CPF/CNPJ. */
export const formatDoc = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return raw;
};
