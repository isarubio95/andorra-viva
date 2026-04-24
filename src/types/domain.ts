/** Tipos alineados con tablas Supabase `businesses`, `reviews`, `plans` (sin datos estáticos). */

export interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
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
}
