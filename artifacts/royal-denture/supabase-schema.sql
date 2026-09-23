-- Royal Denture — Supabase schema setup
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)

create extension if not exists pgcrypto;

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ar text not null,
  description text,
  price numeric not null default 0,
  delivery_days text,
  badge text,
  image_url text,
  sort_order integer default 0,
  is_active boolean default true,
  stage integer default 2,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Testimonials
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  author text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Admin settings (key/value store used for app config + session/order fallback storage)
create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  case_id text,
  customer_name text not null,
  customer_phone text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  status text not null default 'قيد المعالجة',
  assigned_to text,
  internal_notes text,
  rating integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security: this app's admin panel authenticates its own way
-- (not via Supabase Auth) and talks to Supabase directly with the publishable key,
-- so policies here are permissive by design — matching the previous project's setup.
alter table public.products enable row level security;
alter table public.testimonials enable row level security;
alter table public.admin_settings enable row level security;
alter table public.orders enable row level security;

drop policy if exists "public_all_products" on public.products;
create policy "public_all_products" on public.products for all using (true) with check (true);

drop policy if exists "public_all_testimonials" on public.testimonials;
create policy "public_all_testimonials" on public.testimonials for all using (true) with check (true);

drop policy if exists "public_all_admin_settings" on public.admin_settings;
create policy "public_all_admin_settings" on public.admin_settings for all using (true) with check (true);

drop policy if exists "public_all_orders" on public.orders;
create policy "public_all_orders" on public.orders for all using (true) with check (true);

-- Storage bucket for product images (used by the admin panel's image upload)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public_read_product_images" on storage.objects;
create policy "public_read_product_images" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "public_write_product_images" on storage.objects;
create policy "public_write_product_images" on storage.objects for all
  using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

-- Seed a couple of starter products so the storefront isn't empty
insert into public.products (slug, name, name_ar, description, price, delivery_days, image_url, sort_order, is_active, stage)
values
  ('zirconia-crown', 'Zirconia Crown', 'تاج زركونيا', 'تاج أسنان زركونيا عالي الجودة والمتانة', 150000, '3-5 أيام', '', 1, true, 2),
  ('pfm-crown', 'PFM Crown', 'تاج معدني خزفي', 'تاج معدني مغطى بالخزف بجودة ممتازة', 90000, '3-5 أيام', '', 2, true, 2)
on conflict (slug) do nothing;
