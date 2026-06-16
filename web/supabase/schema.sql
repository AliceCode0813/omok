-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.rooms (
  id text primary key,
  host_id text not null,
  guest_id text,
  player_black text,
  player_white text,
  current_turn smallint not null default 1,
  status text not null default 'waiting' check (status in ('waiting', 'ready', 'playing', 'finished')),
  winner smallint not null default 0,
  last_winner smallint not null default 0,
  board jsonb not null,
  mode text not null default 'online',
  host_ready boolean not null default false,
  guest_ready boolean not null default false,
  turn_started_at timestamptz,
  last_move_row smallint,
  last_move_col smallint,
  end_reason text,
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

-- Realtime 활성화 (4단계: SQL Editor에서 이 줄도 실행)
alter publication supabase_realtime add table public.rooms;
