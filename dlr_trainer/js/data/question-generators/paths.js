/* Wegfiguren-Generator.
   Pfade werden als Folge von Segmenten (Richtung, Länge) auf einem Gitter erzeugt; Abbiegungen (links/rechts),
   Kreuzungen und Endrichtung werden geometrisch berechnet, nicht "erraten". Mehrdeutige Berührungen
   (Linie streift eigenen Eckpunkt) werden verworfen – erlaubt sind nur eindeutige Kreuzungen. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // N, O, S, W (y nach oben); Index steigt im Uhrzeigersinn
  const DIR_LABEL = ['oben', 'rechts', 'unten', 'links'];
  const DIR_ARROW = ['↑', '→', '↓', '←'];

  /** Pfad erzeugen. Rückgabe {pts, segs, turns, crossings, endDir, startDir} oder null. */
  function genPath(r, nSeg, opt) {
    const lens = opt.lens || [1, 2, 3], maxC = opt.maxC || 5;
    for (let tries = 0; tries < 500; tries++) {
      let x = 0, y = 0, dir = r.int(0, 3);
      const startDir = dir;
      const steps = []; // {x,y,dir,segIndex,idxInSeg,len}
      const pts = [[0, 0]], segs = [], turns = [];
      let ok = true;
      const visits = new Map();
      const addVisit = (px, py, type, axis) => { const k = px + ',' + py; (visits.get(k) || visits.set(k, []).get(k)).push({ type, axis }); };
      const edges = new Set();
      addVisit(0, 0, 'end', dir % 2);
      for (let i = 0; i < nSeg && ok; i++) {
        if (i > 0) { const t = r.chance(0.5) ? 1 : 3; turns.push(t === 1 ? 'R' : 'L'); dir = (dir + t) % 4; }
        const len = r.pick(lens);
        segs.push({ dir, len });
        for (let s = 0; s < len; s++) {
          const nx = x + DIRS[dir][0], ny = y + DIRS[dir][1];
          const ek = Math.min(x, nx) + ',' + Math.min(y, ny) + ',' + (dir % 2);
          if (edges.has(ek) || Math.abs(nx) > maxC || Math.abs(ny) > maxC) { ok = false; break; }
          edges.add(ek);
          x = nx; y = ny;
          const last = i === nSeg - 1 && s === len - 1;
          const corner = s === len - 1 && !last;
          addVisit(x, y, last ? 'end' : corner ? 'corner' : 'straight', dir % 2);
        }
        pts.push([x, y]);
      }
      if (!ok) continue;
      let crossings = 0;
      visits.forEach((v) => {
        if (v.length === 1) return;
        if (v.length === 2 && v[0].type === 'straight' && v[1].type === 'straight' && v[0].axis !== v[1].axis) crossings++;
        else ok = false;
      });
      if (!ok) continue;
      if (opt.minCross != null && crossings < opt.minCross) continue;
      if (opt.noCross && crossings > 0) continue;
      return { pts, segs, turns, crossings, startDir, endDir: segs[segs.length - 1].dir };
    }
    return null;
  }

  function rotatePath(p, rot) {
    const rp = (pt) => { let x = pt[0], y = pt[1]; for (let i = 0; i < rot; i++) { const t = x; x = y; y = -t; } return [x, y]; };
    return { pts: p.pts.map(rp), segs: p.segs.map((s) => ({ dir: (s.dir + rot) % 4, len: s.len })), turns: p.turns, crossings: p.crossings, startDir: (p.startDir + rot) % 4, endDir: (p.endDir + rot) % 4 };
  }

  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

  /** Zeichnet ein oder mehrere Pfade (bereits verschoben/gedreht). */
  function drawPaths(paths, colors, opt) {
    opt = opt || {};
    const u = opt.unit || 34;
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    paths.forEach((p) => p.pts.forEach((q) => { minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]); }));
    const pad = 28, W = (maxX - minX) * u + pad * 2, H = (maxY - minY) * u + pad * 2;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'wfg-fig', role: 'img', 'aria-label': 'Wegfigur' });
    const X = (x) => pad + (x - minX) * u, Y = (y) => pad + (maxY - y) * u;
    const animated = [];
    paths.forEach((p, i) => {
      const col = colors[i];
      const poly = el('polyline', { points: p.pts.map((q) => X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1)).join(' '), fill: 'none', stroke: col, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      svg.appendChild(poly);
      animated.push(poly);
      const s = p.pts[0];
      svg.appendChild(el('circle', { cx: X(s[0]), cy: Y(s[1]), r: 7, fill: col }));
      svg.appendChild(el('circle', { cx: X(s[0]), cy: Y(s[1]), r: 3, fill: '#fff' }));
      const e = p.pts[p.pts.length - 1], d = DIRS[p.endDir];
      const ex = X(e[0]), ey = Y(e[1]), dx = d[0], dy = -d[1];
      const tip = [ex + dx * 11, ey + dy * 11], b1 = [ex - dx * 3 - dy * 8, ey - dy * 3 + dx * 8], b2 = [ex - dx * 3 + dy * 8, ey - dy * 3 - dx * 8];
      svg.appendChild(el('polygon', { points: [tip, b1, b2].map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '), fill: col }));
    });
    svg._animated = animated;
    return svg;
  }

  const LV = {
    1: { seg: [3, 4], lens: [1, 2], q: ['left', 'right'], lines: 1, rot: false, cross: false, expose: 0, c: 7 },
    2: { seg: [4, 5], lens: [1, 2], q: ['left', 'right'], lines: 1, rot: false, cross: false, expose: 0, c: 8 },
    3: { seg: [5, 6], lens: [1, 2, 3], q: ['left', 'right', 'turns', 'end'], lines: 1, rot: false, cross: false, expose: 0, c: 10 },
    4: { seg: [6, 7], lens: [1, 2, 3], q: ['left', 'right', 'turns', 'end'], lines: 1, rot: true, cross: false, expose: 0, c: 12 },
    5: { seg: [7, 8], lens: [1, 2, 3], q: ['left', 'right', 'cross', 'end'], lines: 1, rot: true, cross: true, expose: 0, c: 14 },
    6: { seg: [7, 8], lens: [1, 2, 3], q: ['left', 'right', 'cross'], lines: 2, rot: true, cross: true, expose: 0, c: 16 },
    7: { seg: [8, 9], lens: [1, 2, 3], q: ['left', 'right', 'cross', 'turns'], lines: 2, rot: true, cross: true, expose: 8, c: 18 },
    8: { seg: [9, 11], lens: [1, 2, 3], q: ['left', 'right', 'cross', 'turns'], lines: 3, rot: true, cross: true, expose: 7, c: 22 },
    9: { seg: [10, 12], lens: [1, 2, 3], q: ['left', 'right', 'cross'], lines: 2, rot: true, cross: true, expose: 6, animate: true, c: 24 },
    10: { seg: [11, 13], lens: [1, 2, 3], q: ['left', 'right', 'cross'], lines: 3, rot: true, cross: true, expose: 5, animate: true, c: 28 },
  };
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];
  const LCOL = [{ n: 'schwarze', c: '#1f2937' }, { n: 'rote', c: '#b91c1c' }, { n: 'blaue', c: '#1d4ed8' }, { n: 'grüne', c: '#15803d' }];
  const MCOL = [{ n: 'rote', c: '#b91c1c' }, { n: 'blaue', c: '#1d4ed8' }, { n: 'grüne', c: '#15803d' }];

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10), cfg = LV[L];
    const qType = r.pick(cfg.q);
    const nLines = cfg.lines;
    const paths = [];
    let tries = 0;
    while (paths.length < nLines && tries++ < 40) {
      const nSeg = r.int(cfg.seg[0], cfg.seg[1]);
      const needCross = qType === 'cross' && paths.length === 0;
      let pth = genPath(r, nSeg, { lens: cfg.lens, maxC: 4 + (nLines > 1 ? 0 : 1), noCross: !cfg.cross || (nLines > 1 && !needCross), minCross: needCross ? 1 : null });
      if (!pth && needCross) pth = genPath(r, nSeg, { lens: cfg.lens, maxC: 5, noCross: false });
      if (pth) paths.push(pth);
    }
    if (!paths.length) throw new Error('Pfad nicht erzeugbar');
    const rot = cfg.rot ? r.int(0, 3) : 0;
    const shown = paths.map((pp) => rotatePath(pp, rot));
    // Mehrere Linien nebeneinander in getrennten Bereichen
    if (shown.length > 1) {
      let offX = 0;
      shown.forEach((pp) => {
        const xs = pp.pts.map((q) => q[0]);
        const shift = offX - Math.min.apply(null, xs);
        pp.pts = pp.pts.map((q) => [q[0] + shift, q[1]]);
        offX = Math.max.apply(null, pp.pts.map((q) => q[0])) + 2;
      });
    }
    const colors = nLines === 1 ? [LCOL[0].c] : shown.map((_, i) => MCOL[i].c);
    const target = nLines === 1 ? 0 : r.int(0, shown.length - 1);
    const tp = shown[target];
    const who = nLines === 1 ? 'Figur' : `<b style="color:${MCOL[target].c}">${MCOL[target].n} Linie</b>`;
    const cnt = (ch) => tp.turns.filter((t) => t === ch).length;
    const seq = tp.turns.map((t) => t).join(' ');
    let task;
    if (qType === 'left' || qType === 'right') {
      const ans = cnt(qType === 'left' ? 'L' : 'R'), other = cnt(qType === 'left' ? 'R' : 'L');
      task = { kind: 'num', prompt: `Wie oft biegt die ${who} nach <b>${qType === 'left' ? 'links' : 'rechts'}</b> ab?`, answer: ans,
        errFn: (v) => (v === other ? 'Wahrnehmungsfehler' : Math.abs(v - ans) === 1 ? 'Wahrnehmungsfehler' : 'Gedächtnisfehler'),
        solution: String(ans), explain: 'Abbiegungen ab Start in Fahrtrichtung: ' + (seq || '–') + ' (L = links, R = rechts).' };
    } else if (qType === 'turns') {
      const ans = tp.turns.length;
      task = { kind: 'num', prompt: `Wie viele Richtungswechsel (Abbiegungen) hat die ${who}?`, answer: ans, errFn: (v) => (Math.abs(v - ans) === 1 ? 'Wahrnehmungsfehler' : 'Gedächtnisfehler'), solution: String(ans), explain: 'Abbiegungen: ' + seq };
    } else if (qType === 'cross') {
      const ans = shown.length === 1 ? tp.crossings : tp.crossings;
      task = { kind: 'num', prompt: `Wie oft kreuzt die ${who} sich selbst?`, answer: ans, errFn: (v) => (Math.abs(v - ans) === 1 ? 'Wahrnehmungsfehler' : 'Gedächtnisfehler'), solution: String(ans), explain: 'Eine Kreuzung entsteht, wenn die Linie einen früheren, geraden Abschnitt rechtwinklig überquert.' };
    } else {
      const ans = tp.endDir;
      const options = DIR_LABEL.map((lb, i) => ({ label: DIR_ARROW[i] + ' ' + lb, correct: i === ans, err: 'Wahrnehmungsfehler', note: 'Richtung im Bild' }));
      task = { kind: 'mc', prompt: `In welche Richtung zeigt die ${who} am Ende (bezogen auf das Bild)?`, options, noShuffle: true, labels: ['1', '2', '3', '4'], cols: 4, solution: DIR_ARROW[ans] + ' ' + DIR_LABEL[ans], explain: 'Verfolge Segment für Segment; jede Abbiegung dreht die Richtung um 90°.' };
      task.decimals = false;
    }
    const c = cfg.c * Math.pow(nLines, 0.6);
    const nSegAvg = (cfg.seg[0] + cfg.seg[1]) / 2;
    task.visual = (box, h) => {
      const svg = drawPaths(shown, colors, { unit: 34 });
      box.appendChild(svg);
      if (cfg.animate && svg._animated[0] && svg._animated[0].getTotalLength) {
        const dur = Math.max(3, cfg.expose - 1.5);
        svg._animated.forEach((pl) => {
          try {
            const len = pl.getTotalLength();
            pl.style.strokeDasharray = len; pl.style.strokeDashoffset = len;
            pl.getBoundingClientRect();
            pl.style.transition = 'stroke-dashoffset ' + dur + 's linear';
            h.later(() => { pl.style.strokeDashoffset = 0; }, 60);
          } catch (e) { /* statische Darstellung */ }
        });
      }
    };
    Object.assign(task, {
      level: L, difficulty: Math.min(10, 1 + L * 0.8 + (nLines - 1) * 0.5), type: qType, decimals: false,
      expectedSec: Math.round(c * 10) / 10, timeLimit: Math.round(c * F[L - 1] * (p.timeScale || 1) + (cfg.expose ? 0 : 0)),
      exposureMs: cfg.expose ? cfg.expose * 1000 : null,
      _debug: { paths: shown, qType, target },
    });
    return task;
  }

  DLR.gen.paths = { genPath, rotatePath, drawPaths, generate, DIRS, LEVELS: LV, nSegAvgHint: 0 };
})();
