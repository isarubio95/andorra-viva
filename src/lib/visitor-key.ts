/** Clave anónima de visitas (misma que ReviewsPanel / tracking). */
export const VISITOR_STORAGE_KEY = 'andorra-viva-visitor-key';

export function getStoredVisitorKey(): string | null {
  try {
    const v = localStorage.getItem(VISITOR_STORAGE_KEY);
    return v && v.length >= 8 ? v : null;
  } catch {
    return null;
  }
}

export function clearStoredVisitorKey(): void {
  try {
    localStorage.removeItem(VISITOR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** UUID o cadena larga en localStorage; crea y persiste si hace falta. */
export function getOrCreateVisitorKey(): string {
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `visitor-fallback-${Date.now()}`;
  }
}
