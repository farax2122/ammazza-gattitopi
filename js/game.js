(() => {
  const $ = id => document.getElementById(id);
  const stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
  const DISPLAY = "'Bowlby One SC', Impact, 'Arial Black', sans-serif";
  const FW_COLORS = ['#f2c230', '#e8642c', '#f4efe2', '#7fb2ff', '#c8312b', '#9be07f'];

  let W = 0, H = 0, DPR = 1, bgC = null, holes = [], hz = 0;
  let griller = null, welcome = null, sb = { x: 0, top: 0, S: 0 }, park = { x: 0, y: 0, rx: 0, ry: 0 }, etna = { x: 0, y: 0, flows: [] }, flag = { x: 0, y: 0, s: 10 }, fountain = { x: 0, y: 0, w: 60 }, lamps = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const seeded = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  function ell(c, x, y, rx, ry, fill) {
    c.beginPath(); c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
    c.fillStyle = fill; c.fill();
  }

  // ---------- Simboli: Trinacria, Santa Barbara ----------
  function drawTrinacria(c, x, y, R, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const pass of [[R * 0.26, '#6b3510'], [R * 0.16, '#f6d9a8']]) {
      c.lineWidth = pass[0]; c.strokeStyle = pass[1];
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3 - Math.PI / 2;
        const kx = Math.cos(a) * R * 0.62, ky = Math.sin(a) * R * 0.62;
        const fx = kx + Math.cos(a + 1.3) * R * 0.48, fy = ky + Math.sin(a + 1.3) * R * 0.48;
        const tx = fx + Math.cos(a + 1.3 + 1.4) * R * 0.14, ty = fy + Math.sin(a + 1.3 + 1.4) * R * 0.14;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(kx, ky); c.lineTo(fx, fy); c.lineTo(tx, ty); c.stroke();
      }
    }
    for (let k = 0; k < 10; k++) {
      const a = k * Math.PI / 5;
      ell(c, Math.cos(a) * R * 0.36, Math.sin(a) * R * 0.36, R * 0.08, R * 0.08, k % 2 ? '#3f8a3a' : '#e8642c');
    }
    ell(c, 0, 0, R * 0.32, R * 0.32, '#f2c230');
    ell(c, -R * 0.11, -R * 0.05, R * 0.04, R * 0.04, '#3a1d0a');
    ell(c, R * 0.11, -R * 0.05, R * 0.04, R * 0.04, '#3a1d0a');
    c.strokeStyle = '#3a1d0a'; c.lineWidth = Math.max(1, R * 0.03);
    c.beginPath(); c.arc(0, R * 0.06, R * 0.12, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    c.restore();
  }

  function sicilyDisc(c, x, y, R) {
    c.save(); c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#c8312b'; c.fillRect(x - R, y - R, R * 2, R * 2);
    c.fillStyle = '#f2c230'; c.beginPath(); c.moveTo(x - R, y + R); c.lineTo(x + R, y - R); c.lineTo(x + R, y + R); c.fill();
    c.restore();
  }

  function drawSantaBarbara(c, x, base, S) {
    // S = altezza della statua; colonna e piedistallo sotto
    const ped = S * 0.55, col = S * 1.5, top = base - ped - col;
    sb = { x, top, S };
    c.fillStyle = '#3c3a58';
    c.fillRect(x - S * 0.42, base - ped * 0.35, S * 0.84, ped * 0.35);
    c.fillRect(x - S * 0.32, base - ped, S * 0.64, ped * 0.7);
    c.fillStyle = '#4a4868'; c.fillRect(x - S * 0.38, base - ped - S * 0.06, S * 0.76, S * 0.08);
    c.fillStyle = '#d8d2c0'; c.fillRect(x - S * 0.12, top, S * 0.24, col);
    c.fillStyle = '#b9b2a0'; c.fillRect(x - S * 0.12, top, S * 0.06, col);
    c.fillStyle = '#e5dfcc'; c.fillRect(x - S * 0.2, top - S * 0.05, S * 0.4, S * 0.08);
  }

  // Simulacro di Santa Barbara (1745): abito d'argento cesellato, attributi d'oro.
  // Animato in loop come una gif: riflesso che scorre sull'argento, aureola a raggi, palma che ondeggia, scintille.
  function drawSBFigure(t) {
    const { x, top, S } = sb, c = ctx;
    if (!S) return;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    const glow = c.createRadialGradient(x, top - S * 0.55, 2, x, top - S * 0.55, S * (1.5 + pulse * 0.25));
    glow.addColorStop(0, `rgba(242,214,120,${0.24 + pulse * 0.12})`); glow.addColorStop(1, 'rgba(242,194,48,0)');
    c.fillStyle = glow; c.fillRect(x - S * 2.2, top - S * 2.4, S * 4.4, S * 3.8);
    // raggi dell'aureola
    const hx = x, hy = top - S * 0.86;
    c.save(); c.translate(hx, hy); c.rotate(t * 0.4);
    c.strokeStyle = `rgba(255,226,140,${0.35 + pulse * 0.25})`; c.lineWidth = Math.max(1, S * 0.02);
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, r0 = S * 0.2, r1 = S * (i % 2 ? 0.3 : 0.38);
      c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke();
    }
    c.restore();
    c.strokeStyle = '#f2c94c'; c.lineWidth = Math.max(1, S * 0.03);
    c.beginPath(); c.arc(hx, hy, S * 0.18, 0, Math.PI * 2); c.stroke();
    // torre d'oro, attributo della santa
    c.fillStyle = '#d9b443';
    c.fillRect(x - S * 0.46, top - S * 0.46, S * 0.15, S * 0.44);
    for (let i = 0; i < 3; i++) c.fillRect(x - S * 0.46 + i * S * 0.055, top - S * 0.52, S * 0.035, S * 0.07);
    c.fillStyle = '#6a4f12';
    for (let i = 0; i < 3; i++) c.fillRect(x - S * 0.405, top - S * (0.38 - i * 0.11), S * 0.04, S * 0.06);
    // abito d'argento con riflesso che scorre
    const band = ((t * 0.35) % 1.6) - 0.3;
    const silver = c.createLinearGradient(x - S * 0.3, top - S * 0.75, x + S * 0.3, top);
    silver.addColorStop(0, '#7d8494');
    silver.addColorStop(Math.max(0, Math.min(1, band - 0.12)), '#b9bfcc');
    silver.addColorStop(Math.max(0, Math.min(1, band)), '#ffffff');
    silver.addColorStop(Math.max(0, Math.min(1, band + 0.12)), '#b9bfcc');
    silver.addColorStop(1, '#6f7686');
    c.fillStyle = silver;
    c.beginPath();
    c.moveTo(x - S * 0.3, top - S * 0.04);
    c.quadraticCurveTo(x - S * 0.22, top - S * 0.48, x - S * 0.13, top - S * 0.72);
    c.lineTo(x + S * 0.13, top - S * 0.72);
    c.quadraticCurveTo(x + S * 0.22, top - S * 0.48, x + S * 0.3, top - S * 0.04);
    c.closePath(); c.fill();
    // pieghe cesellate e bordo d'oro del manto
    c.strokeStyle = 'rgba(70,76,92,0.55)'; c.lineWidth = Math.max(1, S * 0.015);
    for (const fx of [-0.14, -0.04, 0.06, 0.16]) {
      c.beginPath(); c.moveTo(x + S * fx * 0.5, top - S * 0.6); c.quadraticCurveTo(x + S * fx * 1.4, top - S * 0.3, x + S * fx * 1.6, top - S * 0.05); c.stroke();
    }
    c.strokeStyle = '#e2b33c'; c.lineWidth = Math.max(1, S * 0.025);
    c.beginPath(); c.moveTo(x - S * 0.13, top - S * 0.7); c.quadraticCurveTo(x - S * 0.24, top - S * 0.35, x - S * 0.3, top - S * 0.05); c.stroke();
    c.beginPath(); c.moveTo(x - S * 0.3, top - S * 0.05); c.lineTo(x + S * 0.3, top - S * 0.05); c.stroke();
    // volto e mani in smalto
    ell(c, x, top - S * 0.81, S * 0.085, S * 0.1, '#e9c7a8');
    ell(c, x - S * 0.03, top - S * 0.83, S * 0.01, S * 0.012, '#5a3a2a');
    ell(c, x + S * 0.03, top - S * 0.83, S * 0.01, S * 0.012, '#5a3a2a');
    ell(c, x + S * 0.13, top - S * 0.45, S * 0.04, S * 0.035, '#e9c7a8');
    // corona d'oro con scintilla
    c.fillStyle = '#f2c94c';
    c.beginPath(); c.moveTo(x - S * 0.09, top - S * 0.9);
    for (let i = 0; i <= 4; i++) c.lineTo(x - S * 0.09 + i * S * 0.045, top - S * (i % 2 ? 0.95 : 1.02));
    c.lineTo(x + S * 0.09, top - S * 0.9); c.closePath(); c.fill();
    // palma d'oro che ondeggia
    c.save(); c.translate(x + S * 0.13, top - S * 0.45); c.rotate(Math.sin(t * 1.6) * 0.09);
    c.strokeStyle = '#e2b33c'; c.lineWidth = Math.max(1, S * 0.03); c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(S * 0.2, -S * 0.3, S * 0.17, -S * 0.62); c.stroke();
    for (let i = 0; i < 6; i++) {
      const py = -S * (0.28 + i * 0.065), px = S * (0.19 - i * 0.004), fl = Math.sin(t * 3 + i) * S * 0.012;
      c.beginPath(); c.moveTo(px, py); c.lineTo(px + S * 0.11, py + S * 0.05 + fl);
      c.moveTo(px, py); c.lineTo(px - S * 0.1, py + S * 0.06 - fl); c.stroke();
    }
    c.restore();
    // cartiglio rosso che sventola sulla colonna, sotto la statua
    const rw = Math.max(S * 3.2, 120), rh = Math.max(S * 0.34, 14), ry = top + S * 0.7;
    const n = 14;
    c.fillStyle = '#8a1a14';
    for (const side of [-1, 1]) {
      const ex2 = x + side * rw / 2, wv = Math.sin(t * 2.4 + side) * rh * 0.12;
      c.beginPath(); c.moveTo(ex2, ry - rh * 0.4 + wv); c.lineTo(ex2 + side * rh * 0.7, ry - rh * 0.4 + wv);
      c.lineTo(ex2 + side * rh * 0.4, ry + wv + rh * 0.1); c.lineTo(ex2 + side * rh * 0.7, ry + rh * 0.6 + wv); c.lineTo(ex2, ry + rh * 0.6 + wv); c.closePath(); c.fill();
    }
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const u = i / n, px = x - rw / 2 + u * rw, py = ry - rh / 2 + Math.sin(t * 2.4 + u * 5) * rh * 0.12;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    for (let i = n; i >= 0; i--) {
      const u = i / n, px = x - rw / 2 + u * rw, py = ry + rh / 2 + Math.sin(t * 2.4 + u * 5) * rh * 0.12;
      c.lineTo(px, py);
    }
    c.closePath();
    const rib = c.createLinearGradient(0, ry - rh / 2, 0, ry + rh / 2);
    rib.addColorStop(0, '#d4372b'); rib.addColorStop(1, '#a3241b');
    c.fillStyle = rib; c.fill();
    c.strokeStyle = '#f2c230'; c.lineWidth = 1; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    let fs = Math.round(rh * 0.62);
    c.font = `${fs}px ${DISPLAY}`;
    const tw2 = c.measureText('Evviva Santa Barbara').width;
    if (tw2 > rw * 0.9) { fs = Math.floor(fs * rw * 0.9 / tw2); c.font = `${fs}px ${DISPLAY}`; }
    c.fillStyle = '#f2c230';
    c.fillText('Evviva Santa Barbara', x, ry + 1 + Math.sin(t * 2.4 + 2.5) * rh * 0.12);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';

    // scintille intorno
    for (let i = 0; i < 5; i++) {
      const ph = t * 2.2 + i * 1.7, k = Math.max(0, Math.sin(ph));
      if (k < 0.05) continue;
      const a = i * 1.26 + Math.floor(ph / (Math.PI * 2)) * 0.9;
      const sx = x + Math.cos(a) * S * 0.48, sy = top - S * 0.5 + Math.sin(a) * S * 0.55, r = S * 0.07 * k;
      c.fillStyle = `rgba(255,240,190,${k})`;
      c.beginPath(); c.moveTo(sx, sy - r); c.lineTo(sx + r * 0.25, sy); c.lineTo(sx, sy + r); c.lineTo(sx - r * 0.25, sy); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(sx - r, sy); c.lineTo(sx, sy + r * 0.25); c.lineTo(sx + r, sy); c.lineTo(sx, sy - r * 0.25); c.closePath(); c.fill();
    }
  }

  // ---------- Sfondo: cielo  // ---------- Sfondo: cielo, Etna, collina storica, Santa Barbara, palazzi, fontana, basole ----------
  function streetTop() { return H * (W < H ? 0.32 : 0.38); }

  function buildBg() {
    bgC = document.createElement('canvas');
    bgC.width = Math.max(1, W * DPR); bgC.height = Math.max(1, H * DPR);
    const c = bgC.getContext('2d'); c.scale(DPR, DPR);
    const R = seeded(11);
    hz = streetTop();
    const U = Math.min(W, H * 1.6);

    let g = c.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, '#0b1029'); g.addColorStop(1, '#2b3567');
    c.fillStyle = g; c.fillRect(0, 0, W, hz);
    for (let i = 0; i < 160; i++) {
      c.fillStyle = `rgba(244,239,226,${0.25 + R() * 0.6})`;
      const s = R() * 1.6 + 0.4; c.fillRect(R() * W, R() * hz * 0.6, s, s);
    }
    const mr = U * 0.03;
    ell(c, W * 0.92, hz * 0.16, mr, mr, '#f4efe2');
    ell(c, W * 0.92 + mr * 0.4, hz * 0.16 - mr * 0.2, mr * 0.85, mr * 0.85, '#151d40');

    // Etna: massiccio largo con crateri sommitali e coni avventizi, fianco a destra illuminato dalla luna
    const ex = W * 0.74, et = hz * 0.2, eb = hz * 0.84, eh = eb - et;
    etna = { x: ex, y: et, flows: [] };
    const prof = [[W * 0.26, eb], [ex - W * 0.24, et + eh * 0.62], [ex - W * 0.14, et + eh * 0.3], [ex - W * 0.07, et + eh * 0.1],
      [ex - W * 0.03, et + 1], [ex - W * 0.012, et - 2], [ex + W * 0.004, et + 5], [ex + W * 0.02, et - 1], [ex + W * 0.045, et + eh * 0.06],
      [ex + W * 0.09, et + eh * 0.17], [ex + W * 0.11, et + eh * 0.14], [ex + W * 0.13, et + eh * 0.24], [ex + W * 0.2, et + eh * 0.42],
      [ex + W * 0.23, et + eh * 0.4], [ex + W * 0.26, et + eh * 0.55], [W * 1.2, eb]];
    const etnaPath = () => {
      c.beginPath(); c.moveTo(prof[0][0], prof[0][1]);
      for (let i = 1; i < prof.length - 1; i++) {
        const mx = (prof[i][0] + prof[i + 1][0]) / 2, my = (prof[i][1] + prof[i + 1][1]) / 2;
        c.quadraticCurveTo(prof[i][0], prof[i][1], mx, my);
      }
      c.lineTo(prof[prof.length - 1][0], prof[prof.length - 1][1]); c.closePath();
    };
    let eg = c.createLinearGradient(ex - W * 0.2, 0, ex + W * 0.2, 0);
    eg.addColorStop(0, '#131733'); eg.addColorStop(0.5, '#1d2247'); eg.addColorStop(1, '#2a3060');
    c.fillStyle = eg; etnaPath(); c.fill();
    c.save(); etnaPath(); c.clip();
    const ev = c.createLinearGradient(0, et, 0, eb);
    ev.addColorStop(0, 'rgba(0,0,0,0)'); ev.addColorStop(1, 'rgba(8,10,25,0.55)');
    c.fillStyle = ev; c.fillRect(ex - W * 0.5, et - 5, W, eh + 10);
    // neve e canaloni vicino alla vetta
    c.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const dx = (R() * 2 - 1) * W * 0.09, y0 = et + Math.abs(dx) * eh * 0.9 / (W * 0.12) + R() * eh * 0.05;
      c.strokeStyle = `rgba(205,215,245,${0.12 + R() * 0.22})`; c.lineWidth = 1 + R() * 1.5;
      c.beginPath(); c.moveTo(ex + dx, y0); c.lineTo(ex + dx * 1.15 + (R() - 0.5) * 4, y0 + eh * (0.06 + R() * 0.08)); c.stroke();
    }
    // colate: lava raffreddata scura, il tratto vivo è animato dal vivo
    for (let k = 0; k < 3; k++) {
      const pts = [[ex + (k - 1) * 3, et + 4]];
      let fx = pts[0][0], fy = pts[0][1];
      const drift = (k - 1) * W * 0.012 + (R() - 0.5) * W * 0.01, end = et + eh * (0.45 + R() * 0.3);
      while (fy < end) { fy += eh * 0.06; fx += drift * 0.5 + (R() - 0.5) * W * 0.008; pts.push([fx, fy]); }
      etna.flows.push(pts);
      c.strokeStyle = 'rgba(90,30,20,0.9)'; c.lineWidth = 4;
      c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    }
    c.restore();

    // Collina storica
    const hillY = x => { // altezza della collina in x (approssimata)
      const t = Math.max(0, Math.min(1, x / (W * 0.5)));
      return hz - Math.sin(Math.PI * t) * hz * 0.34;
    };
    c.fillStyle = '#161a38';
    c.beginPath(); c.moveTo(-10, hz);
    for (let x = 0; x <= W * 0.5; x += 4) c.lineTo(x, hillY(x));
    c.lineTo(W * 0.5, hz); c.closePath(); c.fill();

    // Scalinata verso la Chiesa Madre
    c.strokeStyle = 'rgba(242,194,48,0.35)'; c.lineWidth = 1.5;
    c.beginPath();
    let sx = W * 0.44, sy = hz - 2, dir = -1;
    c.moveTo(sx, sy);
    for (let i = 0; i < 5; i++) { sx += dir * W * 0.035; sy -= hz * 0.05; c.lineTo(sx, sy); dir *= -1; }
    c.stroke();
    for (let i = 0; i < 6; i++) ell(c, W * 0.44 - (i % 2) * W * 0.035, hz - 2 - i * hz * 0.05, 1.8, 1.8, 'rgba(242,194,48,0.9)');

    // Chiesa Madre (Santa Maria dell'Alto) con campanile
    const chx = W * 0.33, chBase = hillY(chx) + 4, chw = Math.max(26, U * 0.06), chh = chw * 0.8;
    c.fillStyle = '#3a3352';
    c.fillRect(chx - chw / 2, chBase - chh, chw, chh);
    c.beginPath(); c.moveTo(chx - chw / 2 - 2, chBase - chh); c.lineTo(chx, chBase - chh - chw * 0.35); c.lineTo(chx + chw / 2 + 2, chBase - chh); c.fill();
    c.fillStyle = 'rgba(242,194,48,0.7)';
    c.beginPath(); c.arc(chx, chBase - chh * 0.62, chw * 0.09, 0, Math.PI * 2); c.fill();
    c.fillRect(chx - chw * 0.08, chBase - chh * 0.35, chw * 0.16, chh * 0.35);
    const ctw = chw * 0.32, ctx0 = chx + chw / 2, cth = chh * 1.9;
    c.fillStyle = '#332d4a'; c.fillRect(ctx0, chBase - cth, ctw, cth);
    c.beginPath(); c.moveTo(ctx0 - 1, chBase - cth); c.lineTo(ctx0 + ctw / 2, chBase - cth - ctw * 1.3); c.lineTo(ctx0 + ctw + 1, chBase - cth); c.fill();
    c.fillStyle = 'rgba(242,194,48,0.85)'; c.fillRect(ctx0 + ctw * 0.3, chBase - cth * 0.82, ctw * 0.4, ctw * 0.55);

    // Castello Normanno (1072): dongione rettangolare 24 x 18 m, alto 34 m, in pietra lavica
    // con cantonali e cornici di calcare chiaro (la bicromia tipica), grandi bifore al piano nobile
    // e portale ogivale. Illuminato dal basso di notte.
    const cx0 = W * 0.2, cBase = hillY(cx0) + 8;
    const cw = Math.max(40, U * 0.095), chh2 = cw * 1.4, cTop = cBase - chh2, sd = cw * 0.32;
    const L = cx0 - cw / 2, Rr = cx0 + cw / 2;
    const up = c.createRadialGradient(cx0, cBase, 2, cx0, cBase - chh2 * 0.4, chh2 * 1.5);
    up.addColorStop(0, 'rgba(255,190,90,0.45)'); up.addColorStop(1, 'rgba(242,194,48,0)');
    c.fillStyle = up; c.fillRect(cx0 - chh2 * 1.6, cTop - chh2 * 0.8, chh2 * 3.2, chh2 * 2.3);
    // rampa d'accesso
    c.fillStyle = '#2a2638';
    c.beginPath(); c.moveTo(cx0 - cw * 0.1, cBase); c.lineTo(cx0 + cw * 0.45, cBase + cw * 0.12); c.lineTo(cx0 + cw * 0.6, cBase + cw * 0.12); c.lineTo(cx0 + cw * 0.1, cBase); c.fill();
    // facciata laterale in scorcio, più in ombra
    let g2 = c.createLinearGradient(0, cTop, 0, cBase);
    g2.addColorStop(0, '#231d22'); g2.addColorStop(1, '#4a3a32');
    c.fillStyle = g2;
    c.beginPath(); c.moveTo(Rr, cTop); c.lineTo(Rr + sd, cTop - sd * 0.35); c.lineTo(Rr + sd, cBase - sd * 0.35); c.lineTo(Rr, cBase); c.closePath(); c.fill();
    // facciata principale: pietra lavica scura illuminata dal basso
    const stone = c.createLinearGradient(0, cTop, 0, cBase);
    stone.addColorStop(0, '#2e2729'); stone.addColorStop(0.6, '#55453c'); stone.addColorStop(1, '#8a6a52');
    c.fillStyle = stone; c.fillRect(L, cTop, cw, chh2);
    // conci irregolari
    for (let i = 0; i < 140; i++) {
      const bx = L + R() * cw, by = cTop + R() * chh2, bw2 = 2 + R() * cw * 0.07, bh2 = 1.5 + R() * 2.5;
      c.fillStyle = R() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,220,180,0.07)';
      c.fillRect(Math.min(bx, Rr - bw2), by, bw2, bh2);
    }
    // cantonali di calcare alternati
    const qh = chh2 / 14;
    for (let i = 0; i < 14; i++) {
      const long = i % 2 === 0, qw = cw * (long ? 0.11 : 0.065), qy = cTop + i * qh;
      const lit = 0.55 + 0.45 * (i / 14);
      c.fillStyle = `rgba(${Math.round(217 * lit + 30)},${Math.round(205 * lit + 25)},${Math.round(180 * lit + 20)},1)`;
      c.fillRect(L, qy + 0.5, qw, qh - 1);
      c.fillRect(Rr - qw, qy + 0.5, qw, qh - 1);
      c.fillStyle = `rgba(${Math.round(150 * lit)},${Math.round(140 * lit)},${Math.round(120 * lit)},1)`;
      c.beginPath(); c.moveTo(Rr, qy + 0.5); c.lineTo(Rr + sd * (long ? 0.35 : 0.2), qy + 0.5 - sd * 0.35 * (long ? 0.35 : 0.2) / 1);
      c.lineTo(Rr + sd * (long ? 0.35 : 0.2), qy + qh - 1 - sd * 0.35 * (long ? 0.35 : 0.2)); c.lineTo(Rr, qy + qh - 1); c.fill();
    }
    // cornici marcapiano tra i tre livelli
    c.fillStyle = 'rgba(222,208,180,0.75)';
    for (const f of [0.36, 0.68]) c.fillRect(L, cTop + chh2 * f, cw, Math.max(1.5, chh2 * 0.012));
    // coronamento con merli
    const mw = cw / 11;
    c.fillStyle = '#3a3034';
    c.fillRect(L - 1, cTop - mw * 0.25, cw + 2, mw * 0.3);
    for (let i = 0; i < 11; i += 2) c.fillRect(L + i * mw, cTop - mw * 1.1, mw, mw * 0.9);
    c.fillStyle = '#231d22';
    for (let i = 0; i < 3; i++) c.fillRect(Rr + sd * (0.1 + i * 0.32), cTop - sd * 0.35 * (0.1 + i * 0.32) - mw * 1.0, sd * 0.18, mw * 0.85);
    // arco a sesto acuto
    const ogive = (x, y, w, h) => {
      c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h * 0.6);
      c.quadraticCurveTo(x - w / 2, y - h, x, y - h); c.quadraticCurveTo(x + w / 2, y - h, x + w / 2, y - h * 0.6);
      c.lineTo(x + w / 2, y); c.closePath();
    };
    // grandi bifore del piano nobile, cornice in calcare, colonnina centrale
    const bifora = (bx, by, s) => {
      c.fillStyle = 'rgba(225,212,186,0.9)'; ogive(bx, by, s * 2.3, s * 2.6); c.fill();
      for (const ox of [-s * 0.5, s * 0.5]) {
        const lg = c.createLinearGradient(0, by - s * 2.2, 0, by);
        lg.addColorStop(0, '#ffd27a'); lg.addColorStop(1, '#e89a3a');
        c.fillStyle = lg; ogive(bx + ox, by - s * 0.08, s * 0.78, s * 2.0); c.fill();
      }
      c.fillStyle = '#e8dcc2'; c.fillRect(bx - s * 0.06, by - s * 1.3, s * 0.12, s * 1.25);
      ell(c, bx, by - s * 1.68, s * 0.16, s * 0.16, '#ffd27a');
    };
    bifora(cx0 - cw * 0.22, cTop + chh2 * 0.6, cw * 0.085);
    bifora(cx0 + cw * 0.22, cTop + chh2 * 0.6, cw * 0.085);
    // monofore al livello alto e basso
    for (const [mx, my] of [[-0.25, 0.27], [0.25, 0.27], [0.27, 0.86]]) {
      c.fillStyle = 'rgba(225,212,186,0.85)'; ogive(cx0 + cw * mx, cTop + chh2 * my, cw * 0.09, cw * 0.17); c.fill();
      c.fillStyle = 'rgba(255,200,110,0.95)'; ogive(cx0 + cw * mx, cTop + chh2 * my - 1, cw * 0.05, cw * 0.13); c.fill();
    }
    // portale ogivale con la luce che filtra
    c.fillStyle = 'rgba(225,212,186,0.9)'; ogive(cx0 - cw * 0.05, cBase, cw * 0.24, chh2 * 0.24); c.fill();
    c.fillStyle = '#2a1a10'; ogive(cx0 - cw * 0.05, cBase, cw * 0.17, chh2 * 0.2); c.fill();
    c.fillStyle = 'rgba(255,190,90,0.35)'; c.fillRect(cx0 - cw * 0.1, cBase - chh2 * 0.06, cw * 0.1, chh2 * 0.06);
    // asta con la bandiera siciliana
    c.fillStyle = '#1a1214'; c.fillRect(cx0 + cw * 0.3, cTop - mw * 1.1 - cw * 0.55, 2, cw * 0.55);
    flag = { x: cx0 + cw * 0.3 + 2, y: cTop - mw * 1.1 - cw * 0.55, s: cw * 0.3 };

    // Palazzi del corso, uno con il murale della Trinacria
    let x = W * 0.5, muralDone = false;
    while (x < W + 10) {
      const isMural = !muralDone && x > W * 0.6;
      const bw = isMural ? Math.max(70, U * 0.13) : 36 + R() * 46;
      const bh = isMural ? hz * 0.42 : hz * (0.14 + R() * 0.2), by = hz - bh;
      c.fillStyle = isMural ? '#242b58' : (R() > 0.5 ? '#1c2246' : '#20274f');
      c.fillRect(x, by, bw, bh);
      if (isMural) {
        muralDone = true;
        c.fillStyle = 'rgba(242,194,48,0.8)';
        for (let k = 0; k < 4; k++) c.fillRect(x + 8 + k * ((bw - 16) / 4), by + bh * 0.78, 7, 10);
      } else {
        const cols = bw > 60 ? 3 : 2, rows = Math.max(1, Math.floor(bh / 22));
        for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
          const lit = R() > 0.62;
          c.fillStyle = lit ? 'rgba(242,194,48,0.8)' : '#2a3262';
          const wx = x + 7 + k * ((bw - 14) / cols), wy = by + 8 + r * 22;
          c.fillRect(wx, wy, 7, 11);
          if (lit && R() > 0.5) { c.fillStyle = '#121a3a'; c.fillRect(wx - 2, wy + 11, 11, 2); }
        }
      }
      x += bw + 2;
    }

    // Santa Barbara sulla colonna, davanti alla scalinata
    drawSantaBarbara(c, W * 0.5, hz + 2, Math.max(22, Math.min(hz * 0.22, U * 0.07)));

    // Villa Moncada: giardino pubblico con palme, laghetto con le papere, cancellata e insegna
    {
      const px0 = W * (W < H ? 0.7 : 0.77), px1 = W * 0.995, pw = px1 - px0, pb = hz - 2;
      c.fillStyle = '#132a1c'; c.fillRect(px0, pb - hz * 0.11, pw, hz * 0.11);
      for (let i = 0; i < 9; i++) ell(c, px0 + (i + 0.5) * pw / 9, pb - hz * 0.11, pw / 13, hz * 0.04, '#1b3a25');
      const palmTree = (x, h) => {
        c.strokeStyle = '#5a4632'; c.lineWidth = Math.max(2, h * 0.05); c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, pb - hz * 0.05); c.quadraticCurveTo(x - h * 0.05, pb - h * 0.5, x + h * 0.06, pb - h); c.stroke();
        c.strokeStyle = '#2e6a3a'; c.lineWidth = Math.max(1.5, h * 0.035);
        const tx = x + h * 0.06, ty = pb - h;
        for (let k = 0; k < 8; k++) {
          const a = -Math.PI / 2 + (k - 3.5) * 0.42, l = h * (0.28 + (k % 2) * 0.08);
          c.beginPath(); c.moveTo(tx, ty);
          c.quadraticCurveTo(tx + Math.cos(a) * l * 0.7, ty + Math.sin(a) * l * 0.7 - h * 0.06, tx + Math.cos(a) * l, ty + Math.sin(a) * l * 0.4 + h * 0.08);
          c.stroke();
        }
      };
      palmTree(px0 + pw * 0.08, hz * 0.3);
      palmTree(px0 + pw * 0.9, hz * 0.36);
      const pondX = px0 + pw * 0.62, pondY = pb - hz * 0.075, prx = pw * 0.27, pry = Math.max(4, hz * 0.024);
      ell(c, pondX, pondY, prx + 3, pry + 2, '#4a4c58');
      ell(c, pondX, pondY, prx, pry, '#1e3a63');
      ell(c, pondX + prx * 0.4, pondY - pry * 0.2, prx * 0.12, pry * 0.25, 'rgba(244,239,226,0.3)');
      park = { x: pondX, y: pondY, rx: prx, ry: pry };
      // cancellata in ferro battuto con le punte
      const fy = pb - hz * 0.035;
      c.strokeStyle = '#0e1020'; c.fillStyle = '#0e1020'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(px0, fy); c.lineTo(px1, fy); c.moveTo(px0, pb - 1); c.lineTo(px1, pb - 1); c.stroke();
      for (let x = px0 + 2; x < px1; x += 5) {
        c.beginPath(); c.moveTo(x, pb); c.lineTo(x, fy - 3); c.stroke();
        c.beginPath(); c.moveTo(x - 1.5, fy - 2); c.lineTo(x, fy - 5); c.lineTo(x + 1.5, fy - 2); c.fill();
      }
      // cancello con pilastri in calcare e insegna
      const gx = px0 + pw * 0.3, gw = Math.max(18, pw * 0.2), gh = hz * 0.13;
      c.fillStyle = '#d8cdb4';
      c.fillRect(gx - gw / 2 - 4, pb - gh, 5, gh); c.fillRect(gx + gw / 2 - 1, pb - gh, 5, gh);
      ell(c, gx - gw / 2 - 1.5, pb - gh - 2, 3.5, 3.5, '#d8cdb4'); ell(c, gx + gw / 2 + 1.5, pb - gh - 2, 3.5, 3.5, '#d8cdb4');
      c.strokeStyle = '#0e1020'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(gx - gw / 2, pb - gh * 0.75); c.quadraticCurveTo(gx, pb - gh * 1.05, gx + gw / 2, pb - gh * 0.75); c.stroke();
      const sw = Math.max(70, pw * 0.62), sh = Math.max(13, hz * 0.05), sx = Math.min(Math.max(gx - sw / 2, px0 - 4), px1 - sw), sy = pb - gh - sh - 6;
      c.fillStyle = '#d8cdb4'; c.fillRect(sx + sw * 0.2, sy + sh, 2, 7); c.fillRect(sx + sw * 0.8 - 2, sy + sh, 2, 7);
      c.fillStyle = '#e2b33c'; c.fillRect(sx, sy, sw, sh);
      c.fillStyle = '#173a24'; c.fillRect(sx + 2, sy + 2, sw - 4, sh - 4);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = Math.round(sh * 0.62);
      c.font = `${fs}px ${DISPLAY}`;
      const mw2 = c.measureText('VILLA MONCADA').width;
      if (mw2 > sw * 0.88) { fs = Math.floor(fs * sw * 0.88 / mw2); c.font = `${fs}px ${DISPLAY}`; }
      c.fillStyle = '#f2c230'; c.fillText('VILLA MONCADA', sx + sw / 2, sy + sh / 2 + 1);
      c.textAlign = 'start'; c.textBaseline = 'alphabetic';
    }

    // Strada di basole laviche
    c.fillStyle = '#2a2b33'; c.fillRect(0, hz, W, H - hz);
    c.fillStyle = '#3b3c46'; c.fillRect(0, hz - 3, W, 7);
    let y = hz + 4, row = 0;
    while (y < H) {
      const rh = 7 + ((y - hz) / Math.max(1, H - hz)) * 26, bw = rh * 2.3;
      let bx = (row % 2) ? -bw / 2 : 0;
      while (bx < W) {
        const v = R();
        c.fillStyle = v > 0.66 ? '#30313b' : v > 0.33 ? '#2c2d36' : '#26272f';
        c.beginPath();
        if (c.roundRect) c.roundRect(bx + 1, y + 1, bw - 2, rh - 2, 2); else c.rect(bx + 1, y + 1, bw - 2, rh - 2);
        c.fill();
        bx += bw;
      }
      y += rh; row++;
    }

    // Fontana delle rane
    const fw = Math.max(56, U * 0.13), fx = W * 0.1 + fw * 0.15, fy = hz + 2;
    fountain = { x: fx, y: fy, w: fw };
    ell(c, fx, fy + 2, fw * 0.62, fw * 0.12, 'rgba(0,0,0,0.35)');
    c.fillStyle = '#6c6e7c'; c.fillRect(fx - fw / 2, fy - fw * 0.2, fw, fw * 0.2);
    ell(c, fx, fy - fw * 0.2, fw / 2, fw * 0.1, '#8a8c99');
    ell(c, fx, fy - fw * 0.2, fw * 0.44, fw * 0.075, '#26406e');
    c.fillStyle = '#7a7c8a'; c.fillRect(fx - fw * 0.05, fy - fw * 0.5, fw * 0.1, fw * 0.3);
    ell(c, fx, fy - fw * 0.5, fw * 0.16, fw * 0.04, '#8a8c99');
    for (const side of [-1, 1]) {
      c.save(); c.translate(fx + side * fw * 0.42, fy - fw * 0.22);
      drawFrog(c, fw * 0.13, { t: 0, hit: false, stone: true });
      c.restore();
    }

    // posto dell'arrostitore di carne di cavallo, sul marciapiede tra la fontana e Santa Barbara
    griller = { x: W * 0.3, y: hz + 3, h: Math.max(44, Math.min(hz * 0.3, 90)) };

    // Lampioni
    lamps = [];
    for (const lx of [W * 0.03, W * 0.97, W * 0.62]) {
      const top = hz - hz * 0.4;
      lamps.push({ x: lx, y: top + 6 });
      const lg = c.createRadialGradient(lx, hz + 10, 4, lx, hz + 10, Math.max(80, W * 0.16));
      lg.addColorStop(0, 'rgba(242,194,48,0.2)'); lg.addColorStop(1, 'rgba(242,194,48,0)');
      c.fillStyle = lg; c.fillRect(lx - W * 0.2, hz - 40, W * 0.4, H);
      c.fillStyle = '#0c0f22'; c.fillRect(lx - 2, top, 4, hz - top + 2);
      c.fillRect(lx - 9, top - 4, 18, 6);
      ell(c, lx, top + 6, 7, 7, '#f2c230');
    }
  }

  function layoutHoles() {
    const top = hz + (H - hz) * 0.06, bot = H * 0.975;
    const rowH = (bot - top) / 3, cellW = Math.min(W / 3, rowH * 2.2);
    holes = [];
    for (let r = 0; r < 3; r++) {
      const persp = 0.84 + 0.13 * r, cy = top + rowH * (r + 0.72);
      const rad = Math.min(cellW * 0.3, rowH * 0.38) * persp;
      const spread = cellW * (0.88 + 0.1 * r);
      for (let c = 0; c < 3; c++) holes.push({ cx: W / 2 + (c - 1) * spread, cy, r: rad, row: r });
    }
    const last = holes[holes.length - 1], free = W - (last.cx + last.r * 1.25);
    if (free > 120) {
      const w = Math.min(free * 0.88, 260), h = w * 0.5, x = W - free / 2 - w / 2;
      welcome = { x, y: H - h - Math.min(H * 0.22, h * 1.2), w, h, base: H };
    } else {
      const w = Math.min(W * 0.42, 220), h = w * 0.5, x = W - w - 8;
      welcome = { x, y: hz - h - hz * 0.12, w, h, base: hz + 2 };
    }
  }

  // Cartello «Benvenuti a Paternò» in primo piano, su due pali, con un faretto
  function drawWelcome() {
    if (!welcome) return;
    const { x, y, w, h, base } = welcome, c = ctx;
    const spot = c.createRadialGradient(x + w / 2, y + h * 0.4, 4, x + w / 2, y + h * 0.4, w * 0.75);
    spot.addColorStop(0, 'rgba(255,220,140,0.25)'); spot.addColorStop(1, 'rgba(255,220,140,0)');
    c.fillStyle = spot; c.fillRect(x - w * 0.3, y - h * 0.6, w * 1.6, h * 2.2);
    for (const px of [x + w * 0.18, x + w * 0.82]) {
      const g = c.createLinearGradient(px - 3, 0, px + 3, 0);
      g.addColorStop(0, '#5d6070'); g.addColorStop(0.5, '#b8bcc8'); g.addColorStop(1, '#4a4c58');
      c.fillStyle = g; c.fillRect(px - 3, y + h - 2, 6, base - y - h + 2);
      ell(c, px, base, 8, 2.5, 'rgba(0,0,0,0.4)');
    }
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x + 5, y + 6, w, h);
    c.fillStyle = '#1f4fa8'; c.fillRect(x, y, w, h);
    c.fillStyle = '#f2c230'; c.fillRect(x + 4, y + 4, w - 8, h - 8);
    c.fillStyle = '#f4efe2'; c.fillRect(x + 7, y + 7, w - 14, h - 14);
    for (const [qx, qy] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) ell(c, qx, qy, h * 0.1, h * 0.1, '#1f4fa8');
    ell(c, x + w / 2, y + 2, w * 0.08, 3, '#2b2d35');
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const fit = (txt, max, size, font) => {
      c.font = `${size}px ${font}`;
      const tw = c.measureText(txt).width;
      return tw > max ? Math.floor(size * max / tw) : size;
    };
    const f1 = fit('Benvenuti a', w * 0.6, Math.round(h * 0.17), "600 'Rubik', system-ui, sans-serif");
    c.font = `600 ${f1}px 'Rubik', system-ui, sans-serif`; c.fillStyle = '#121a3a';
    c.fillText('Benvenuti a', x + w / 2, y + h * 0.27);
    const f2 = fit('PATERNÒ', w * 0.8, Math.round(h * 0.36), DISPLAY);
    c.font = `${f2}px ${DISPLAY}`; c.fillStyle = '#1f4fa8';
    c.fillText('PATERNÒ', x + w / 2, y + h * 0.56);
    const f3 = fit('Città di Santa Barbara e dei Gattitopi', w * 0.86, Math.round(h * 0.11), "'Rubik', system-ui, sans-serif");
    c.font = `italic ${f3}px 'Rubik', system-ui, sans-serif`; c.fillStyle = '#8a1a14';
    c.fillText('Città di Santa Barbara e dei Gattitopi', x + w / 2, y + h * 0.8);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    buildBg(); layoutHoles();
  }

  // ---------- Sprite (origine: centro in basso) ----------
  function ratEyes(s, boss) { s *= boss ? 1.12 : 1; const hy = -s * 1.7; return [[-s * 0.27, hy - s * 0.1], [s * 0.27, hy - s * 0.1], s * 0.14]; }

  const FUR_TINTS = [
    ['#6d6874', '#a19ba6', '#36323c'], ['#6b5f55', '#a3937f', '#342b25'],
    ['#5f5b55', '#938d84', '#2e2b27'], ['#77706a', '#aaa197', '#3d3833']
  ];

  // contorno a ciuffi: ellisse con punte alterne, deterministico per entità
  function furBlob(c, cx, cy, rx, ry, n, jag, R) {
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, k = i % 2 ? 1 - jag * (0.5 + R() * 0.5) : 1 + jag * 0.3 * R();
      const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
  }
  function shade(c, x, y, r, light, mid, dark) {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.08, x, y, r * 1.1);
    g.addColorStop(0, light); g.addColorStop(0.55, mid); g.addColorStop(1, dark);
    return g;
  }

  function drawRat(c, s, o) {
    const boss = o.boss; s *= boss ? 1.12 : 1;
    const R = seeded(o.seed || 7);
    const [fur, light, dark] = boss ? ['#4f4a58', '#7a7484', '#211e27'] : o.baby ? ['#8a848f', '#bdb7c2', '#4f4a55'] : FUR_TINTS[(o.seed || 0) % FUR_TINTS.length];
    const skin = '#d99aa5', skinDark = '#a8626f';
    const lx = o.look ? o.look.x : 0, ly = o.look ? o.look.y : 0;
    c.lineCap = 'round'; c.lineJoin = 'round';

    // coda squamata e rastremata
    const sw = Math.sin(o.t * (o.baby ? 10 : 3.5)) * s * 0.3;
    const P = [[s * 0.55, -s * 0.45], [s * 1.35, -s * 0.5], [s * 1.15 + sw * 0.5, -s * 1.5], [s * 1.45 + sw, -s * 2.0]];
    const bez = t => { const u = 1 - t; return [0, 1].map(k => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
    let prev = bez(0);
    for (let i = 1; i <= 16; i++) {
      const q = bez(i / 16);
      c.strokeStyle = i % 2 ? skin : skinDark; c.lineWidth = s * (0.14 - i * 0.0072);
      c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke();
      prev = q;
    }

    // corpo che respira
    c.save(); c.scale(1, 1 + Math.sin(o.t * 3.2) * 0.025);
    c.fillStyle = shade(c, 0, -s * 0.75, s * 0.95, light, fur, dark);
    furBlob(c, 0, -s * 0.75, s * 0.84, s * 0.92, 48, 0.08, R); c.fill();
    const belly = c.createRadialGradient(0, -s * 0.7, s * 0.05, 0, -s * 0.55, s * 0.6);
    belly.addColorStop(0, 'rgba(214,205,196,0.9)'); belly.addColorStop(1, 'rgba(214,205,196,0)');
    c.fillStyle = belly; furBlob(c, 0, -s * 0.58, s * 0.48, s * 0.58, 30, 0.1, R); c.fill();
    c.strokeStyle = dark; c.lineWidth = Math.max(1, s * 0.022);
    for (let i = 0; i < 22; i++) {
      const a = R() * Math.PI * 2, rr = 0.55 + R() * 0.35;
      const x = Math.cos(a) * s * 0.84 * rr, y = -s * 0.75 + Math.sin(a) * s * 0.92 * rr;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * s * 0.08, y + Math.sin(a) * s * 0.08 + s * 0.04); c.stroke();
    }
    c.restore();

    // zampe aggrappate al bordo del tombino, con artigli
    for (const side of [-1, 1]) {
      const hx = side * s * 0.46, hy0 = -s * 0.24;
      ell(c, hx, hy0, s * 0.19, s * 0.12, skin);
      for (let f = -1.5; f <= 1.5; f++) {
        const fx = hx + f * s * 0.075;
        ell(c, fx, hy0 + s * 0.08, s * 0.04, s * 0.06, skin);
        c.strokeStyle = '#2a1e1e'; c.lineWidth = Math.max(1, s * 0.02);
        c.beginPath(); c.moveTo(fx, hy0 + s * 0.12); c.lineTo(fx + side * s * 0.01, hy0 + s * 0.18); c.stroke();
      }
    }

    // testa: si gira verso il pede
    const hy = -s * 1.7;
    c.save(); c.translate(lx * s * 0.06, hy); c.rotate(lx * 0.12 + (o.hit ? 0.3 : 0));
    ell(c, 0, s * 0.48, s * 0.55, s * 0.14, 'rgba(0,0,0,0.28)');
    for (const side of [-1, 1]) {
      c.save(); c.translate(side * s * 0.42, -s * 0.36); c.rotate(side * (0.38 + Math.sin(o.t * 2.2 + side) * 0.06));
      let g = c.createLinearGradient(0, s * 0.1, 0, -s * 0.6);
      g.addColorStop(0, fur); g.addColorStop(1, dark);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(-s * 0.25, s * 0.12); c.quadraticCurveTo(-s * 0.21, -s * 0.45, 0, -s * 0.6); c.quadraticCurveTo(s * 0.21, -s * 0.45, s * 0.25, s * 0.12); c.closePath(); c.fill();
      g = c.createLinearGradient(0, s * 0.05, 0, -s * 0.45);
      g.addColorStop(0, '#f0a7b4'); g.addColorStop(1, '#8e4c58');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(-s * 0.14, s * 0.06); c.quadraticCurveTo(-s * 0.11, -s * 0.32, 0, -s * 0.44); c.quadraticCurveTo(s * 0.11, -s * 0.32, s * 0.14, s * 0.06); c.closePath(); c.fill();
      c.strokeStyle = light; c.lineWidth = Math.max(1, s * 0.018);
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * s * 0.04, 0); c.lineTo(k * s * 0.08, -s * 0.24); c.stroke(); }
      c.restore();
    }
    c.fillStyle = shade(c, 0, 0, s * 0.72, light, fur, dark);
    furBlob(c, 0, 0, s * 0.7, s * 0.58, 40, 0.07, R); c.fill();
    // muso allungato, naso bagnato
    const snout = c.createRadialGradient(0, s * 0.16, s * 0.02, 0, s * 0.26, s * 0.4);
    snout.addColorStop(0, '#cbc1b8'); snout.addColorStop(1, fur);
    ell(c, 0, s * 0.26, s * 0.36, s * 0.27, snout);
    ell(c, 0, s * 0.12, s * 0.11, s * 0.08, '#c96a7b');
    ell(c, -s * 0.04, s * 0.14, s * 0.017, s * 0.013, '#4a1f28');
    ell(c, s * 0.04, s * 0.14, s * 0.017, s * 0.013, '#4a1f28');
    ell(c, -s * 0.03, s * 0.095, s * 0.03, s * 0.018, 'rgba(255,255,255,0.75)');
    c.strokeStyle = '#2a1e1e'; c.lineWidth = Math.max(1, s * 0.022);
    c.beginPath(); c.moveTo(0, s * 0.2); c.lineTo(0, s * 0.31);
    c.moveTo(-s * 0.13, s * 0.36); c.quadraticCurveTo(0, s * 0.29, s * 0.13, s * 0.36); c.stroke();
    // incisivi gialli, come quelli veri
    c.fillStyle = '#e3a83c';
    c.fillRect(-s * 0.075, s * 0.33, s * 0.07, s * 0.17); c.fillRect(s * 0.005, s * 0.33, s * 0.07, s * 0.17);
    c.fillStyle = 'rgba(255,240,200,0.6)'; c.fillRect(-s * 0.065, s * 0.34, s * 0.02, s * 0.11);
    // baffi che vibrano
    const tw = Math.sin(o.t * 19) * s * 0.025;
    c.strokeStyle = 'rgba(244,239,226,0.7)'; c.lineWidth = Math.max(0.8, s * 0.014);
    for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) {
      c.beginPath(); c.moveTo(side * s * 0.18, s * 0.2 + i * s * 0.04);
      c.quadraticCurveTo(side * s * 0.55, s * 0.1 + i * s * 0.1 + tw, side * s * 0.98, s * 0.12 + i * s * 0.2 + tw); c.stroke();
    }
    // occhi rossi lucidi con pupilla a fessura che segue il cursore
    for (const side of [-1, 1]) {
      const ex = side * s * 0.27, ey = -s * 0.1;
      ell(c, ex, ey, s * 0.16, s * 0.15, dark);
      if (o.hit) {
        c.strokeStyle = '#f4efe2'; c.lineWidth = Math.max(1.5, s * 0.06);
        c.beginPath(); c.moveTo(ex - s * 0.1, ey - s * 0.1); c.lineTo(ex + s * 0.1, ey + s * 0.1);
        c.moveTo(ex + s * 0.1, ey - s * 0.1); c.lineTo(ex - s * 0.1, ey + s * 0.1); c.stroke();
        continue;
      }
      const iris = c.createRadialGradient(ex - s * 0.04, ey - s * 0.05, s * 0.01, ex, ey, s * 0.14);
      iris.addColorStop(0, '#ff8a6a'); iris.addColorStop(0.5, '#d0201a'); iris.addColorStop(1, '#4a0806');
      ell(c, ex, ey, s * 0.13, s * 0.13, iris);
      ell(c, ex + lx * s * 0.045, ey + ly * s * 0.035, s * 0.03, s * 0.1, '#120404');
      ell(c, ex - s * 0.045, ey - s * 0.055, s * 0.035, s * 0.028, 'rgba(255,255,255,0.85)');
      if (o.blink > 0) {
        c.save(); c.beginPath(); c.arc(ex, ey, s * 0.14, 0, Math.PI * 2); c.clip();
        c.fillStyle = fur; c.fillRect(ex - s * 0.15, ey - s * 0.15, s * 0.3, s * 0.3 * o.blink); c.restore();
      }
      c.strokeStyle = dark; c.lineWidth = Math.max(1.5, s * 0.05);
      c.beginPath(); c.moveTo(ex - side * s * 0.15, ey - s * 0.21); c.lineTo(ex + side * s * 0.1, ey - s * 0.13); c.stroke();
    }
    if (boss) {
      // coppola di tweed
      const cap = c.createLinearGradient(0, -s * 0.62, 0, -s * 0.25);
      cap.addColorStop(0, '#5a4330'); cap.addColorStop(1, '#2c1f16');
      ell(c, 0, -s * 0.42, s * 0.62, s * 0.24, cap);
      c.strokeStyle = 'rgba(200,170,120,0.25)'; c.lineWidth = 1;
      for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * s * 0.12, -s * 0.62); c.lineTo(i * s * 0.12 + s * 0.08, -s * 0.22); c.stroke(); }
      ell(c, s * 0.06, -s * 0.28, s * 0.72, s * 0.11, '#241811');
      c.strokeStyle = '#c98a95'; c.lineWidth = Math.max(1.5, s * 0.04);
      c.beginPath(); c.moveTo(-s * 0.44, -s * 0.22); c.lineTo(-s * 0.14, s * 0.1); c.stroke();
      if (o.hp > 0) for (let i = 0; i < o.hp; i++) ell(c, (i - (o.hp - 1) / 2) * s * 0.28, -s * 0.85, s * 0.09, s * 0.09, '#e8642c');
    }
    if (o.hit) drawStars(c, 0, -s * 0.6, s, o.t);
    c.restore();
  }

  function drawGirl(c, s, o) {
    const skin = '#f0c49c', hair = '#3a2216', dress = '#d9475a';
    // vestitino a pois con colletto
    c.fillStyle = dress;
    c.beginPath(); c.moveTo(-s * 0.42, -s * 1.2); c.lineTo(s * 0.42, -s * 1.2); c.lineTo(s * 0.78, 0); c.lineTo(-s * 0.78, 0); c.closePath(); c.fill();
    const R = seeded(3);
    for (let i = 0; i < 14; i++) ell(c, (R() * 2 - 1) * s * 0.55, -s * (0.1 + R() * 1.0), s * 0.05, s * 0.05, '#f4efe2');
    ell(c, -s * 0.16, -s * 1.18, s * 0.18, s * 0.08, '#f4efe2');
    ell(c, s * 0.16, -s * 1.18, s * 0.18, s * 0.08, '#f4efe2');
    // manine sul bordo
    ell(c, -s * 0.5, -s * 0.2, s * 0.14, s * 0.1, skin);
    ell(c, s * 0.5, -s * 0.2, s * 0.14, s * 0.1, skin);
    // codini con fiocchi rossi
    const hy = -s * 1.72, sw = Math.sin(o.t * 5) * 0.12;
    for (const side of [-1, 1]) {
      c.save(); c.translate(side * s * 0.62, hy - s * 0.05); c.rotate(side * (0.4 + sw));
      ell(c, 0, s * 0.25, s * 0.16, s * 0.32, hair);
      ell(c, 0, -s * 0.02, s * 0.14, s * 0.07, '#c8312b');
      c.restore();
    }
    ell(c, 0, hy, s * 0.6, s * 0.58, skin);
    // frangetta
    c.fillStyle = hair;
    c.beginPath(); c.arc(0, hy, s * 0.62, Math.PI * 1.02, Math.PI * 1.98);
    c.quadraticCurveTo(s * 0.3, hy - s * 0.18, 0, hy - s * 0.25); c.quadraticCurveTo(-s * 0.3, hy - s * 0.18, -s * 0.6, hy - s * 0.05); c.fill();
    ell(c, -s * 0.33, hy + s * 0.2, s * 0.1, s * 0.06, 'rgba(232,110,120,0.45)');
    ell(c, s * 0.33, hy + s * 0.2, s * 0.1, s * 0.06, 'rgba(232,110,120,0.45)');
    c.strokeStyle = '#2a1a12'; c.lineWidth = Math.max(1.5, s * 0.05); c.lineCap = 'round';
    if (o.hit) {
      // spaventata: occhi stretti e bocca a O
      for (const side of [-1, 1]) {
        const ex = side * s * 0.22, ey = hy;
        c.beginPath(); c.moveTo(ex - side * s * 0.09, ey - s * 0.07); c.lineTo(ex + side * s * 0.05, ey); c.lineTo(ex - side * s * 0.09, ey + s * 0.07); c.stroke();
      }
      ell(c, 0, hy + s * 0.3, s * 0.09, s * 0.12, '#7a2a2a');
      c.font = `${Math.round(s * 0.8)}px ${DISPLAY}`; c.textAlign = 'center';
      c.fillStyle = '#e8642c'; c.fillText('!', s * 0.85, hy - s * 0.45);
    } else {
      for (const side of [-1, 1]) {
        const ex = side * s * 0.22, ey = hy;
        ell(c, ex, ey, s * 0.09, s * 0.12, '#2a1a12');
        ell(c, ex - s * 0.03, ey - s * 0.04, s * 0.03, s * 0.03, '#ffffff');
      }
      c.beginPath(); c.arc(0, hy + s * 0.22, s * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    }
  }

  function drawFrog(c, s, o) {
    const g = o.stone ? '#8f9a8c' : '#5fb04a', dk = o.stone ? '#6b7468' : '#3d7f2f', belly = o.stone ? '#a9b2a4' : '#d9e8a0';
    ell(c, -s * 0.62, -s * 0.25, s * 0.38, s * 0.25, dk);
    ell(c, s * 0.62, -s * 0.25, s * 0.38, s * 0.25, dk);
    ell(c, 0, -s * 0.55, s * 0.75, s * 0.55, g);
    ell(c, 0, -s * 0.4, s * 0.45, s * 0.32, belly);
    if (!o.stone && Math.sin(o.t * 7) > 0.55) ell(c, 0, -s * 0.42, s * 0.36, s * 0.28, '#eef6c4');
    ell(c, -s * 0.32, -s * 0.06, s * 0.16, s * 0.08, dk);
    ell(c, s * 0.32, -s * 0.06, s * 0.16, s * 0.08, dk);
    for (const side of [-1, 1]) {
      const ex = side * s * 0.36, ey = -s * 1.02;
      ell(c, ex, ey, s * 0.24, s * 0.24, g);
      ell(c, ex, ey, s * 0.17, s * 0.17, o.stone ? '#b8c0b4' : '#fbfbea');
      if (o.hit) {
        c.strokeStyle = '#1b2b14'; c.lineWidth = Math.max(1.2, s * 0.05);
        c.beginPath(); c.moveTo(ex - s * 0.08, ey - s * 0.08); c.lineTo(ex + s * 0.08, ey + s * 0.08);
        c.moveTo(ex + s * 0.08, ey - s * 0.08); c.lineTo(ex - s * 0.08, ey + s * 0.08); c.stroke();
      } else if (!o.stone) ell(c, ex, ey, s * 0.1, s * 0.06, '#1b2b14');
    }
    c.strokeStyle = dk; c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath(); c.arc(0, -s * 0.85, s * 0.38, 0.22 * Math.PI, 0.78 * Math.PI); c.stroke();
    if (!o.stone) {
      ell(c, -s * 0.42, -s * 0.72, s * 0.08, s * 0.05, 'rgba(232,120,140,0.6)');
      ell(c, s * 0.42, -s * 0.72, s * 0.08, s * 0.05, 'rgba(232,120,140,0.6)');
    }
    if (o.hit) drawStars(c, 0, -s * 1.35, s, o.t);
  }

  function drawAra(c, s, o) {
    const h = s * 2.0, w = s * 0.85;
    c.save();
    c.shadowColor = 'rgba(242,194,48,0.9)'; c.shadowBlur = s * 0.6;
    c.beginPath(); c.moveTo(0, -h);
    c.bezierCurveTo(w * 0.5, -h * 0.75, w * 1.1, -h * 0.35, w * 0.95, -h * 0.15);
    c.bezierCurveTo(w * 0.8, 0.02 * s, -w * 0.8, 0.02 * s, -w * 0.95, -h * 0.15);
    c.bezierCurveTo(-w * 1.1, -h * 0.35, -w * 0.5, -h * 0.75, 0, -h);
    const g = c.createRadialGradient(-w * 0.3, -h * 0.5, s * 0.1, 0, -h * 0.35, h * 0.8);
    g.addColorStop(0, '#f6c35a'); g.addColorStop(0.6, '#d98a2b'); g.addColorStop(1, '#9c5416');
    c.fillStyle = g; c.fill();
    c.restore();
    const R = seeded(5);
    for (let i = 0; i < 26; i++) {
      const yy = -h * (0.08 + R() * 0.8), span = w * (1 - (-yy / h) * 0.85);
      ell(c, (R() * 2 - 1) * span * 0.8, yy, s * 0.035, s * 0.035, R() > 0.5 ? '#7a3f10' : '#fbe0a0');
    }
    c.strokeStyle = 'rgba(244,239,226,0.6)'; c.lineWidth = Math.max(1.5, s * 0.05); c.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      const bx = i * s * 0.3, ph = o.t * 5 + i;
      c.moveTo(bx, -h - s * 0.1);
      c.quadraticCurveTo(bx + Math.sin(ph) * s * 0.2, -h - s * 0.35, bx, -h - s * 0.6);
      c.stroke();
    }
  }

  function drawTriPower(c, s, o) {
    const y = -s * 1.1, R = s * 0.95;
    c.save(); c.shadowColor = 'rgba(242,194,48,0.95)'; c.shadowBlur = s * 0.7;
    ell(c, 0, y, R, R, '#f2c230'); c.restore();
    sicilyDisc(c, 0, y, R * 0.94);
    drawTrinacria(c, 0, y, R * 0.8, o.t * 1.6);
  }

  function drawFuochi(c, s, o) {
    c.save(); c.shadowColor = 'rgba(232,100,44,0.9)'; c.shadowBlur = s * 0.6;
    c.fillStyle = '#c8312b'; c.fillRect(-s * 0.26, -s * 1.7, s * 0.52, s * 1.35);
    c.restore();
    c.fillStyle = '#f2c230';
    for (let i = 0; i < 3; i++) c.fillRect(-s * 0.26, -s * (1.5 - i * 0.4), s * 0.52, s * 0.1);
    c.fillStyle = '#1f4fa8';
    c.beginPath(); c.moveTo(-s * 0.32, -s * 1.7); c.lineTo(0, -s * 2.15); c.lineTo(s * 0.32, -s * 1.7); c.fill();
    c.fillStyle = '#7a4a22'; c.fillRect(-s * 0.04, -s * 0.35, s * 0.08, s * 0.35);
    for (let i = 0; i < 6; i++) {
      const a = o.t * 7 + i, rr = s * (0.12 + 0.12 * Math.abs(Math.sin(a * 1.7)));
      ell(c, Math.cos(a * 2.3) * rr, -s * 2.25 + Math.sin(a * 2.3) * rr, s * 0.05, s * 0.05, FW_COLORS[i % FW_COLORS.length]);
    }
  }

  function drawStars(c, x, y, s, t) {
    for (let i = 0; i < 3; i++) {
      const a = t * 9 + i * (Math.PI * 2 / 3);
      const sx = x + Math.cos(a) * s * 0.7, sy = y + Math.sin(a) * s * 0.22;
      c.fillStyle = '#f2c230'; c.beginPath();
      for (let k = 0; k < 10; k++) {
        const rr = (k % 2 ? 0.05 : 0.13) * s, aa = k * Math.PI / 5;
        c.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr);
      }
      c.fill();
    }
  }

  // ---------- Armi (cursore) ----------
  function drawWeapon(c, name, x, y, ang, sc) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(sc, sc);
    if (name === 'Pede') {
      // pianta del piede vista da sopra, alluce a sinistra; le ultime due dita sono rotte e fasciate insieme
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 160);
      ell(c, 4, 6, 18, 37, 'rgba(0,0,0,0.32)');
      const sole = () => {
        c.beginPath(); c.moveTo(-13, -21);
        c.bezierCurveTo(-16, -4, -11, 8, -12, 20);
        c.quadraticCurveTo(-12, 38, 0, 38); c.quadraticCurveTo(11, 38, 11, 22);
        c.bezierCurveTo(12, 10, 17, -2, 16, -18);
        c.quadraticCurveTo(2, -28, -13, -21); c.closePath();
      };
      const g = c.createRadialGradient(-5, -10, 2, 0, 4, 40);
      g.addColorStop(0, '#fbd7b8'); g.addColorStop(0.6, '#eab48d'); g.addColorStop(1, '#c4835c');
      c.fillStyle = g; sole(); c.fill();
      c.strokeStyle = 'rgba(140,80,50,0.55)'; c.lineWidth = 1; sole(); c.stroke();
      // arco plantare in ombra e tallone più chiaro
      ell(c, -9, 6, 4, 11, 'rgba(160,90,60,0.22)');
      ell(c, -1, 28, 7, 6, 'rgba(255,230,210,0.45)');
      ell(c, -2, -12, 9, 5, 'rgba(255,225,200,0.35)');
      const toe = (tx, ty, rx, ry, bend, broken) => {
        c.save(); c.translate(tx, ty); c.rotate(bend);
        const tg = c.createRadialGradient(-rx * 0.3, -ry * 0.4, 0.5, 0, 0, ry * 1.2);
        if (broken) { tg.addColorStop(0, '#d98aa0'); tg.addColorStop(0.55, '#a1527e'); tg.addColorStop(1, '#5e2f62'); }
        else { tg.addColorStop(0, '#fbd7b8'); tg.addColorStop(1, '#d99a72'); }
        c.fillStyle = tg; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(120,60,40,0.5)'; c.lineWidth = 0.8; c.stroke();
        // unghia
        c.fillStyle = broken ? 'rgba(240,200,215,0.85)' : '#fbe6d8';
        c.beginPath(); c.ellipse(0, -ry * 0.45, rx * 0.55, ry * 0.32, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(160,100,80,0.5)'; c.lineWidth = 0.6; c.stroke();
        ell(c, -rx * 0.18, -ry * 0.55, rx * 0.18, ry * 0.1, 'rgba(255,255,255,0.8)');
        c.restore();
      };
      toe(-8, -29, 6, 7.5, -0.05, false);
      toe(0, -33, 4.3, 5.8, 0, false);
      toe(6.5, -31.5, 3.9, 5.2, 0.08, false);
      // dita rotte: storte verso l'esterno, gonfie e livide
      toe(12.2, -27, 3.9, 5, 0.55, true);
      toe(16.4, -21.5, 3.5, 4.5, 0.85, true);
      // cerotto che le tiene insieme
      c.save(); c.translate(14.3, -24.2); c.rotate(0.7);
      c.fillStyle = '#f4efe2'; c.fillRect(-7, -2.2, 14, 4.4);
      c.strokeStyle = '#cfc6b4'; c.lineWidth = 0.6; c.strokeRect(-7, -2.2, 14, 4.4);
      c.fillStyle = 'rgba(200,190,170,0.9)';
      for (let i = -5; i <= 5; i += 2.5) c.fillRect(i, -2.2, 0.6, 4.4);
      ell(c, 2, 0.3, 1.6, 1, 'rgba(200,40,40,0.55)');
      c.restore();
      // fitte di dolore che pulsano
      c.strokeStyle = `rgba(232,60,40,${0.45 + 0.5 * pulse})`; c.lineWidth = 1.4; c.lineCap = 'round';
      for (const a of [-1.1, -0.55, 0]) {
        const r0 = 9 + pulse * 1.5;
        c.beginPath();
        c.moveTo(15 + Math.cos(a) * r0, -26 + Math.sin(a) * r0);
        c.lineTo(15 + Math.cos(a) * (r0 + 5), -26 + Math.sin(a) * (r0 + 5));
        c.stroke();
      }
      // pieghe sotto le dita
      c.strokeStyle = 'rgba(140,80,50,0.35)'; c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(-11, -20); c.quadraticCurveTo(1, -24, 14, -18); c.stroke();
    } else {
      // asse di legno con venature e chiodi
      ell(c, 4, 6, 14, 52, 'rgba(0,0,0,0.3)');
      const g = c.createLinearGradient(-10, 0, 10, 0);
      g.addColorStop(0, '#8a5a2b'); g.addColorStop(0.5, '#b98247'); g.addColorStop(1, '#7a4c22');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(-10, -58); c.lineTo(8, -60); c.lineTo(10, 40); c.lineTo(-10, 42); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,40,15,0.55)'; c.lineWidth = 1;
      for (const vx of [-5, 0, 5]) { c.beginPath(); c.moveTo(vx, -56); c.bezierCurveTo(vx + 3, -20, vx - 3, 10, vx + 1, 40); c.stroke(); }
      c.beginPath(); c.ellipse(2, -10, 2.5, 6, 0, 0, Math.PI * 2); c.stroke();
      for (const ny of [-50, 32]) { ell(c, -5, ny, 1.8, 1.8, '#9a9ca6'); ell(c, 5, ny, 1.8, 1.8, '#9a9ca6'); }
      c.fillStyle = '#b98247';
      c.beginPath(); c.moveTo(-10, -58); c.lineTo(-13, -64); c.lineTo(-6, -59); c.fill();
    }
    c.restore();
  }

  function drawSignora(c, x, y, h, t, dir, look) {
    const [skirt, shawl] = look, ph = t * 14, bob = Math.abs(Math.sin(ph)) * h * 0.04;
    const skin = '#e8b892';
    c.save(); c.translate(x, y); ell(c, 0, 0, h * 0.2, h * 0.035, 'rgba(0,0,0,0.35)');
    c.translate(0, -bob); c.scale(dir, 1);
    c.lineCap = 'round';
    for (const k of [-1, 1]) {
      const sw = Math.sin(ph + (k > 0 ? Math.PI : 0)) * h * 0.1;
      c.strokeStyle = skin; c.lineWidth = h * 0.035;
      c.beginPath(); c.moveTo(k * h * 0.04, -h * 0.14); c.lineTo(k * h * 0.04 + sw, -h * 0.03); c.stroke();
      ell(c, k * h * 0.04 + sw + h * 0.02, -h * 0.015, h * 0.045, h * 0.022, '#111');
    }
    // gonna lunga che svolazza e grembiule bianco
    const fl = Math.sin(ph) * h * 0.03;
    c.fillStyle = skirt;
    c.beginPath(); c.moveTo(-h * 0.1, -h * 0.5); c.lineTo(h * 0.1, -h * 0.5); c.lineTo(h * 0.2 + fl, -h * 0.12);
    c.quadraticCurveTo(0, -h * 0.07, -h * 0.26 - fl, -h * 0.13); c.closePath(); c.fill();
    c.fillStyle = '#f4efe2';
    c.beginPath(); c.moveTo(h * 0.02, -h * 0.5); c.lineTo(h * 0.1, -h * 0.5); c.lineTo(h * 0.18 + fl, -h * 0.16); c.lineTo(h * 0.05 + fl, -h * 0.15); c.closePath(); c.fill();
    // corpetto e scialle con frange
    c.fillStyle = '#2a2030'; c.fillRect(-h * 0.085, -h * 0.7, h * 0.17, h * 0.21);
    c.fillStyle = shawl;
    c.beginPath(); c.moveTo(-h * 0.13, -h * 0.71); c.lineTo(h * 0.12, -h * 0.71); c.lineTo(-h * 0.03 - fl, -h * 0.46); c.closePath(); c.fill();
    c.strokeStyle = shawl; c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const u = i / 5, fx = lerp(-h * 0.13, -h * 0.03 - fl, u), fy = lerp(-h * 0.71, -h * 0.46, u);
      c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx - h * 0.02, fy + h * 0.03); c.stroke();
    }
    // braccia alzate che sbracciano
    for (const k of [-1, 1]) {
      const a = -Math.PI / 2 + k * 0.5 + Math.sin(ph * 0.9 + k) * 0.35;
      const sx = k * h * 0.07, sy = -h * 0.66, ex = sx + Math.cos(a) * h * 0.22, ey = sy + Math.sin(a) * h * 0.22;
      c.strokeStyle = shawl; c.lineWidth = h * 0.045;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
      ell(c, ex, ey, h * 0.03, h * 0.03, skin);
    }
    // testa col fazzoletto nero annodato, bocca che urla
    const hx = h * 0.01, hy = -h * 0.79;
    ell(c, hx, hy, h * 0.075, h * 0.085, skin);
    c.fillStyle = '#1c1b26';
    c.beginPath(); c.arc(hx, hy - h * 0.005, h * 0.095, Math.PI * 0.9, Math.PI * 2.08); c.lineTo(-h * 0.08, -h * 0.7); c.closePath(); c.fill();
    ell(c, -h * 0.02, -h * 0.71, h * 0.025, h * 0.018, '#1c1b26');
    ell(c, h * 0.045, hy - h * 0.015, h * 0.012, h * 0.014, '#1a1010');
    ell(c, h * 0.05, hy + h * 0.03, h * 0.02, h * 0.028, '#5a1a1a');
    c.restore();
  }

  const SCREAMS = ['Aiutu!', 'Matri mia!', 'U gattu topu!', 'Bedda Matri!', 'Scappati!', "Santa Barbara, aiutatici!"];
  const DRESSES = [['#1c1b26', '#c8312b'], ['#6e1c1c', '#1f4fa8'], ['#20304f', '#d9a21b'], ['#2b2b2b', '#3f8a3a']];
  let runners = [];
  function runnerFeetY() { return hz + (H - hz) * 0.035; }
  function runnerHeight() { return Math.max(46, Math.min(hz * 0.32, 95)); }
  function panic() {
    const dir = Math.random() < 0.5 ? 1 : -1, n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      runners.push({
        x: dir > 0 ? -40 - i * 60 : W + 40 + i * 60, dir, v: rnd(0.38, 0.5) * W, t: rnd(0, 1),
        look: pick(DRESSES), yell: rnd(0.15, 0.7)
      });
    }
    addText(W / 2, hz * 0.62, "Arriva 'U Zù!", '#e8642c', 26, 1.4);
    sfx.scream();
  }
  function updateRunners(dt) {
    const top = runnerFeetY() - runnerHeight() - 12;
    for (const r of runners) {
      r.x += r.dir * r.v * dt; r.t += dt; r.yell -= dt;
      if (r.yell <= 0 && r.x > 20 && r.x < W - 20) { r.yell = rnd(0.8, 1.4); addText(r.x, top, pick(SCREAMS), '#f4efe2', 14, 0.8); }
    }
    runners = runners.filter(r => r.dir > 0 ? r.x < W + 90 : r.x > -90);
  }

  // ---------- Arrusti e mangia: carne di cavallo sulla brace, fumo a nuvoloni ----------
  let grillSmoke = [], sparks = [], grillT = 0;
  function updateGrill(dt) {
    if (!griller) return;
    const { x, y, h } = griller, gx = x + h * 0.32, gw = h * 0.85, gy = y - h * 0.47;
    grillT -= dt;
    while (grillT <= 0) {
      grillT += 0.045;
      grillSmoke.push({ x: gx + Math.random() * gw, y: gy, r: h * 0.06, vx: rnd(-4, 10), vy: -rnd(14, 26) * h / 60, t: 0, life: rnd(4, 6.5) });
    }
    if (Math.random() < dt * 6) sparks.push({ x: gx + Math.random() * gw, y: gy, vx: rnd(-10, 10), vy: -rnd(30, 60), t: 0, life: rnd(0.4, 0.9) });
    for (const p of grillSmoke) { p.t += dt; p.x += (p.vx + 6) * dt; p.y += p.vy * dt; p.vy *= 0.995; p.r += dt * h * 0.14; }
    for (const p of sparks) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    grillSmoke = grillSmoke.filter(p => p.t < p.life);
    sparks = sparks.filter(p => p.t < p.life);
  }

  function drawGriller(t) {
    if (!griller) return;
    const c = ctx, { x, y, h } = griller;
    const gx = x + h * 0.32, gw = h * 0.85, gy = y - h * 0.47;
    const flick = 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 7.7);
    // bagliore della brace
    const glow = c.createRadialGradient(gx + gw / 2, gy, 2, gx + gw / 2, gy, h * 0.9);
    glow.addColorStop(0, `rgba(255,140,50,${0.35 * flick})`); glow.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = glow; c.fillRect(gx - h * 0.6, gy - h * 0.9, gw + h * 1.2, h * 1.6);
    // lavagnetta
    const bx = gx + gw + h * 0.12, bw = h * 0.5, bh = h * 0.42, by = y - bh - h * 0.12;
    c.strokeStyle = '#6b4a2a'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(bx + bw * 0.15, by + bh); c.lineTo(bx + bw * 0.05, y); c.moveTo(bx + bw * 0.85, by + bh); c.lineTo(bx + bw * 0.95, y); c.stroke();
    c.fillStyle = '#6b4a2a'; c.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    c.fillStyle = '#1e2a22'; c.fillRect(bx, by, bw, bh);
    c.fillStyle = '#f4efe2'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `${Math.max(6, Math.round(bh * 0.2))}px ${DISPLAY}`;
    c.fillText('CARNE', bx + bw / 2, by + bh * 0.25);
    c.fillText('DI', bx + bw / 2, by + bh * 0.5);
    c.fillText('CAVADDU', bx + bw / 2, by + bh * 0.75, bw * 0.92);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
    // griglia: braciere di lamiera su gambe
    c.fillStyle = '#2b2d35';
    for (const lx of [gx + gw * 0.08, gx + gw * 0.92]) c.fillRect(lx - 1.5, gy, 3, y - gy);
    c.fillStyle = '#3a3c46'; c.fillRect(gx, gy, gw, h * 0.1);
    const ember = c.createLinearGradient(0, gy, 0, gy + h * 0.06);
    ember.addColorStop(0, `rgba(255,${Math.round(150 + 60 * flick)},60,1)`); ember.addColorStop(1, '#a3241b');
    c.fillStyle = ember; c.fillRect(gx + 2, gy + 1, gw - 4, h * 0.05);
    c.strokeStyle = '#9a9ca6'; c.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(gx + 2 + i * (gw - 4) / 8, gy - 1); c.lineTo(gx + 2 + i * (gw - 4) / 8, gy + 2); c.stroke(); }
    // fettine e polpette di cavallo con le righe della griglia
    for (let i = 0; i < 5; i++) {
      const mx = gx + gw * (0.14 + i * 0.18), sz = h * 0.06;
      if (i % 2) ell(c, mx, gy - sz * 0.4, sz * 0.8, sz * 0.6, '#5a2418');
      else {
        ell(c, mx, gy - sz * 0.3, sz * 1.3, sz * 0.45, '#7a2e1e');
        c.strokeStyle = '#2a0e08'; c.lineWidth = 0.8;
        for (const k of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(mx + k * sz - sz * 0.2, gy - sz * 0.6); c.lineTo(mx + k * sz + sz * 0.2, gy); c.stroke(); }
      }
    }
    // l'arrostitore: canottiera, grembiule, coppola, baffi; sventola il cartone sulla brace
    const skin = '#d9a07a', fanA = Math.sin(t * 11) * 0.5;
    c.fillStyle = '#23263a'; c.fillRect(x - h * 0.1, y - h * 0.35, h * 0.08, h * 0.35); c.fillRect(x + h * 0.03, y - h * 0.35, h * 0.08, h * 0.35);
    ell(c, x - h * 0.06, y - h * 0.01, h * 0.07, h * 0.025, '#111'); ell(c, x + h * 0.08, y - h * 0.01, h * 0.07, h * 0.025, '#111');
    ell(c, x, y - h * 0.5, h * 0.17, h * 0.2, '#f1ede4');
    c.fillStyle = '#e7dccb'; c.fillRect(x - h * 0.13, y - h * 0.52, h * 0.27, h * 0.25);
    ell(c, x + h * 0.02, y - h * 0.42, h * 0.03, h * 0.02, 'rgba(120,40,30,0.5)');
    c.strokeStyle = skin; c.lineWidth = h * 0.055; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - h * 0.13, y - h * 0.62); c.lineTo(x - h * 0.2, y - h * 0.4); c.stroke();
    const sx = x + h * 0.12, sy = y - h * 0.6, hx = sx + Math.cos(-0.3 + fanA * 0.4) * h * 0.22, hy = sy + Math.sin(-0.3 + fanA * 0.4) * h * 0.22 + h * 0.08;
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
    c.save(); c.translate(hx, hy); c.rotate(fanA);
    c.fillStyle = '#c9a26a'; c.fillRect(-h * 0.02, -h * 0.13, h * 0.16, h * 0.13);
    c.restore();
    ell(c, x + h * 0.01, y - h * 0.79, h * 0.1, h * 0.11, skin);
    c.fillStyle = '#1c1b26';
    c.beginPath(); c.ellipse(x, y - h * 0.86, h * 0.12, h * 0.05, 0, Math.PI, 0); c.fill();
    c.fillRect(x - h * 0.02, y - h * 0.87, h * 0.17, h * 0.03);
    c.fillStyle = '#2a1a12'; c.fillRect(x + h * 0.03, y - h * 0.76, h * 0.08, h * 0.02);
    ell(c, x + h * 0.06, y - h * 0.81, h * 0.012, h * 0.012, '#111');
    // fumo a nuvoloni, illuminato dalla brace in basso
    for (const p of grillSmoke) {
      const k = p.t / p.life, a = Math.sin(Math.PI * Math.min(1, k * 1.4)) * 0.32 * (1 - k * 0.5);
      const warm = Math.max(0, 1 - p.t * 1.5);
      ell(c, p.x, p.y, p.r, p.r * 0.85, `rgba(${Math.round(200 + 55 * warm)},${Math.round(200 - 40 * warm)},${Math.round(210 - 90 * warm)},${a})`);
    }
    for (const p of sparks) ell(c, p.x, p.y, 1.2, 1.2, `rgba(255,${Math.round(200 - 120 * p.t / p.life)},60,${1 - p.t / p.life})`);
  }

  function drawDucks(t) {
    if (!park.rx) return;
    const c = ctx;
    for (let i = 0; i < 3; i++) {
      const ph = t * 0.3 + i * 2.1, x = park.x + Math.sin(ph) * park.rx * 0.62, dir = Math.cos(ph) >= 0 ? 1 : -1;
      const y = park.y + (i - 1) * park.ry * 0.25 + Math.sin(t * 3 + i) * 0.5;
      const s = Math.max(2.6, park.ry * 0.85) * (i === 1 ? 0.7 : 1), col = i === 1 ? '#f2c230' : '#f4efe2';
      c.save(); c.translate(x, y); c.scale(dir, 1);
      c.strokeStyle = 'rgba(244,239,226,0.35)'; c.lineWidth = 0.8;
      c.beginPath(); c.ellipse(-s * 0.4, s * 0.05, s * 1.4, s * 0.3, 0, 0, Math.PI * 2); c.stroke();
      ell(c, 0, -s * 0.35, s * 1.05, s * 0.5, col);
      ell(c, -s * 0.85, -s * 0.6, s * 0.35, s * 0.18, col);
      ell(c, s * 0.7, -s * 1.0, s * 0.4, s * 0.4, col);
      ell(c, s * 1.12, -s * 0.95, s * 0.26, s * 0.1, '#e8642c');
      ell(c, s * 0.82, -s * 1.08, s * 0.06, s * 0.06, '#111');
      c.restore();
    }
  }

  // ---------- Etna viva: bagliore, fontane di lava, colate, pennacchio; parossismo ogni tanto ----------
  let lava = [];
  const erupt = { on: 0, next: 10 };
  function updateEtna(dt) {
    erupt.next -= dt;
    if (erupt.on <= 0 && erupt.next <= 0) {
      erupt.on = 7; erupt.next = rnd(22, 34);
      if (game.state === 'play') addText(W / 2, hz * 0.3, "L'Etna erutta!", '#ffb030', 22, 1.6);
      sfx.rumble();
    }
    erupt.on = Math.max(0, erupt.on - dt);
    const boom = erupt.on > 0, sc = Math.max(0.5, hz / 280);
    const n = boom ? 3 : (Math.random() < dt * 14 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      lava.push({ x: etna.x + rnd(-3, 3), y: etna.y, vx: rnd(-28, 28) * sc, vy: -rnd(50, boom ? 165 : 85) * sc, t: 0, life: rnd(1.1, 2.1), r: rnd(0.9, boom ? 2.4 : 1.6) });
    }
    for (const p of lava) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 95 * sc * dt; }
    lava = lava.filter(p => p.t < p.life);
  }
  function drawEtnaLive(t) {
    const c = ctx, boom = erupt.on > 0 ? Math.min(1, erupt.on, (7 - erupt.on) * 2) : 0;
    // cielo arrossato durante il parossismo
    if (boom > 0) { c.fillStyle = `rgba(232,90,40,${0.1 * boom})`; c.fillRect(0, 0, W, hz - 3); }
    // pennacchio di cenere illuminato dal basso
    for (const s of smoke) {
      const a = Math.sin(Math.PI * s.t / s.life) * (0.3 + 0.15 * boom), lit = Math.max(0, 1 - s.t / 1.8);
      const r = Math.round(lerp(70, 220, lit * 0.8)), g = Math.round(lerp(64, 110, lit * 0.6)), b = Math.round(lerp(78, 60, lit));
      ell(c, s.x, s.y, s.r, s.r * 0.8, `rgba(${r},${g},${b},${a})`);
    }
    c.save(); c.globalCompositeOperation = 'lighter';
    const pulse = 0.55 + 0.25 * Math.sin(t * 3.1) + 0.12 * Math.sin(t * 7.3) + 0.5 * boom;
    const gr = Math.max(26, W * 0.07) * (1 + boom * 0.6);
    const glow = c.createRadialGradient(etna.x, etna.y, 1, etna.x, etna.y, gr);
    glow.addColorStop(0, `rgba(255,170,70,${Math.min(1, 0.7 * pulse)})`); glow.addColorStop(0.4, `rgba(232,90,40,${0.35 * pulse})`); glow.addColorStop(1, 'rgba(232,80,30,0)');
    c.fillStyle = glow; c.fillRect(etna.x - gr, etna.y - gr, gr * 2, gr * 2);
    // colate vive che scorrono
    c.lineCap = 'round'; c.lineJoin = 'round';
    etna.flows.forEach((pts, k) => {
      c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
      c.setLineDash([]); c.strokeStyle = `rgba(232,90,40,${0.25 + 0.2 * boom})`; c.lineWidth = 5; c.stroke();
      c.setLineDash([5, 9]); c.lineDashOffset = -t * (10 + 14 * boom) - k * 7;
      c.strokeStyle = 'rgba(255,190,90,0.9)'; c.lineWidth = 1.8; c.stroke();
    });
    c.setLineDash([]);
    // brandelli di lava
    for (const p of lava) {
      const k = p.t / p.life;
      const col = k < 0.25 ? '255,240,170' : k < 0.55 ? '255,170,60' : k < 0.8 ? '232,90,40' : '140,30,20';
      ell(c, p.x, p.y, p.r, p.r, `rgba(${col},${1 - k * 0.6})`);
    }
    c.restore();
  }

  // ---------- Stato di gioco ----------
  // Le regole che decidono i punti stanno in supabase/functions/_shared/sim.js (GattitopiSim):
  // lo stesso codice gira sul server, che rigioca la partita dai clic e salva il punteggio che ottiene lui.
  const Sim = window.GattitopiSim;
  const game = { state: 'menu', record: 0, paused: false, shake: 0, shownLives: Sim.MAX_LIVES, acc: 0, gameId: null, inputs: [] };
  let S = Sim.create(1);
  let parts = [], texts = [], smoke = [], fw = [], smokeT = 0, festaT = 0, croakT = 3, fwQueue = [];
  const pointer = { x: -100, y: -100, show: 0, swing: 1, lx: 0, ly: 0 };

  try { game.record = parseInt(localStorage.getItem('gattitopi-record') || '0', 10) || 0; } catch (e) {}

  const HIT_LINES = ['Mizzica!', 'Talìa chistu!', "Va' curcati!", 'Pigghiatu!', 'Chi schifiu!', "Unn'è ca vai?", 'Ammazzalu!', 'Bedda matri!'];
  const EVENT_LABELS = { ondata: 'Ondata di gattitopi', blackout: 'Blackout!', festa: 'Festa di Santa Barbara' };

  const isPest = Sim.isPest, hittable = Sim.hittable;
  const mult = () => Sim.mult(S), bonus = () => Sim.bonus(S), progress = () => Sim.progress(S);

  const SCALE = { rat: 1, boss: 1, baby: 0.72, girl: 1, frog: 1, ara: 1, tri: 1, fuochi: 1 };
  const HEIGHT = { rat: 2.5, boss: 2.75, baby: 1.85, girl: 2.5, frog: 1.5, ara: 2.3, tri: 2.15, fuochi: 2.4 };
  function spriteHeight(e, h) { return h.r * HEIGHT[e.type]; }
  function anchorY(e, h) {
    const r = Math.max(0, Math.min(1, e.rise));
    const k = e.state === 'down' ? 1 - (1 - r) * (1 - r) : 1 - Math.pow(1 - r, 3);
    return h.cy + (1 - k) * spriteHeight(e, h) + h.r * 0.12;
  }
  function jumpPos(e) {
    const a = holes[e.from], b = holes[e.hole], t = e.jt;
    const r = lerp(a.r, b.r, t);
    return { x: lerp(a.cx, b.cx, t), y: lerp(a.cy, b.cy, t) + r * 0.12 - Math.sin(Math.PI * t) * r * 3.2, r };
  }

  function addText(x, y, txt, col, size = 22, life = 0.9) { texts.push({ x, y, txt, col, size, t: 0, life }); }
  function puff(x, y, n, col) {
    for (let i = 0; i < n; i++) parts.push({ x, y, vx: rnd(-140, 140), vy: rnd(-220, -40), r: rnd(3, 7), col, t: 0, life: rnd(0.4, 0.8), g: 600 });
  }
  function firework(x, y) {
    const col = pick(FW_COLORS), n = 36;
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n, v = rnd(80, 150);
      fw.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: Math.random() < 0.2 ? '#f4efe2' : col, t: 0, life: rnd(0.9, 1.4) });
    }
    sfx.boom();
  }

  function contains(e, x, y) {
    const pad = 8;
    if (e.state === 'jump') {
      const p = jumpPos(e);
      return Math.hypot(x - p.x, y - (p.y - p.r * 0.7)) < p.r * 1.15 + pad;
    }
    const h = holes[e.hole], ay = anchorY(e, h), top = ay - spriteHeight(e, h), w = h.r * 1.05 * SCALE[e.type];
    return x > h.cx - w - pad && x < h.cx + w + pad && y > top - pad && y < h.cy + h.r * 0.4 + pad;
  }
  function entPos(e) {
    if (e.state === 'jump' || (e.from !== undefined && e.jt < 1)) { const p = jumpPos(e); return { x: p.x, y: p.y - p.r * 1.2 }; }
    const h = holes[e.hole]; return { x: h.cx, y: anchorY(e, h) - spriteHeight(e, h) * 0.75 };
  }
  function nearestHole(x, y) {
    let best = -1, bd = Infinity;
    holes.forEach((h, i) => { const d = Math.hypot(x - h.cx, (y - h.cy) * 1.3); if (d < h.r * 2.2 && d < bd) { bd = d; best = i; } });
    return best;
  }

  // ---------- Rosario di Santa Barbara (vite) ----------
  function buildRosary() {
    // 10 grani di corallo sull'anello, la medaglia di Santa Barbara chiude l'anello in basso
    const g = $('beads'), NS = 'http://www.w3.org/2000/svg';
    g.innerHTML = '';
    for (let i = 0; i < Sim.MAX_LIVES; i++) {
      const a = Math.PI / 2 + (i + 1) * Math.PI * 2 / (Sim.MAX_LIVES + 1);
      const x = 60 + Math.cos(a) * 42, y = 54 + Math.sin(a) * 42;
      const b = document.createElementNS(NS, 'g');
      b.setAttribute('class', 'bead');
      const ball = document.createElementNS(NS, 'circle');
      ball.setAttribute('cx', x); ball.setAttribute('cy', y); ball.setAttribute('r', 6.6);
      ball.setAttribute('fill', 'url(#coral)'); ball.setAttribute('stroke', '#5a0e0a'); ball.setAttribute('stroke-width', '.5');
      const hi = document.createElementNS(NS, 'ellipse');
      hi.setAttribute('cx', x - 2.2); hi.setAttribute('cy', y - 2.4); hi.setAttribute('rx', 2); hi.setAttribute('ry', 1.3);
      hi.setAttribute('fill', '#fff'); hi.style.animationDelay = `${(i * 0.26).toFixed(2)}s`;
      b.append(ball, hi);
      g.appendChild(b);
    }
    game.shownLives = S.lives;
    updateLivesLabel();
  }
  function updateLivesLabel() {
    $('hLives').textContent = `${S.lives} ${S.lives === 1 ? 'vita' : 'vite'}`;
    $('rosary').setAttribute('aria-label', `Rosario: ${S.lives} palline`);
  }
  // i grani seguono le vite del motore: cadono quando ne perdi, tornano quando le riprendi
  function syncLives() {
    const now = S.lives, beads = $('beads').children;
    if (now === game.shownLives) return;
    if (now < game.shownLives) {
      for (let i = now; i < game.shownLives; i++) { beads[i].classList.remove('regain'); beads[i].classList.add('lost'); }
      sfx.tink();
      stage.classList.remove('hurt'); void stage.offsetWidth; stage.classList.add('hurt');
    } else {
      for (let i = game.shownLives; i < now; i++) { const b = beads[i]; b.classList.remove('lost'); void b.getBoundingClientRect(); b.classList.add('regain'); }
    }
    game.shownLives = now;
    updateLivesLabel();
  }

  function whack(x, y) {
    sfx.thwack();
    pointer.lx = x; pointer.ly = y;
    const w = Sim.weapon(S);
    const depth = e => (e.state === 'jump' ? 9 : holes[e.hole].row);
    const under = S.ents.filter(e => hittable(e) && contains(e, x, y)).sort((a, b) => depth(b) - depth(a));
    // l'asse di legno passa sopra 'a picciridda: si prende prima qualunque altro bersaglio
    const target = under.find(e => !(w.splash && e.type === 'girl')) || under[0] || null;
    const res = Sim.click(S, target ? target.id : -1, target ? -1 : nearestHole(x, y));
    if (!res) return;
    game.inputs.push(res.input);
    if (w.splash) {
      const reach = holes.length > 1 ? Math.abs(holes[1].cx - holes[0].cx) * 1.1 : 100;
      parts.push({ x, y, vx: 0, vy: 0, r: reach * 0.5, col: 'ring', t: 0, life: 0.25, g: 0 });
    }
    handleEvents(res.events, x, y);
  }

  // effetti, scritte e suoni per quello che è successo nel motore
  function handleEvents(list, cx, cy) {
    for (const v of list) {
      const e = v.e;
      if (v.k === 'spawn') {
        e.fur = 1 + Math.floor(Math.random() * 997); e.animOff = Math.random() * 10;
        if (e.type === 'boss') panic();
        const h = holes[e.hole];
        for (let i = 0; i < 7; i++) parts.push({ x: h.cx + rnd(-h.r, h.r), y: h.cy + rnd(-2, 4), vx: rnd(-30, 30), vy: rnd(-40, -10), r: rnd(2, 4.5), col: 'rgba(150,140,130,0.5)', t: 0, life: rnd(0.5, 0.9), g: -10 });
      } else if (v.k === 'kill') {
        const p = entPos(e);
        if (e.type === 'boss') {
          game.shake = Math.max(game.shake, 0.35);
          puff(p.x, p.y, 24, '#6e6878'); if (!v.quiet) { sfx.boss(); playVoice('rumpiu', true); }
          addText(p.x, p.y - 10, `+${v.pts}`, '#f2c230', 28);
          addText(p.x, p.y - 46, "'U Zù è finutu!", '#e8642c', 20, 1.3);
        } else if (e.type === 'frog') {
          puff(p.x, p.y, 12, '#5fb04a'); if (!v.quiet) sfx.croak();
          addText(p.x, p.y - 10, `+${v.pts}`, '#9be07f', 24);
          addText(p.x, p.y - 42, v.air ? 'Al volo!' : 'Cra!', '#f4efe2', 18, 1.1);
        } else {
          puff(p.x, p.y, 10, '#948e9b'); if (!v.quiet && !killVoice()) sfx.squeak(e.type === 'baby' ? 1.4 : 1);
          addText(p.x, p.y - 10, `+${v.pts}`, '#f2c230', 22);
          if (!v.quiet && Math.random() < 0.35) addText(p.x, p.y - 40, pick(HIT_LINES), '#f4efe2', 18, 1.1);
        }
      } else if (v.k === 'bossHit') {
        const p = entPos(e);
        puff(p.x, p.y, 6, '#6e6878'); sfx.squeak(0.7); addText(p.x, p.y - 10, `ancora ${e.hp}`, '#f4efe2', 16, 0.6);
      } else if (v.k === 'girl') {
        const p = entPos(e);
        game.shake = 0.25;
        puff(p.x, p.y, 8, '#f4efe2'); playVoice('bambina', true);
        addText(p.x, p.y - 20, "Scansa 'a picciridda!", '#e8642c', 20, 1.3);
      } else if (v.k === 'ara') {
        const p = entPos(e);
        puff(p.x, p.y, 14, '#f2c230'); sfx.crunch();
        addText(p.x, p.y - 20, 'Arancino!', '#f2c230', 24, 1.2);
      } else if (v.k === 'tri') {
        const p = entPos(e);
        puff(p.x, p.y, 16, '#c8312b'); sfx.shield();
        addText(p.x, p.y - 20, 'Trinacria: +3 scudi', '#f2c230', 20, 1.3);
      } else if (v.k === 'fuochi') {
        addText(W / 2, hz * 0.5, 'Fuochi di Santa Barbara!', '#f2c230', 26, 1.6);
        if (v.pests && !playVoice('rumpiu', true)) sfx.squeak(1.2);
        game.shake = 0.5;
        for (let i = 0; i < 5; i++) fwQueue.push({ at: i * 0.18, x: rnd(W * 0.15, W * 0.85), y: rnd(hz * 0.15, hz * 0.6) });
      } else if (v.k === 'miss') {
        if (v.overGirl) addText(cx, cy - 20, 'Scansata!', '#9be07f', 16, 0.7);
        else if (v.prevCombo >= 5) addText(cx, cy - 20, 'Combo persa', '#f4efe2', 16, 0.7);
      } else if (v.k === 'escape') {
        const h = holes[e.hole];
        if (v.shielded) { addText(h.cx, h.cy - h.r * 1.5, 'Parata!', '#f2c230', 18, 0.9); sfx.shield(); }
        else { addText(h.cx, h.cy - h.r * 1.5, 'Scappau!', '#e8642c', 20, 1); sfx.escape(); }
      } else if (v.k === 'jump') {
        sfx.boing();
      } else if (v.k === 'event') {
        addText(W / 2, hz * 0.45, v.hour === 0 ? 'Mezzanotte!' : `Ore ${String(v.hour).padStart(2, '0')}:00`, '#f4efe2', 22, 1.8);
        addText(W / 2, hz * 0.45 + 34, EVENT_LABELS[v.type], v.type === 'blackout' ? '#e8642c' : '#f2c230', 28, 2);
        sfx.bell();
        if (v.type === 'festa') firework(W / 2, hz * 0.3);
      } else if (v.k === 'weapon') {
        if (v.up) { addText(W / 2, H * 0.5, `${v.name}!`, '#f2c230', 34, 1.2); sfx.upgrade(); }
      } else if (v.k === 'end') {
        syncLives();
        end(v.win);
      }
    }
    syncLives();
  }

  function update(dt) {
    updateEtna(dt);
    const boom = erupt.on > 0;
    smokeT -= dt;
    if (smokeT <= 0) { smokeT = boom ? 0.12 : 0.3; smoke.push({ x: etna.x + rnd(-4, 4), y: etna.y - 2, r: boom ? 6 : 4, t: 0, life: boom ? 7 : 6, v: boom ? 18 : 8 }); }
    for (const s of smoke) { s.t += dt; s.y -= dt * s.v; s.x += dt * 10; s.r += dt * (boom ? 9 : 5); }
    smoke = smoke.filter(s => s.t < s.life);

    croakT -= dt;
    if (croakT <= 0 && park.rx && Math.random() < 0.4) {
      croakT = rnd(4, 9);
      addText(park.x + rnd(-park.rx, park.rx) * 0.5, park.y - park.ry * 3, 'qua qua', '#f4efe2', 12, 1.2);
    } else if (croakT <= 0) {
      croakT = rnd(4, 9);
      addText(fountain.x + pick([-1, 1]) * fountain.w * 0.42, fountain.y - fountain.w * 0.5, 'cra cra', '#9be07f', 13, 1.2);
    }

    pointer.swing = Math.min(1, pointer.swing + dt / 0.18);
    if (pointer.show > 0 && pointer.show !== Infinity) pointer.show -= dt;
    for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
    parts = parts.filter(p => p.t < p.life);
    for (const f of fw) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 90 * dt; f.vx *= 0.985; }
    fw = fw.filter(f => f.t < f.life);
    for (const q of fwQueue) { q.at -= dt; if (q.at <= 0) firework(q.x, q.y); }
    fwQueue = fwQueue.filter(q => q.at > 0);
    for (const t of texts) { t.t += dt; t.y -= 40 * dt; }
    texts = texts.filter(t => t.t < t.life);
    game.shake = Math.max(0, game.shake - dt);

    updateRunners(dt);
    updateGrill(dt);
    if (game.state !== 'play') return;
    if (S.event && S.event.type === 'festa') {
      festaT -= dt;
      if (festaT <= 0) { festaT = 0.55; firework(rnd(W * 0.1, W * 0.9), rnd(hz * 0.1, hz * 0.6)); }
    }
    // il motore avanza a passo fisso (1/60 s), come quando il server rigioca la partita
    game.acc = Math.min(game.acc + dt, 0.25);
    while (game.acc >= Sim.TICK && game.state === 'play') { game.acc -= Sim.TICK; handleEvents(Sim.step(S)); }
  }

  // ---------- Disegno ----------
  function drawEnt(c, e, s, look) {
    const ph = (e.anim + (e.animOff || 0)) % 3.4, blink = ph < 0.14 ? 1 - Math.abs(ph / 0.07 - 1) : 0;
    const o = { t: e.anim + (e.animOff || 0), hit: e.dead, boss: e.type === 'boss', baby: e.type === 'baby', hp: e.hp, seed: e.fur, look, blink };
    if (isPest(e)) drawRat(c, s * SCALE[e.type], o);
    else if (e.type === 'girl') drawGirl(c, s, o);
    else if (e.type === 'frog') drawFrog(c, s, o);
    else if (e.type === 'tri') drawTriPower(c, s, o);
    else if (e.type === 'fuochi') drawFuochi(c, s, o);
    else drawAra(c, s, o);
  }

  function drawFlag(t) {
    const { x, y, s } = flag, w = s * 1.5, n = 8;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const off0 = Math.sin(t * 4 - i * 0.7) * s * 0.08, off1 = Math.sin(t * 4 - (i + 1) * 0.7) * s * 0.08;
      const x0 = x + u0 * w, x1 = x + u1 * w;
      const d0 = y + off0 + s * (1 - u0), d1 = y + off1 + s * (1 - u1);
      ctx.fillStyle = '#c8312b';
      ctx.beginPath(); ctx.moveTo(x0, y + off0); ctx.lineTo(x1, y + off1); ctx.lineTo(x1, d1); ctx.lineTo(x0, d0); ctx.fill();
      ctx.fillStyle = '#f2c230';
      ctx.beginPath(); ctx.moveTo(x0, d0); ctx.lineTo(x1, d1); ctx.lineTo(x1, y + off1 + s); ctx.lineTo(x0, y + off0 + s); ctx.fill();
    }
    ell(ctx, x + w * 0.5, y + s * 0.5 + Math.sin(t * 4 - 3.5) * s * 0.08, s * 0.16, s * 0.16, '#f6d9a8');
  }

  function drawFountainWater(t) {
    const { x, y, w } = fountain;
    ctx.save();
    ctx.strokeStyle = 'rgba(160,200,255,0.75)'; ctx.lineWidth = Math.max(1.5, w * 0.025); ctx.lineCap = 'round';
    ctx.setLineDash([w * 0.05, w * 0.06]); ctx.lineDashOffset = -t * w * 0.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * w * 0.38, y - w * 0.32);
      ctx.quadraticCurveTo(x + side * w * 0.2, y - w * 0.62, x + side * w * 0.05, y - w * 0.22);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x, y - w * 0.52); ctx.lineTo(x, y - w * 0.72); ctx.stroke();
    ctx.restore();
  }

  function render(now) {
    const t = now / 1000;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (game.shake > 0) ctx.translate(Math.sin(t * 71) * game.shake * 14, Math.cos(t * 53) * game.shake * 10);
    if (bgC) ctx.drawImage(bgC, 0, 0, W, H);

    const p = game.state === 'menu' ? 0 : progress();
    if (p > 0.55) {
      const a = (p - 0.55) / 0.45;
      const g = ctx.createLinearGradient(0, 0, 0, hz);
      g.addColorStop(0, `rgba(120,140,220,${a * 0.25})`); g.addColorStop(1, `rgba(255,150,110,${a * 0.45})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz - 3);
    }
    drawEtnaLive(t);
    for (const f of fw) {
      const a = 1 - f.t / f.life;
      ctx.globalAlpha = Math.max(0, a);
      ell(ctx, f.x, f.y, 2.2, 2.2, f.col);
    }
    ctx.globalAlpha = 1;
    drawFlag(t);
    drawSBFigure(t);
    drawFountainWater(t);
    drawDucks(t);
    drawGriller(t);
    for (const r of runners) drawSignora(ctx, r.x, runnerFeetY(), runnerHeight(), r.t, r.dir, r.look);

    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      ell(ctx, h.cx, h.cy + h.r * 0.08, h.r * 1.18, h.r * 0.5, 'rgba(0,0,0,0.35)');
      ell(ctx, h.cx, h.cy, h.r * 1.06, h.r * 0.44, '#5d5f6b');
      ell(ctx, h.cx, h.cy, h.r * 0.92, h.r * 0.36, '#07070b');
      const e = S.ents.find(en => en.hole === i && en.state !== 'jump' && !(en.from !== undefined && en.state === 'hit' && en.jt < 1));
      if (e) {
        ctx.save();
        ctx.beginPath(); ctx.rect(h.cx - h.r * 4, h.cy - h.r * 6, h.r * 8, h.r * 6); ctx.clip();
        ctx.translate(h.cx, anchorY(e, h));
        if (e.wob > 0) ctx.rotate(Math.sin(e.wob * 50) * 0.12);
        let sy = 1;
        if (e.state === 'rise') sy = 1 + 0.14 * e.rise;
        else if (e.state === 'stay') sy = 1 + 0.14 * Math.cos(e.t * 26) * Math.exp(-e.t * 9);
        else if (e.state === 'hit') sy = 0.74 + 0.26 * Math.min(1, e.t / 0.4);
        ctx.scale(1 / Math.sqrt(sy), sy);
        const lp = pointer.show > 0 ? pointer : { x: h.cx, y: h.cy - h.r * 3 };
        const look = { x: Math.max(-1, Math.min(1, (lp.x - h.cx) / (W * 0.25))), y: Math.max(-1, Math.min(1, (lp.y - (h.cy - h.r * 2)) / (H * 0.25))) };
        drawEnt(ctx, e, h.r, look);
        ctx.restore();
      }
      ctx.strokeStyle = '#7a7c88'; ctx.lineWidth = h.r * 0.14;
      ctx.beginPath(); ctx.ellipse(h.cx, h.cy, h.r * 0.99, h.r * 0.4, 0, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = '#4a4c56'; ctx.lineWidth = Math.max(1, h.r * 0.04);
      for (let k = 1; k < 6; k++) {
        const a = Math.PI * k / 6;
        ctx.beginPath();
        ctx.moveTo(h.cx + Math.cos(a) * h.r * 0.93, h.cy + Math.sin(a) * h.r * 0.35);
        ctx.lineTo(h.cx + Math.cos(a) * h.r * 1.05, h.cy + Math.sin(a) * h.r * 0.45); ctx.stroke();
      }
    }

    // rane in volo (o colpite in volo)
    for (const e of S.ents) {
      const air = e.state === 'jump' || (e.from !== undefined && e.state === 'hit' && e.jt < 1);
      if (!air) continue;
      const jp = jumpPos(e);
      ell(ctx, lerp(holes[e.from].cx, holes[e.hole].cx, e.jt), lerp(holes[e.from].cy, holes[e.hole].cy, e.jt) + jp.r * 0.2, jp.r * 0.6, jp.r * 0.18, 'rgba(0,0,0,0.3)');
      ctx.save(); ctx.translate(jp.x, jp.y); drawEnt(ctx, e, jp.r); ctx.restore();
    }
    drawWelcome();

    for (const q of parts) {
      const k = 1 - q.t / q.life;
      if (q.col === 'ring') {
        ctx.strokeStyle = `rgba(242,194,48,${k * 0.8})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r * (2 - k), q.r * (2 - k) * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
      } else ell(ctx, q.x, q.y, q.r * k, q.r * k, q.col);
    }

    // Blackout: buio con la luce della torcia sul pede, si vedono solo gli occhi rossi
    if (game.state === 'play' && S.event && S.event.type === 'blackout') {
      const fade = Math.min(1, (S.event.dur - S.event.t) / 0.6, S.event.t / 0.6);
      const lx = pointer.show > 0 ? pointer.x : pointer.lx, ly = pointer.show > 0 ? pointer.y : pointer.ly;
      const rad = Math.max(90, Math.min(W, H) * 0.22);
      const g = ctx.createRadialGradient(lx, ly, rad * 0.25, lx, ly, rad);
      g.addColorStop(0, 'rgba(5,6,15,0)'); g.addColorStop(1, `rgba(5,6,15,${0.94 * fade})`);
      ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
      for (const e of S.ents) {
        if (!isPest(e) || e.dead || e.state === 'jump') continue;
        const h = holes[e.hole], ay = anchorY(e, h);
        if (ay - spriteHeight(e, h) * 0.7 > h.cy) continue;
        const [l, r2, er] = ratEyes(h.r * SCALE[e.type], e.type === 'boss');
        for (const [ex, ey] of [l, r2]) {
          ctx.save(); ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 10;
          ell(ctx, h.cx + ex, ay + ey, er * 0.8, er * 0.8, '#ff3b3b'); ctx.restore();
        }
      }
    }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const tx of texts) {
      ctx.globalAlpha = Math.min(1, 2 * (1 - tx.t / tx.life));
      ctx.font = `${Math.round(tx.size * (1 + 0.45 * Math.max(0, 1 - tx.t / 0.14)))}px ${DISPLAY}`;
      ctx.lineWidth = 5; ctx.strokeStyle = '#0f1630'; ctx.strokeText(tx.txt, tx.x, tx.y);
      ctx.fillStyle = tx.col; ctx.fillText(tx.txt, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;

    if (game.state === 'play') {
      const labels = [];
      if (S.event) labels.push([`${EVENT_LABELS[S.event.type]} · ${Math.ceil(S.event.t)}s`, S.event.type === 'blackout' ? '#e8642c' : '#f2c230']);
      if (S.slow > 0) labels.push([`Pausa arancino ${S.slow.toFixed(1)}s`, '#f2c230']);
      if (S.shield > 0) labels.push([`Scudo Trinacria ×${S.shield}`, '#f4efe2']);
      ctx.font = `16px ${DISPLAY}`; ctx.lineWidth = 5; ctx.strokeStyle = '#0f1630';
      labels.forEach(([txt, col], i) => { ctx.strokeText(txt, W / 2, 20 + i * 22); ctx.fillStyle = col; ctx.fillText(txt, W / 2, 20 + i * 22); });
    }
    ctx.restore();

    if (pointer.show > 0) {
      const k = pointer.swing;
      const ang = -0.55 + Math.sin(Math.PI * k) * 1.1;
      drawWeapon(ctx, game.state === 'play' ? Sim.weapon(S).name : 'Pede', pointer.x + 6, pointer.y - 12, ang, 1 + Math.sin(Math.PI * k) * 0.15);
    }
  }

  // ---------- Audio ----------
  let ac = null, muted = false;
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    loadVoices();
  }
  function tone(f1, f2, dur, type = 'square', vol = 0.08, delay = 0) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, freq, vol, delay = 0) {
    if (!ac || muted) return;
    const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    src.connect(f).connect(g).connect(ac.destination); src.start(ac.currentTime + delay);
  }
  const sfx = {
    thwack: () => noise(0.09, 900, 0.9),
    squeak: (k = 1) => tone(1800 * k, 2600 * k, 0.12, 'square', 0.05),
    boss: () => { tone(300, 80, 0.4, 'sawtooth', 0.09); noise(0.25, 300, 0.8); },
    croak: () => { tone(180, 120, 0.12, 'sawtooth', 0.08); tone(200, 130, 0.12, 'sawtooth', 0.08, 0.14); },
    boing: () => tone(220, 660, 0.18, 'triangle', 0.05),
    crunch: () => { noise(0.05, 2500, 0.6); noise(0.05, 2000, 0.6, 0.06); tone(523, 784, 0.25, 'triangle', 0.08, 0.05); },
    shield: () => { tone(660, 990, 0.12, 'triangle', 0.07); tone(990, 1320, 0.15, 'triangle', 0.06, 0.1); },
    boom: () => { noise(0.4, 150, 0.7); noise(0.25, 2400, 0.25, 0.05); },
    upgrade: () => [392, 523, 659].forEach((f, i) => tone(f, f, 0.14, 'square', 0.05, i * 0.08)),
    escape: () => tone(500, 180, 0.22, 'triangle', 0.06),
    rumble: () => { noise(1.4, 60, 0.9); noise(0.8, 120, 0.4, 0.2); },
    scream: () => { tone(900, 1350, 0.55, 'sawtooth', 0.035); tone(1150, 1500, 0.5, 'triangle', 0.03, 0.12); },
    tink: () => { tone(2400, 2300, 0.08, 'sine', 0.07); tone(2000, 1900, 0.08, 'sine', 0.05, 0.12); tone(1700, 1650, 0.08, 'sine', 0.035, 0.22); },
    bell: () => { tone(880, 870, 0.6, 'sine', 0.06); tone(660, 655, 0.8, 'sine', 0.05, 0.25); },
    end: win => win
      ? [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.25, 'triangle', 0.08, i * 0.14))
      : [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.98, 0.3, 'sawtooth', 0.06, i * 0.18))
  };

  // ---------- Fine partita e interfaccia ----------
  function rankFor(s) {
    if (s < 5000) return "Picciriddu cu 'u pede rottu";
    if (s < 15000) return 'Spazzino di quartiere';
    if (s < 35000) return 'Eroe di Paternò';
    if (s < 60000) return 'Cavaliere di Santa Barbara';
    return "Leggenda dell'Etna";
  }

  function end(win) {
    game.state = 'over';
    const dawn = S.dawnBonus || 0;
    let isRecord = false;
    if (S.score > game.record) {
      game.record = S.score; isRecord = true;
      try { localStorage.setItem('gattitopi-record', String(game.record)); } catch (e) {}
    }
    sfx.end(win);
    if (win) for (let i = 0; i < 6; i++) fwQueue.push({ at: i * 0.3, x: rnd(W * 0.15, W * 0.85), y: rnd(hz * 0.15, hz * 0.6) });
    $('endEyebrow').textContent = win ? "06:00 · È l'alba" : `${$('hClock').textContent} · Rosario sgranato`;
    $('endTitle').textContent = win ? 'Paternò è salva' : 'I gattitopi hanno vinto';
    $('endText').textContent = win
      ? `Hai tenuto la piazza fino al mattino. Bonus alba: +${dawn} punti per le ${S.lives} palline rimaste sul rosario.${isRecord ? ' Nuovo record.' : ''}`
      : `I tombini sono loro, almeno per stanotte. Tieni la combo alta per arrivare all'asse di legno, e conserva gli scudi della Trinacria per il blackout.${isRecord ? ' Nuovo record, comunque.' : ''}`;
    $('endScore').textContent = S.score.toLocaleString('it-IT');
    $('endRecord').textContent = game.record.toLocaleString('it-IT');
    $('endCombo').textContent = S.maxCombo;
    $('endRank').textContent = rankFor(S.score);
    if (window.Online) window.Online.finish({ gameId: game.gameId, inputs: game.inputs, score: S.score, maxCombo: S.maxCombo, win });
    $('ovEnd').hidden = false;
    $('againBtn').focus();
  }

  async function start() {
    if (game.state === 'starting') return;
    audio();
    game.state = 'starting';
    $('startBtn').disabled = $('againBtn').disabled = true;
    // da loggato il seed lo sceglie il server, che poi rigioca la partita con quel seed
    const online = window.Online ? await window.Online.newGame() : null;
    $('startBtn').disabled = $('againBtn').disabled = false;
    const unranked = !online && window.Online && window.Online.loggedIn();
    S = Sim.create(online ? online.seed : Math.floor(Math.random() * 2 ** 31));
    game.gameId = online ? online.id : null;
    game.inputs = []; game.acc = 0; game.shake = 0;
    parts = []; texts = []; fw = []; fwQueue = []; runners = [];
    pointer.lx = W / 2; pointer.ly = H * 0.7;
    buildRosary();
    game.state = 'play';
    $('ovStart').hidden = true; $('ovEnd').hidden = true; $('ovBoard').hidden = true; game.boardOpen = false;
    // il server accetta una partita nuova ogni 10 secondi: se ricominci troppo in fretta questa non va in classifica
    if (unranked) addText(W / 2, hz * 0.55, 'Partita fuori classifica: ricomincia tra qualche secondo', '#e8642c', 16, 3);
  }

  function updateHud() {
    $('hScore').textContent = S.score.toLocaleString('it-IT');
    $('hRecord').textContent = game.record.toLocaleString('it-IT');
    const wn = Sim.weapon(S).name;
    $('hCombo').textContent = `${S.combo} · x${mult() * bonus()}`;
    $('hWeapon').textContent = wn;
    $('hWeapon').classList.toggle('weapon-up', wn !== 'Pede');
    $('hShield').textContent = S.shield;
    const mins = (Sim.START_MIN + Math.floor(S.elapsed * 2)) % (24 * 60);
    $('hClock').textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  }

  // ---------- Input ----------
  function pos(ev) { const r = cv.getBoundingClientRect(); pointer.x = ev.clientX - r.left; pointer.y = ev.clientY - r.top; }
  cv.addEventListener('pointerdown', ev => {
    ev.preventDefault(); pos(ev); audio();
    pointer.show = ev.pointerType === 'mouse' ? Infinity : 0.45; pointer.swing = 0;
    if (game.state === 'play' && !game.paused && !game.boardOpen) whack(pointer.x, pointer.y);
  });
  cv.addEventListener('pointermove', ev => { pos(ev); pointer.lx = pointer.x; pointer.ly = pointer.y; if (ev.pointerType === 'mouse') pointer.show = Infinity; });
  cv.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') pointer.show = 0; });
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  // ---------- Voce campionata dal servizio TV su Paternò (velocizzata 1.25x, tono invariato) ----------
  const VOICE_CLIPS = {
    mmazzai: 'assets/audio/mmazzai.mp3',
    rumpiu: 'assets/audio/rumpiu.mp3',
    bambina: 'assets/audio/bambina.mp3',
    pidata: 'assets/audio/pidata.mp3',
    gattotopo: 'assets/audio/gattotopo.mp3'
  };
  const voices = {};
  let voiceSrc = null, voiceBusyUntil = 0, voicesLoaded = false;
  function loadVoices() {
    if (voicesLoaded || !ac) return;
    voicesLoaded = true;
    for (const [k, url] of Object.entries(VOICE_CLIPS)) {
      // data: URL (versione single-file) decodificato a mano: alcuni sandbox bloccano fetch su data:
      const bytes = url.startsWith('data:')
        ? Promise.resolve(Uint8Array.from(atob(url.split(',')[1]), ch => ch.charCodeAt(0)).buffer)
        : fetch(url).then(r => r.arrayBuffer());
      bytes
        .then(buf => ac.decodeAudioData(buf))
        .then(b => { voices[k] = b; })
        .catch(() => {}); // senza server (file://) le voci non si caricano: resta lo squittio
    }
  }
  // priority: una frase lunga (boss) non viene interrotta da quelle corte
  function playVoice(name, priority = false) {
    const buf = voices[name];
    if (!buf || !ac || muted) return false;
    if (!priority && ac.currentTime < voiceBusyUntil) return true;
    try { if (voiceSrc) voiceSrc.stop(); } catch (e) {}
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = buf; g.gain.value = 0.95;
    src.connect(g).connect(ac.destination); src.start();
    voiceSrc = src;
    voiceBusyUntil = priority ? ac.currentTime + buf.duration : 0;
    return true;
  }
  function killVoice() {
    const r = Math.random();
    return playVoice(r < 0.6 ? 'mmazzai' : r < 0.8 ? 'pidata' : 'gattotopo');
  }

  // la classifica mette in pausa la partita finché resta aperta
  if (window.Online && window.Online.available) {
    $('boardBtn').hidden = false;
    const openBoard = () => { game.boardOpen = true; window.Online.showBoard(); $('boardClose').focus(); };
    const closeBoard = () => { $('ovBoard').hidden = true; game.boardOpen = false; };
    $('boardBtn').addEventListener('click', openBoard);
    $('boardClose').addEventListener('click', closeBoard);
    // Esc apre e chiude la classifica (non mentre si scrive nel login)
    document.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape' || !$('ovAuth').hidden) return;
      ev.preventDefault();
      game.boardOpen ? closeBoard() : openBoard();
    });
  }
  // ricomincia da capo in qualsiasi momento; la partita in corso viene abbandonata
  $('restartBtn').addEventListener('click', () => { $('restartBtn').blur(); start(); });

  $('muteBtn').addEventListener('click', () => {
    muted = !muted; $('muteBtn').textContent = muted ? 'Audio: no' : 'Audio: sì';
  });
  document.addEventListener('visibilitychange', () => { game.paused = document.hidden; });

  // ---------- Icone della legenda ----------
  function drawIcon(id, fn, o, s = 12, dy = 0) {
    const c = $(id).getContext('2d');
    c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 44, 44);
    c.save(); c.beginPath(); c.arc(22, 22, 22, 0, Math.PI * 2); c.clip();
    c.translate(22, 44 + dy); fn(c, s, Object.assign({ t: 0.3, hit: false }, o)); c.restore();
  }
  function drawIcons() {
    drawIcon('icRat', drawRat, {});
    drawIcon('icBoss', drawRat, { boss: true, hp: 3 }, 11);
    drawIcon('icBaby', drawRat, { baby: true }, 12 * 0.72, -6);
    drawIcon('icGirl', drawGirl, {});
    drawIcon('icFrog', drawFrog, {}, 15, -6);
    drawIcon('icAra', drawAra, {}, 12, -4);
    drawIcon('icTri', drawTriPower, { t: 0 }, 14, -6);
    drawIcon('icFuo', drawFuochi, {}, 11, -4);
  }

  // ---------- Avvio ----------
  new ResizeObserver(resize).observe(stage);
  resize();
  buildRosary();
  drawIcons();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { buildBg(); drawIcons(); });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!game.paused && !game.boardOpen) update(dt);
    render(now); updateHud();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
