-- ThinkInProducts: sections, featured pieces, SEO fields and metrics.
-- Run after 0001_init.sql (SQL Editor -> New query -> paste -> Run). Safe to run once.

-- "Teardown" is now called "Product breakdown".
alter table public.pieces drop constraint if exists pieces_type_check;
update public.pieces set type = 'breakdown' where type = 'teardown';
alter table public.pieces add constraint pieces_type_check
  check (type in ('article', 'case_study', 'breakdown', 'newsletter'));

alter table public.pieces
  add column if not exists category text not null default '',
  add column if not exists tags text[] not null default '{}',
  add column if not exists featured boolean not null default false,
  add column if not exists cover jsonb,
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists reading_minutes integer not null default 1,
  add column if not exists issue_number integer;

create index if not exists pieces_type_status on public.pieces (type, status, published_at desc);
create index if not exists pieces_featured on public.pieces (type) where featured;

-- Subscribers pick formats; "teardown" becomes "breakdown" there too.
update public.subscribers set formats = array_replace(formats, 'teardown', 'breakdown');
alter table public.subscribers alter column formats set default array['newsletter'];

-- Page views per piece per day. Readers can't read this table; they can only add a view.
create table if not exists public.piece_views (
  piece_id uuid not null references public.pieces (id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0,
  primary key (piece_id, day)
);
alter table public.piece_views enable row level security;
create policy "admin reads views" on public.piece_views for select using (public.is_admin());

create or replace function public.track_view(p_piece uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.piece_views (piece_id, day, views)
  select p_piece, current_date, 1 where exists (select 1 from public.pieces where id = p_piece and status = 'published')
  on conflict (piece_id, day) do update set views = piece_views.views + 1;
$$;
-- Only the server (service role) may count views.
revoke execute on function public.track_view(uuid) from public, anon, authenticated;
grant execute on function public.track_view(uuid) to service_role;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Email events from Resend webhooks: delivered, opened, clicked, bounced, complained.
create table if not exists public.email_events (
  id bigint generated always as identity primary key,
  send_id uuid references public.sends (id) on delete cascade,
  email text,
  type text not null,
  created_at timestamptz not null default now()
);
create index if not exists email_events_send on public.email_events (send_id, type);
alter table public.email_events enable row level security;
create policy "admin reads email events" on public.email_events for select using (public.is_admin());
