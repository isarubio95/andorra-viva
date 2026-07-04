import { supabase } from '@/lib/supabase';
import { clearStoredVisitorKey, getStoredVisitorKey } from '@/lib/visitor-key';
import type { Business, NewsMonthlyQuota, NewsPost, Plan, Review } from '@/types/domain';
import { rewriteSupabaseStorageUrl } from '@/lib/business-image';
import { parseOpeningHours } from '@/lib/business-hours';

export interface TopVisitedBusiness extends Business {
  visits_month: number;
}

export interface BusinessMetricRow {
  business_id: string;
  business_name: string;
  visits_month: number;
  visits_total: number;
  reviews_total: number;
  rating_avg: number;
  daily_visits: { date: string; visits: number }[];
}

/** Asegura campos coherentes con la app (p. ej. `is_premium`, arrays). */
export function normalizeBusinessRow(row: unknown): Business {
  const r = row as Business & { is_premium?: boolean; services?: unknown; gallery?: unknown };
  const services = Array.isArray(r.services) ? (r.services as string[]) : [];
  const gallery = Array.isArray(r.gallery)
    ? (r.gallery as string[])
        .map(url => rewriteSupabaseStorageUrl(url))
        .filter((url): url is string => !!url)
    : undefined;
  const imageUrl = rewriteSupabaseStorageUrl(r.image_url) ?? r.image_url;

  return {
    ...r,
    subcategory: r.subcategory != null ? String(r.subcategory) : null,
    rating: Number(r.rating ?? 0),
    review_count: Number(r.review_count ?? 0),
    price_range: Number(r.price_range ?? 2),
    services,
    is_premium: !!r.is_premium,
    image_url: imageUrl,
    gallery,
    opening_hours: parseOpeningHours((r as { opening_hours?: unknown }).opening_hours),
  };
}

export function normalizePlanRow(row: unknown): Plan {
  const r = row as Record<string, unknown>;
  const features = Array.isArray(r.features) ? (r.features as string[]) : [];
  const price = typeof r.price === 'number' ? r.price : Number(r.price ?? 0);
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    price: Number.isFinite(price) ? price : 0,
    currency: String(r.currency ?? '€'),
    interval: String(r.interval ?? 'mes'),
    features,
    is_popular: Boolean(r.is_popular),
  };
}

export async function getBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('is_premium', { ascending: false })
    .order('is_recommended', { ascending: false });

  if (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
  return (data ?? []).map(normalizeBusinessRow);
}

export async function getMyBusinesses(userId: string): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my businesses:', error);
    return [];
  }
  return (data ?? []).map(normalizeBusinessRow);
}

export async function updateMyBusiness(
  businessId: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  if (!businessId) return { ok: false, error: 'Negocio inválido' };

  const { error } = await supabase
    .from('businesses')
    .update(payload)
    .eq('id', businessId);

  if (error) {
    console.error('Error updating business:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteMyBusiness(
  businessId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!businessId) return { ok: false, error: 'Negocio inválido' };

  const { error } = await supabase.from('businesses').delete().eq('id', businessId);

  if (error) {
    console.error('Error deleting business:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching business:', error);
    return null;
  }
  return normalizeBusinessRow(data);
}

export async function getReviewsByBusiness(businessId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
  return (data ?? []) as Review[];
}

export async function getMyReviewForBusiness(businessId: string, userId: string): Promise<Review | null> {
  if (!businessId || !userId) return null;

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching my review:', error);
    return null;
  }
  return data as Review | null;
}

export async function submitBusinessReview(params: {
  businessId: string;
  rating: number;
  comment?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { businessId, rating, comment } = params;
  if (!businessId) return { ok: false, error: 'Negocio inválido' };
  if (rating < 1 || rating > 5) return { ok: false, error: 'La valoración debe estar entre 1 y 5' };

  const { error } = await supabase.rpc('submit_business_review', {
    p_business_id: businessId,
    p_rating: rating,
    p_comment: comment?.trim() || null,
  });

  if (error) {
    console.error('Error submitting review:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
  return (data ?? []).map(normalizePlanRow);
}

/** Pasa de usuario básico a profesional y asigna el plan (RPC `upgrade_to_professional`). */
export async function upgradeToProfessional(planId: string): Promise<{ ok: boolean; error?: string }> {
  if (!planId?.trim()) return { ok: false, error: 'Plan inválido' };

  const { error } = await supabase.rpc('upgrade_to_professional', { p_plan_id: planId.trim() });

  if (error) {
    console.error('[auth] upgrade_to_professional:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Pasa de cuenta profesional a personal (RPC `downgrade_to_personal`). */
export async function downgradeToPersonal(): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('downgrade_to_personal');

  if (error) {
    console.error('[auth] downgrade_to_personal:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Actualiza el plan de la suscripción del usuario autenticado (RPC `set_my_subscription_plan`). */
export async function setMySubscriptionPlan(planId: string): Promise<{ ok: boolean; error?: string }> {
  if (!planId?.trim()) return { ok: false, error: 'Plan inválido' };

  const { error } = await supabase.rpc('set_my_subscription_plan', { p_plan_id: planId.trim() });

  if (error) {
    console.error('[plans] set_my_subscription_plan:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

function currentMonthKey(): string {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return monthStart.toISOString().slice(0, 10);
}

export async function trackBusinessVisit(businessId: string, visitorKey: string): Promise<void> {
  if (!businessId) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const anonKeyOk = visitorKey.length >= 8;
  if (!session && !anonKeyOk) return;

  const { error } = await supabase.rpc('track_business_visit', {
    p_business_id: businessId,
    p_visitor_key: anonKeyOk ? visitorKey : '________',
    p_visit_month: currentMonthKey(),
  });

  if (error) {
    console.error('Error tracking business visit:', error);
  }
}

/** Tras login: une visitas anónimas (localStorage) a la cuenta y limpia la clave. */
export async function mergeAnonymousVisitsForUser(userId: string): Promise<void> {
  const anonKey = getStoredVisitorKey();
  if (!anonKey || anonKey === userId) return;

  const { error } = await supabase.rpc('merge_anonymous_business_visits', {
    p_visitor_key: anonKey,
  });

  if (error) {
    console.warn('[visits] merge anónimas:', error.message);
    return;
  }
  clearStoredVisitorKey();
}

export async function getTopVisitedBusinessesOfMonth(limit = 6): Promise<TopVisitedBusiness[]> {
  const { data: ranking, error: rankingError } = await supabase
    .rpc('get_top_visited_businesses_month', { _limit: limit });

  if (rankingError) {
    console.error('Error fetching top visited ranking:', rankingError);
    return [];
  }

  const rows = (ranking ?? []) as { business_id: string; visits_month: number }[];
  if (rows.length === 0) return [];

  const ids = rows.map(r => r.business_id);
  const { data: businesses, error: businessesError } = await supabase
    .from('businesses')
    .select('*')
    .in('id', ids);

  if (businessesError) {
    console.error('Error fetching top visited businesses:', businessesError);
    return [];
  }

  const byId = new Map(
    (businesses ?? []).map(raw => {
      const b = normalizeBusinessRow(raw);
      return [b.id, b] as const;
    })
  );
  return rows
    .map(r => {
      const business = byId.get(r.business_id);
      if (!business) return null;
      return { ...business, visits_month: Number(r.visits_month ?? 0) };
    })
    .filter((x): x is TopVisitedBusiness => x !== null);
}

export async function getMyBusinessMetrics(days = 30): Promise<BusinessMetricRow[]> {
  const { data, error } = await supabase.rpc('get_my_business_metrics', { _days: days });
  if (error) {
    console.error('Error fetching my business metrics:', error);
    return [];
  }

  type RpcRow = {
    business_id: string;
    business_name: string;
    visits_month: unknown;
    visits_total: unknown;
    reviews_total: unknown;
    rating_avg: unknown;
    daily_visits: unknown;
  };
  type DailyPoint = { date?: unknown; visits?: unknown };

  return ((data ?? []) as RpcRow[]).map(row => ({
    business_id: row.business_id,
    business_name: row.business_name,
    visits_month: Number(row.visits_month ?? 0),
    visits_total: Number(row.visits_total ?? 0),
    reviews_total: Number(row.reviews_total ?? 0),
    rating_avg: Number(row.rating_avg ?? 0),
    daily_visits: Array.isArray(row.daily_visits)
      ? (row.daily_visits as DailyPoint[]).map(p => ({
          date: String(p.date ?? ''),
          visits: Number(p.visits ?? 0),
        }))
      : [],
  }));
}

function normalizeNewsPostRow(row: unknown): NewsPost {
  const r = row as NewsPost & { image_url?: string | null };
  return {
    ...r,
    business_id: r.business_id ?? null,
    business_name: r.business_name ?? null,
    image_url: rewriteSupabaseStorageUrl(r.image_url) ?? r.image_url ?? null,
  };
}

function monthDateRangeUtc(year: number, month: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function getNewsPosts(filters?: {
  year?: number;
  month?: number;
}): Promise<NewsPost[]> {
  let query = supabase.from('news_posts').select('*').order('created_at', { ascending: false });

  if (filters?.year && filters?.month) {
    const { from, to } = monthDateRangeUtc(filters.year, filters.month);
    query = query.gte('created_at', from).lt('created_at', to);
  } else if (filters?.year) {
    const from = new Date(Date.UTC(filters.year, 0, 1)).toISOString();
    const to = new Date(Date.UTC(filters.year + 1, 0, 1)).toISOString();
    query = query.gte('created_at', from).lt('created_at', to);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching news posts:', error);
    return [];
  }
  return (data ?? []).map(normalizeNewsPostRow);
}

export async function getMyNewsPosts(): Promise<NewsPost[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my news posts:', error);
    return [];
  }
  return (data ?? []).map(normalizeNewsPostRow);
}

export async function getMyNewsMonthlyQuota(): Promise<NewsMonthlyQuota | null> {
  const { data, error } = await supabase.rpc('get_my_news_monthly_quota');
  if (error) {
    console.error('Error fetching news quota:', error);
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  return {
    can_publish: Boolean(d.can_publish),
    posted_this_month: Boolean(d.posted_this_month),
    remaining_this_month: Number(d.remaining_this_month ?? 0),
    month_start: String(d.month_start ?? ''),
    month_end: String(d.month_end ?? ''),
  };
}

export async function submitNewsPost(params: {
  title: string;
  body: string;
  imageUrl?: string | null;
}): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const title = params.title.trim();
  const body = params.body.trim();
  if (!title) return { ok: false, error: 'El título es obligatorio' };
  if (!body) return { ok: false, error: 'El contenido es obligatorio' };

  const { data, error } = await supabase.rpc('submit_news_post', {
    p_title: title,
    p_body: body,
    p_image_url: params.imageUrl?.trim() || null,
  });

  if (error) {
    console.error('Error submitting news post:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true, postId: typeof data === 'string' ? data : undefined };
}

export async function deleteMyNewsPost(postId: string): Promise<{ ok: boolean; error?: string }> {
  if (!postId) return { ok: false, error: 'Noticia inválida' };

  const { error } = await supabase.rpc('delete_my_news_post', { p_post_id: postId });
  if (error) {
    console.error('Error deleting news post:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function uploadNewsImage(userId: string, file: File): Promise<{ url?: string; error?: string }> {
  if (!userId) return { error: 'Usuario no autenticado' };
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/news-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('business-images').upload(path, file);
  if (error) {
    console.error('Error uploading news image:', error);
    return { error: error.message };
  }
  const { data } = supabase.storage.from('business-images').getPublicUrl(path);
  return { url: data.publicUrl };
}
