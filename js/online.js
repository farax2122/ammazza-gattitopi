// Login, registrazione e classifica online su Supabase.
// Senza configurazione (js/config.js) il gioco resta offline: niente account, niente classifica.
(() => {
  const $ = id => document.getElementById(id);
  const cfg = window.GATTITOPI_CONFIG || {};
  const configured = window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey && !cfg.supabaseUrl.includes('TUO-PROGETTO');
  const sb = configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const USERNAME_RE = /^[\p{L}\p{N}_ .'-]{3,20}$/u;

  let me = null;       // { id, username } quando sei dentro
  let pending = null;  // partita finita da ospite, salvata appena fai l'accesso
  let mode = 'login';

  function el(tag, props = {}, ...kids) {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  }

  // ---------- riquadro account nelle schermate di inizio e fine ----------
  function renderAccount() {
    for (const box of document.querySelectorAll('[data-account]')) {
      box.replaceChildren();
      if (!sb) continue;
      if (me) {
        box.append(
          el('span', {}, 'Giochi come ', el('strong', { textContent: me.username })),
          el('button', { type: 'button', className: 'icon-btn', textContent: 'Esci', onclick: () => sb.auth.signOut() })
        );
      } else {
        box.append(
          el('span', { textContent: 'Puoi giocare da ospite, ma il punteggio va in classifica solo se accedi.' }),
          el('button', { type: 'button', className: 'icon-btn', textContent: 'Accedi o registrati', onclick: openAuth })
        );
      }
    }
  }

  // ---------- finestra di accesso / registrazione ----------
  function setMode(m) {
    mode = m;
    $('authTitle').textContent = m === 'login' ? 'Accedi' : 'Registrati';
    $('authUserRow').hidden = m === 'login';
    $('authUser').required = m === 'register';
    $('authPass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('authSubmit').textContent = m === 'login' ? 'Entra' : 'Crea account';
    $('authSwitch').textContent = m === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi';
    $('authMsg').textContent = '';
  }
  function openAuth() {
    setMode('login');
    $('ovAuth').hidden = false;
    $('authEmail').focus();
  }
  function closeAuth() { $('ovAuth').hidden = true; }

  function friendly(err) {
    const m = (err && err.message) || '';
    if (/invalid login credentials/i.test(m)) return 'Email o password sbagliate.';
    if (/email not confirmed/i.test(m)) return "Prima conferma l'indirizzo dal link che ti abbiamo mandato per email.";
    if (/already registered/i.test(m)) return 'Esiste già un account con questa email: accedi.';
    if (/password/i.test(m) && /6/.test(m)) return 'La password deve avere almeno 6 caratteri.';
    if (/rate limit/i.test(m)) return 'Troppi tentativi: aspetta un minuto e riprova.';
    return m || 'Qualcosa è andato storto. Riprova.';
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const email = $('authEmail').value.trim(), password = $('authPass').value, msg = $('authMsg');
    $('authSubmit').disabled = true;
    msg.textContent = mode === 'login' ? 'Accesso in corso…' : 'Creo il tuo account…';
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        closeAuth();
      } else {
        const username = $('authUser').value.trim();
        if (!USERNAME_RE.test(username)) throw new Error('Il nome deve avere da 3 a 20 caratteri: lettere, numeri, spazi, _ . \' -');
        const { data: taken } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
        if (taken) throw new Error('Questo nome è già preso: scegline un altro.');
        const { data, error } = await sb.auth.signUp({
          email, password,
          options: { data: { username }, emailRedirectTo: location.origin + location.pathname }
        });
        if (error) throw error;
        if (data.session) closeAuth();
        else msg.textContent = "Fatto! Ti abbiamo mandato un'email: apri il link per confermare, poi accedi.";
        return;
      }
    } catch (err) {
      msg.textContent = friendly(err);
    } finally {
      $('authSubmit').disabled = false;
    }
  }

  // ---------- punteggi e classifica ----------
  async function save(run) {
    const status = $('saveStatus');
    status.textContent = 'Salvo il punteggio…';
    const { error } = await sb.from('scores').insert({ score: run.score, max_combo: run.maxCombo, win: run.win });
    status.textContent = error ? `Punteggio non salvato: ${friendly(error)}` : 'Punteggio salvato in classifica.';
    return !error;
  }

  function row(pos, name, pts, cls) {
    const li = el('li', { className: cls || '' },
      el('span', { className: 'pos', textContent: pos ? pos + '°' : '–' }),
      el('span', { className: 'name', textContent: name }),
      el('span', { className: 'pts', textContent: pts.toLocaleString('it-IT') }));
    return li;
  }

  async function rankOf(score) {
    const { count } = await sb.from('leaderboard').select('user_id', { count: 'exact', head: true }).gt('best', score);
    return (count ?? 0) + 1;
  }

  async function renderBoard(run) {
    const ol = $('board');
    ol.replaceChildren(el('li', { className: 'gap', textContent: 'Carico la classifica…' }));
    const { data, error } = await sb.from('leaderboard').select('user_id, username, best').order('best', { ascending: false }).limit(10);
    if (error) { ol.replaceChildren(el('li', { className: 'gap', textContent: 'Classifica non raggiungibile in questo momento.' })); return; }
    ol.replaceChildren();
    if (!data.length) ol.append(el('li', { className: 'gap', textContent: 'Nessun punteggio ancora: il primo posto è libero.' }));
    data.forEach((r, i) => ol.append(row(i + 1, r.username, r.best, me && r.user_id === me.id ? 'me' : '')));
    const inTop = me && data.some(r => r.user_id === me.id);
    if (me && !inTop) {
      const { data: mine } = await sb.from('leaderboard').select('best').eq('user_id', me.id).maybeSingle();
      if (mine) ol.append(el('li', { className: 'gap', textContent: '…' }), row(await rankOf(mine.best), me.username, mine.best, 'me'));
    } else if (!me && run) {
      ol.append(el('li', { className: 'gap', textContent: '…' }), row(await rankOf(run.score), 'Tu (ospite)', run.score, 'me'));
    }
  }

  // chiamata dal gioco a fine partita
  async function finish(score, maxCombo, win) {
    $('boardWrap').hidden = !sb;
    if (!sb) return;
    const run = { score, maxCombo, win };
    $('saveStatus').textContent = '';
    if (me) { await save(run); pending = null; }
    else { pending = run; $('saveStatus').textContent = 'Sei ospite: accedi per mettere questo punteggio in classifica.'; }
    renderBoard(me ? null : run);
  }

  window.Online = { finish };

  if (!sb) { renderAccount(); return; }
  $('authForm').addEventListener('submit', onSubmit);
  $('authSwitch').addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));
  $('authClose').addEventListener('click', closeAuth);

  sb.auth.onAuthStateChange((_event, session) => {
    // niente await dentro il callback: lo raccomanda supabase-js
    setTimeout(async () => {
      if (session) {
        const { data } = await sb.from('profiles').select('username').eq('id', session.user.id).maybeSingle();
        me = { id: session.user.id, username: (data && data.username) || 'Giocatore' };
        if (pending && await save(pending)) { pending = null; if (!$('ovEnd').hidden) renderBoard(null); }
      } else {
        me = null;
      }
      renderAccount();
    }, 0);
  });
  renderAccount();
})();
