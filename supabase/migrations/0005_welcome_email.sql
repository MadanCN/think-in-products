-- When the welcome email went out, so each subscriber gets it once.
alter table public.subscribers add column if not exists welcomed_at timestamptz;
