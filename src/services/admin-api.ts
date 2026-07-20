import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/contexts/AuthContext';
import { mergeCategories } from '@/constants/businessCategories';
import type { CategoryThemesConfig } from '@/constants/categoryDisplay';
import type { SubcategoryConfig } from '@/constants/businessSubcategories';
import { DEFAULT_SUBCATEGORY_LABELS } from '@/constants/subcategory-display';
import type { SiteTextKey } from '@/constants/site-content-defaults';
import type { LegalPageDocument, LegalPageKey } from '@/constants/legal-pages-defaults';
import { DEFAULT_MAP_THEME, resolveMapTheme, writeCachedMapTheme, type MapThemeId } from '@/constants/map-themes';
import type { Business } from '@/types/domain';
import type { NewsPost, Plan, Review } from '@/types/domain';
import { normalizeBusinessRow, normalizePlanRow } from '@/services/api';

export interface AdminUserRow {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: UserRole;
  plan_id: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export interface AdminDashboardStats {
  users_total: number;
  businesses_total: number;
  reviews_total: number;
  active_subscriptions: number;
  revenue_events_month: number;
}

export interface PaymentEventRow {
  id: string;
  user_id: string | null;
  stripe_event_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  event_type: string;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
}

export async function adminGetDashboardStats(): Promise<AdminDashboardStats | null> {
  const { data, error } = await supabase.rpc('admin_get_dashboard_stats');
  if (error) {
    console.error('[admin] dashboard stats:', error.message);
    return null;
  }
  return data as AdminDashboardStats;
}

export async function adminListUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) {
    console.error('[admin] list users:', error.message);
    return [];
  }
  return (data ?? []) as AdminUserRow[];
}

export async function adminUpdateUserRole(
  userId: string,
  role: UserRole,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_update_user_role', {
    target_user_id: userId,
    new_role: role,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminUpdateSubscription(
  userId: string,
  planId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_update_subscription', {
    target_user_id: userId,
    new_plan_id: planId,
    new_status: status,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchSiteSettings(): Promise<{
  texts: Partial<Record<SiteTextKey, string>>;
  categories: string[];
  categoryLabels: Partial<Record<string, string>>;
  categoryThemes: CategoryThemesConfig;
  subcategories: Partial<SubcategoryConfig>;
  subcategoryLabels: Partial<Record<string, string>>;
  subcategoryIcons: Partial<Record<string, string>>;
  legalPages: Partial<Record<LegalPageKey, Partial<LegalPageDocument>>>;
  mapTheme: MapThemeId;
}> {
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error) {
    console.error('[admin] site settings:', error.message);
    return {
      texts: {},
      categories: mergeCategories(),
      categoryLabels: {},
      categoryThemes: {},
      subcategories: {},
      subcategoryLabels: {},
      subcategoryIcons: {},
      legalPages: {},
      mapTheme: DEFAULT_MAP_THEME,
    };
  }

  const texts: Partial<Record<SiteTextKey, string>> = {};
  let categoriesRaw: unknown;
  const categoryLabels: Partial<Record<string, string>> = {};
  const categoryThemes: CategoryThemesConfig = {};
  const subcategories: Partial<SubcategoryConfig> = {};
  const subcategoryLabels: Partial<Record<string, string>> = {};
  const subcategoryIcons: Partial<Record<string, string>> = {};
  const legalPages: Partial<Record<LegalPageKey, Partial<LegalPageDocument>>> = {};
  let mapTheme: MapThemeId = DEFAULT_MAP_THEME;

  for (const row of data ?? []) {
    if (row.key === 'texts' && row.value && typeof row.value === 'object') {
      Object.assign(texts, row.value);
    }
    if (row.key === 'categories') {
      categoriesRaw = row.value;
    }
    if (row.key === 'category_labels' && row.value && typeof row.value === 'object') {
      Object.assign(categoryLabels, row.value);
    }
    if (row.key === 'category_themes' && row.value && typeof row.value === 'object' && !Array.isArray(row.value)) {
      Object.assign(categoryThemes, row.value as CategoryThemesConfig);
    }
    if (row.key === 'subcategories' && row.value && typeof row.value === 'object') {
      Object.assign(subcategories, row.value);
    }
    if (row.key === 'subcategory_labels' && row.value && typeof row.value === 'object') {
      Object.assign(subcategoryLabels, row.value);
    }
    if (row.key === 'subcategory_icons' && row.value && typeof row.value === 'object') {
      Object.assign(subcategoryIcons, row.value);
    }
    if (row.key === 'legal_pages' && row.value && typeof row.value === 'object') {
      Object.assign(legalPages, row.value);
    }
    if (row.key === 'map_theme') {
      mapTheme = resolveMapTheme(row.value);
    }
  }

  return {
    texts,
    categories: mergeCategories(categoriesRaw),
    categoryLabels,
    categoryThemes,
    subcategories,
    subcategoryLabels,
    subcategoryIcons,
    legalPages,
    mapTheme,
  };
}

export async function saveSiteTexts(
  texts: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'texts',
    value: texts,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveCategories(
  categories: string[],
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'categories',
    value: categories,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveCategoryLabels(
  labels: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'category_labels',
    value: labels,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveCategoryThemes(
  themes: CategoryThemesConfig,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'category_themes',
    value: themes,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveCategoryConfig(
  categories: string[],
  labels: Record<string, string>,
  themes: CategoryThemesConfig,
): Promise<{ ok: boolean; error?: string }> {
  const catRes = await saveCategories(categories);
  if (!catRes.ok) return catRes;
  const labelRes = await saveCategoryLabels(labels);
  if (!labelRes.ok) return labelRes;
  return saveCategoryThemes(themes);
}

export async function saveSubcategories(
  subcategories: SubcategoryConfig,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'subcategories',
    value: subcategories,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveSubcategoryLabels(
  labels: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'subcategory_labels',
    value: labels,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveSubcategoryIcons(
  icons: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'subcategory_icons',
    value: icons,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveSubcategoryConfig(
  subcategories: SubcategoryConfig,
  labels: Record<string, string>,
  icons: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const subRes = await saveSubcategories(subcategories);
  if (!subRes.ok) return subRes;
  const labelRes = await saveSubcategoryLabels(labels);
  if (!labelRes.ok) return labelRes;
  return saveSubcategoryIcons(icons);
}

/** Etiquetas por defecto exportadas para el admin. */
export { DEFAULT_SUBCATEGORY_LABELS };

export async function saveMapTheme(
  themeId: MapThemeId,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'map_theme',
    value: themeId,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  writeCachedMapTheme(themeId);
  return { ok: true };
}

export async function saveLegalPages(
  pages: Record<LegalPageKey, LegalPageDocument>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'legal_pages',
    value: pages,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminListBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin] businesses:', error.message);
    return [];
  }
  return (data ?? []).map(row => normalizeBusinessRow(row));
}

export async function adminUpdateBusiness(
  businessId: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('businesses').update(payload).eq('id', businessId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminDeleteBusiness(
  businessId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('businesses').delete().eq('id', businessId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminListPaymentEvents(limit = 50): Promise<PaymentEventRow[]> {
  const { data, error } = await supabase
    .from('payment_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[admin] payment events:', error.message);
    return [];
  }
  return (data ?? []) as PaymentEventRow[];
}

export interface AdminReviewRow extends Review {
  business_name: string;
}

export async function adminListReviews(limit = 100): Promise<AdminReviewRow[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, businesses(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[admin] reviews:', error.message);
    return [];
  }

  return (data ?? []).map(row => {
    const r = row as Review & { businesses?: { name?: string } | null };
    return {
      id: r.id,
      business_id: r.business_id,
      user_id: r.user_id,
      user_name: r.user_name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      business_name: r.businesses?.name ?? '—',
    };
  });
}

export async function adminDeleteReview(
  reviewId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_delete_review', { p_review_id: reviewId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type AdminNewsPostRow = NewsPost;

export async function adminListNewsPosts(limit = 100): Promise<AdminNewsPostRow[]> {
  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[admin] news posts:', error.message);
    return [];
  }

  return (data ?? []).map(row => {
    const r = row as NewsPost & { image_url?: string | null };
    return {
      id: r.id,
      author_id: r.author_id,
      business_id: r.business_id,
      author_name: r.author_name,
      business_name: r.business_name,
      title: r.title,
      body: r.body,
      image_url: r.image_url ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });
}

export async function adminDeleteNewsPost(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_delete_news_post', { p_post_id: postId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminListAllPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
  if (error) {
    console.error('[admin] plans:', error.message);
    return [];
  }
  return (data ?? []).map(normalizePlanRow);
}

export async function adminUpdatePlan(
  planId: string,
  payload: {
    name: string;
    price: number;
    features: string[];
    is_popular: boolean;
    trial_months: number;
    promo_label: string | null;
  },
): Promise<{ ok: boolean; error?: string; stripe_synced?: boolean }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { ok: false, error: 'Sesión no válida' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return { ok: false, error: 'Supabase no configurado' };

  const paidPlanIds = new Set(['basic', 'pro', 'premium']);
  const shouldSyncStripe = paidPlanIds.has(planId) && payload.price > 0;

  if (shouldSyncStripe) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-plan-stripe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          name: payload.name,
          price: payload.price,
          features: payload.features,
          is_popular: payload.is_popular,
          trial_months: Math.max(0, Math.floor(payload.trial_months)),
          promo_label: payload.promo_label,
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        stripe_synced?: boolean;
      };
      if (!res.ok) return { ok: false, error: body.error ?? 'Error al sincronizar con Stripe' };
      return { ok: true, stripe_synced: !!body.stripe_synced };
    } catch {
      return { ok: false, error: 'No se pudo sincronizar el plan con Stripe' };
    }
  }

  const { error } = await supabase
    .from('plans')
    .update({
      name: payload.name,
      price: payload.price,
      features: payload.features,
      is_popular: payload.is_popular,
      trial_months: Math.max(0, Math.floor(payload.trial_months)),
      promo_label: payload.promo_label?.trim() || null,
      stripe_price_id: null,
    })
    .eq('id', planId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createStripeCheckoutSession(
  planId: string,
): Promise<{ url?: string; updated?: boolean; planId?: string; error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { error: 'Sesión no válida' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return { error: 'Supabase no configurado' };

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, returnOrigin: window.location.origin }),
    });

    const body = (await res.json()) as {
      url?: string;
      updated?: boolean;
      planId?: string;
      error?: string;
    };
    if (!res.ok) return { error: body.error ?? 'Error al crear sesión de pago' };
    return { url: body.url, updated: body.updated, planId: body.planId };
  } catch {
    return { error: 'No se pudo conectar con Stripe. ¿Está desplegada la Edge Function?' };
  }
}
