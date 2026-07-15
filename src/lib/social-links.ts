export type SocialNetwork = 'instagram' | 'facebook' | 'x';

export interface BusinessSocialUrls {
  instagram_url?: string | null;
  facebook_url?: string | null;
  x_url?: string | null;
}

export interface SocialLinkItem {
  network: SocialNetwork;
  label: string;
  url: string;
  accountName: string;
}

function stripAtHandle(value: string): string {
  return value.trim().replace(/^@+/, '');
}

function ensureHttps(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function normalizeInstagramUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) {
    return ensureHttps(trimmed);
  }

  const handle = stripAtHandle(trimmed).replace(/[^a-zA-Z0-9._]/g, '');
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

export function normalizeFacebookUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed) || /facebook\.com/i.test(trimmed)) {
    return ensureHttps(trimmed.replace(/^www\./i, ''));
  }

  const slug = stripAtHandle(trimmed).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!slug) return null;
  return `https://facebook.com/${slug}`;
}

export function normalizeXUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed) || /(x\.com|twitter\.com)/i.test(trimmed)) {
    return ensureHttps(trimmed.replace(/^www\./i, ''));
  }

  const handle = stripAtHandle(trimmed).replace(/[^a-zA-Z0-9_]/g, '');
  if (!handle) return null;
  return `https://x.com/${handle}`;
}

export function normalizeSocialUrls(urls: BusinessSocialUrls): BusinessSocialUrls {
  return {
    instagram_url: urls.instagram_url ? normalizeInstagramUrl(urls.instagram_url) : null,
    facebook_url: urls.facebook_url ? normalizeFacebookUrl(urls.facebook_url) : null,
    x_url: urls.x_url ? normalizeXUrl(urls.x_url) : null,
  };
}

export function extractSocialAccountName(network: SocialNetwork, url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (!/^https?:\/\//i.test(trimmed)) {
    const handle = stripAtHandle(trimmed);
    if (handle) {
      return network === 'facebook' ? handle : `@${handle}`;
    }
  }

  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (network === 'instagram' || network === 'x') {
      const handle = segments[0];
      return handle ? `@${handle}` : trimmed;
    }

    if (network === 'facebook') {
      if (segments[0] === 'profile.php') return 'Facebook';
      const slug = segments[segments.length - 1];
      return slug ?? 'Facebook';
    }
  } catch {
    const handle = stripAtHandle(trimmed);
    if (handle) return network === 'facebook' ? handle : `@${handle}`;
  }

  return trimmed;
}

export function buildSocialLinkList(urls: BusinessSocialUrls): SocialLinkItem[] {
  const links: SocialLinkItem[] = [];

  if (urls.instagram_url?.trim()) {
    const url = normalizeInstagramUrl(urls.instagram_url) ?? urls.instagram_url.trim();
    links.push({
      network: 'instagram',
      label: 'Instagram',
      url,
      accountName: extractSocialAccountName('instagram', urls.instagram_url),
    });
  }
  if (urls.facebook_url?.trim()) {
    const url = normalizeFacebookUrl(urls.facebook_url) ?? urls.facebook_url.trim();
    links.push({
      network: 'facebook',
      label: 'Facebook',
      url,
      accountName: extractSocialAccountName('facebook', urls.facebook_url),
    });
  }
  if (urls.x_url?.trim()) {
    const url = normalizeXUrl(urls.x_url) ?? urls.x_url.trim();
    links.push({
      network: 'x',
      label: 'X',
      url,
      accountName: extractSocialAccountName('x', urls.x_url),
    });
  }

  return links;
}

export function hasSocialLinks(urls: BusinessSocialUrls): boolean {
  return buildSocialLinkList(urls).length > 0;
}
