import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/contexts/AuthContext';
import type { BusinessCategory } from '@/constants/businessCategories';
import type { SubcategoryConfig } from '@/constants/businessSubcategories';
import { DEFAULT_SUBCATEGORY_LABELS } from '@/constants/subcategory-display';
import type { SiteTextKey } from '@/constants/site-content-defaults';
import type { LegalPageDocument, LegalPageKey } from '@/constants/legal-pages-defaults';
import type { Business } from '@/types/domain';
import type { Plan, Review } from '@/types/domain';
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
  categoryLabels: Partial<Record<BusinessCategory, string>>;
  subcategories: Partial<SubcategoryConfig>;
  subcategoryLabels: Partial<Record<string, string>>;
  subcategoryIcons: Partial<Record<string, string>>;
  legalPages: Partial<Record<LegalPageKey, Partial<LegalPageDocument>>>;
}> {
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error) {
    console.error('[admin] site settings:', error.message);
    return {
      texts: {},
      categoryLabels: {},
      subcategories: {},
      subcategoryLabels: {},
      subcategoryIcons: {},
      legalPages: {},
    };
  }

  const texts: Partial<Record<SiteTextKey, string>> = {};
  const categoryLabels: Partial<Record<BusinessCategory, string>> = {};
  const subcategories: Partial<SubcategoryConfig> = {};
  const subcategoryLabels: Partial<Record<string, string>> = {};
  const subcategoryIcons: Partial<Record<string, string>> = {};
  const legalPages: Partial<Record<LegalPageKey, Partial<LegalPageDocument>>> = {};

  for (const row of data ?? []) {
    if (row.key === 'texts' && row.value && typeof row.value === 'object') {
      Object.assign(texts, row.value);
    }
    if (row.key === 'category_labels' && row.value && typeof row.value === 'object') {
      Object.assign(categoryLabels, row.value);
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
  }

  return { texts, categoryLabels, subcategories, subcategoryLabels, subcategoryIcons, legalPages };
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
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('plans')
    .update({
      name: payload.name,
      price: payload.price,
      features: payload.features,
      is_popular: payload.is_popular,
      trial_months: Math.max(0, Math.floor(payload.trial_months)),
      promo_label: payload.promo_label?.trim() || null,
    })
    .eq('id', planId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createStripeCheckoutSession(
  planId: string,
): Promise<{ url?: string; error?: string }> {
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
      body: JSON.stringify({ planId }),
    });

    const body = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) return { error: body.error ?? 'Error al crear sesión de pago' };
    return { url: body.url };
  } catch {
    return { error: 'No se pudo conectar con Stripe. ¿Está desplegada la Edge Function?' };
  }
}
