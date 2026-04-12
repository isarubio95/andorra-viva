import { supabase } from '@/lib/supabase';
import { clearStoredVisitorKey, getStoredVisitorKey } from '@/lib/visitor-key';
import { mockBusinesses, mockReviews, mockPlans, type Business, type Review, type Plan } from '@/data/mockData';

// Flag para usar datos mock (solo si se activa explícitamente en .env)
const USE_MOCK_BUSINESSES = import.meta.env.VITE_USE_MOCK_BUSINESSES === 'true';
const USE_MOCK_REVIEWS = import.meta.env.VITE_USE_MOCK_REVIEWS === 'true';

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

export async function getBusinesses(): Promise<Business[]> {
  if (USE_MOCK_BUSINESSES) return mockBusinesses;

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('is_recommended', { ascending: false });

  if (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
  return data as Business[];
}

export async function getMyBusinesses(userId: string): Promise<Business[]> {
  if (USE_MOCK_BUSINESSES) return mockBusinesses;

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my businesses:', error);
    return [];
  }
  return data as Business[];
}

export async function getBusinessById(id: string): Promise<Business | null> {
  if (USE_MOCK_BUSINESSES) return mockBusinesses.find(b => b.id === id) || null;

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching business:', error);
    return null;
  }
  return data as Business;
}

export async function getReviewsByBusiness(businessId: string): Promise<Review[]> {
  if (USE_MOCK_REVIEWS) return mockReviews.filter(r => r.business_id === businessId);

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
  return data as Review[];
}

export async function getMyReviewForBusiness(businessId: string, userId: string): Promise<Review | null> {
  if (!businessId || !userId) return null;
  if (USE_MOCK_REVIEWS) return null;

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

  if (USE_MOCK_REVIEWS) return { ok: true };

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
    console.error('Error fetching plans, using mock:', error);
    return mockPlans;
  }
  return (data && data.length > 0) ? data as Plan[] : mockPlans;
}

function currentMonthKey(): string {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return monthStart.toISOString().slice(0, 10);
}

export async function trackBusinessVisit(businessId: string, visitorKey: string): Promise<void> {
  if (!businessId || USE_MOCK_BUSINESSES) return;

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
  if (USE_MOCK_BUSINESSES) return;
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
  if (USE_MOCK_BUSINESSES) {
    return mockBusinesses
      .slice()
      .sort((a, b) => b.review_count - a.review_count)
      .slice(0, limit)
      .map(b => ({ ...b, visits_month: b.review_count }));
  }

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

  const byId = new Map((businesses as Business[]).map(b => [b.id, b]));
  return rows
    .map(r => {
      const business = byId.get(r.business_id);
      if (!business) return null;
      return { ...business, visits_month: Number(r.visits_month ?? 0) };
    })
    .filter((x): x is TopVisitedBusiness => x !== null);
}

export async function getMyBusinessMetrics(days = 30): Promise<BusinessMetricRow[]> {
  if (USE_MOCK_BUSINESSES) {
    return mockBusinesses.slice(0, 2).map((b, i) => ({
      business_id: b.id,
      business_name: b.name,
      visits_month: 120 - i * 20,
      visits_total: 540 - i * 100,
      reviews_total: b.review_count,
      rating_avg: b.rating,
      daily_visits: Array.from({ length: days }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - idx));
        return { date: d.toISOString().slice(0, 10), visits: Math.max(0, 2 + ((idx + i) % 9)) };
      }),
    }));
  }

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
