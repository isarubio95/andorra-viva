/** Tipos alineados con tablas Supabase `businesses`, `reviews`, `plans` (sin datos estáticos). */

import type { BusinessOpeningHours } from '@/lib/business-hours';

export interface Business {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  location: string;
  address?: string | null;
  rating: number;
  review_count: number;
  image_url: string;
  description: string;
  latitude: number;
  longitude: number;
  is_recommended: boolean;
  is_premium: boolean;
  services: string[];
  price_range: number;
  min_age: number | null;
  owner_id?: string | null;
  gallery?: string[];
  phone?: string | null;
  website?: string | null;
  opening_hours?: BusinessOpeningHours | null;
  created_at?: string;
}

export interface Review {
  id: string;
  business_id: string;
  user_id?: string;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  is_popular: boolean;
  trial_months: number;
  promo_label: string | null;
}

export interface NewsPost {
  id: string;
  author_id: string;
  business_id: string | null;
  author_name: string;
  business_name: string | null;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  updated_at?: string;
}

export interface NewsMonthlyQuota {
  can_publish: boolean;
  posted_this_month: boolean;
  remaining_this_month: number;
  month_start: string;
  month_end: string;
}
