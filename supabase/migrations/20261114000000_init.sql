-- Lbasy store schema for Supabase (Postgres).
-- Run once in the Supabase SQL editor, or with `supabase db push`.
-- Then run supabase/seed.sql for the shipping fees, and make yourself an admin (see README).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- True when the signed-in user is in public.admins. Used by RLS policies and the admin page.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table if not exists public.drops (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title_ar text not null,
  title_en text not null default '',
  subtitle_ar text not null default '',
  subtitle_en text not null default '',
  date date not null default current_date,
  cover text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_ar text not null,
  name_en text not null default '',
  brand text not null default '',
  gender text not null check (gender in ('men', 'women', 'kids', 'unisex')),
  category text not null check (category in (
    'jackets', 'coats', 'jeans', 'pants', 'shirts', 'tshirts',
    'knitwear', 'hoodies', 'dresses', 'shoes', 'bags'
  )),
  size text not null default '',
  -- Measurements in cm, e.g. {"chest": 56, "length": 72}
  measurements jsonb not null default '{}'::jsonb,
  condition text not null default 'very_good' check (condition in ('like_new', 'very_good', 'good')),
  material_ar text not null default '',
  material_en text not null default '',
  color_ar text not null default '',
  color_en text not null default '',
  notes_ar text,
  notes_en text,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  -- Each piece is one of a kind, so stock is normally 1 (available) or 0 (sold).
  stock integer not null default 1 check (stock >= 0),
  -- Kept in sync with stock by a trigger: true once the piece has been ordered.
  sold boolean not null default false,
  -- Public URLs, first one is the cover photo.
  images text[] not null default '{}',
  drop_slug text references public.drops (slug) on update cascade on delete set null,
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_listing_idx on public.products (published, created_at desc);
create index if not exists products_drop_idx on public.products (drop_slug);

create or replace function public.products_before_write()
returns trigger
language plpgsql
as $$
begin
  new.sold := new.stock < 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_before_write on public.products;
create trigger products_before_write
  before insert or update on public.products
  for each row execute function public.products_before_write();

create table if not exists public.shipping_zones (
  code text primary key,
  name_ar text not null,
  name_en text not null,
  fee integer not null check (fee >= 0),
  days text not null default '',
  active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  phone2 text,
  governorate text not null references public.shipping_zones (code),
  city text not null,
  address text not null,
  notes text,
  subtotal integer not null,
  shipping integer not null,
  total integer not null,
  payment_method text not null default 'cod' check (payment_method in ('cod', 'online')),
  status text not null default 'new' check (status in ('new', 'confirmed', 'shipped', 'delivered', 'cancelled'))
);

create index if not exists orders_created_idx on public.orders (created_at desc);

-- A snapshot of each piece at the time of the order, so the order still reads
-- correctly if the product is later edited or deleted.
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  slug text not null,
  name_ar text not null,
  name_en text not null,
  brand text not null,
  size text not null,
  price integer not null,
  image text not null default ''
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- place_order: called by the checkout (POST /api/orders) with the anon key.
-- Runs as one transaction: locks the pieces, checks they are all still available,
-- marks them sold and creates the order. Two customers can never buy the same piece:
-- the second one gets an error "SOLD:<ids>" and nothing is written.
-- ---------------------------------------------------------------------------

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ids text[];
  unavailable text[];
  zone public.shipping_zones;
  v_subtotal integer;
  v_order public.orders;
  v_number text;
  v_items jsonb;
begin
  select coalesce(array_agg(distinct x), '{}')
    into ids
    from jsonb_array_elements_text(coalesce(payload -> 'item_ids', '[]'::jsonb)) as x;

  if cardinality(ids) = 0 or cardinality(ids) > 30 then
    raise exception 'INVALID:item_ids';
  end if;
  if coalesce(trim(payload ->> 'customer_name'), '') = ''
     or coalesce(trim(payload ->> 'phone'), '') = ''
     or coalesce(trim(payload ->> 'city'), '') = ''
     or coalesce(trim(payload ->> 'address'), '') = '' then
    raise exception 'INVALID:customer';
  end if;

  select * into zone from public.shipping_zones
   where code = payload ->> 'governorate' and active;
  if not found then
    raise exception 'INVALID:governorate';
  end if;

  -- Lock the rows in a fixed order so concurrent checkouts wait for each other.
  perform 1 from public.products where id = any (ids) order by id for update;

  select coalesce(array_agg(i), '{}') into unavailable
    from unnest(ids) as i
   where not exists (
     select 1 from public.products p
      where p.id = i and p.published and p.stock > 0
   );
  if cardinality(unavailable) > 0 then
    raise exception 'SOLD:%', array_to_string(unavailable, ',');
  end if;

  select sum(price) into v_subtotal from public.products where id = any (ids);

  loop
    v_number := 'LB-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.orders where number = v_number);
  end loop;

  insert into public.orders (
    number, customer_name, phone, phone2, governorate, city, address, notes,
    subtotal, shipping, total, payment_method, status
  ) values (
    v_number,
    left(trim(payload ->> 'customer_name'), 120),
    left(trim(payload ->> 'phone'), 20),
    nullif(left(trim(coalesce(payload ->> 'phone2', '')), 20), ''),
    zone.code,
    left(trim(payload ->> 'city'), 120),
    left(trim(payload ->> 'address'), 500),
    nullif(left(trim(coalesce(payload ->> 'notes', '')), 500), ''),
    v_subtotal, zone.fee, v_subtotal + zone.fee, 'cod', 'new'
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, slug, name_ar, name_en, brand, size, price, image)
  select v_order.id, p.id, p.slug, p.name_ar, p.name_en, p.brand, p.size, p.price, coalesce(p.images[1], '')
    from public.products p
   where p.id = any (ids);

  update public.products set stock = stock - 1 where id = any (ids);

  select coalesce(jsonb_agg(jsonb_build_object(
           'product_id', product_id, 'slug', slug, 'name_ar', name_ar, 'name_en', name_en,
           'brand', brand, 'size', size, 'price', price, 'image', image) order by id), '[]'::jsonb)
    into v_items
    from public.order_items where order_id = v_order.id;

  return to_jsonb(v_order) || jsonb_build_object('items', v_items);
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_set_order_status: cancelling an order puts its pieces back on sale;
-- reopening a cancelled order takes them off sale again (if nobody bought them meanwhile).
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_order_status(order_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status text;
  ids text[];
  unavailable text[];
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if new_status not in ('new', 'confirmed', 'shipped', 'delivered', 'cancelled') then
    raise exception 'INVALID:status';
  end if;

  select status into old_status from public.orders where id = order_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if old_status = new_status then
    return;
  end if;

  select coalesce(array_agg(product_id), '{}') into ids
    from public.order_items oi where oi.order_id = admin_set_order_status.order_id and product_id is not null;

  if new_status = 'cancelled' then
    update public.products set stock = stock + 1 where id = any (ids);
  elsif old_status = 'cancelled' then
    perform 1 from public.products where id = any (ids) order by id for update;
    select coalesce(array_agg(id), '{}') into unavailable
      from public.products where id = any (ids) and stock < 1;
    if cardinality(unavailable) > 0 then
      raise exception 'SOLD:%', array_to_string(unavailable, ',');
    end if;
    update public.products set stock = stock - 1 where id = any (ids);
  end if;

  update public.orders set status = new_status where id = order_id;
end;
$$;

revoke all on function public.place_order(jsonb) from public;
revoke all on function public.admin_set_order_status(uuid, text) from public;
revoke all on function public.is_admin() from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.drops enable row level security;
alter table public.products enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- admins: a user can see their own row; rows are added from the SQL editor.
drop policy if exists "admins read own" on public.admins;
create policy "admins read own" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Catalog: everyone reads what is published, admins do everything.
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products
  for select to anon, authenticated using (published or public.is_admin());
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read drops" on public.drops;
create policy "public read drops" on public.drops
  for select to anon, authenticated using (published or public.is_admin());
drop policy if exists "admin write drops" on public.drops;
create policy "admin write drops" on public.drops
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read shipping" on public.shipping_zones;
create policy "public read shipping" on public.shipping_zones
  for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "admin write shipping" on public.shipping_zones;
create policy "admin write shipping" on public.shipping_zones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Orders: only admins can read them. Customers create orders through place_order only.
drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders" on public.orders
  for select to authenticated using (public.is_admin());
drop policy if exists "admin read order items" on public.order_items;
create policy "admin read order items" on public.order_items
  for select to authenticated using (public.is_admin());

grant select on public.products, public.drops, public.shipping_zones to anon;
grant select, insert, update, delete on public.products, public.drops, public.shipping_zones to authenticated;
grant select on public.orders, public.order_items, public.admins to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for product photos. Anyone can view, only admins upload.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'products');
drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects
  for update to authenticated using (bucket_id = 'products' and public.is_admin());
drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_admin());
