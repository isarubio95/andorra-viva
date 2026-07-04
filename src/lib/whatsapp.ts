/** Número internacional sin símbolos, apto para wa.me (p. ej. +376 800 000 → 376800000). */
export function normalizeWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppUrl(phone: string, message?: string): string | null {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return null;

  const base = `https://wa.me/${digits}`;
  const text = message?.trim();
  if (!text) return base;

  return `${base}?text=${encodeURIComponent(text)}`;
}
