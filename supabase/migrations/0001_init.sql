-- ThinkInProducts: initial schema.
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

-- One row per account. role = 'admin' for you, 'reader' for everyone else.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  role text not null default 'reader' check (role in ('reader', 'admin')),
  created_at timestamptz not null default now()
);

-- Every email on the list, with or without an account.
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  confirm_token uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  formats text[] not null default array['article', 'teardown', 'case_study', 'newsletter'],
  source text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.plans (
  id text primary key check (id in ('plus', 'pro')),
  name text not null,
  price_monthly_inr integer,
  price_yearly_inr integer,
  razorpay_plan_monthly text,
  razorpay_plan_yearly text
);

insert into public.plans (id, name) values ('plus', 'Plus'), ('pro', 'Pro');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null references public.plans (id),
  status text not null check (status in ('active', 'past_due', 'cancelled')),
  billing text check (billing in ('monthly', 'yearly')),
  current_period_end timestamptz,
  razorpay_subscription_id text unique,
  created_at timestamptz not null default now()
);

create unique index memberships_one_active on public.memberships (user_id) where status = 'active';

-- Every article, teardown, case study and newsletter issue.
create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('article', 'teardown', 'case_study', 'newsletter')),
  title text not null default '',
  slug text not null unique,
  subtitle text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  access text not null default 'free' check (access in ('free', 'plus', 'pro')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pieces_published on public.pieces (status, published_at desc);

-- One row per email send of a piece.
create table public.sends (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces (id) on delete cascade,
  audience text not null,
  recipient_count integer not null default 0,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

-- A logged-in reader's choices in make-the-call and check-yourself blocks.
create table public.answers (
  user_id uuid not null references auth.users (id) on delete cascade,
  piece_id uuid not null references public.pieces (id) on delete cascade,
  block_id text not null,
  option_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, piece_id, block_id)
);

-- Raw payment and email webhooks, kept for debugging.
create table public.events (
  id bigint generated always as identity primary key,
  source text not null,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Helpers ---------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile when someone signs up, and link any existing subscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'avatar_url');
  update public.subscribers set user_id = new.id where lower(email) = lower(new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pieces_touch before update on public.pieces
  for each row execute function public.touch_updated_at();

-- Row-level security ------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.subscribers enable row level security;
alter table public.plans enable row level security;
alter table public.memberships enable row level security;
alter table public.pieces enable row level security;
alter table public.sends enable row level security;
alter table public.answers enable row level security;
alter table public.events enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "plans are public" on public.plans for select using (true);
create policy "admin manages plans" on public.plans for all using (public.is_admin()) with check (public.is_admin());

create policy "own membership" on public.memberships for select using (user_id = auth.uid() or public.is_admin());

create policy "own subscription" on public.subscribers for select using (user_id = auth.uid() or public.is_admin());
create policy "admin manages subscribers" on public.subscribers for all using (public.is_admin()) with check (public.is_admin());

-- Anyone can read published pieces; the site hides paid blocks from readers without a plan.
create policy "published pieces are public" on public.pieces for select
  using (status = 'published' or public.is_admin());
create policy "admin writes pieces" on public.pieces for all using (public.is_admin()) with check (public.is_admin());

create policy "admin reads sends" on public.sends for all using (public.is_admin()) with check (public.is_admin());

create policy "own answers" on public.answers for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admin reads events" on public.events for select using (public.is_admin());

-- Storage bucket for images used in pieces (screenshots for teardowns, etc).
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;

create policy "admin uploads media" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());
create policy "admin updates media" on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());
create policy "admin deletes media" on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
