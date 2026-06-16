-- 타이머 / 마지막 수 / 시간패 기능 추가

alter table public.rooms add column if not exists turn_started_at timestamptz;
alter table public.rooms add column if not exists last_move_row smallint;
alter table public.rooms add column if not exists last_move_col smallint;
alter table public.rooms add column if not exists end_reason text;
