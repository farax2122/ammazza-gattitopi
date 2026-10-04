-- Ammazza Gattitopi: profili, partite, punteggi verificati e classifica.
-- Da eseguire nel progetto Supabase: Dashboard > SQL Editor > New query > incolla > Run.
--
-- Anti-trucchi: il browser non può scrivere punteggi. Chiede una partita (start_game, che sceglie il seed),
-- gioca, poi manda solo i clic alla Edge Function submit-score: il server rigioca la partita con lo stesso
-- motore (functions/_shared/sim.js) e salva il punteggio che ottiene lui.

-- Profili pubblici: solo il nome visibile in classifica.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (char_length(username) between 3 and 20 and username ~ '^[[:alnum:]_ .''-]+$'),
  created_at timestamptz not null default now()
);

-- Partite avviate: il seed lo sceglie il database, non il browser.
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  seed integer not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
create index if not exists games_user_idx on public.games (user_id, created_at desc);

-- Punteggi: li scrive solo la Edge Function (service role) dopo aver rigiocato la partita.
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null unique references public.games (id) on delete cascade,
  score integer not null check (score >= 0),
  max_combo integer not null default 0,
  win boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.scores enable row level security;

drop policy if exists "profili leggibili" on public.profiles;
create policy "profili leggibili" on public.profiles for select using (true);
drop policy if exists "profilo proprio" on public.profiles;
create policy "profilo proprio" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Partite: ognuno vede solo le sue; nessuna scrittura diretta dal browser (si passa da start_game).
drop policy if exists "partite proprie" on public.games;
create policy "partite proprie" on public.games for select using (auth.uid() = user_id);

-- Punteggi: tutti leggono; nessuna policy di insert/update/delete, quindi dal browser non si scrivono.
drop policy if exists "punteggi leggibili" on public.scores;
create policy "punteggi leggibili" on public.scores for select using (true);
drop policy if exists "punteggio proprio" on public.scores;

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

-- Avvia una partita: seed casuale scelto qui. Al massimo una partita ogni 10 secondi.
create or replace function public.start_game()
returns table (id uuid, seed integer) language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Accedi per giocare in classifica'; end if;
  if exists (select 1 from public.games g where g.user_id = auth.uid() and g.created_at > now() - interval '10 seconds') then
    raise exception 'Aspetta qualche secondo prima di iniziare un''altra partita';
  end if;
  return query
    insert into public.games (user_id, seed)
    values (auth.uid(), floor(random() * 2147483647)::integer)
    returning games.id, games.seed;
end;
$$;
revoke all on function public.start_game() from public, anon;
grant execute on function public.start_game() to authenticated;

-- Classifica: miglior punteggio verificato di ogni giocatore.
create or replace view public.leaderboard with (security_invoker = true) as
  select p.id as user_id, p.username, max(s.score) as best, max(s.max_combo) as best_combo, count(*) as games
  from public.scores s join public.profiles p on p.id = s.user_id
  group by p.id, p.username;
grant select on public.leaderboard to anon, authenticated;
