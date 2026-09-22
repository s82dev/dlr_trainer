/* TVT-Generator (technisches Verständnis). Alle Aufgaben werden aus Parametern erzeugt und
   physikalisch nachgerechnet; die Grafiken (SVG) folgen den Parametern (Zähnezahl -> Radius,
   Auftrieb -> Eintauchtiefe, Hebelarme -> Positionen). Eigene Aufgaben, vereinfachte Annahmen (reibungsfrei). */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];
  const INK = '#334155', SOFT = '#cbd5e1', ACC = '#2563eb', WARN = '#b45309';

  const svgWrap = (w, h, inner) => `<svg class="tech-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" xmlns="http://www.w3.org/2000/svg" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="13">${inner}</svg>`;
  const f1 = (v) => U.fmtNum(v, 2);
  const line = (x1, y1, x2, y2, c, w, extra) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c || INK}" stroke-width="${w || 2}" ${extra || ''}/>`;
  const text = (x, y, t, o) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${(o && o.fill) || INK}" text-anchor="${(o && o.anchor) || 'middle'}" font-weight="${(o && o.bold) ? 700 : 500}" ${(o && o.size) ? 'font-size="' + o.size + '"' : ''}>${t}</text>`;

  /** Antwortoptionen für Zahlenaufgaben: richtige + typische Fehlvarianten. */
  function numOptions(r, ans, wrongs, fmt, count) {
    count = count || 4;
    fmt = fmt || ((v) => U.fmtNum(v, 2));
    const seen = new Set([ans]); const out = [{ label: fmt(ans), correct: true }];
    wrongs.forEach((w) => { if (out.length < count && w.v > 0 && !seen.has(w.v) && isFinite(w.v)) { seen.add(w.v); out.push({ label: fmt(w.v), correct: false, err: w.err || 'Rechenfehler', note: w.note }); } });
    const steps = [0.5, 2, 1.25, 1.5, 0.75, 3, 0.25, 4];
    let i = 0;
    while (out.length < count && i < steps.length * 2) {
      const v = Math.round(ans * steps[i % steps.length] * 100) / 100 + (i >= steps.length ? 1 : 0);
      if (v > 0 && !seen.has(v)) { seen.add(v); out.push({ label: fmt(v), correct: false, err: 'Rechenfehler' }); }
      i++;
    }
    return out;
  }
  const textOptions = (correctIdx, labels, errs) => labels.map((l, i) => ({ label: l, correct: i === correctIdx, err: (errs && errs[i]) || 'technische Fehlinterpretation' }));

  /* ============================ ZAHNRÄDER ============================ */
  function gearPath(cx, cy, z, mod) {
    const r = z * mod / 2, ro = r + 4.5, ri = r - 4.5, pts = [];
    const n = Math.min(z, 48);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 2 * Math.PI, w = (2 * Math.PI) / n;
      [[0.0, ri], [0.16, ro], [0.5, ro], [0.66, ri]].forEach((p) => { const a = a0 + p[0] * w; pts.push((cx + p[1] * Math.cos(a)).toFixed(1) + ',' + (cy + p[1] * Math.sin(a)).toFixed(1)); });
    }
    return `<polygon points="${pts.join(' ')}" fill="#e2e8f0" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  function arrowArc(cx, cy, r, cw) {
    const a0 = -60, a1 = 40, rad = (d) => (d * Math.PI) / 180;
    const p = (d) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];
    const s = cw ? p(a0) : p(a1), e = cw ? p(a1) : p(a0);
    const dir = cw ? 1 : 0;
    const ang = rad(cw ? a1 + 90 : a0 - 90);
    const hx = e[0], hy = e[1];
    const h1 = [hx - 9 * Math.cos(ang - 0.45), hy - 9 * Math.sin(ang - 0.45)], h2 = [hx - 9 * Math.cos(ang + 0.45), hy - 9 * Math.sin(ang + 0.45)];
    return `<path d="M ${s[0].toFixed(1)} ${s[1].toFixed(1)} A ${r} ${r} 0 0 ${dir} ${e[0].toFixed(1)} ${e[1].toFixed(1)}" fill="none" stroke="${ACC}" stroke-width="3"/><polygon points="${hx.toFixed(1)},${hy.toFixed(1)} ${h1[0].toFixed(1)},${h1[1].toFixed(1)} ${h2[0].toFixed(1)},${h2[1].toFixed(1)}" fill="${ACC}"/>`;
  }
  function gearRow(teeth, cwFirst, labels) {
    const mod = 4.2, radii = teeth.map((z) => (z * mod) / 2);
    let x = 20 + radii[0], maxR = Math.max.apply(null, radii);
    let inner = '', H = maxR * 2 + 50, cy = H / 2;
    const xs = [];
    radii.forEach((r, i) => { xs.push(x); if (i < radii.length - 1) x += r + radii[i + 1] + 2; });
    teeth.forEach((z, i) => {
      inner += gearPath(xs[i], cy, z, mod) + `<circle cx="${xs[i].toFixed(1)}" cy="${cy}" r="4" fill="${INK}"/>`;
      inner += text(xs[i], cy + radii[i] * 0.45 + 14, 'z=' + z, { size: 12 }) + text(xs[i], cy - radii[i] - 12, labels[i], { bold: true, size: 15, fill: ACC });
    });
    inner += arrowArc(xs[0], cy, Math.min(radii[0] * 0.55, 30), cwFirst);
    return svgWrap(Math.round(xs[xs.length - 1] + radii[radii.length - 1] + 20), Math.round(H), inner);
  }
  function gearRing3(z) {
    const mod = 4.2, r = (z * mod) / 2, d = 2 * r + 2;
    const pts = [[d / 2 + r + 30, r + 30], [d / 2 + r + 30 + d, r + 30], [d / 2 + r + 30 + d / 2, r + 30 + d * 0.866]];
    let inner = '';
    pts.forEach((p, i) => { inner += gearPath(p[0], p[1], z, mod) + `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${INK}"/>` + text(p[0], p[1] - r - 10, 'ABC'[i], { bold: true, fill: ACC, size: 15 }); });
    inner += arrowArc(pts[0][0], pts[0][1], Math.min(r * 0.55, 28), true);
    return svgWrap(Math.round(d * 2 + 60), Math.round(d * 0.866 + r * 2 + 60), inner);
  }
  const CW = 'im Uhrzeigersinn', CCW = 'gegen den Uhrzeigersinn';

  const T = {};
  T.gearDir = (r, L) => {
    const n = r.int(2, Math.min(6, 2 + Math.ceil(L / 2)));
    const teeth = []; for (let i = 0; i < n; i++) teeth.push(r.pick([12, 14, 16, 18, 20, 24, 28, 32]));
    const cw = r.chance(0.5), labels = 'ABCDEFG'.split('').slice(0, n);
    const lastCw = (n - 1) % 2 === 0 ? cw : !cw;
    const idx = n - 1;
    return {
      visual: gearRow(teeth, cw, labels), prompt: `Zahnrad A dreht sich <b>${cw ? CW : CCW}</b>. In welche Richtung dreht sich Zahnrad ${labels[idx]}?`,
      options: textOptions(lastCw ? 0 : 1, [CW, CCW]), cols: 2, c: 5 + n * 2, diff: 1 + n * 0.5,
      solution: lastCw ? CW : CCW, explain: 'Jedes Zahnrad kehrt die Drehrichtung seines Nachbarn um. Nach ' + idx + ' Übergängen: ' + (idx % 2 === 0 ? 'gleiche' : 'entgegengesetzte') + ' Richtung.',
    };
  };
  T.gearRatio = (r, L) => {
    const n = r.int(2, L >= 6 ? 4 : 3);
    const pairs = [[12, 24], [24, 12], [36, 12], [12, 36], [20, 30], [30, 20], [16, 32], [32, 16], [18, 36], [40, 20], [20, 40], [24, 36], [36, 24]];
    const pr = r.pick(pairs);
    const teeth = [pr[0]]; for (let i = 1; i < n - 1; i++) teeth.push(r.pick([14, 18, 22, 26]));
    teeth.push(pr[1]);
    const rpm = r.pick([60, 120, 180, 240, 360].filter((x) => (x * pr[0]) % pr[1] === 0));
    const ans = (rpm * pr[0]) / pr[1];
    const labels = 'ABCDEF'.split('').slice(0, n);
    const opts = numOptions(r, ans, [{ v: (rpm * pr[1]) / pr[0], err: 'technische Fehlinterpretation', note: 'Übersetzung umgekehrt' }, { v: rpm, err: 'technische Fehlinterpretation', note: 'Zähnezahl ignoriert' }, { v: rpm + (pr[1] - pr[0]), err: 'Rechenfehler' }], (v) => U.fmtNum(v, 0) + ' min⁻¹');
    return {
      visual: gearRow(teeth, true, labels), prompt: `Zahnrad A dreht mit <b>${rpm} min⁻¹</b>. Wie schnell dreht Zahnrad ${labels[n - 1]}?`,
      options: opts, cols: 2, c: 12 + n, diff: 3 + n * 0.6, solution: U.fmtNum(ans, 0) + ' min⁻¹',
      explain: `Zwischenräder ändern nur die Richtung. n_${labels[n - 1]} = n_A × z_A / z_${labels[n - 1]} = ${rpm} × ${pr[0]} / ${pr[1]} = ${ans}.`,
    };
  };
  T.gearBlock = (r, L) => {
    const ring = r.chance(0.55); // Ring aus 3 Rädern blockiert
    if (ring) return {
      visual: gearRing3(r.pick([16, 20, 24])), prompt: 'Die drei gleich großen Zahnräder greifen paarweise ineinander. Rad A wird angetrieben. Was passiert?',
      options: textOptions(2, ['Alle drehen sich, C gegenläufig zu A', 'Alle drehen sich gleichsinnig', 'Das System blockiert'], ['technische Fehlinterpretation', 'technische Fehlinterpretation']), cols: 1, c: 14, diff: 6,
      solution: 'Das System blockiert', explain: 'Ein geschlossener Ring aus einer ungeraden Anzahl von Zahnrädern kann sich nicht drehen: Rad A würde B gegenläufig und C wieder gegenläufig zu B (also gleichsinnig zu A) antreiben – C muss aber zugleich A gegenläufig antreiben.',
    };
    return T.gearDir(r, L);
  };

  /* ============================ RIEMENTRIEB ============================ */
  T.belt = (r, L) => {
    const crossed = r.chance(0.5), dA = r.pick([10, 20, 30, 40]), dB = r.pick([10, 20, 30, 40].filter((x) => x !== dA));
    const rpm = r.pick([60, 120, 240, 300, 360, 480].filter((x) => (x * dA) % dB === 0));
    const ans = (rpm * dA) / dB;
    const r1 = dA * 1.1, r2 = dB * 1.1, D = r1 + r2 + 90, cy = Math.max(r1, r2) + 22;
    const c1 = [20 + r1, cy], c2 = [20 + r1 + D, cy];
    let inner = `<circle cx="${c1[0]}" cy="${c1[1]}" r="${r1}" fill="#e2e8f0" stroke="${INK}" stroke-width="2"/><circle cx="${c2[0]}" cy="${c2[1]}" r="${r2}" fill="#e2e8f0" stroke="${INK}" stroke-width="2"/>`;
    const nx = crossed ? (r1 + r2) / D : (r1 - r2) / D, ny = Math.sqrt(1 - nx * nx);
    [-1, 1].forEach((s) => {
      const n = [nx, s * ny];
      const p1 = [c1[0] + r1 * n[0], c1[1] + r1 * n[1]];
      const p2 = crossed ? [c2[0] - r2 * n[0], c2[1] - r2 * n[1]] : [c2[0] + r2 * n[0], c2[1] + r2 * n[1]];
      inner += line(p1[0], p1[1], p2[0], p2[1], WARN, 3);
    });
    inner += `<circle cx="${c1[0]}" cy="${c1[1]}" r="3" fill="${INK}"/><circle cx="${c2[0]}" cy="${c2[1]}" r="3" fill="${INK}"/>` + text(c1[0], c1[1] + 4, 'A', { bold: true, fill: ACC, size: 15 }) + text(c2[0], c2[1] + 4, 'B', { bold: true, fill: ACC, size: 15 });
    inner += text(c1[0], c1[1] + r1 + 16, 'Ø ' + dA + ' mm', { size: 12 }) + text(c2[0], c2[1] + r2 + 16, 'Ø ' + dB + ' mm', { size: 12 }) + arrowArc(c1[0], c1[1] - r1 * 0.0, Math.min(r1 * 0.45, 22), true);
    const svg = svgWrap(Math.round(D + r1 + r2 + 40), Math.round(cy * 2 + 30), inner);
    const kind = r.chance(0.5) ? 'dir' : 'rpm';
    if (kind === 'dir') return { visual: svg, prompt: `Riemenscheibe A dreht <b>${CW}</b>. Wie dreht sich B (${crossed ? 'gekreuzter' : 'offener'} Riemen)?`, options: textOptions(crossed ? 1 : 0, [CW, CCW]), cols: 2, c: 8, diff: 3, solution: crossed ? CCW : CW, explain: 'Ein offener Riemen erhält die Drehrichtung, ein gekreuzter Riemen kehrt sie um.' };
    return { visual: svg, prompt: `Scheibe A (Ø ${dA} mm) dreht mit <b>${rpm} min⁻¹</b>. Drehzahl von B (Ø ${dB} mm)?`, options: numOptions(r, ans, [{ v: (rpm * dB) / dA, err: 'technische Fehlinterpretation', note: 'Übersetzung umgekehrt' }, { v: rpm, err: 'technische Fehlinterpretation' }], (v) => U.fmtNum(v, 0) + ' min⁻¹'), cols: 2, c: 13, diff: 4, solution: ans + ' min⁻¹', explain: `Bandgeschwindigkeit gleich: n_B = n_A × d_A / d_B = ${rpm} × ${dA} / ${dB} = ${ans}.` };
  };

  /* ============================ HEBEL ============================ */
  function leverSvg(left, right, unknownRight) {
    const U0 = 30, cx = 210, by = 90, W = 420;
    let inner = line(cx - 6 * U0, by, cx + 6 * U0, by, INK, 5, 'stroke-linecap="round"');
    inner += `<polygon points="${cx},${by + 4} ${cx - 16},${by + 44} ${cx + 16},${by + 44}" fill="#94a3b8" stroke="${INK}" stroke-width="1.5"/>`;
    for (let i = -6; i <= 6; i++) { inner += line(cx + i * U0, by - 5, cx + i * U0, by + 5, i === 0 ? '#0f172a' : INK, 1.5); if (i !== 0) inner += text(cx + i * U0, by + 22, String(Math.abs(i)), { size: 10, fill: '#64748b' }); }
    const mass = (x, m, unknown) => { const s = 22 + Math.min(16, m / 2); return line(x, by, x, by - 24, INK, 1.5) + `<rect x="${x - s / 2}" y="${by - 24 - s}" width="${s}" height="${s}" fill="${unknown ? '#fde68a' : '#cbd5e1'}" stroke="${INK}" stroke-width="1.6"/>` + text(x, by - 24 - s / 2 + 4, unknown ? '?' : m + ' kg', { size: 11, bold: true }); };
    left.forEach((p) => (inner += mass(cx - p.d * U0, p.m)));
    right.forEach((p) => (inner += mass(cx + p.d * U0, p.m, unknownRight && p.unknown)));
    return svgWrap(W, 150, inner);
  }
  T.lever = (r, L) => {
    const nl = L >= 6 ? 2 : 1, nr = L >= 6 ? 2 : 1;
    const mk = (n) => { const arr = [], used = new Set(); for (let i = 0; i < n; i++) { let d; do { d = r.int(1, 6); } while (used.has(d)); used.add(d); arr.push({ m: r.pick([2, 3, 4, 5, 6, 8, 10]), d }); } return arr; };
    const left = mk(nl), right = mk(nr);
    const tl = U.sum(left.map((x) => x.m * x.d)), tr = U.sum(right.map((x) => x.m * x.d));
    if (r.chance(0.5)) {
      const ans = tl === tr ? 2 : tl > tr ? 0 : 1;
      return {
        visual: leverSvg(left, right), prompt: 'Der Hebel ruht auf dem Drehpunkt (Skala = Abstand in Einheiten). Welche Seite senkt sich?',
        options: textOptions(ans, ['links', 'rechts', 'Gleichgewicht'], ['Wahrnehmungsfehler', 'Wahrnehmungsfehler', 'technische Fehlinterpretation']), cols: 3, c: 8 + 3 * (nl + nr), diff: 2 + nl + nr,
        solution: ['links', 'rechts', 'Gleichgewicht'][ans], explain: `Drehmomente: links ${left.map((x) => x.m + '×' + x.d).join(' + ')} = ${tl}, rechts ${right.map((x) => x.m + '×' + x.d).join(' + ')} = ${tr}. Die Seite mit dem größeren Drehmoment senkt sich.`,
      };
    }
    // Gleichgewichtsmasse
    let d2, mR; const tries = [];
    for (let d = 1; d <= 6; d++) if (tl % d === 0 && tl / d <= 30) tries.push(d);
    if (!tries.length) return T.lever(r, L);
    d2 = r.pick(tries); mR = tl / d2;
    const rr = [{ m: 0, d: d2, unknown: true }];
    return {
      visual: leverSvg(left, rr, true), prompt: 'Der Hebel soll im Gleichgewicht sein. Welche Masse muss rechts hängen (?)',
      options: numOptions(r, mR, [{ v: tl, err: 'technische Fehlinterpretation', note: 'Hebelarm ignoriert' }, { v: mR + 2, err: 'Rechenfehler' }, { v: (tl * d2) / 1, err: 'technische Fehlinterpretation' }], (v) => U.fmtNum(v, 1) + ' kg'), cols: 2, c: 13 + nl * 3, diff: 4 + nl,
      solution: U.fmtNum(mR, 1) + ' kg', explain: `Linkes Drehmoment ${tl}. Rechts: m × ${d2} = ${tl} → m = ${mR} kg.`,
    };
  };

  /* ============================ FLASCHENZUG ============================ */
  T.pulley = (r, L) => {
    const n = r.int(2, Math.min(6, 2 + Math.ceil(L / 2))), W = r.pick([120, 240, 360, 480, 600, 720].filter((x) => x % n === 0 && x % (n - 1 || 1) === 0 || x % n === 0)), h = r.pick([1, 2, 3]);
    const x0 = 60, span = 160;
    let inner = `<rect x="${x0 - 30}" y="10" width="${span + 60}" height="14" fill="#94a3b8" stroke="${INK}" stroke-width="1.5"/>` + text(x0 + span / 2, 6, 'Decke', { size: 10, fill: '#64748b' });
    inner += `<rect x="${x0 - 8}" y="24" width="${span + 16}" height="18" rx="4" fill="#e2e8f0" stroke="${INK}" stroke-width="1.6"/>`;
    const yb = 140;
    inner += `<rect x="${x0 - 8}" y="${yb}" width="${span + 16}" height="18" rx="4" fill="#e2e8f0" stroke="${INK}" stroke-width="1.6"/>`;
    for (let i = 0; i < n; i++) { const x = x0 + (span * i) / Math.max(1, n - 1); inner += line(x, 42, x, yb, WARN, 2.5); }
    inner += line(x0 + span / 2, yb + 18, x0 + span / 2, yb + 44, INK, 2) + `<rect x="${x0 + span / 2 - 30}" y="${yb + 44}" width="60" height="34" fill="#cbd5e1" stroke="${INK}" stroke-width="1.6"/>` + text(x0 + span / 2, yb + 66, W + ' N', { bold: true });
    inner += line(x0 + span + 8, 33, x0 + span + 70, 33, WARN, 2.5) + `<polygon points="${x0 + span + 70},33 ${x0 + span + 60},28 ${x0 + span + 60},38" fill="${WARN}"/>` + text(x0 + span + 60, 20, 'F', { bold: true, fill: ACC, size: 15 });
    const svg = svgWrap(x0 + span + 110, 240, inner);
    if (r.chance(0.5)) {
      const ans = W / n;
      return { visual: svg, prompt: `Ein Gewicht von ${W} N wird über den Flaschenzug (reibungsfrei) gehoben. Welche Zugkraft F ist nötig?`, options: numOptions(r, ans, [{ v: W, err: 'technische Fehlinterpretation', note: 'Seile nicht gezählt' }, { v: W / (n + 1), err: 'technische Fehlinterpretation' }, { v: W / (n > 2 ? n - 1 : 4), err: 'technische Fehlinterpretation', note: 'falsche Seilzahl' }], (v) => U.fmtNum(v, 0) + ' N'), cols: 2, c: 9, diff: 3 + n * 0.3, solution: ans + ' N', explain: `Die Last hängt an ${n} tragenden Seilen: F = ${W} N / ${n} = ${ans} N.` };
    }
    const ans = n * h;
    return { visual: svg, prompt: `Die Last soll um ${h} m angehoben werden. Wie viele Meter Seil müssen gezogen werden?`, options: numOptions(r, ans, [{ v: h, err: 'technische Fehlinterpretation' }, { v: h * (n + 1), err: 'technische Fehlinterpretation' }, { v: h * (n - 1 || 3), err: 'technische Fehlinterpretation' }], (v) => U.fmtNum(v, 0) + ' m'), cols: 2, c: 9, diff: 3 + n * 0.3, solution: ans + ' m', explain: `Bei ${n} tragenden Seilen muss jedes Seil um ${h} m kürzer werden: ${n} × ${h} = ${ans} m (Kraft ÷ ${n}, Weg × ${n}).` };
  };

  /* ============================ HYDRAULIK ============================ */
  T.hydraulic = (r, L) => {
    const A1 = r.pick([2, 4, 5, 10]), k = r.pick([2, 3, 4, 5, 8, 10]), A2 = A1 * k, F1 = r.pick([20, 50, 100, 150, 200]);
    const w1 = 18 + A1 * 3, w2 = 18 + A2 * 3 / (k > 5 ? 3 : 1.4);
    const wa = Math.min(w1, 60), wb = Math.min(w2, 130);
    let inner = `<rect x="30" y="50" width="${wa}" height="130" fill="#e0f2fe" stroke="${INK}" stroke-width="2"/><rect x="${30 + wa + 90}" y="50" width="${wb}" height="130" fill="#e0f2fe" stroke="${INK}" stroke-width="2"/>`;
    inner += `<rect x="${30 + wa}" y="150" width="90" height="30" fill="#e0f2fe" stroke="${INK}" stroke-width="2"/>`;
    inner += `<rect x="32" y="70" width="${wa - 4}" height="10" fill="#94a3b8" stroke="${INK}"/>` + `<rect x="${32 + wa + 90}" y="70" width="${wb - 4}" height="10" fill="#94a3b8" stroke="${INK}"/>`;
    inner += line(30 + wa / 2, 20, 30 + wa / 2, 68, ACC, 3) + `<polygon points="${30 + wa / 2},70 ${30 + wa / 2 - 6},58 ${30 + wa / 2 + 6},58" fill="${ACC}"/>` + text(30 + wa / 2, 14, 'F₁=' + F1 + ' N', { size: 12, fill: ACC, bold: true });
    inner += text(30 + wa / 2, 200, 'A₁=' + A1 + ' cm²', { size: 12 }) + text(30 + wa + 90 + wb / 2, 200, 'A₂=' + A2 + ' cm²', { size: 12 }) + text(30 + wa + 90 + wb / 2, 40, 'F₂ = ?', { size: 13, bold: true, fill: WARN });
    const svg = svgWrap(30 + wa + 90 + wb + 40, 215, inner);
    if (r.chance(0.6)) { const ans = F1 * k; return { visual: svg, prompt: 'Die Hydraulikflüssigkeit ist nicht komprimierbar. Welche Kraft F₂ entsteht am großen Kolben?', options: numOptions(r, ans, [{ v: F1 / k, err: 'technische Fehlinterpretation', note: 'Flächenverhältnis umgekehrt' }, { v: F1, err: 'technische Fehlinterpretation' }, { v: F1 + A2 - A1, err: 'Rechenfehler' }], (v) => U.fmtNum(v, 1) + ' N'), cols: 2, c: 11, diff: 3.5, solution: ans + ' N', explain: `Druck p = F₁/A₁ = ${F1}/${A1} = ${F1 / A1} N/cm². F₂ = p × A₂ = ${F1 / A1} × ${A2} = ${ans} N.` }; }
    const s = r.pick([2, 4, 6, 10]) * k; const ans = s / k;
    return { visual: svg, prompt: `Der kleine Kolben (A₁) wird um ${s} cm eingedrückt. Um wie viele cm hebt sich der große Kolben?`, options: numOptions(r, ans, [{ v: s * k, err: 'technische Fehlinterpretation', note: 'Weg-Kraft-Verhältnis vertauscht' }, { v: s, err: 'technische Fehlinterpretation' }, { v: s / 2, err: 'Rechenfehler' }], (v) => U.fmtNum(v, 1) + ' cm'), cols: 2, c: 11, diff: 4.5, solution: ans + ' cm', explain: `Verdrängtes Volumen gleich: A₁ × s₁ = A₂ × s₂ → s₂ = ${s} × ${A1}/${A2} = ${ans} cm.` };
  };

  /* ============================ GAS / PNEUMATIK ============================ */
  T.boyle = (r, L) => {
    const p1 = r.pick([100, 150, 200, 300]), V1 = r.pick([4, 6, 8, 12]);
    const f = r.pick([2, 3, 4]).valueOf();
    const shrink = r.chance(0.6); const V2 = shrink ? V1 / f : V1 * f;
    if (V2 !== Math.round(V2) && shrink) return T.boyle(r, L);
    const ans = (p1 * V1) / V2;
    const draw = (x, V, label, gas) => `<rect x="${x}" y="30" width="${20 + V * 14}" height="50" fill="#f1f5f9" stroke="${INK}" stroke-width="2"/><rect x="${x + 20 + V * 14}" y="36" width="8" height="38" fill="#94a3b8" stroke="${INK}"/>${line(x + 28 + V * 14, 55, x + 58 + V * 14, 55, INK, 3)}` + text(x + (20 + V * 14) / 2, 100, label, { size: 12 }) + Array.from({ length: gas }, (_, i) => `<circle cx="${x + 8 + ((i * 37) % (16 + V * 14 - 8))}" cy="${40 + ((i * 23) % 34)}" r="2.6" fill="${ACC}"/>`).join('');
    const svg = svgWrap(460, 120, draw(20, V1, `V₁ = ${V1} l, p₁ = ${p1} kPa`, 14) + text(230, 60, '→', { size: 24 }) + draw(250, V2, `V₂ = ${U.fmtNum(V2, 1)} l, p₂ = ?`, 14));
    return { visual: svg, prompt: 'Das Gas im Zylinder wird bei <b>konstanter Temperatur</b> auf ein anderes Volumen gebracht. Wie groß ist p₂?', options: numOptions(r, ans, [{ v: (p1 * V2) / V1, err: 'technische Fehlinterpretation', note: 'Gesetz von Boyle umgekehrt' }, { v: p1, err: 'technische Fehlinterpretation' }, { v: p1 + Math.abs(V1 - V2) * 10, err: 'Rechenfehler' }], (v) => U.fmtNum(v, 1) + ' kPa'), cols: 2, c: 12, diff: 4, solution: U.fmtNum(ans, 1) + ' kPa', explain: `p × V = konstant: ${p1} × ${V1} = p₂ × ${U.fmtNum(V2, 1)} → p₂ = ${U.fmtNum(ans, 1)} kPa.` };
  };
  T.vessels = (r, L) => {
    const p1 = r.pick([100, 200, 400, 600]), V1 = r.pick([2, 3, 6]), p2 = r.pick([100, 200, 300, 500].filter((x) => x !== p1)), V2 = r.pick([2, 3, 6]);
    const ans = (p1 * V1 + p2 * V2) / (V1 + V2);
    if (!Number.isInteger(ans * 10)) return T.vessels(r, L);
    const inner = `<rect x="20" y="20" width="${40 + V1 * 14}" height="80" fill="#f1f5f9" stroke="${INK}" stroke-width="2"/>` + `<rect x="${140 + V1 * 8}" y="20" width="${40 + V2 * 14}" height="80" fill="#f1f5f9" stroke="${INK}" stroke-width="2"/>` + line(60 + V1 * 14, 60, 140 + V1 * 8, 60, INK, 8) + `<circle cx="${100 + V1 * 11}" cy="60" r="9" fill="#fde68a" stroke="${INK}" stroke-width="2"/>` + text(20 + (40 + V1 * 14) / 2, 115, `${V1} l · ${p1} kPa`, { size: 12 }) + text(140 + V1 * 8 + (40 + V2 * 14) / 2, 115, `${V2} l · ${p2} kPa`, { size: 12 }) + text(100 + V1 * 11, 42, 'Ventil', { size: 11 });
    return { visual: svgWrap(280 + V2 * 8 + V1 * 8, 130, inner), prompt: 'Zwei Behälter (gleiche Temperatur) werden über das Ventil verbunden. Welcher Druck stellt sich ein?', options: numOptions(r, ans, [{ v: (p1 + p2) / 2, err: 'technische Fehlinterpretation', note: 'Volumen nicht gewichtet' }, { v: p1 + p2, err: 'technische Fehlinterpretation' }, { v: Math.max(p1, p2), err: 'technische Fehlinterpretation' }], (v) => U.fmtNum(v, 1) + ' kPa'), cols: 2, c: 16, diff: 6, solution: U.fmtNum(ans, 1) + ' kPa', explain: `Gesamtmenge bleibt: p × (V₁+V₂) = p₁V₁ + p₂V₂ → p = (${p1}×${V1} + ${p2}×${V2}) / ${V1 + V2} = ${U.fmtNum(ans, 1)} kPa.` };
  };

  /* ============================ SCHALTKREISE (Serien-/Parallel-Bäume) ============================ */
  function layout(node) {
    const GAP = 22, LW = 64, LH = 32;
    if (node.t === 'S') {
      const ch = node.ch.map(layout); const cy = Math.max.apply(null, ch.map((c) => c.cy));
      const w = U.sum(ch.map((c) => c.w)) + GAP * (ch.length - 1), h = Math.max.apply(null, ch.map((c) => cy - c.cy + c.h));
      return { w, h, cy, draw(x, y) { let s = '', cx = x; ch.forEach((c, i) => { s += c.draw(cx, y + cy - c.cy); cx += c.w; if (i < ch.length - 1) { s += line(cx, y + cy, cx + GAP, y + cy, INK, 2); cx += GAP; } }); return s; } };
    }
    if (node.t === 'P') {
      const ch = node.ch.map(layout), mw = Math.max.apply(null, ch.map((c) => c.w)), RAIL = 14;
      let yy = 0; const pos = ch.map((c) => { const p = yy; yy += c.h + 14; return p; });
      const h = yy - 14, cy = ch[0].cy, lastCy = pos[pos.length - 1] + ch[ch.length - 1].cy;
      return { w: mw + RAIL * 2, h, cy, draw(x, y) {
        let s = line(x + RAIL, y + cy, x + RAIL, y + lastCy, INK, 2) + line(x + RAIL + mw, y + cy, x + RAIL + mw, y + lastCy, INK, 2);
        ch.forEach((c, i) => { const yy2 = y + pos[i]; const off = (mw - c.w) / 2; s += c.draw(x + RAIL + off, yy2); const ty = yy2 + c.cy; s += line(x + RAIL, ty, x + RAIL + off, ty, INK, 2) + line(x + RAIL + off + c.w, ty, x + RAIL + mw, ty, INK, 2); });
        s += line(x, y + cy, x + RAIL, y + cy, INK, 2) + line(x + RAIL + mw, y + cy, x + mw + RAIL * 2, y + cy, INK, 2);
        return s; } };
    }
    return { w: LW, h: LH, cy: LH / 2, draw(x, y) {
      const cy = y + LH / 2;
      if (node.t === 'R') return line(x, cy, x + 10, cy, INK, 2) + `<rect x="${x + 10}" y="${y + 4}" width="${LW - 20}" height="${LH - 8}" fill="#fff" stroke="${INK}" stroke-width="2"/>` + line(x + LW - 10, cy, x + LW, cy, INK, 2) + text(x + LW / 2, cy + 4, node.label, { size: 11, bold: true });
      if (node.t === 'L') { return line(x, cy, x + 16, cy, INK, 2) + `<circle cx="${x + LW / 2}" cy="${cy}" r="12" fill="#fff" stroke="${INK}" stroke-width="2"/>` + line(x + LW / 2 - 8, cy - 8, x + LW / 2 + 8, cy + 8, INK, 1.5) + line(x + LW / 2 - 8, cy + 8, x + LW / 2 + 8, cy - 8, INK, 1.5) + line(x + LW - 16, cy, x + LW, cy, INK, 2) + text(x + LW / 2, cy - 17, node.label, { size: 11, bold: true, fill: ACC }); }
      // Schalter
      return line(x, cy, x + 16, cy, INK, 2) + `<circle cx="${x + 16}" cy="${cy}" r="3" fill="${INK}"/><circle cx="${x + LW - 16}" cy="${cy}" r="3" fill="${INK}"/>` + (node.open ? line(x + 16, cy, x + LW - 20, cy - 14, INK, 2.5) : line(x + 16, cy, x + LW - 16, cy, INK, 2.5)) + line(x + LW - 16, cy, x + LW, cy, INK, 2) + text(x + LW / 2, cy + 20, node.label, { size: 11, bold: true, fill: ACC });
    } };
  }
  function drawCircuit(root, uLabel) {
    const lay = layout(root), pad = 46, W = lay.w + pad * 2 + 30, top = 36, H = lay.h + top + 44;
    let s = lay.draw(pad + 20, top) + line(pad, top + lay.cy, pad + 20, top + lay.cy, INK, 2) + line(pad + 20 + lay.w, top + lay.cy, W - pad + 10, top + lay.cy, INK, 2);
    const bx = pad, ex = W - pad + 10, by = H - 22;
    s += line(ex, top + lay.cy, ex, by, INK, 2) + line(ex, by, bx, by, INK, 2) + line(bx, top + lay.cy, bx, by - 24, INK, 2) + line(bx, by - 12, bx, by, INK, 2);
    s += line(bx - 12, by - 24, bx + 12, by - 24, INK, 3) + line(bx - 6, by - 12, bx + 6, by - 12, INK, 5) + text(bx + 34, by - 14, uLabel, { size: 12, bold: true, fill: WARN });
    return svgWrap(W, H, s);
  }
  const RC = { total(n) { if (n.t === 'R') return n.v; if (n.t === 'S') return U.sum(n.ch.map(RC.total)); return 1 / U.sum(n.ch.map((c) => 1 / RC.total(c))); } };
  const PAIRS = [[6, 3], [12, 4], [20, 5], [30, 20], [60, 40], [10, 10], [15, 10], [12, 6], [40, 10], [30, 15], [60, 20], [24, 8], [20, 20], [30, 30], [12, 12]];
  function conducts(n) { if (n.t === 'R' || n.t === 'L') return true; if (n.t === 'SW') return !n.open; if (n.t === 'S') return n.ch.every(conducts); return n.ch.some(conducts); }
  function markLit(n, ctxOn) {
    if (n.t === 'L') { n.lit = ctxOn; return; }
    if (n.t === 'S') { const all = n.ch.every(conducts); n.ch.forEach((c) => markLit(c, ctxOn && all)); }
    else if (n.t === 'P') n.ch.forEach((c) => markLit(c, ctxOn && conducts(c)));
  }
  function collect(n, out) { if (n.t === 'L') out.push(n); else if (n.ch) n.ch.forEach((c) => collect(c, out)); return out; }

  T.circuitR = (r, L) => {
    const mode = L <= 2 ? 'series' : L <= 4 ? r.pick(['series', 'parallel']) : 'mixed';
    let root, label = 1; const R = (v) => ({ t: 'R', v, label: 'R' + label++ + ' ' + v + 'Ω' });
    if (mode === 'series') root = { t: 'S', ch: [R(r.pick([10, 20, 30, 40, 50])), R(r.pick([10, 20, 30, 40, 50])), R(r.pick([10, 20, 30]))].slice(0, r.int(2, 3)) };
    else if (mode === 'parallel') { const p = r.pick(PAIRS); root = { t: 'P', ch: [R(p[0]), R(p[1])] }; }
    else { const p = r.pick(PAIRS); root = { t: 'S', ch: [R(r.pick([10, 20, 30, 40])), { t: 'P', ch: [R(p[0]), R(p[1])] }] }; if (L >= 8 && r.chance(0.6)) root.ch.push(R(r.pick([10, 20]))); }
    const Rt = RC.total(root);
    const Iopts = [0.5, 1, 2, 3, 4, 5].filter((i) => Number.isInteger(Rt * i * 10)); const I = r.pick(Iopts.length ? Iopts : [1]);
    const Uq = Math.round(Rt * I * 100) / 100;
    const ask = r.chance(0.5) ? 'R' : 'I';
    const svg = drawCircuit(root, Uq + ' V');
    if (ask === 'R') return { visual: svg, prompt: 'Wie groß ist der Gesamtwiderstand der Schaltung?', options: numOptions(r, Rt, [{ v: U.sum(collectR(root)), err: 'technische Fehlinterpretation', note: 'Parallelschaltung wie Reihenschaltung' }, { v: Math.max.apply(null, collectR(root)), err: 'technische Fehlinterpretation' }, { v: Rt + 5, err: 'Rechenfehler' }], (v) => U.fmtNum(v, 1) + ' Ω'), cols: 2, c: 10 + collectR(root).length * 2, diff: 3 + collectR(root).length, solution: U.fmtNum(Rt, 1) + ' Ω', explain: explainR(root, Rt) };
    return { visual: svg, prompt: `Die Quelle liefert ${Uq} V. Wie groß ist der Gesamtstrom?`, options: numOptions(r, I, [{ v: Uq / U.sum(collectR(root)), err: 'technische Fehlinterpretation', note: 'Gesamtwiderstand falsch' }, { v: Uq / Math.max.apply(null, collectR(root)), err: 'technische Fehlinterpretation' }, { v: I + 1, err: 'Rechenfehler' }], (v) => U.fmtNum(v, 2) + ' A'), cols: 2, c: 14 + collectR(root).length * 2, diff: 4 + collectR(root).length, solution: U.fmtNum(I, 2) + ' A', explain: `R_ges = ${U.fmtNum(Rt, 1)} Ω → I = U / R = ${Uq} / ${U.fmtNum(Rt, 1)} = ${U.fmtNum(I, 2)} A. ` + explainR(root, Rt) };
  };
  function collectR(n, out) { out = out || []; if (n.t === 'R') out.push(n.v); else n.ch.forEach((c) => collectR(c, out)); return out; }
  function explainR(root, Rt) { return 'Reihe: Widerstände addieren; parallel: 1/R = 1/R₁ + 1/R₂. Ergebnis R_ges = ' + U.fmtNum(Rt, 2) + ' Ω.'; }

  T.circuitLamps = (r, L) => {
    let lab = 1, sw = 1; const Lp = () => ({ t: 'L', label: 'L' + lab++ }), Sw = (open) => ({ t: 'SW', open, label: 'S' + sw++ });
    const forms = [
      () => ({ t: 'S', ch: [Lp(), { t: 'P', ch: [Lp(), { t: 'S', ch: [Sw(r.chance(0.5)), Lp()] }] }] }),
      () => ({ t: 'P', ch: [{ t: 'S', ch: [Lp(), Sw(r.chance(0.5))] }, { t: 'S', ch: [Lp(), Sw(r.chance(0.5))] }] }),
      () => ({ t: 'S', ch: [Sw(r.chance(0.5)), { t: 'P', ch: [Lp(), Lp(), { t: 'S', ch: [Sw(r.chance(0.5)), Lp()] }] }] }),
      () => ({ t: 'S', ch: [{ t: 'P', ch: [{ t: 'S', ch: [Sw(r.chance(0.5)), Lp()] }, Lp()] }, Sw(r.chance(0.6)), Lp()] }),
    ];
    let root = r.pick(forms.slice(0, L <= 3 ? 2 : 4))();
    markLit(root, conducts(root));
    const lamps = collect(root, []);
    const lit = lamps.filter((l) => l.lit).map((l) => l.label);
    const svg = drawCircuit(root, 'U');
    const all = lamps.map((l) => l.label);
    const fmtSet = (a) => (a.length ? a.join(', ') : 'keine Lampe');
    const cands = [lit.slice().sort()];
    const subsets = []; for (let m = 0; m < (1 << all.length); m++) subsets.push(all.filter((_, i) => m & (1 << i)).sort());
    r.shuffle(subsets).forEach((sub) => { if (cands.length < 4 && !cands.some((c) => c.join() === sub.join())) cands.push(sub); });
    const options = cands.map((s, i) => ({ label: fmtSet(s.slice().sort()), correct: i === 0, err: 'technische Fehlinterpretation', note: 'Stromweg falsch verfolgt' }));
    return { visual: svg, prompt: 'Die Schalter stehen wie gezeichnet (offen = getrennte Klemme). Welche Lampen leuchten?', options, cols: 2, c: 12 + lamps.length * 2.5, diff: 4 + lamps.length * 0.7, solution: fmtSet(lit.slice().sort()), explain: 'Eine Lampe leuchtet nur, wenn ihr Zweig und der gesamte Hauptstrompfad geschlossen sind. Offene Schalter unterbrechen ihren Zweig (bzw. bei Reihenschaltung den ganzen Kreis).', _debug: { root } };
  };

  /* ============================ SCHWERPUNKT ============================ */
  T.cog = (r, L) => {
    const dims = () => ({ w: r.pick([2, 3, 4, 5, 6]), h: r.pick([2, 3, 4, 5, 6, 8]) });
    let a = dims(), b = dims();
    let tries = 0; while (tries++ < 20 && (a.w / a.h === b.w / b.h)) b = dims();
    const ra = a.w / (2 * a.h), rb = b.w / (2 * b.h);
    const ans = ra === rb ? 2 : ra < rb ? 0 : 1;
    const S = 26;
    const body = (x, d, name) => { const w = d.w * S, h = d.h * S; return `<g transform="translate(${x},135) rotate(-14)"><rect x="0" y="${-h}" width="${w}" height="${h}" fill="#e2e8f0" stroke="${INK}" stroke-width="2"/><circle cx="${w / 2}" cy="${-h / 2}" r="4.5" fill="${WARN}"/>${text(w / 2, -h - 6, name, { bold: true, fill: ACC, size: 14 })}${text(w / 2, -h / 2 + 22, d.w + '×' + d.h, { size: 11 })}</g>`; };
    const inner = `<polygon points="10,150 470,150 470,80" fill="#cbd5e1" stroke="${INK}" stroke-width="1.5" opacity="0.0"/>` + line(10, 150, 470, 150, INK, 3) + body(40, a, 'A') + body(60 + a.w * S + 60, b, 'B') + text(240, 178, 'Gleiche Masse, Schwerpunkt (●) in der Mitte', { size: 11, fill: '#64748b' });
    return { visual: svgWrap(490, 190, inner), prompt: 'Die Unterlage wird langsam geneigt (Körper rutschen nicht). Welcher Körper kippt zuerst um?', options: textOptions(ans, ['A', 'B', 'beide gleichzeitig'], ['technische Fehlinterpretation', 'technische Fehlinterpretation', 'technische Fehlinterpretation']), cols: 3, c: 12, diff: 4.5, solution: ['A', 'B', 'beide gleichzeitig'][ans], explain: `Kipp-Bedingung: tan α = (halbe Breite) / (Schwerpunkthöhe). A: ${a.w / 2}/${a.h / 2} → ${U.fmtNum(a.w / a.h, 2)}; B: ${U.fmtNum(b.w / b.h, 2)}. Der kleinere Wert kippt zuerst.` };
  };

  /* ============================ ENERGIE (Achterbahn) ============================ */
  T.energy = (r, L) => {
    const n = 5, hs = []; while (hs.length < n) { const h = r.int(1, 10); if (!hs.includes(h)) hs.push(h); }
    const X = (i) => 40 + i * 90, Y = (h) => 190 - h * 15;
    let d = `M ${X(0)} ${Y(hs[0])}`; for (let i = 1; i < n; i++) { const mx = (X(i - 1) + X(i)) / 2; d += ` C ${mx} ${Y(hs[i - 1])}, ${mx} ${Y(hs[i])}, ${X(i)} ${Y(hs[i])}`; }
    let inner = `<line x1="20" y1="190" x2="440" y2="190" stroke="${INK}" stroke-width="2"/>` + `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3"/>`;
    hs.forEach((h, i) => { inner += `<circle cx="${X(i)}" cy="${Y(h)}" r="6" fill="${ACC}"/>` + text(X(i), Y(h) - 12, 'ABCDE'[i], { bold: true, fill: ACC, size: 14 }) + line(X(i), Y(h), X(i), 190, '#94a3b8', 1, 'stroke-dasharray="3 3"') + text(X(i), 206, h + ' m', { size: 11 }); });
    const svg = svgWrap(470, 216, inner);
    const t = r.pick(['v', 'pot', 'kin']);
    const g = 10;
    if (t === 'v') { const i = hs.indexOf(Math.min.apply(null, hs)); return { visual: svg, prompt: 'Ein reibungsfreier Wagen startet in A aus der Ruhe. An welchem Punkt ist seine Geschwindigkeit am größten?', options: textOptions(i, ['A', 'B', 'C', 'D', 'E'], ['technische Fehlinterpretation']), cols: 5, c: 8, diff: 2, solution: 'ABCDE'[i], explain: 'Je niedriger der Punkt, desto mehr potentielle Energie ist in Bewegungsenergie umgewandelt.' }; }
    if (t === 'pot') { const i = hs.indexOf(Math.max.apply(null, hs)); return { visual: svg, prompt: 'An welchem Punkt hat der Wagen die größte potentielle Energie?', options: textOptions(i, ['A', 'B', 'C', 'D', 'E'], ['technische Fehlinterpretation']), cols: 5, c: 7, diff: 1.5, solution: 'ABCDE'[i], explain: 'E_pot = m·g·h – proportional zur Höhe.' }; }
    const m = r.pick([2, 4, 5, 10]), j = r.int(1, n - 1); const dh = hs[0] - hs[j];
    if (dh <= 0) return T.energy(r, L);
    const ans = m * g * dh;
    return { visual: svg, prompt: `Wagen (m = ${m} kg, g = 10 m/s²) startet in A aus der Ruhe, reibungsfrei. Bewegungsenergie in ${'ABCDE'[j]}?`, options: numOptions(r, ans, [{ v: m * g * hs[j], err: 'technische Fehlinterpretation', note: 'Höhe statt Höhendifferenz' }, { v: m * g * hs[0], err: 'technische Fehlinterpretation' }, { v: (m * dh) / 2, err: 'Rechenfehler' }], (v) => U.fmtNum(v, 0) + ' J'), cols: 2, c: 14, diff: 5, solution: ans + ' J', explain: `E_kin = m·g·(h_A − h) = ${m} × 10 × (${hs[0]} − ${hs[j]}) = ${ans} J.` };
  };

  /* ============================ BEWEGUNG ============================ */
  T.motion = (r, L) => {
    const meet = r.chance(0.6);
    const v1 = r.pick([40, 50, 60, 80, 90, 100]), v2 = r.pick([30, 40, 50, 60, 70].filter((x) => meet || x < v1));
    const tot = meet ? v1 + v2 : v1 - v2;
    const Dopts = []; for (let D = 30; D <= 600; D += 10) if ((D * 60) % tot === 0) Dopts.push(D);
    if (!Dopts.length) return T.motion(r, L);
    const D = r.pick(Dopts), ans = (D * 60) / tot;
    const inner = line(30, 70, 430, 70, INK, 3) + `<circle cx="30" cy="70" r="7" fill="${ACC}"/><circle cx="430" cy="70" r="7" fill="${WARN}"/>` + text(30, 96, 'Zug 1', { size: 12 }) + text(430, 96, meet ? 'Zug 2' : 'Zug 2 (vor Zug 1)', { size: 12, anchor: 'end' }) + text(230, 56, D + ' km', { bold: true }) + text(30, 46, v1 + ' km/h →', { anchor: 'start', fill: ACC, bold: true }) + text(430, 46, meet ? '← ' + v2 + ' km/h' : v2 + ' km/h →', { anchor: 'end', fill: WARN, bold: true });
    return { visual: svgWrap(470, 110, inner), prompt: meet ? 'Beide Züge fahren gleichzeitig los und aufeinander zu. Nach wie vielen Minuten begegnen sie sich?' : 'Zug 1 fährt hinter Zug 2 her und ist schneller. Nach wie vielen Minuten holt er Zug 2 ein?', options: numOptions(r, ans, [{ v: (D * 60) / (meet ? Math.abs(v1 - v2) || 1 : v1 + v2), err: 'technische Fehlinterpretation', note: 'Relativgeschwindigkeit falsch' }, { v: (D * 60) / v1, err: 'technische Fehlinterpretation' }, { v: ans + 10, err: 'Rechenfehler' }], (v) => U.fmtNum(v, 1) + ' min'), cols: 2, c: 16, diff: 5.5, solution: U.fmtNum(ans, 1) + ' min', explain: `Relativgeschwindigkeit ${meet ? v1 + '+' + v2 : v1 + '−' + v2} = ${tot} km/h. t = ${D}/${tot} h = ${U.fmtNum(ans, 1)} min.` };
  };

  /* ============================ AUFTRIEB ============================ */
  T.buoyancy = (r, L) => {
    const rho = r.pick([200, 250, 400, 500, 600, 750, 800, 900]), Hh = 100;
    const sub = rho / 1000, blockH = 70, gx = 80, gy = 30, gw = 190, gh = 170, waterTop = gy + 50;
    const bx = gx + 55, by = waterTop - blockH * (1 - sub);
    let inner = `<rect x="${gx}" y="${waterTop}" width="${gw}" height="${gh - 50}" fill="#bae6fd" opacity="0.7"/><path d="M ${gx} ${gy} L ${gx} ${gy + gh} L ${gx + gw} ${gy + gh} L ${gx + gw} ${gy}" fill="none" stroke="${INK}" stroke-width="3"/>`;
    inner += `<rect x="${bx}" y="${by}" width="80" height="${blockH}" fill="#d6b58a" stroke="${INK}" stroke-width="2"/>` + text(bx + 40, by + 26, 'ρ = ' + rho, { size: 11, bold: true }) + text(bx + 40, by + 42, 'kg/m³', { size: 10 });
    inner += text(gx + gw + 70, waterTop + 4, 'Wasser', { size: 12, fill: '#0369a1' }) + text(gx + gw + 70, waterTop + 20, '1000 kg/m³', { size: 11, fill: '#0369a1' });
    const pct = Math.round(sub * 100);
    const svg = svgWrap(gx + gw + 150, gy + gh + 16, inner);
    return { visual: svg, prompt: 'Der Quader schwimmt im Wasser. Wie viel Prozent seiner Höhe tauchen ein?', options: numOptions(r, pct, [{ v: 100 - pct, err: 'technische Fehlinterpretation', note: 'Anteil über Wasser genannt' }, { v: Math.min(99, pct + 20), err: 'Rechenfehler' }, { v: Math.max(5, pct - 20), err: 'Rechenfehler' }], (v) => v + ' %'), cols: 2, c: 8, diff: 3.5, solution: pct + ' %', explain: `Schwimmen: Eintauchanteil = ρ_Körper / ρ_Wasser = ${rho} / 1000 = ${pct} %.` };
  };

  /* ============================ Pool + Erzeugung ============================ */
  const POOLS = {
    1: [['gearDir', 4], ['lever', 3], ['energy', 3], ['buoyancy', 2]],
    2: [['gearDir', 3], ['lever', 3], ['pulley', 3], ['circuitR', 2], ['hydraulic', 2], ['energy', 2]],
    3: [['gearRatio', 3], ['lever', 2], ['pulley', 2], ['boyle', 2], ['motion', 2], ['circuitR', 3], ['buoyancy', 2]],
    4: [['belt', 3], ['circuitR', 3], ['hydraulic', 3], ['energy', 3], ['cog', 2], ['gearRatio', 2], ['circuitLamps', 2]],
    5: [['gearBlock', 3], ['belt', 2], ['circuitLamps', 3], ['vessels', 2], ['cog', 2], ['pulley', 2], ['hydraulic', 2], ['motion', 2]],
    6: [['gearRatio', 3], ['circuitR', 3], ['circuitLamps', 3], ['lever', 3], ['vessels', 2], ['belt', 2], ['cog', 2]],
  };
  [7, 8, 9, 10].forEach((l) => (POOLS[l] = POOLS[6]));

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10);
    const pool = POOLS[L];
    const tot = U.sum(pool.map((x) => x[1])); let z = r.next() * tot, name = pool[0][0];
    for (const x of pool) { z -= x[1]; if (z <= 0) { name = x[0]; break; } }
    const t = T[name](r, L);
    return {
      kind: 'mc', level: L, difficulty: Math.min(10, t.diff + L * 0.25), type: name,
      prompt: t.prompt, visual: t.visual, options: t.options, cols: t.cols, labels: t.labels,
      expectedSec: Math.round(t.c * 10) / 10, timeLimit: Math.round(t.c * F[L - 1] * 1.15 * (p.timeScale || 1)),
      solution: t.solution, explain: t.explain, noShuffle: t.options.every((o) => /^[A-E]$/.test(o.label)) || false, _debug: t._debug,
    };
  }

  DLR.gen.technical = { generate, templates: T, layout, drawCircuit, conducts, markLit, RC };
})();
