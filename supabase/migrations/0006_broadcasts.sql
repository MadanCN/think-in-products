-- Newsletter issues go out as Resend broadcasts; events for them carry the broadcast id.
alter table public.sends add column if not exists broadcast_id text;
create index if not exists sends_broadcast on public.sends (broadcast_id) where broadcast_id is not null;
