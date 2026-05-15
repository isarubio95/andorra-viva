const PRODUCTION_SITE_URL = 'https://andorra-viva.vercel.app';

export function getPublicSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  const raw = fromEnv && fromEnv.trim().length > 0 ? fromEnv.trim() : PRODUCTION_SITE_URL;
  return raw.replace(/\/+$/, '');
}

export function buildPublicUrl(path: string): string {
  const base = getPublicSiteUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
