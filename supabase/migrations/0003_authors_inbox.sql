-- Authors, bylines, and the admin inbox (contact messages and "write for us" pitches).

create table if not exists public.authors (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  role text not null default '',
  short_bio text not null default '',
  bio text not null default '',
  photo text not null default '',
  avatar text not null default '',
  links jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.authors enable row level security;
drop policy if exists "Authors are public" on public.authors;
create policy "Authors are public" on public.authors for select using (true);

insert into public.authors (slug, name, role, short_bio, photo, avatar)
values ('madan', 'Madan', 'Product Manager, healthcare SaaS',
        'Product manager who started as a Salesforce developer. I write ThinkInProducts to learn product management in public.',
        '/images/authors/madan.jpg', '/images/authors/madan-avatar.jpg')
on conflict (slug) do nothing;

alter table public.pieces add column if not exists author text not null default 'madan';
alter table public.pieces drop constraint if exists pieces_author_fkey;
alter table public.pieces add constraint pieces_author_fkey
  foreign key (author) references public.authors(slug) on update cascade on delete restrict;
create index if not exists pieces_author_idx on public.pieces (author);

create table if not exists public.inbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'pitch')),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  name text not null check (char_length(name) <= 120),
  email text not null check (char_length(email) <= 200),
  phone text not null default '' check (char_length(phone) <= 40),
  subject text not null default '' check (char_length(subject) <= 200),
  message text not null check (char_length(message) <= 5000),
  piece_type text not null default '',
  link text not null default '' check (char_length(link) <= 500),
  consent boolean not null default false,
  ip_hash text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists inbox_created_idx on public.inbox (created_at desc);
create index if not exists inbox_ip_idx on public.inbox (ip_hash, created_at);

-- Only the server (service role) reads or writes the inbox. No public access at all.
alter table public.inbox enable row level security;
