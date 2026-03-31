-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category USER-DEFINED NOT NULL,
  location text NOT NULL,
  description text,
  image_url text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  is_recommended boolean DEFAULT false,
  services ARRAY DEFAULT '{}'::text[],
  owner_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  price_range smallint NOT NULL DEFAULT 2 CHECK (price_range >= 1 AND price_range <= 3),
  min_age smallint,
  gallery ARRAY NOT NULL DEFAULT '{}'::text[],
  phone text,
  website text,
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (user_id, business_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT favorites_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.plans (
  id text NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  currency text DEFAULT '€'::text,
  interval text DEFAULT 'mes'::text,
  features ARRAY DEFAULT '{}'::text[],
  is_popular boolean DEFAULT false,
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'trialing'::text, 'past_due'::text, 'canceled'::text])),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  current_period_end timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'basic'::app_role,
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);