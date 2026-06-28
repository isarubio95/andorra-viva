-- Al eliminar un negocio, borrar también datos dependientes (visitas ya tenían cascade).

alter table public.reviews
  drop constraint if exists reviews_business_id_fkey;

alter table public.reviews
  add constraint reviews_business_id_fkey
  foreign key (business_id) references public.businesses (id) on delete cascade;

alter table public.favorites
  drop constraint if exists favorites_business_id_fkey;

alter table public.favorites
  add constraint favorites_business_id_fkey
  foreign key (business_id) references public.businesses (id) on delete cascade;
