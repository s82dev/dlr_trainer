/* Kopfrechen-Generator. Jede Aufgabe wird aus Zahlen "rückwärts" gebaut, sodass das Ergebnis
   immer exakt und sauber ist (ganzzahlig oder .5). Die Lösung wird zusätzlich mit einem eigenen
   Auswerter (Punkt-vor-Strich) nachgerechnet. Alle Zeiten (c) sind interne Trainings-Referenzwerte. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;

  /* Punkt-vor-Strich-Auswertung einer Tokenliste [n, op, n, op, ...] ohne eval(). */
  function evalChain(tokens) {
    const t = tokens.slice();
    for (let i = 1; i < t.length; i += 2) {
      if (t[i] === '×' || t[i] === '÷') {
        const r = t[i] === '×' ? t[i - 1] * t[i + 1] : t[i - 1] / t[i + 1];
        t.splice(i - 1, 3, r); i -= 2;
      }
    }
    let v = t[0];
    for (let i = 1; i < t.length; i += 2) v = t[i] === '+' ? v + t[i + 1] : v - t[i + 1];
    return v;
  }

  const gen = (DLR.gen.arithmetic = {
    evalChain,

    add(r, L) {
      const hi = L <= 1 ? 60 : L <= 2 ? 99 : 480;
      const a = r.int(12, hi), b = r.int(8, L <= 1 ? 39 : L <= 2 ? 89 : 380);
      return { text: `${a} + ${b}`, answer: a + b, c: L <= 2 ? 4 : 6, diff: 1 + L * 0.3, explain: `${a} + ${b} = ${a + b}` };
    },
    sub(r, L) {
      const hi = L <= 1 ? 80 : L <= 2 ? 99 : 620;
      let a = r.int(30, hi), b = r.int(8, Math.min(a - 5, L <= 2 ? 70 : 420));
      return { text: `${a} − ${b}`, answer: a - b, c: L <= 2 ? 4 : 6, diff: 1 + L * 0.3, explain: `${a} − ${b} = ${a - b}` };
    },
    mul(r, L) {
      let a, b;
      if (L <= 1) { a = r.pick([2, 5, 10]); b = r.int(3, 12); }
      else if (L <= 3) { a = r.int(3, 12); b = r.int(3, 12); }
      else if (L <= 6) { a = r.int(11, 25); b = r.int(3, 9); }
      else { a = r.int(12, 49); b = r.int(6, 19); }
      if (r.chance(0.5)) { const t = a; a = b; b = t; }
      return { text: `${a} × ${b}`, answer: a * b, c: L <= 3 ? 4.5 : L <= 6 ? 7 : 11, diff: 1.5 + L * 0.35, explain: `${a} × ${b} = ${a * b}` };
    },
    div(r, L) {
      const q = L <= 3 ? r.int(3, 12) : r.int(6, 25), d = L <= 3 ? r.int(2, 12) : r.int(4, 19);
      return { text: `${q * d} ÷ ${d}`, answer: q, c: L <= 3 ? 5 : 8, diff: 1.5 + L * 0.35, explain: `${q * d} ÷ ${d} = ${q}, denn ${d} × ${q} = ${q * d}` };
    },
    chain(r, L) {
      const k = L <= 5 ? 3 : L <= 8 ? 4 : 5; // Anzahl Zahlen
      for (let tries = 0; tries < 80; tries++) {
        const tok = [r.int(6, 40)];
        for (let i = 1; i < k; i++) {
          const op = r.pick(['+', '−', '×', '×', '+', '−', '÷']);
          let n;
          if (op === '×') n = r.int(2, L <= 6 ? 6 : 9);
          else if (op === '÷') { const prev = tok[tok.length - 1]; const divs = []; for (let d = 2; d <= 12; d++) if (prev % d === 0) divs.push(d); if (!divs.length) { i--; continue; } n = r.pick(divs); }
          else n = r.int(3, L <= 6 ? 30 : 60);
          tok.push(op, n);
        }
        const v = evalChain(tok);
        if (Number.isInteger(v) && v >= 0 && v < 400) {
          const shown = tok.map((x) => (typeof x === 'number' ? x : x)).join(' ');
          const hasMul = tok.some((x) => x === '×' || x === '÷');
          return { text: shown, answer: v, c: 3 + k * 2.4, diff: 2 + k * 0.7, explain: (hasMul ? 'Punkt vor Strich. ' : '') + shown + ' = ' + v };
        }
      }
      return gen.add(r, L);
    },
    paren(r, L) {
      const a = r.int(4, 30), b = r.int(3, 25), c = r.int(2, 9);
      const useMinus = r.chance(0.4) && a > b;
      const inner = useMinus ? a - b : a + b;
      return { text: `(${a} ${useMinus ? '−' : '+'} ${b}) × ${c}`, answer: inner * c, c: 9, diff: 5 + L * 0.2, explain: `Klammer zuerst: ${inner}, dann × ${c} = ${inner * c}` };
    },
    percent(r, L) {
      const ps = L <= 4 ? [10, 20, 50, 25] : L <= 7 ? [5, 10, 15, 20, 25, 30, 40, 75] : [12, 15, 35, 45, 60, 75, 80, 8];
      const p = r.pick(ps);
      const step = 100 / U.gcd(p, 100);
      const base = step * r.int(L <= 4 ? 1 : 2, L <= 4 ? 8 : 12);
      const ans = (base * p) / 100;
      return { text: `${p} % von ${base}`, answer: ans, c: L <= 4 ? 6 : 9, diff: 3 + L * 0.3, explain: `${p} % von ${base} = ${base} × ${p} ÷ 100 = ${ans}` };
    },
    ratio(r, L) {
      if (r.chance(0.5)) {
        const a = r.int(2, 9), b = r.int(2, 9), m = r.int(2, 12);
        if (a === b) return gen.ratio(r, L);
        return { text: `${a} : ${b} = ${a * m} : ?`, answer: b * m, c: 7, diff: 4 + L * 0.3, explain: `Faktor ${m}: ${b} × ${m} = ${b * m}` };
      }
      const a = r.int(1, 7), b = r.int(2, 9); const s = a + b; const m = r.int(3, 15);
      const total = s * m; const which = r.chance(0.5);
      return { text: `${total} im Verhältnis ${a} : ${b} teilen. Wie groß ist der ${which ? 'erste' : 'zweite'} Teil?`, answer: (which ? a : b) * m, c: 10, diff: 5 + L * 0.3, explain: `${a}+${b} = ${s} Teile; ein Teil = ${total} ÷ ${s} = ${m}` };
    },
    units(r, L) {
      const t = r.int(0, 3);
      if (t === 0) { const v = r.int(1, 12) * 36; return { text: `${v} km/h in m/s`, answer: v / 3.6, c: 7, diff: 5 + L * 0.2, unit: 'm/s', explain: `${v} ÷ 3,6 = ${v / 3.6}` }; }
      if (t === 1) { const v = r.int(2, 30) * 5; return { text: `${v} m/s in km/h`, answer: v * 3.6, c: 8, diff: 5 + L * 0.2, unit: 'km/h', explain: `${v} × 3,6 = ${v * 3.6}` }; }
      if (t === 2) { const m = r.pick([1.5, 2.5, 3.5, 4.5, 7.5, 12.5, 2, 3, 6]); return { text: `${U.fmtNum(m)} min in Sekunden`, answer: m * 60, c: 5, diff: 3 + L * 0.2, unit: 's', explain: `${U.fmtNum(m)} × 60 = ${m * 60}` }; }
      const hh = r.pick([1.25, 1.5, 1.75, 2.25, 2.5, 3.75, 0.75]);
      return { text: `${U.fmtNum(hh, 2)} h in Minuten`, answer: hh * 60, c: 6, diff: 3 + L * 0.2, unit: 'min', explain: `${U.fmtNum(hh, 2)} × 60 = ${hh * 60}` };
    },
    /** Weg = Geschwindigkeit × Zeit (ganzzahlig durch Konstruktion). */
    distance(r, L) {
      const v = r.pick([60, 90, 120, 180, 240, 300, 360, 420, 480, 600, 720]);
      const mins = r.pick([10, 12, 15, 20, 30, 40, 45, 50, 60].filter((m) => (v * m) % 60 === 0));
      const unit = 'km';
      return { text: `Ein Flugzeug fliegt ${v} km/h. Wie weit fliegt es in ${mins} Minuten?`, answer: (v * mins) / 60, c: 9, diff: 5 + L * 0.25, unit, explain: `${v} km/h × ${mins}/60 h = ${(v * mins) / 60} km` };
    },
    time(r, L) {
      const v = r.pick([60, 90, 120, 180, 240, 300, 360, 480, 600]);
      const opts = []; for (let d = 30; d <= 900; d += 15) if ((d * 60) % v === 0 && (d * 60) / v <= 90) opts.push(d);
      const d = r.pick(opts);
      return { text: `Strecke ${d} km bei ${v} km/h. Wie viele Minuten dauert der Flug?`, answer: (d * 60) / v, c: 10, diff: 5.5 + L * 0.25, unit: 'min', explain: `${d} ÷ ${v} h = ${(d * 60) / v} min` };
    },
    fuel(r, L) {
      const rate = r.pick([1200, 1800, 2400, 3000, 3600, 4800]);
      const mins = r.pick([10, 15, 20, 30, 40, 45, 50].filter((m) => (rate * m) % 60 === 0));
      return { text: `Ein Triebwerk verbraucht ${rate} kg Treibstoff pro Stunde. Verbrauch in ${mins} Minuten?`, answer: (rate * mins) / 60, c: 9, diff: 5.5 + L * 0.25, unit: 'kg', explain: `${rate} × ${mins}/60 = ${(rate * mins) / 60} kg` };
    },
    climb(r, L) {
      const rate = r.pick([500, 800, 1000, 1200, 1500, 1800, 2000]);
      const from = r.int(5, 60) * 100;
      const minutes = r.int(3, 12);
      return { text: `Steigflug mit ${rate} ft/min ab ${from} ft. Welche Höhe (ft) nach ${minutes} Minuten?`, answer: from + rate * minutes, c: 11, diff: 6 + L * 0.25, unit: 'ft', explain: `${rate} × ${minutes} = ${rate * minutes}; ${from} + ${rate * minutes} = ${from + rate * minutes}` };
    },
    descent(r, L) {
      const rate = r.pick([1000, 1500, 1800, 2000, 2500, 3000]);
      const fromFL = r.pick([300, 280, 240, 200, 180]), toFL = r.pick([120, 100, 80, 60, 40].filter((x) => x < fromFL));
      const diff = (fromFL - toFL) * 100;
      if (diff % rate !== 0) return gen.descent(r, L);
      return { text: `Sinkflug von FL${fromFL} auf FL${toFL} mit ${rate} ft/min. Wie viele Minuten?`, answer: diff / rate, c: 12, diff: 6.5 + L * 0.25, unit: 'min', explain: `(${fromFL} − ${toFL}) × 100 ft = ${diff} ft; ${diff} ÷ ${rate} = ${diff / rate} min` };
    },
    /** Mehrstufig: Wind + Zeit. */
    wind(r, L) {
      const tas = r.pick([300, 360, 420, 480, 540]), w = r.pick([30, 60, 90]), sign = r.pick([1, -1]);
      const gs = tas + sign * w;
      const mins = r.pick([10, 15, 20, 30, 40, 45, 60].filter((m) => (gs * m) % 60 === 0));
      if (!mins) return gen.distance(r, L);
      return { text: `TAS ${tas} km/h, ${sign > 0 ? 'Rückenwind' : 'Gegenwind'} ${w} km/h. Wie viele km in ${mins} Minuten über Grund?`, answer: (gs * mins) / 60, c: 16, diff: 8 + L * 0.2, unit: 'km', explain: `Groundspeed ${gs} km/h; ${gs} × ${mins}/60 = ${(gs * mins) / 60} km` };
    },
    /** Mehrstufig: Prozentänderung. */
    pchange(r, L) {
      const base = r.pick([200, 250, 400, 500, 800, 1200, 2000]);
      const p1 = r.pick([10, 20, 25, 50]), up = r.chance(0.5);
      const mid = base + (up ? 1 : -1) * (base * p1) / 100;
      const p2 = r.pick([10, 20, 50].filter((p) => (mid * p) % 100 === 0));
      if (!p2) return gen.percent(r, L);
      const fin = up ? mid - (mid * p2) / 100 : mid + (mid * p2) / 100;
      return { text: `${base} wird um ${p1} % ${up ? 'erhöht' : 'gesenkt'}, danach um ${p2} % ${up ? 'gesenkt' : 'erhöht'}. Ergebnis?`, answer: fin, c: 17, diff: 8.5 + L * 0.15, explain: `${base} ${up ? '+' : '−'} ${(base * p1) / 100} = ${mid}; dann ${up ? '−' : '+'} ${(mid * p2) / 100} = ${fin}` };
    },
    multi(r, L) {
      const a = r.int(12, 49), b = r.int(3, 9), c = r.int(10, 90), d = r.pick([2, 3, 4, 5, 6]);
      const inner = a * b - c;
      if (inner <= 0 || inner % d !== 0) return gen.multi(r, L);
      return { text: `(${a} × ${b} − ${c}) ÷ ${d}`, answer: inner / d, c: 15, diff: 8 + L * 0.2, explain: `${a} × ${b} = ${a * b}; − ${c} = ${inner}; ÷ ${d} = ${inner / d}` };
    },
  });

  /** Aufgabentyp-Gewichte je Level. */
  const TYPES = {
    1: [['add', 4], ['sub', 4], ['mul', 2]],
    2: [['add', 3], ['sub', 3], ['mul', 3], ['div', 1]],
    3: [['add', 2], ['sub', 2], ['mul', 3], ['div', 3], ['chain', 1]],
    4: [['mul', 2], ['div', 2], ['chain', 3], ['percent', 3]],
    5: [['chain', 3], ['percent', 3], ['ratio', 2], ['mul', 1], ['paren', 1]],
    6: [['chain', 2], ['percent', 2], ['ratio', 2], ['units', 3], ['distance', 2]],
    7: [['distance', 3], ['time', 3], ['fuel', 2], ['units', 2], ['chain', 2], ['paren', 2]],
    8: [['time', 2], ['climb', 2], ['descent', 2], ['fuel', 1], ['ratio', 2], ['paren', 2], ['pchange', 2]],
    9: [['wind', 3], ['pchange', 2], ['climb', 2], ['descent', 2], ['multi', 3], ['chain', 2]],
    10: [['wind', 3], ['pchange', 3], ['multi', 4], ['climb', 2], ['descent', 2], ['chain', 2]],
  };
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];

  gen.generate = function (p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10);
    const table = TYPES[L];
    const total = U.sum(table.map((t) => t[1]));
    let x = r.next() * total, type = table[0][0];
    for (const t of table) { x -= t[1]; if (x <= 0) { type = t[0]; break; } }
    const t = gen[type](r, L);
    // Kontrolle der Lösung mit unabhängiger Nachrechnung für Kettenaufgaben
    const limit = Math.round(t.c * F[L - 1] * (p.timeScale || 1) * 10) / 10;
    return {
      kind: 'num', type, level: L, difficulty: Math.min(10, t.diff),
      prompt: t.text.length > 24 ? `<span class="krn-text">${U.esc(t.text)}</span>` : `<span class="krn-expr">${U.esc(t.text)} = ?</span>`,
      speech: DLR.audio.mathToSpeech(t.text.replace(/\?/g, '')),
      answer: t.answer, unit: t.unit || '', tolerance: 0, decimals: !Number.isInteger(t.answer),
      expectedSec: t.c, timeLimit: limit,
      solution: U.fmtNum(t.answer, 3) + (t.unit ? ' ' + t.unit : ''), explain: t.explain,
    };
  };
})();
