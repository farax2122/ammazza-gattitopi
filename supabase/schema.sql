-- Ammazza Gattitopi: profili, punteggi e classifica.
-- Da eseguire una volta nel progetto Supabase: Dashboard > SQL Editor > New query > incolla > Run.

-- Profili pubblici: solo il nome visibile in classifica.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (char_length(username) between 3 and 20 and username ~ '^[[:alnum:]_ .''-]+$'),
  created_at timestamptz not null default now()
);

-- Una riga per partita finita.
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  score integer not null check (score between 0 and 500000),
  max_combo integer not null default 0 check (max_combo between 0 and 2000),
  win boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists scores_user_idx on public.scores (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.scores enable row level security;

-- Tutti leggono i profili (servono i nomi in classifica); ognuno modifica solo il suo.
drop policy if exists "profili leggibili" on public.profiles;
create policy "profili leggibili" on public.profiles for select using (true);
drop policy if exists "profilo proprio" on public.profiles;
create policy "profilo proprio" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Tutti leggono i punteggi; si inseriscono solo i propri; nessuna modifica o cancellazione dal client.
drop policy if exists "punteggi leggibili" on public.scores;
create policy "punteggi leggibili" on public.scores for select using (true);
drop policy if exists "punteggio proprio" on public.scores;
create policy "punteggio proprio" on public.scores for insert to authenticated with check (auth.uid() = user_id);

-- Alla registrazione crea il profilo con lo username scelto (passato nei metadata del signUp).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'Giocatore ' || left(new.id::text, 6)));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Anti-spam minimo: una partita salvata ogni 20 secondi per giocatore.
-- ponytail: il punteggio arriva dal browser, quindi chi sa usare la console può barare.
-- Se la classifica diventa importante, validare la partita lato server (Edge Function).
create or replace function public.scores_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.scores where user_id = new.user_id and created_at > now() - interval '20 seconds') then
    raise exception 'Troppe partite salvate di fila: riprova tra poco';
  end if;
  return new;
end;
$$;
drop trigger if exists scores_rate_limit on public.scores;
create trigger scores_rate_limit before insert on public.scores
  for each row execute function public.scores_rate_limit();

-- Classifica: miglior punteggio di ogni giocatore.
create or replace view public.leaderboard with (security_invoker = true) as
  select p.id as user_id, p.username, max(s.score) as best, max(s.max_combo) as best_combo, count(*) as games
  from public.scores s join public.profiles p on p.id = s.user_id
  group by p.id, p.username;
grant select on public.leaderboard to anon, authenticated;
