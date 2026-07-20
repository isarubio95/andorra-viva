import { supabase } from '@/lib/supabase';
import { clearStoredVisitorKey, getStoredVisitorKey } from '@/lib/visitor-key';
import type { Business, BusinessLocation, NewsMonthlyQuota, NewsPost, Plan, Review } from '@/types/domain';
import { rewriteSupabaseStorageUrl } from '@/lib/business-image';
import { uploadBusinessImage } from '@/lib/object-storage';
import { parseOpeningHours } from '@/lib/business-hours';

export interface TopVisitedBusiness extends Business {
  visits_month: number;
}

export type BusinessClickType = 'whatsapp' | 'phone' | 'directions' | 'website';

export interface ClickTypeMetric {
  click_type: BusinessClickType;
  count: number;
  count_total: number;
}

export interface StarDistribution {
  stars: number;
  count: number;
}

export interface BusinessMetricRow {
  business_id: string;
  business_name: string;
  visits_period: number;
  visits_total: number;
  reviews_total: number;
  reviews_period: number;
  rating_avg: number;
  rating_avg_period: number;
  rating_distribution: StarDistribution[];
  daily_visits: { date: string; visits: number }[];
  daily_reviews: { date: string; reviews: number }[];
  clicks_period: number;
  clicks_total: number;
  clicks_by_type: ClickTypeMetric[];
  daily_clicks: { date: string; clicks: number }[];
}

export type SecondaryBusinessLocationInput = {
  label?: string | null;
  location: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

function normalizeBusinessLocationRow(row: unknown): BusinessLocation | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const id = r.id != null ? String(r.id) : '';
  const businessId = r.business_id != null ? String(r.business_id) : '';
  const location = r.location != null ? String(r.location) : '';
  const latitude = Number(r.latitude);
  const longitude = Number(r.longitude);
  if (!id || !businessId || !location || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return {
    id,
    business_id: businessId,
    label: r.label != null && String(r.label).trim() !== '' ? String(r.label).trim() : null,
    location,
    address: r.address != null && String(r.address).trim() !== '' ? String(r.address) : null,
    latitude,
    longitude,
    is_primary: Boolean(r.is_primary),
    sort_order: Number(r.sort_order ?? 0),
  };
}

function extractLocations(row: Record<string, unknown>): BusinessLocation[] | undefined {
  const raw = row.locations ?? row.business_locations;
  if (!Array.isArray(raw)) return undefined;
  const locations = raw
    .map(normalizeBusinessLocationRow)
    .filter((loc): loc is BusinessLocation => loc != null)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    });
  return locations;
}

/** Ubicaciones a mostrar (API o fallback a la primaria del negocio). */
export function getBusinessDisplayLocations(business: Business): BusinessLocation[] {
  if (business.locations && business.locations.length > 0) {
    return business.locations;
  }
  return [
    {
      id: `${business.id}-primary`,
      business_id: business.id,
      label: 'Principal',
      location: business.location,
      address: business.address ?? null,
      latitude: business.latitude,
      longitude: business.longitude,
      is_primary: true,
      sort_order: 0,
    },
  ];
}

const BUSINESS_SELECT_WITH_LOCATIONS = '*, locations:business_locations(*)';

/** Asegura campos coherentes con la app (p. ej. `is_premium`, arrays). */
export function normalizeBusinessRow(row: unknown): Business {
  const r = row as Business & {
    is_premium?: boolean;
    services?: unknown;
    gallery?: unknown;
    locations?: unknown;
    business_locations?: unknown;
  };
  const services = Array.isArray(r.services) ? (r.services as string[]) : [];
  const gallery = Array.isArray(r.gallery)
    ? (r.gallery as string[])
        .map(url => rewriteSupabaseStorageUrl(url))
        .filter((url): url is string => !!url)
    : undefined;
  const imageUrl = rewriteSupabaseStorageUrl(r.image_url) ?? r.image_url;
  const locations = extractLocations(r as unknown as Record<string, unknown>);

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
    locations,
    opening_hours: parseOpeningHours((r as { opening_hours?: unknown }).opening_hours),
  };
}

export function normalizePlanRow(row: unknown): Plan {
  const r = row as Record<string, unknown>;
  const features = Array.isArray(r.features) ? (r.features as string[]) : [];
  const price = typeof r.price === 'number' ? r.price : Number(r.price ?? 0);
  const trialMonths =
    typeof r.trial_months === 'number' ? r.trial_months : Number(r.trial_months ?? 0);

  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    price: Number.isFinite(price) ? price : 0,
    currency: String(r.currency ?? '€'),
    interval: String(r.interval ?? 'mes'),
    features,
    is_popular: Boolean(r.is_popular),
    trial_months: Number.isFinite(trialMonths) && trialMonths > 0 ? Math.floor(trialMonths) : 0,
    promo_label: r.promo_label != null && String(r.promo_label).trim() !== ''
      ? String(r.promo_label).trim()
      : null,
  };
}

export async function getBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select(BUSINESS_SELECT_WITH_LOCATIONS)
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
    .select(BUSINESS_SELECT_WITH_LOCATIONS)
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
    .select(BUSINESS_SELECT_WITH_LOCATIONS)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching business:', error);
    return null;
  }
  return normalizeBusinessRow(data);
}

export async function getBusinessLocations(businessId: string): Promise<BusinessLocation[]> {
  if (!businessId) return [];

  const { data, error } = await supabase
    .from('business_locations')
    .select('*')
    .eq('business_id', businessId)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching business locations:', error);
    return [];
  }
  return (data ?? [])
    .map(normalizeBusinessLocationRow)
    .filter((loc): loc is BusinessLocation => loc != null);
}

export async function upsertSecondaryBusinessLocation(
  businessId: string,
  input: SecondaryBusinessLocationInput,
  existingId?: string | null,
): Promise<{ ok: boolean; location?: BusinessLocation; error?: string }> {
  if (!businessId) return { ok: false, error: 'Negocio inválido' };

  const payload = {
    business_id: businessId,
    label: input.label?.trim() || 'Sucursal',
    location: input.location,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    is_primary: false,
    sort_order: 1,
  };

  if (existingId) {
    const { data, error } = await supabase
      .from('business_locations')
      .update(payload)
      .eq('id', existingId)
      .eq('business_id', businessId)
      .eq('is_primary', false)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error updating secondary location:', error);
      return { ok: false, error: error.message };
    }
    const location = normalizeBusinessLocationRow(data);
    if (!location) return { ok: false, error: 'No se pudo actualizar la sucursal' };
    return { ok: true, location };
  }

  const { data, error } = await supabase
    .from('business_locations')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error creating secondary location:', error);
    return { ok: false, error: error.message };
  }
  const location = normalizeBusinessLocationRow(data);
  if (!location) return { ok: false, error: 'No se pudo crear la sucursal' };
  return { ok: true, location };
}

export async function deleteSecondaryBusinessLocation(
  businessId: string,
  locationId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!businessId || !locationId) return { ok: false, error: 'Ubicación inválida' };

  const { error } = await supabase
    .from('business_locations')
    .delete()
    .eq('id', locationId)
    .eq('business_id', businessId)
    .eq('is_primary', false);

  if (error) {
    console.error('Error deleting secondary location:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
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

export async function trackBusinessClick(
  businessId: string,
  clickType: BusinessClickType,
  visitorKey?: string,
): Promise<void> {
  if (!businessId) return;

  const { error } = await supabase.rpc('track_business_click', {
    p_business_id: businessId,
    p_click_type: clickType,
    p_visitor_key: visitorKey && visitorKey.length >= 8 ? visitorKey : null,
  });

  if (error) {
    console.error('Error tracking business click:', error);
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
    .select(BUSINESS_SELECT_WITH_LOCATIONS)
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
    throw new Error(error.message);
  }

  type RpcRow = {
    business_id: string;
    business_name: string;
    visits_period?: unknown;
    visits_month?: unknown;
    visits_total: unknown;
    reviews_total: unknown;
    reviews_period?: unknown;
    reviews_month?: unknown;
    rating_avg: unknown;
    rating_avg_period?: unknown;
    rating_distribution: unknown;
    daily_visits: unknown;
    daily_reviews: unknown;
    clicks_period?: unknown;
    clicks_month?: unknown;
    clicks_total: unknown;
    clicks_by_type: unknown;
    daily_clicks: unknown;
  };
  type DailyVisitsPoint = { date?: unknown; visits?: unknown };
  type DailyReviewsPoint = { date?: unknown; reviews?: unknown };
  type DailyClicksPoint = { date?: unknown; clicks?: unknown };
  type StarPoint = { stars?: unknown; count?: unknown };
  type ClickTypePoint = {
    click_type?: unknown;
    count?: unknown;
    count_total?: unknown;
    count_month?: unknown;
  };

  const CLICK_TYPES: BusinessClickType[] = ['whatsapp', 'phone', 'directions', 'website'];

  return ((data ?? []) as RpcRow[]).map(row => ({
    business_id: row.business_id,
    business_name: row.business_name,
    visits_period: Number(row.visits_period ?? row.visits_month ?? 0),
    visits_total: Number(row.visits_total ?? 0),
    reviews_total: Number(row.reviews_total ?? 0),
    reviews_period: Number(row.reviews_period ?? row.reviews_month ?? 0),
    rating_avg: Number(row.rating_avg ?? 0),
    rating_avg_period: Number(row.rating_avg_period ?? 0),
    rating_distribution: Array.isArray(row.rating_distribution)
      ? (row.rating_distribution as StarPoint[]).map(p => ({
          stars: Number(p.stars ?? 0),
          count: Number(p.count ?? 0),
        }))
      : [],
    daily_visits: Array.isArray(row.daily_visits)
      ? (row.daily_visits as DailyVisitsPoint[]).map(p => ({
          date: String(p.date ?? ''),
          visits: Number(p.visits ?? 0),
        }))
      : [],
    daily_reviews: Array.isArray(row.daily_reviews)
      ? (row.daily_reviews as DailyReviewsPoint[]).map(p => ({
          date: String(p.date ?? ''),
          reviews: Number(p.reviews ?? 0),
        }))
      : [],
    clicks_period: Number(row.clicks_period ?? row.clicks_month ?? 0),
    clicks_total: Number(row.clicks_total ?? 0),
    clicks_by_type: Array.isArray(row.clicks_by_type)
      ? (row.clicks_by_type as ClickTypePoint[])
          .filter(p => CLICK_TYPES.includes(String(p.click_type) as BusinessClickType))
          .map(p => ({
            click_type: String(p.click_type) as BusinessClickType,
            count: Number(p.count ?? 0),
            count_total: Number(p.count_total ?? p.count ?? 0),
          }))
      : [],
    daily_clicks: Array.isArray(row.daily_clicks)
      ? (row.daily_clicks as DailyClicksPoint[]).map(p => ({
          date: String(p.date ?? ''),
          clicks: Number(p.clicks ?? 0),
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
  return uploadBusinessImage(userId, file, { namePrefix: 'news-' });
}
