// Verifica che il server, rigiocando seed + clic, ottenga esattamente il punteggio visto nel browser.
// Uso: node tools/sim_test.js
require('../supabase/functions/_shared/sim.js');
const Sim = globalThis.GattitopiSim;
const assert = require('assert');

function play(seed, skill) {
  const s = Sim.create(seed), inputs = [];
  let r = seed;
  const rand = () => ((r = (r * 1103515245 + 12345) >>> 0) / 4294967296);
  while (!s.over) {
    if (rand() < 0.12) {
      // giocatore finto: a volte mira a un bersaglio colpibile, a volte clicca a vuoto su un tombino
      const ok = s.ents.filter(e => Sim.hittable(e) && (skill > rand() || e.type !== 'girl'));
      const t = ok.length && rand() < skill ? ok[Math.floor(rand() * ok.length)] : null;
      const res = Sim.click(s, t ? t.id : -1, t ? -1 : Math.floor(rand() * 10) - 1);
      if (res) inputs.push(res.input);
    }
    Sim.step(s);
  }
  return { s, inputs };
}

let wins = 0;
for (let seed = 1; seed <= 300; seed++) {
  const { s, inputs } = play(seed, (seed % 10) / 10);
  const rep = Sim.replay(seed, JSON.parse(JSON.stringify(inputs)));
  assert.ok(!rep.error, `seed ${seed}: ${rep.error}`);
  assert.strictEqual(rep.score, s.score, `seed ${seed}: punteggio diverso`);
  assert.strictEqual(rep.maxCombo, s.maxCombo);
  assert.strictEqual(rep.win, s.win);
  if (s.win) wins++;
}

// i trucchi devono essere rifiutati
const { s, inputs } = play(42, 0.9);
assert.ok(inputs.length > 3);
const forged = inputs.map(x => x.slice());
forged[1] = [forged[1][0], 9999, -1];
assert.ok(Sim.replay(42, forged).error, 'bersaglio inventato accettato');
const fast = inputs.map(x => x.slice());
fast[2][0] = fast[1][0] + 1;
assert.ok(Sim.replay(42, fast).error, 'clic troppo ravvicinati accettati');
assert.ok(Sim.replay(43, inputs).error || Sim.replay(43, inputs).score !== s.score, 'seed sbagliato con stesso punteggio');
assert.ok(Sim.replay(42, inputs.concat([[s.tick + 100, -1, -1]])).error, 'clic dopo la fine accettati');

console.log(`ok: 300 partite rigiocate identiche (${wins} vinte), 4 trucchi rifiutati`);
