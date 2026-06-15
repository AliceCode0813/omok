-- 기존 DB에 새 기능 추가 (SQL Editor에서 실행)

alter table public.rooms add column if not exists mode text default 'online';
alter table public.rooms add column if not exists host_ready boolean default false;
alter table public.rooms add column if not exists guest_ready boolean default false;
alter table public.rooms add column if not exists last_winner smallint default 0;

-- status에 ready 추가 (이미 있으면 에러 날 수 있음 - 그때는 아래 주석 참고)
alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms add constraint rooms_status_check
  check (status in ('waiting', 'ready', 'playing', 'finished'));
