/* Würfelnetz-Engine für PPT.
   Kein Zufalls-Bildermix: Netze werden aus allen Hexominos enumeriert und durch echte 3D-Faltung geprüft
   (nur die 11 gültigen Würfelnetze bleiben übrig). Jede Fläche trägt ein chirales Symbol (Pentomino) mit
   Farbe und Orientierung. Antwortkandidaten sind vollständige Würfel; ob eine Ansicht zum gefalteten Würfel
   passt, wird über alle 24 Drehungen mathematisch geprüft. Spiegel- und Rotationsfallen sind garantiert falsch. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;

  /* ---------- Vektoren ---------- */
  const V = {
    neg: (a) => [-a[0], -a[1], -a[2]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    eq: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2],
    key(v) { return v[0] ? (v[0] > 0 ? 'x+' : 'x-') : v[1] ? (v[1] > 0 ? 'y+' : 'y-') : v[2] > 0 ? 'z+' : 'z-'; },
  };
  const NORMALS = { 'x+': [1, 0, 0], 'x-': [-1, 0, 0], 'y+': [0, 1, 0], 'y-': [0, -1, 0], 'z+': [0, 0, 1], 'z-': [0, 0, -1] };
  const NKEYS = Object.keys(NORMALS);
  const CANON_UP = { 'z+': [0, 1, 0], 'z-': [0, 1, 0], 'x+': [0, 0, 1], 'x-': [0, 0, 1], 'y+': [0, 0, 1], 'y-': [0, 0, 1] };
  const canonU = (nk) => CANON_UP[nk];
  function rotK(v, n, k) { let x = v; for (let i = 0; i < k; i++) x = V.cross(n, x); return x; }
  function kOf(nk, up) {
    const n = NORMALS[nk]; let x = canonU(nk);
    for (let k = 0; k < 4; k++) { if (V.eq(x, up)) return k; x = V.cross(n, x); }
    return -1;
  }

  /* ---------- Rotationsgruppe des Würfels (24 Drehungen) ---------- */
  const ROTS = (function () {
    const out = [];
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    perms.forEach((p) => {
      for (let s = 0; s < 8; s++) {
        const sg = [s & 1 ? -1 : 1, s & 2 ? -1 : 1, s & 4 ? -1 : 1];
        const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let i = 0; i < 3; i++) M[i][p[i]] = sg[i];
        const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
        if (det === 1) out.push(M);
      }
    });
    return out;
  })();
  const mulQ = (Q, v) => [Q[0][0] * v[0] + Q[0][1] * v[1] + Q[0][2] * v[2], Q[1][0] * v[0] + Q[1][1] * v[1] + Q[1][2] * v[2], Q[2][0] * v[0] + Q[2][1] * v[1] + Q[2][2] * v[2]];

  /* ---------- Symbole (chirale Pentominos) ---------- */
  const GLYPH_DEF = [
    { name: 'F', rows: ['.##', '##.', '.#.'] },
    { name: 'L', rows: ['#.', '#.', '#.', '##'] },
    { name: 'N', rows: ['.#', '.#', '##', '#.'] },
    { name: 'P', rows: ['##', '##', '#.'] },
    { name: 'Y', rows: ['.#', '##', '.#', '.#'] },
    { name: 'Z', rows: ['##.', '.#.', '.##'] },
  ];
  const GLYPH_CELLS = GLYPH_DEF.map((g) => {
    const cells = [];
    g.rows.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') cells.push([c, r]); });
    const cs = cells.map((x) => x[0]), rs = cells.map((x) => x[1]);
    const cx = (Math.min.apply(null, cs) + Math.max.apply(null, cs)) / 2, cy = (Math.min.apply(null, rs) + Math.max.apply(null, rs)) / 2;
    return cells.map((x) => [x[0] - cx, cy - x[1]]); // (a nach rechts, b nach oben), Mittelpunkt im Zentrum
  });
  /** Zellen eines Symbols (optional gespiegelt), Koordinaten a rechts / b oben. */
  function glyphCells(g, m) { return GLYPH_CELLS[g].map((c) => [m ? -c[0] : c[0], c[1]]); }
  const _gk = {};
  function glyphKey(g, m, k) {
    const id = g + '|' + m + '|' + k;
    if (_gk[id]) return _gk[id];
    let cells = glyphCells(g, m).map((c) => [c[0] * 2, c[1] * 2]);
    for (let i = 0; i < k; i++) cells = cells.map((c) => [-c[1], c[0]]);
    const mnA = Math.min.apply(null, cells.map((c) => c[0])), mnB = Math.min.apply(null, cells.map((c) => c[1]));
    return (_gk[id] = cells.map((c) => (c[0] - mnA) + ',' + (c[1] - mnB)).sort().join(';'));
  }
  const faceKey = (st) => st.col + '|' + glyphKey(st.g, st.m, st.k);

  /* ---------- Netze: Enumeration + echte Faltung ---------- */
  function foldNet(cells) {
    const idx = new Map(cells.map((c, i) => [c[0] + ',' + c[1], i]));
    const frames = new Array(cells.length).fill(null);
    frames[0] = { n: [0, 0, 1], r: [1, 0, 0], u: [0, 1, 0] };
    const queue = [0];
    const dirs = [[0, 1, 'r', 1], [0, -1, 'r', -1], [-1, 0, 'u', 1], [1, 0, 'u', -1]];
    while (queue.length) {
      const i = queue.shift(), f = frames[i], c = cells[i];
      dirs.forEach((d) => {
        const j = idx.get((c[0] + d[0]) + ',' + (c[1] + d[1]));
        if (j === undefined || frames[j]) return;
        const d3 = d[3] > 0 ? f[d[2]] : V.neg(f[d[2]]);
        const mapv = (v) => (V.eq(v, d3) ? V.neg(f.n) : V.eq(v, V.neg(d3)) ? f.n : v);
        frames[j] = { n: d3, r: mapv(f.r), u: mapv(f.u) };
        queue.push(j);
      });
    }
    if (frames.some((f) => !f)) return null;
    const ns = new Set(frames.map((f) => V.key(f.n)));
    return ns.size === 6 ? frames : null;
  }

  function normalizeCells(cells) {
    const mr = Math.min.apply(null, cells.map((c) => c[0])), mc = Math.min.apply(null, cells.map((c) => c[1]));
    return cells.map((c) => [c[0] - mr, c[1] - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }
  function netClass(cells) {
    const rows = {}, cols = {};
    cells.forEach((c) => { rows[c[0]] = (rows[c[0]] || 0) + 1; cols[c[1]] = (cols[c[1]] || 0) + 1; });
    const rv = Object.values(rows).sort(), cv = Object.values(cols).sort();
    if (Math.max.apply(null, rv) === 4 || Math.max.apply(null, cv) === 4) return 'easy';
    const pat = (a) => a.slice().sort().join('');
    if (pat(rv) === '123' || pat(cv) === '123') return 'medium';
    return 'hard';
  }
  let _nets = null;
  function allNets() {
    if (_nets) return _nets;
    let level = [[[0, 0]]];
    for (let n = 1; n < 6; n++) {
      const seen = new Set(), next = [];
      level.forEach((poly) => {
        const occ = new Set(poly.map((c) => c[0] + ',' + c[1]));
        poly.forEach((c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => {
          const nc = [c[0] + d[0], c[1] + d[1]];
          if (occ.has(nc[0] + ',' + nc[1])) return;
          const np = normalizeCells(poly.concat([nc]));
          const k = np.map((x) => x.join(',')).join('|');
          if (!seen.has(k)) { seen.add(k); next.push(np); }
        }));
      });
      level = next;
    }
    const valid = level.filter((p) => foldNet(p));
    _nets = { all: valid, easy: [], medium: [], hard: [] };
    valid.forEach((p) => _nets[netClass(p)].push(p));
    return _nets;
  }
  /** Anzahl freier Netze (bis auf Drehung/Spiegelung) – muss 11 sein (Selbsttest). */
  function freeNetCount() {
    const forms = new Set();
    allNets().all.forEach((p) => {
      let best = null;
      for (let s = 0; s < 8; s++) {
        let q = p.map((c) => [c[0], c[1]]);
        for (let i = 0; i < (s & 3); i++) q = q.map((c) => [c[1], -c[0]]);
        if (s & 4) q = q.map((c) => [c[0], -c[1]]);
        const key = normalizeCells(q).map((x) => x.join(',')).join('|');
        if (best === null || key < best) best = key;
      }
      forms.add(best);
    });
    return forms.size;
  }

  /* ---------- Würfel als Datenmodell ---------- */
  function foldToCube(cells, prints) {
    const frames = foldNet(cells);
    const cube = {};
    frames.forEach((f, i) => {
      const nk = V.key(f.n);
      const up = rotK(f.u, f.n, prints[i].rho);
      cube[nk] = { g: prints[i].g, m: prints[i].m, col: prints[i].col, k: kOf(nk, up) };
    });
    return cube;
  }
  function rotateCube(cube, Q) {
    const out = {};
    NKEYS.forEach((nk) => {
      const n = NORMALS[nk], st = cube[nk];
      const uold = rotK(canonU(nk), n, st.k);
      const n2 = mulQ(Q, n), u2 = mulQ(Q, uold), nk2 = V.key(n2);
      out[nk2] = { g: st.g, m: st.m, col: st.col, k: kOf(nk2, u2) };
    });
    return out;
  }
  function cubeView(cube) { return { 'x+': cube['x+'], 'y+': cube['y+'], 'z+': cube['z+'] }; }
  function viewKey(view) { return ['x+', 'y+', 'z+'].map((k) => faceKey(view[k])).join('#'); }
  /** Zeigt die Ansicht (3 sichtbare Flächen) eine Ansicht des Würfels T bei irgendeiner Drehung? */
  function viewMatches(T, view) {
    const vk = ['x+', 'y+', 'z+'].map((k) => faceKey(view[k]));
    for (let i = 0; i < ROTS.length; i++) {
      const R = rotateCube(T, ROTS[i]);
      if (faceKey(R['x+']) === vk[0] && faceKey(R['y+']) === vk[1] && faceKey(R['z+']) === vk[2]) return true;
    }
    return false;
  }
  const cloneCube = (c) => { const o = {}; NKEYS.forEach((k) => (o[k] = Object.assign({}, c[k]))); return o; };

  /* ---------- Zeichnen ---------- */
  const SX = [-1 / Math.SQRT2, 1 / Math.SQRT2, 0];
  const SY = [-1 / Math.sqrt(6), -1 / Math.sqrt(6), 2 / Math.sqrt(6)];
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function drawGlyph(parent, cells, matrix, color) {
    const g = el('g', { transform: 'matrix(' + matrix.map((x) => +x.toFixed(4)).join(' ') + ')', fill: color, stroke: color, 'stroke-width': 0.07, 'stroke-linejoin': 'round' });
    cells.forEach((c) => g.appendChild(el('rect', { x: c[0] - 0.5, y: c[1] - 0.5, width: 1, height: 1 })));
    parent.appendChild(g);
  }

  const GS = 0.15; // Kantenlänge einer Symbolzelle relativ zur Flächenkante

  /** Netz als SVG. states[i] = {g,m,col,rho}. */
  function drawNet(cells, states, size) {
    size = size || 46;
    const maxR = Math.max.apply(null, cells.map((c) => c[0])) + 1, maxC = Math.max.apply(null, cells.map((c) => c[1])) + 1;
    const pad = 6;
    const svg = el('svg', { viewBox: `0 0 ${maxC * size + pad * 2} ${maxR * size + pad * 2}`, class: 'ppt-net', role: 'img', 'aria-label': 'Würfelnetz', width: maxC * size + pad * 2, height: maxR * size + pad * 2 });
    cells.forEach((c, i) => {
      const x = pad + c[1] * size, y = pad + c[0] * size, st = states[i];
      svg.appendChild(el('rect', { x, y, width: size, height: size, fill: '#f8fafc', stroke: '#64748b', 'stroke-width': 1.4 }));
      const cx = x + size / 2, cy = y + size / 2;
      // 2D-Rahmen: rechts=(1,0), oben=(0,1); um rho * 90° gegen den Uhrzeigersinn gedreht
      let rx = 1, ry = 0, ux = 0, uy = 1;
      for (let k = 0; k < st.rho; k++) { const nrx = -ry, nry = rx, nux = -uy, nuy = ux; rx = nrx; ry = nry; ux = nux; uy = nuy; }
      const s = size * GS;
      drawGlyph(svg, glyphCells(st.g, st.m), [rx * s, -ry * s, ux * s, -uy * s, cx, cy], st.col);
    });
    return svg;
  }

  const P = (p, S, ox, oy) => [ox + V.dot(p, SX) * S, oy - V.dot(p, SY) * S];
  /** Würfelansicht (drei sichtbare Flächen). */
  function drawCubeView(view, S) {
    S = S || 60;
    const W = Math.round(S * 2.3), H = Math.round(S * 2.3), ox = W / 2, oy = H / 2;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'ppt-cube', role: 'img', width: W, height: H });
    const shade = { 'z+': '#fbfcfe', 'x+': '#e8edf4', 'y+': '#d9e1ec' };
    ['x+', 'y+', 'z+'].forEach((nk) => {
      const n = NORMALS[nk], u = canonU(nk), r = V.cross(u, n), st = view[nk];
      const ctr = [n[0] / 2, n[1] / 2, n[2] / 2];
      const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map((s) => P([ctr[0] + (s[0] * r[0] + s[1] * u[0]) / 2, ctr[1] + (s[0] * r[1] + s[1] * u[1]) / 2, ctr[2] + (s[0] * r[2] + s[1] * u[2]) / 2], S, ox, oy));
      svg.appendChild(el('polygon', { points: corners.map((c) => c[0].toFixed(2) + ',' + c[1].toFixed(2)).join(' '), fill: shade[nk], stroke: '#475569', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
      const Uk = rotK(u, n, st.k), Rk = V.cross(Uk, n);
      const c0 = P(ctr, S, ox, oy);
      const s = S * GS;
      const mat = [V.dot(Rk, SX) * s, -V.dot(Rk, SY) * s, V.dot(Uk, SX) * s, -V.dot(Uk, SY) * s, c0[0], c0[1]];
      drawGlyph(svg, glyphCells(st.g, st.m), mat, st.col);
    });
    return svg;
  }

  /* ---------- Aufgaben-Generator ---------- */
  const COLORS6 = ['#b91c1c', '#1d4ed8', '#15803d', '#b45309', '#7e22ce', '#0e7490'];
  const COLORS_SIM = ['#1e40af', '#2563eb', '#3b82f6'];
  const MONO = '#111827';
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];

  const LV = {
    1: { fam: ['easy'], rho: 0, col: 'distinct', twins: 0, muts: ['swap', 'glyph'], pNone: 0, perRot: false, c: 14 },
    2: { fam: ['easy'], rho: 0.15, col: 'distinct', twins: 0, muts: ['swap', 'glyph'], pNone: 0, perRot: false, c: 15 },
    3: { fam: ['easy', 'medium'], rho: 0.3, col: 'distinct', twins: 0, muts: ['swap', 'glyph', 'rot'], pNone: 0.1, perRot: false, c: 17 },
    4: { fam: ['easy', 'medium'], rho: 0.5, col: 'distinct', twins: 0, muts: ['swap', 'glyph', 'rot'], pNone: 0.1, perRot: true, c: 19 },
    5: { fam: ['easy', 'medium', 'hard'], rho: 0.6, col: 'similar', twins: 0, muts: ['swap', 'rot', 'mirror', 'color'], pNone: 0.15, perRot: true, c: 22 },
    6: { fam: ['easy', 'medium', 'hard'], rho: 0.8, col: 'similar', twins: 0, muts: ['swap', 'rot', 'mirror', 'color'], pNone: 0.2, perRot: true, c: 24 },
    7: { fam: ['medium', 'hard'], rho: 1, col: 'mono', twins: 2, muts: ['swap', 'rot', 'mirror'], pNone: 0.25, perRot: true, c: 28 },
    8: { fam: ['medium', 'hard'], rho: 1, col: 'mono', twins: 3, muts: ['swap', 'rot', 'mirror'], pNone: 0.25, perRot: true, c: 30 },
    9: { fam: ['medium', 'hard'], rho: 1, col: 'mono', twins: 3, muts: ['rot', 'mirror', 'mirror'], pNone: 0.3, perRot: true, c: 33 },
    10: { fam: ['hard', 'medium'], rho: 1, col: 'mono', twins: 3, muts: ['rot', 'mirror', 'mirror'], pNone: 0.3, perRot: true, c: 36 },
  };
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];
  const MUT_NOTE = { swap: 'Nachbarschaft vertauscht', glyph: 'falsches Symbol', rot: 'Rotationsfalle', mirror: 'Spiegelungsfalle', color: 'ähnliche Farbe' };

  function assignGlyphs(r, twins) {
    if (!twins) return r.shuffle([0, 1, 2, 3, 4, 5]).map((g) => ({ g, m: 0 }));
    const bases = r.shuffle([0, 1, 2, 3, 4, 5]);
    let list;
    if (twins >= 3) list = [0, 1, 2].map((i) => [{ g: bases[i], m: 0 }, { g: bases[i], m: 1 }]).reduce((a, b) => a.concat(b), []);
    else list = [{ g: bases[0], m: 0 }, { g: bases[0], m: 1 }, { g: bases[1], m: 0 }, { g: bases[1], m: 1 }, { g: bases[2], m: 0 }, { g: bases[3], m: r.int(0, 1) }];
    return r.shuffle(list);
  }
  function gname(st) { return GLYPH_DEF[st.g].name + (st.m ? '′' : ''); }

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10), cfg = LV[L];
    const nets = allNets();
    const fam = r.pick(cfg.fam);
    const cells = r.pick(nets[fam].length ? nets[fam] : nets.all);
    const gl = assignGlyphs(r, cfg.twins);
    const cols = cfg.col === 'distinct' ? r.shuffle(COLORS6) : null;
    const prints = cells.map((c, i) => ({
      g: gl[i].g, m: gl[i].m,
      col: cols ? cols[i] : cfg.col === 'similar' ? r.pick(COLORS_SIM) : MONO,
      rho: r.chance(cfg.rho) ? r.int(1, 3) : 0,
    }));
    const T = foldToCube(cells, prints);

    const wantNone = r.chance(cfg.pNone);
    const Q0 = r.pick(ROTS);
    const baseRot = () => (cfg.perRot ? r.pick(ROTS) : Q0);
    const seenKeys = new Set();

    function mutate(C, kind) {
      const c = cloneCube(C);
      const nk = r.pick(NKEYS);
      if (kind === 'mirror') c[nk].m ^= 1;
      else if (kind === 'rot') c[nk].k = (c[nk].k + r.int(1, 3)) % 4;
      else if (kind === 'swap') { let nk2 = r.pick(NKEYS); if (nk2 === nk) nk2 = NKEYS[(NKEYS.indexOf(nk) + 1) % 6]; const t = c[nk]; c[nk] = c[nk2]; c[nk2] = t; }
      else if (kind === 'glyph') { const nk2 = r.pick(NKEYS.filter((x) => x !== nk)); c[nk].g = C[nk2].g; c[nk].m = C[nk2].m; }
      else if (kind === 'color') { const others = COLORS_SIM.filter((x) => x !== c[nk].col); c[nk].col = others.length ? r.pick(others) : c[nk].col; }
      return c;
    }
    function makeInvalid() {
      for (let t = 0; t < 120; t++) {
        const kind = r.pick(cfg.muts);
        const C0 = rotateCube(T, baseRot());
        // Farbmutation nur sinnvoll, wenn Farben variieren
        const C1 = mutate(C0, kind === 'color' && cfg.col === 'mono' ? 'mirror' : kind);
        const view = cubeView(C1), vk = viewKey(view);
        if (seenKeys.has(vk) || viewMatches(T, view)) continue;
        seenKeys.add(vk);
        return { view, note: MUT_NOTE[kind] };
      }
      // Notfall: Spiegelung einer sichtbaren Fläche (stets ungültig, da chirale Symbole)
      for (let t = 0; t < 200; t++) {
        const C1 = cloneCube(rotateCube(T, baseRot()));
        C1[r.pick(['x+', 'y+', 'z+'])].m ^= 1;
        const view = cubeView(C1), vk = viewKey(view);
        if (seenKeys.has(vk) || viewMatches(T, view)) continue;
        seenKeys.add(vk);
        return { view, note: MUT_NOTE.mirror };
      }
      throw new Error('Kein Distraktor erzeugbar');
    }
    function makeValid() {
      for (let t = 0; t < 40; t++) {
        const view = cubeView(rotateCube(T, baseRot()));
        const vk = viewKey(view);
        if (seenKeys.has(vk)) continue;
        seenKeys.add(vk);
        return { view, note: null };
      }
      const view = cubeView(rotateCube(T, r.pick(ROTS)));
      return { view, note: null };
    }

    const correctIdx = wantNone ? 4 : r.int(0, 3);
    const opts = [];
    for (let i = 0; i < 4; i++) opts.push(i === correctIdx ? makeValid() : makeInvalid());

    const opposite = ['x', 'y', 'z'].map((ax) => gname(T[ax + '+']) + ' ↔ ' + gname(T[ax + '-'])).join(',  ');
    const options = opts.map((o, i) => ({
      node: drawCubeView(o.view, 44), correct: i === correctIdx, err: 'Wahrnehmungsfehler', note: o.note,
    }));
    options.push({ label: 'Keiner', correct: wantNone, err: 'Wahrnehmungsfehler', note: wantNone ? null : 'gültige Ansicht übersehen' });

    return {
      kind: 'mc', level: L, difficulty: L, type: 'net-' + fam,
      prompt: 'Welcher Würfel entsteht, wenn das Netz gefaltet wird (Symbole außen)?',
      visual: (box) => box.appendChild(drawNet(cells, prints, 44)),
      options, noShuffle: true, labels: LETTERS, cols: 5,
      expectedSec: cfg.c, timeLimit: Math.round(cfg.c * F[L - 1] * (p.timeScale || 1)),
      solution: wantNone ? 'E – keiner der Würfel' : 'Würfel ' + LETTERS[correctIdx],
      explain: 'Gegenüberliegende Flächen im gefalteten Würfel: ' + opposite + '. Prüfe zuerst zwei benachbarte Symbole, dann Orientierung und Spiegelung.',
      // Testzugriff
      _debug: { cells, prints, T, opts, correctIdx, wantNone },
    };
  }

  DLR.gen.cube = {
    V, ROTS, GLYPH_DEF, NORMALS, allNets, freeNetCount, foldNet, foldToCube, rotateCube, cubeView, viewMatches, faceKey, drawNet, drawCubeView, generate,
    LEVELS: LV,
  };
})();
