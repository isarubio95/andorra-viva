-- Precios: Basic 9€, Pro 19€, Premium 29€.

update public.plans set price = 9 where id = 'basic';

update public.plans set price = 19 where id = 'pro';

update public.plans set price = 29 where id = 'premium';
