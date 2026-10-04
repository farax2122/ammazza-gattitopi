// Riceve gameId + clic, rigioca la partita sul server e salva il punteggio che ottiene lui.
// Il punteggio mandato dal browser non viene nemmeno letto.
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import '../_shared/sim.js';

// deno-lint-ignore no-explicit-any
const Sim = (globalThis as any).GattitopiSim;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'metodo non ammesso' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: auth } = await admin.auth.getUser(token);
  const user = auth?.user;
  if (!user) return json({ error: 'devi aver fatto l\'accesso' }, 401);

  let body: { gameId?: unknown; inputs?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'richiesta non valida' }, 400); }
  const { gameId, inputs } = body;
  if (typeof gameId !== 'string' || !Array.isArray(inputs)) return json({ error: 'richiesta non valida' }, 400);

  const { data: game } = await admin.from('games').select('id, user_id, seed, created_at, used_at').eq('id', gameId).maybeSingle();
  if (!game || game.user_id !== user.id) return json({ error: 'partita sconosciuta' }, 404);
  if (game.used_at) return json({ error: 'partita già consegnata' }, 409);
  const wall = (Date.now() - Date.parse(game.created_at)) / 1000;
  if (wall > 60 * 60) return json({ error: 'partita scaduta' }, 410);

  // la partita si può consegnare una volta sola, anche se arrivano due richieste insieme
  const { data: claimed } = await admin.from('games').update({ used_at: new Date().toISOString() })
    .eq('id', gameId).is('used_at', null).select('id');
  if (!claimed || !claimed.length) return json({ error: 'partita già consegnata' }, 409);

  const res = Sim.replay(game.seed, inputs);
  if (res.error) return json({ error: `partita non valida (${res.error})` }, 422);
  // il tempo vero passato deve coprire la partita: niente partite "giocate" in un istante da uno script
  if (wall < (res.ticks / 60) * 0.9) return json({ error: 'partita non valida (troppo veloce)' }, 422);

  const { error } = await admin.from('scores').insert({
    user_id: user.id, game_id: game.id, score: res.score, max_combo: res.maxCombo, win: res.win
  });
  if (error) return json({ error: 'salvataggio non riuscito' }, 500);
  return json({ score: res.score, maxCombo: res.maxCombo, win: res.win });
});
