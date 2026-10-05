// Motore di gioco deterministico di Ammazza Gattitopi.
// Lo stesso file gira nel browser (per giocare) e nella Edge Function submit-score (per verificare):
// dato il seed della partita e la lista dei clic, il server rigioca tutto e ottiene lo stesso punteggio.
// Qui c'è solo la logica che decide i punti: niente disegno, niente suoni, niente Math.random.
(function (root) {
  const TICK = 1 / 60;
  const DURATION = 190;               // secondi di gioco: 23:40 -> 06:00, due minuti di gioco al secondo
  const START_MIN = 23 * 60 + 40;
  const MAX_LIVES = 10;
  const MIN_GAP = 5;                  // tick minimi tra due clic (~83 ms)
  const MIN_REACT = 9;                // tick minimi tra la comparsa di un bersaglio e il colpo (~150 ms)
  const WEAPONS = [
    { name: 'Pede', min: 0, dmg: 1, splash: false },
    { name: 'Asse di legno', min: 10, dmg: 2, splash: true }
  ];
  const EVENT_DUR = { ondata: 10, blackout: 12, festa: 12 };
  const EVENT_KEYS = ['ondata', 'blackout', 'festa'];
  const BALL_FLY = 1.6;               // secondi di volo della polpetta di cavallo

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(seed) {
    return {
      rng: mulberry32(seed >>> 0), tick: 0, elapsed: 0,
      score: 0, combo: 0, maxCombo: 0, lives: MAX_LIVES, shield: 0,
      slow: 0, hitstop: 0, spawnT: 0.8, lastHour: 23, event: null, lastEvent: null,
      weapon: 0, ents: [], nextId: 1, lastClickTick: -1000, ball: null, ballT: 40,
      over: false, win: false, invalid: null
    };
  }

  const isPest = e => e.type === 'rat' || e.type === 'boss' || e.type === 'baby';
  const hittable = e => !e.dead && e.state !== 'hit' && (e.state === 'jump' || e.rise >= 0.35);
  const mult = s => Math.min(5, 1 + Math.floor(s.combo / 5));
  const bonus = s => (s.event && s.event.type === 'festa' ? 2 : 1);
  const progress = s => Math.min(1, s.elapsed / DURATION);
  const weaponIndex = s => (s.combo >= WEAPONS[1].min ? 1 : 0);
  const rnd = (s, a, b) => a + s.rng() * (b - a);
  const pick = (s, arr) => arr[Math.floor(s.rng() * arr.length)];
  const freeHoles = s => [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !s.ents.some(e => e.hole === i));
  // l'asse prende il tombino colpito e quelli accanto sulla stessa fila
  const nearSameRow = (a, b) => Math.floor(a / 3) === Math.floor(b / 3) && Math.abs((a % 3) - (b % 3)) <= 1;

  function bumpCombo(s) { s.combo++; if (s.combo > s.maxCombo) s.maxCombo = s.combo; }

  function spawn(s, ev) {
    const free = freeHoles(s);
    if (!free.length) return;
    const hole = pick(s, free), p = progress(s), r = s.rng();
    const table = [
      ['ara', 0.04], ['tri', 0.025], ['fuochi', p > 0.15 ? 0.02 : 0], ['frog', 0.06],
      ['girl', 0.1 + 0.06 * p], ['boss', 0.04 + 0.07 * p], ['baby', 0.1 + 0.08 * p]
    ];
    let type = 'rat', acc = 0;
    for (const [t, pr] of table) { acc += pr; if (r < acc) { type = t; break; } }
    const baseStay = 1.35 - 0.75 * p;
    const stayBy = { boss: baseStay * 1.8, ara: baseStay * 0.8, tri: baseStay * 0.75, fuochi: baseStay * 0.7, baby: baseStay * 0.55, frog: 0.55 };
    const e = {
      id: s.nextId++, born: s.tick, hole, type, rise: 0, state: 'rise', t: 0, anim: 0, wob: 0, dead: false,
      hp: type === 'boss' ? 3 : 1, jumps: type === 'frog' ? 2 + Math.floor(s.rng() * 3) : 0,
      stay: stayBy[type] || baseStay * rnd(s, 0.85, 1.15)
    };
    s.ents.push(e);
    ev.push({ k: 'spawn', e });
  }

  function kill(s, e, ev, quiet) {
    const air = e.state === 'jump';
    e.dead = true; e.state = 'hit'; e.t = 0;
    bumpCombo(s);
    let pts;
    if (e.type === 'boss') { pts = 500 * mult(s) * bonus(s); s.hitstop = 0.09; }
    else if (e.type === 'frog') pts = (air ? 600 : 300) * mult(s) * bonus(s);
    else { pts = (e.type === 'baby' ? 150 : 100) * mult(s) * bonus(s); s.hitstop = Math.max(s.hitstop, 0.04); }
    s.score += pts;
    ev.push({ k: 'kill', e, pts, air, quiet: !!quiet });
  }

  function strike(s, e, dmg, ev) {
    if (e.type === 'boss') {
      e.hp -= dmg; e.wob = 0.3; e.t = Math.max(0, e.t - 0.45);
      if (e.hp <= 0) kill(s, e, ev);
      else ev.push({ k: 'bossHit', e });
    } else if (e.type === 'girl') {
      s.combo = 0;
      e.state = 'hit'; e.t = 0; e.dead = true;
      s.lives = Math.max(0, s.lives - 1);
      ev.push({ k: 'girl', e });
    } else if (e.type === 'ara') {
      bumpCombo(s);
      s.score += 50 * mult(s) * bonus(s); s.slow = 5; s.lives = Math.min(MAX_LIVES, s.lives + 1);
      e.state = 'hit'; e.t = 0; e.dead = true;
      ev.push({ k: 'ara', e });
    } else if (e.type === 'tri') {
      bumpCombo(s);
      s.shield = Math.min(5, s.shield + 3);
      e.state = 'hit'; e.t = 0; e.dead = true;
      ev.push({ k: 'tri', e });
    } else if (e.type === 'fuochi') {
      bumpCombo(s);
      e.state = 'hit'; e.t = 0; e.dead = true;
      const targets = s.ents.filter(x => x !== e && !x.dead && (isPest(x) || x.type === 'frog'));
      ev.push({ k: 'fuochi', e, pests: targets.some(isPest) });
      for (const x of targets) kill(s, x, ev, true);
    } else {
      kill(s, e, ev);
    }
  }

  function escape(s, e, ev) {
    if (!isPest(e)) return;
    if (s.shield > 0) { s.shield--; ev.push({ k: 'escape', e, shielded: true }); return; }
    s.combo = 0;
    s.lives = Math.max(0, s.lives - (e.type === 'boss' ? 2 : 1));
    ev.push({ k: 'escape', e, shielded: false });
  }

  // Un clic. target = id del bersaglio scelto dal browser (-1 se nessuno), hole = tombino più vicino (-1 se nessuno).
  // Ritorna null se il clic è ignorato (troppo ravvicinato), altrimenti { input, events }:
  // input è il clic come va registrato e rigiocato, identico su browser e server.
  function click(s, target, hole) {
    if (s.over || s.tick - s.lastClickTick < MIN_GAP) return null;
    s.lastClickTick = s.tick;
    const ev = [];
    // la polpetta di cavallo lanciata dall'arrostitore: presa al volo, rosario di nuovo pieno
    if (s.ball && target === s.ball.id) {
      if (s.tick - s.ball.born < MIN_REACT) { s.invalid = 'bersaglio non valido'; return { input: [s.tick, target, hole], events: ev }; }
      s.ball = null; s.lives = MAX_LIVES;
      ev.push({ k: 'ballCatch' });
      return { input: [s.tick, target, hole], events: ev };
    }
    let e = target >= 0 ? s.ents.find(x => x.id === target) : null;
    if (target >= 0 && (!e || !hittable(e))) { s.invalid = 'bersaglio non valido'; return { input: [s.tick, target, hole], events: ev }; }
    let recTarget = target, recHole = hole;
    if (e && s.tick - e.born < MIN_REACT) { recTarget = -1; recHole = e.hole; hole = e.hole; e = null; } // troppo presto: colpo a vuoto
    const w = WEAPONS[weaponIndex(s)];
    let center = e ? e.hole : hole, girlDodge = false, hits = 0;
    if (e && w.splash && e.type === 'girl') { girlDodge = true; e = null; }   // l'asse passa sopra 'a picciridda
    if (e) { strike(s, e, w.dmg, ev); hits++; }
    if (w.splash && center >= 0) {
      for (const x of s.ents) {
        if (x === e || !hittable(x) || x.state === 'jump' || !isPest(x) || !nearSameRow(center, x.hole)) continue;
        strike(s, x, w.dmg, ev); hits++;
      }
    }
    if (!hits) {
      ev.push({ k: 'miss', overGirl: girlDodge, prevCombo: s.combo });
      if (!girlDodge) s.combo = 0;
    }
    return { input: [s.tick, recTarget, recHole], events: ev };
  }

  function startEvent(s, hour, ev) {
    const type = pick(s, EVENT_KEYS.filter(k => k !== s.lastEvent));
    s.lastEvent = type;
    s.event = { type, t: EVENT_DUR[type], dur: EVENT_DUR[type] };
    ev.push({ k: 'event', type, hour });
  }

  // Avanza di un tick (1/60 s). Ritorna gli eventi successivi, per effetti e suoni.
  function step(s) {
    const ev = [];
    if (s.over) return ev;
    s.tick++;
    const dt = TICK;
    if (s.hitstop > 0) { s.hitstop -= dt; return ev; }
    s.elapsed += dt;
    s.slow = Math.max(0, s.slow - dt);
    const sdt = dt * (s.slow > 0 ? 0.45 : 1);

    if (s.event) { s.event.t -= dt; if (s.event.t <= 0) s.event = null; }
    const mins = (START_MIN + Math.floor(s.elapsed * 2)) % (24 * 60), hour = Math.floor(mins / 60);
    if (hour !== s.lastHour) { s.lastHour = hour; if (hour !== 6) startEvent(s, hour, ev); }

    const wi = weaponIndex(s);
    if (wi !== s.weapon) { ev.push({ k: 'weapon', name: WEAPONS[wi].name, up: wi > s.weapon }); s.weapon = wi; }

    s.ballT -= dt;
    if (s.ballT <= 0 && !s.ball) {
      s.ballT = rnd(s, 35, 55);
      s.ball = { id: s.nextId++, born: s.tick, t: 0 };
      ev.push({ k: 'ballThrow' });
    }
    if (s.ball) {
      s.ball.t += sdt;
      if (s.ball.t >= BALL_FLY) { s.ball = null; ev.push({ k: 'ballMiss' }); }
    }

    s.spawnT -= sdt;
    if (s.spawnT <= 0) {
      const p = progress(s), rush = s.event && s.event.type === 'ondata' ? 0.4 : 1;
      s.spawnT = (1.05 - 0.62 * p) * rnd(s, 0.75, 1.2) * rush;
      spawn(s, ev);
      if (p > 0.35 && s.rng() < 0.15 + 0.25 * p) spawn(s, ev);
    }

    for (const e of s.ents) {
      e.anim += sdt; e.wob = Math.max(0, e.wob - sdt);
      if (e.state === 'rise') { e.rise += sdt / 0.2; if (e.rise >= 1) { e.rise = 1; e.state = 'stay'; e.t = 0; } }
      else if (e.state === 'stay') {
        e.t += sdt;
        if (e.t >= e.stay) {
          if (e.type === 'frog' && e.jumps > 0) {
            const free = freeHoles(s);
            if (free.length) { e.from = e.hole; e.hole = pick(s, free); e.state = 'jump'; e.jt = 0; e.jumps--; ev.push({ k: 'jump', e }); }
            else e.state = 'down';
          } else e.state = 'down';
        }
      } else if (e.state === 'jump') {
        e.jt += sdt / 0.5;
        if (e.jt >= 1) { e.state = 'stay'; e.t = 0; e.rise = 1; }
      } else if (e.state === 'hit') {
        e.t += sdt;
        if (e.t >= 0.4) { e.state = 'down'; if (e.from !== undefined && e.jt < 1) e.rise = 1; }
      } else if (e.state === 'down') {
        e.rise -= sdt / (e.dead ? 0.12 : e.type === 'baby' ? 0.1 : 0.18);
        if (e.rise <= 0) { e.gone = true; if (!e.dead) escape(s, e, ev); }
      }
    }
    s.ents = s.ents.filter(e => !e.gone);

    if (s.lives <= 0) { s.over = true; s.win = false; ev.push({ k: 'end', win: false }); }
    else if (s.elapsed >= DURATION) {
      s.over = true; s.win = true; s.dawnBonus = s.lives * 1000; s.score += s.dawnBonus;
      ev.push({ k: 'end', win: true });
    }
    return ev;
  }

  // Rigioca una partita dal seed e dai clic registrati: lo usa il server per calcolare il punteggio vero.
  function replay(seed, inputs, maxTicks = 60 * 600) {
    if (!Array.isArray(inputs) || inputs.length > 4000) return { error: 'formato dei clic' };
    const s = create(seed);
    let i = 0;
    while (!s.over && s.tick < maxTicks) {
      while (i < inputs.length && Array.isArray(inputs[i]) && inputs[i][0] === s.tick) {
        const [, target, hole] = inputs[i];
        if (!Number.isInteger(target) || !Number.isInteger(hole) || hole < -1 || hole > 8) return { error: 'formato dei clic' };
        const r = click(s, target, hole);
        if (!r) return { error: 'clic troppo ravvicinati' };
        if (s.invalid) return { error: s.invalid };
        if (r.input[1] !== target || r.input[2] !== hole) return { error: 'clic non coerente' };
        i++;
      }
      if (i < inputs.length && !(Array.isArray(inputs[i]) && Number.isInteger(inputs[i][0]) && inputs[i][0] > s.tick)) return { error: 'ordine dei clic' };
      step(s);
    }
    if (i < inputs.length) return { error: 'clic dopo la fine' };
    if (!s.over) return { error: 'partita troppo lunga' };
    return { score: s.score, maxCombo: s.maxCombo, win: s.win, ticks: s.tick };
  }

  root.GattitopiSim = {
    TICK, DURATION, START_MIN, MAX_LIVES, WEAPONS, BALL_FLY, MIN_REACT,
    create, step, click, replay, hittable, isPest,
    weapon: s => WEAPONS[weaponIndex(s)], mult, bonus, progress
  };
})(globalThis);
