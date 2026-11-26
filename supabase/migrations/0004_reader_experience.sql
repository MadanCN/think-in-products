-- Readers: profiles they can edit, reading progress, and comments with replies.

alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists notify_replies boolean not null default true;
alter table public.profiles add column if not exists comments_blocked boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Readers may change their own name, bio and reply emails, never their role or block.
-- (The existing "update own profile" policy already stops anyone changing their role.)
revoke update on public.profiles from anon, authenticated;
grant update (name, bio, notify_replies, updated_at) on public.profiles to authenticated;

-- Google sign-in sends "full_name" and "picture"; email sign-up sends "name".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  update public.subscribers set user_id = new.id where lower(email) = lower(new.email);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Fill in anyone who signed up before this change.
update public.profiles p set
  name = coalesce(nullif(p.name, ''), u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u where u.id = p.id;

-- Reading progress, one row per reader per piece.
create table if not exists public.reading_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  piece_id uuid not null references public.pieces (id) on delete cascade,
  progress smallint not null default 0 check (progress between 0 and 100),
  completed boolean not null default false,
  first_read_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (user_id, piece_id)
);
create index if not exists reading_progress_recent on public.reading_progress (user_id, last_read_at desc);
alter table public.reading_progress enable row level security;
create policy "own reading" on public.reading_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Comments. Readers write through the site's server, which checks sign-in, limits and
-- spam; the table itself is closed to the public and read through the server too.
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  author_slug text,           -- set when you reply from the admin, as the site's author
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  seen boolean not null default false,  -- seen in the admin
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  check (user_id is not null or author_slug is not null)
);
create index if not exists comments_piece on public.comments (piece_id, created_at);
create index if not exists comments_user on public.comments (user_id, created_at desc);
create index if not exists comments_unseen on public.comments (seen) where seen = false;
alter table public.comments enable row level security;
create policy "admin reads comments" on public.comments for select using (public.is_admin());

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.comment_likes enable row level security;
create policy "own likes" on public.comment_likes for select using (user_id = auth.uid());
revoke insert, update, delete, truncate on public.comments, public.comment_likes from anon, authenticated;
