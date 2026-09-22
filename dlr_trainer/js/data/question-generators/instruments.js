/* OWT-Generator: Der Zeigerstand wird aus dem Zielwert berechnet (Wert -> Winkel, siehe components/Gauges.js).
   Die richtige Lösung ist immer der tatsächlich eingestellte Wert. Antworten sind Ableseaufgaben, keine Bildauswahl. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];
  const NAME = { speed: 'die Geschwindigkeit (kt)', alt: 'die Höhe (ft)', hdg: 'den Kurs (°)', vsi: 'die Vertikalgeschwindigkeit (ft/min)' };
  const GREEN = { speed: { from: 110, to: 200 }, vsi: { from: -500, to: 500 } };

  function valueFor(r, type, L) {
    if (type === 'speed') { const st = L <= 2 ? 20 : L <= 4 ? 10 : 5; return { v: r.int(Math.ceil(30 / st), Math.floor(260 / st)) * st, step: st }; }
    if (type === 'alt') { const st = L <= 6 ? 100 : 20; const max = L <= 4 ? 9900 : L <= 6 ? 29900 : 39980; return { v: r.int(Math.ceil(300 / st), Math.floor(max / st)) * st, step: st }; }
    if (type === 'hdg') { const st = L <= 3 ? 30 : L <= 5 ? 10 : 5; return { v: r.int(0, Math.floor(355 / st)) * st, step: st }; }
    const st = L <= 4 ? 500 : L <= 6 ? 100 : 50; return { v: r.int(-Math.floor(2000 / st), Math.floor(2000 / st)) * st, step: st };
  }
  function fmtVal(type, v) { return type === 'hdg' ? String(v).padStart(3, '0') : U.fmtNum(v, 0); }
  function errFor(type, diff) {
    if (type === 'alt' && diff % 1000 === 0) return 'technische Fehlinterpretation';
    if (type === 'hdg' && (Math.abs(diff) === 180 || Math.abs(diff) === 90)) return 'technische Fehlinterpretation';
    return 'Wahrnehmungsfehler';
  }
  function answerTask(r, type, val, step, useMc, unitTxt) {
    const t = { solution: fmtVal(type, val) + ' ' + unitTxt };
    if (useMc) {
      const set = new Set([val]);
      const cand = [val - step, val + step, val - 2 * step, val + 2 * step, val - 3 * step, val + 3 * step];
      const valid = cand.filter((x) => (type === 'hdg' ? true : type === 'vsi' ? x >= -2000 && x <= 2000 : x >= 0));
      const picks = r.shuffle(valid).slice(0, 4);
      picks.forEach((x) => set.add(type === 'hdg' ? U.normDeg(x) : x));
      const list = r.shuffle(Array.from(set));
      t.kind = 'mc'; t.cols = 5; t.labels = ['1', '2', '3', '4', '5'];
      t.options = list.map((x) => ({ label: fmtVal(type, x), correct: x === val, err: errFor(type, x - val), note: x === val ? null : 'Skalenwert daneben' }));
      t.noShuffle = true;
    } else {
      t.kind = 'num'; t.answer = val; t.tolerance = 0; t.decimals = type === 'hdg' ? false : false;
      t.errFn = (v) => errFor(type, v - val);
    }
    return t;
  }

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10);
    const pool = L <= 2 ? [['read', 3]] : L <= 4 ? [['read', 3]] : L <= 6 ? [['read', 2], ['panel', 3]] : L <= 7 ? [['panel', 3], ['count', 2], ['read', 1]] : L <= 8 ? [['panel', 2], ['count', 2], ['max', 2]] : [['panel', 2], ['count', 2], ['max', 2], ['diff', 2]];
    const tot = U.sum(pool.map((x) => x[1])); let z = r.next() * tot, qt = pool[0][0];
    for (const x of pool) { z -= x[1]; if (z <= 0) { qt = x[0]; break; } }
    const rotAllowed = L >= 6;
    const rotOf = () => (rotAllowed ? r.pick([0, 90, 180, 270, 45, 315]) : 0);
    const useMc = L <= 4;
    const expo = L >= 8 ? [null, null, null, null, null, null, null, 6, 4.5, 3.5][L - 1] : null;
    let task, c = 6, vis;

    if (qt === 'read') {
      const types = L <= 2 ? ['speed', 'vsi'] : ['speed', 'hdg', 'vsi', 'alt'];
      const type = r.pick(types);
      const { v, step } = valueFor(r, type, L);
      task = answerTask(r, type, v, step, useMc, DLR.ui.gauges.SPEC[type].unit);
      task.prompt = `Lies ${NAME[type]} ab.`;
      const rot = rotOf();
      vis = [{ type, v, rot }];
      c = 5 + (type === 'alt' ? 4 : 0) + (useMc ? 0 : 2) + (rot ? 1.5 : 0);
    } else if (qt === 'panel') {
      const k = L <= 6 ? 2 : L <= 8 ? 3 : 4;
      const types = r.sample(['speed', 'alt', 'hdg', 'vsi'], k);
      const target = r.pick(types);
      vis = types.map((type) => { const vv = valueFor(r, type, L); return { type, v: vv.v, step: vv.step, rot: rotOf() }; });
      const tv = vis.find((x) => x.type === target);
      task = answerTask(r, target, tv.v, tv.step, useMc, DLR.ui.gauges.SPEC[target].unit);
      task.prompt = `Lies ${NAME[target]} ab.`;
      c = 6 + k * 2.2 + (target === 'alt' ? 4 : 0) + (rotAllowed ? 2 : 0);
    } else if (qt === 'count') {
      const k = L <= 7 ? 3 : 4;
      const types = []; for (let i = 0; i < k; i++) types.push(i % 2 === 0 ? 'speed' : 'vsi');
      const target = r.int(0, k);
      const flags = r.shuffle(types.map((_, i) => i < target));
      vis = types.map((type, i) => {
        const g = GREEN[type], step = type === 'speed' ? 5 : 100;
        let v;
        for (let t = 0; t < 60; t++) {
          const inside = flags[i];
          v = valueFor(r, type, Math.max(L, 5)).v;
          const margin = type === 'speed' ? 15 : 200;
          const isIn = v >= g.from && v <= g.to;
          const nearEdge = Math.abs(v - g.from) < margin || Math.abs(v - g.to) < margin;
          if (isIn === inside && !nearEdge) break;
        }
        return { type, v, rot: rotOf(), arcs: [{ from: g.from, to: g.to, color: '#2fbf71' }], fine: type === 'vsi' };
      });
      const cnt = vis.filter((x) => x.v >= GREEN[x.type].from && x.v <= GREEN[x.type].to).length;
      task = { kind: 'num', answer: cnt, tolerance: 0, decimals: false, errFn: (v) => (Math.abs(v - cnt) === 1 ? 'Wahrnehmungsfehler' : 'Gedächtnisfehler'), solution: String(cnt) };
      task.prompt = 'Wie viele Zeiger stehen im <b style="color:#2fbf71">grünen Bereich</b>?';
      c = 8 + k * 3;
    } else if (qt === 'max') {
      const k = L <= 8 ? 3 : 4;
      const vals = []; const gap = L <= 8 ? 20 : 10;
      while (vals.length < k) { const v = valueFor(r, 'speed', 6).v; if (vals.every((x) => Math.abs(x - v) >= gap)) vals.push(v); }
      vis = vals.map((v) => ({ type: 'speed', v, rot: rotOf() }));
      const mx = Math.max.apply(null, vals), idx = vals.indexOf(mx);
      const LET = ['A', 'B', 'C', 'D'];
      task = { kind: 'mc', options: vals.map((v, i) => ({ label: 'Instrument ' + LET[i], correct: i === idx, err: 'Wahrnehmungsfehler', note: 'niedrigerer Wert gewählt' })), noShuffle: true, labels: LET.slice(0, k), cols: k, solution: 'Instrument ' + LET[idx] + ' (' + mx + ' kt)' };
      task.prompt = 'Welches Instrument zeigt die <b>höchste</b> Geschwindigkeit?'; vis.forEach((x, i) => (x.tag = LET[i]));
      c = 9 + k * 2.6;
    } else { // diff
      const a = valueFor(r, 'speed', 6).v; let b; do { b = valueFor(r, 'speed', 6).v; } while (Math.abs(a - b) < 10);
      vis = [{ type: 'speed', v: a, rot: rotOf(), tag: 'A' }, { type: 'speed', v: b, rot: rotOf(), tag: 'B' }];
      const d = Math.abs(a - b);
      task = { kind: 'num', answer: d, tolerance: 0, decimals: false, errFn: (v) => (Math.abs(v - d) <= 10 ? 'Wahrnehmungsfehler' : 'Rechenfehler'), solution: d + ' kt' };
      task.prompt = 'Um wie viel kt unterscheiden sich die Geschwindigkeiten A und B?';
      c = 17;
    }

    task.visual = (box) => {
      const row = U.h('div', { class: 'gauge-row' });
      vis.forEach((x) => {
        const g = DLR.ui.gauges.create(x.type, { size: vis.length >= 4 ? 132 : vis.length === 3 ? 150 : 176, rot: x.rot, arcs: x.arcs, fine: x.fine });
        g.set(x.v);
        row.appendChild(U.h('div', { class: 'gauge-cell' }, g.el, x.tag ? U.h('div', { class: 'gauge-tag' }, x.tag) : null));
      });
      box.appendChild(row);
    };
    task.explain = 'Skala und Zeigerstellung genau prüfen: erst die Skalenbeschriftung, dann Zwischenstriche zählen. Bei gedrehten Instrumenten wandert die Skala mit.';
    Object.assign(task, {
      level: L, difficulty: Math.min(10, 1 + L * 0.85 + (vis.length - 1) * 0.3), type: qt,
      expectedSec: Math.round(c * 10) / 10, timeLimit: Math.round(c * F[L - 1] * (p.timeScale || 1)),
      exposureMs: expo ? Math.round(expo * 1000 + (vis.length - 1) * 500) : null,
      _debug: { vis, qt },
    });
    return task;
  }

  DLR.gen.instruments = { generate, GREEN };
})();
