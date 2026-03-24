import { supabase } from '@/lib/supabase';
import { mockBusinesses, mockReviews, mockPlans, type Business, type Review, type Plan } from '@/data/mockData';

// Flag para usar datos mock mientras no haya conexión a Supabase
const USE_MOCK = false;

export async function getBusinesses(): Promise<Business[]> {
  if (USE_MOCK) return mockBusinesses;

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('is_premium', { ascending: false });

  if (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
  return data as Business[];
}

export async function getBusinessById(id: string): Promise<Business | null> {
  if (USE_MOCK) return mockBusinesses.find(b => b.id === id) || null;

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
  if (USE_MOCK) return mockReviews.filter(r => r.business_id === businessId);

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

export async function getPlans(): Promise<Plan[]> {
  if (USE_MOCK) return mockPlans;

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
  return data as Plan[];
}
