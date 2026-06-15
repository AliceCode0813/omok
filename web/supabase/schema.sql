-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.rooms (
  id text primary key,
  host_id text not null,
  guest_id text,
  player_black text,
  player_white text,
  current_turn smallint not null default 1,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  winner smallint not null default 0,
  board jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

drop policy if exists "rooms_select" on public.rooms;
drop policy if exists "rooms_insert" on public.rooms;
drop policy if exists "rooms_update" on public.rooms;

create policy "rooms_select" on public.rooms
  for select using (true);

create policy "rooms_insert" on public.rooms
  for insert with check (true);

create policy "rooms_update" on public.rooms
  for update using (true);

-- Realtime 사용을 위해 Table Editor > rooms > Realtime 를 켜거나
-- Database > Replication 에서 rooms 테이블을 publication에 추가하세요.
