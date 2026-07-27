/** Identificadores de páginas públicas con fondo editable. */
export const PAGE_BACKGROUND_IDS = [
  'home',
  'directory',
  'news',
  'login',
  'signup',
  'account',
  'favorites',
  'register_business',
  'legal',
] as const;

export type PageBackgroundId = (typeof PAGE_BACKGROUND_IDS)[number];

export type PageBackground =
  | { mode: 'default' }
  | { mode: 'color'; color: string }
  | { mode: 'image'; imageUrl: string; imageSrcSet?: string };

export type PageBackgroundsConfig = Partial<Record<PageBackgroundId, PageBackground>>;

export type PageBackgroundMode = PageBackground['mode'];

export const PAGE_BACKGROUND_LABELS: Record<PageBackgroundId, string> = {
  home: 'Inicio',
  directory: 'Directorio',
  news: 'Noticias',
  login: 'Iniciar sesión',
  signup: 'Registro',
  account: 'Mi cuenta',
  favorites: 'Favoritos',
  register_business: 'Registrar negocio',
  legal: 'Páginas legales',
};

export const DEFAULT_PAGE_BACKGROUND: PageBackground = { mode: 'default' };

/** Ruta pública representativa para previsualizar cada fondo. */
export const PAGE_BACKGROUND_PREVIEW_PATHS: Record<PageBackgroundId, string> = {
  home: '/',
  directory: '/directorio',
  news: '/noticias',
  login: '/login',
  signup: '/signup',
  account: '/mi-cuenta',
  favorites: '/favoritos',
  register_business: '/registrar-negocio',
  legal: '/aviso-legal',
};

const LEGAL_PATHS = new Set([
  '/politica-proteccion-datos',
  '/politica-de-cookies',
  '/aviso-legal',
  '/condiciones-de-uso',
]);

/** Resuelve el id de fondo editable a partir del pathname actual. */
export function resolvePageBackgroundId(pathname: string): PageBackgroundId | null {
  if (pathname.startsWith('/admin')) return null;
  if (pathname === '/') return 'home';
  if (pathname === '/directorio' || pathname.startsWith('/directorio/')) return 'directory';
  if (pathname === '/noticias' || pathname.startsWith('/noticias/')) return 'news';
  if (pathname === '/login') return 'login';
  if (pathname === '/signup') return 'signup';
  if (pathname === '/favoritos') return 'favorites';
  if (pathname === '/registrar-negocio') return 'register_business';
  if (pathname === '/mi-cuenta' || pathname.startsWith('/mi-cuenta/')) return 'account';
  if (LEGAL_PATHS.has(pathname)) return 'legal';
  return null;
}

export function getPageBackground(
  id: PageBackgroundId,
  config: PageBackgroundsConfig,
): PageBackground {
  return config[id] ?? DEFAULT_PAGE_BACKGROUND;
}

/** Normaliza un valor remoto de site_settings a PageBackgroundsConfig. */
export function parsePageBackgrounds(raw: unknown): PageBackgroundsConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const result: PageBackgroundsConfig = {};
  for (const id of PAGE_BACKGROUND_IDS) {
    const entry = (raw as Record<string, unknown>)[id];
    const parsed = parsePageBackground(entry);
    if (parsed) result[id] = parsed;
  }
  return result;
}

export function parsePageBackground(raw: unknown): PageBackground | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const mode = (raw as { mode?: unknown }).mode;
  if (mode === 'default') return { mode: 'default' };
  if (mode === 'color') {
    const color = (raw as { color?: unknown }).color;
    if (typeof color === 'string' && color.trim()) return { mode: 'color', color: color.trim() };
    return null;
  }
  if (mode === 'image') {
    const imageUrl = (raw as { imageUrl?: unknown }).imageUrl;
    if (typeof imageUrl !== 'string' || !imageUrl.trim()) return null;
    const imageSrcSet = (raw as { imageSrcSet?: unknown }).imageSrcSet;
    return {
      mode: 'image',
      imageUrl: imageUrl.trim(),
      ...(typeof imageSrcSet === 'string' && imageSrcSet.trim()
        ? { imageSrcSet: imageSrcSet.trim() }
        : {}),
    };
  }
  return null;
}

export function pageBackgroundsEqual(a: PageBackground, b: PageBackground): boolean {
  if (a.mode !== b.mode) return false;
  if (a.mode === 'default' && b.mode === 'default') return true;
  if (a.mode === 'color' && b.mode === 'color') return a.color === b.color;
  if (a.mode === 'image' && b.mode === 'image') {
    return a.imageUrl === b.imageUrl && (a.imageSrcSet ?? '') === (b.imageSrcSet ?? '');
  }
  return false;
}
