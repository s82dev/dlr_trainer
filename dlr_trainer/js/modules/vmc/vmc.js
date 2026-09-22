/* VMC – visuelles Gedächtnis.
   Phase 1: Muster kurz zeigen. Phase 2: Verzögerung (ab Level 9 mit Störreizen). Phase 3: Abruf.
   Modus "Positionen": markierte Felder anklicken. Modus "Muster": das gleiche Muster unter vier Kandidaten wählen
   (Distraktoren: verschobenes Objekt, ähnliche Farbe, ähnliche Form, vertauschte Objekte). */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;
  const NS = 'http://www.w3.org/2000/svg';

  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hex', 'pent'];
  const SIMILAR_SHAPE = { circle: 'hex', hex: 'circle', square: 'diamond', diamond: 'square', triangle: 'pent', pent: 'triangle' };
  const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed'];
  const SIMILAR_COLOR = { '#dc2626': '#f97316', '#f97316': '#dc2626', '#2563eb': '#38bdf8', '#38bdf8': '#2563eb', '#16a34a': '#84cc16', '#84cc16': '#16a34a' };
  const SIM_SET = ['#dc2626', '#f97316', '#2563eb', '#38bdf8', '#16a34a', '#84cc16'];

  const LV = {
    1: { cols: 4, rows: 2, k: 3, show: 2600, delay: 1500, mode: 'pos', obj: false, c: 7 },
    2: { cols: 3, rows: 3, k: 4, show: 2300, delay: 1800, mode: 'pos', obj: false, c: 8 },
    3: { cols: 4, rows: 3, k: 5, show: 2100, delay: 2000, mode: 'pos', obj: false, c: 10 },
    4: { cols: 4, rows: 4, k: 6, show: 1900, delay: 2200, mode: 'pos', obj: false, c: 12 },
    5: { cols: 3, rows: 3, k: 4, show: 3200, delay: 2000, mode: 'mix', obj: true, similar: false, c: 12 },
    6: { cols: 4, rows: 3, k: 5, show: 3000, delay: 2400, mode: 'mix', obj: true, similar: true, c: 14 },
    7: { cols: 4, rows: 4, k: 6, show: 2600, delay: 3000, mode: 'mix', obj: true, similar: true, c: 16 },
    8: { cols: 5, rows: 4, k: 7, show: 2400, delay: 3000, mode: 'mix', obj: true, similar: true, c: 18 },
    9: { cols: 5, rows: 5, k: 8, show: 2100, delay: 4000, mode: 'mix', obj: true, similar: true, mask: true, c: 21 },
    10: { cols: 5, rows: 5, k: 9, show: 1700, delay: 4000, mode: 'mix', obj: true, similar: true, mask: true, c: 24 },
  };
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];

  function shapeSvg(shape, color, size) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 40 40'); s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('aria-hidden', 'true');
    let el;
    const mk = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const ngon = (n, r, rot) => Array.from({ length: n }, (_, i) => { const a = rot + (i * 2 * Math.PI) / n; return (20 + r * Math.cos(a)).toFixed(1) + ',' + (20 + r * Math.sin(a)).toFixed(1); }).join(' ');
    if (shape === 'circle') el = mk('circle', { cx: 20, cy: 20, r: 14 });
    else if (shape === 'square') el = mk('rect', { x: 7, y: 7, width: 26, height: 26 });
    else if (shape === 'triangle') el = mk('polygon', { points: '20,5 35,33 5,33' });
    else if (shape === 'diamond') el = mk('polygon', { points: '20,4 36,20 20,36 4,20' });
    else if (shape === 'hex') el = mk('polygon', { points: ngon(6, 15, 0) });
    else el = mk('polygon', { points: ngon(5, 15, -Math.PI / 2) });
    el.setAttribute('fill', color);
    s.appendChild(el);
    return s;
  }
  const cellName = (idx, cols) => String.fromCharCode(65 + Math.floor(idx / cols)) + (idx % cols + 1);

  /** Board zeichnen. objs: {idx: {shape,color}}; sel: Set der gewählten Zellen; onCell optional. */
  function board(cfg, objs, opts) {
    opts = opts || {};
    const size = opts.size || 46;
    const grid = h('div', { class: 'vmc-grid' + (opts.mini ? ' mini' : ''), style: { gridTemplateColumns: `repeat(${cfg.cols}, ${size}px)` } });
    const cells = [];
    for (let i = 0; i < cfg.cols * cfg.rows; i++) {
      const o = objs && objs[i];
      const c = h('button', { type: 'button', class: 'vmc-cell' + (o ? ' has' : ''), style: { width: size + 'px', height: size + 'px' }, 'data-i': i, tabindex: opts.onCell ? 0 : -1, 'aria-label': cellName(i, cfg.cols) });
      if (o) {
        if (cfg.obj) c.appendChild(shapeSvg(o.shape, o.color, size - 10));
        else c.classList.add('mark');
      }
      if (opts.onCell) c.addEventListener('click', () => opts.onCell(i, c)); else c.disabled = true;
      cells.push(c); grid.appendChild(c);
    }
    grid._cells = cells;
    return grid;
  }

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10), cfg = LV[L];
    const total = cfg.cols * cfg.rows;
    const idxs = r.sample(Array.from({ length: total }, (_, i) => i), cfg.k).sort((a, b) => a - b);
    const objs = {};
    idxs.forEach((i) => {
      objs[i] = { shape: cfg.obj ? r.pick(SHAPES) : 'square', color: cfg.obj ? (cfg.similar ? r.pick(SIM_SET) : r.pick(COLORS)) : '#2563eb' };
    });
    const mode = cfg.mode === 'pos' ? 'pos' : r.chance(0.5) ? 'pos' : 'pat';

    // Muster-Distraktoren
    function mutate(kind) {
      const o = JSON.parse(JSON.stringify(objs)); const keys = Object.keys(o).map(Number);
      const i = r.pick(keys);
      if (kind === 'move') { const free = Array.from({ length: total }, (_, x) => x).filter((x) => !(x in o)); const to = r.pick(free); o[to] = o[i]; delete o[i]; return { o, note: 'Objekt verschoben', err: 'Gedächtnisfehler' }; }
      if (kind === 'color') { o[i].color = SIMILAR_COLOR[o[i].color] || r.pick(COLORS.filter((c) => c !== o[i].color)); return { o, note: 'ähnliche Farbe', err: 'Wahrnehmungsfehler' }; }
      if (kind === 'shape') { o[i].shape = SIMILAR_SHAPE[o[i].shape]; return { o, note: 'ähnliche Form', err: 'Wahrnehmungsfehler' }; }
      const j = r.pick(keys.filter((x) => x !== i)); const t = o[i]; o[i] = o[j]; o[j] = t;
      return { o, note: 'Objekte vertauscht', err: 'Gedächtnisfehler' };
    }
    const key = (o) => Object.keys(o).sort((a, b) => a - b).map((k) => k + o[k].shape + o[k].color).join('|');
    const kinds = cfg.similar ? ['move', 'color', 'shape', 'swap'] : ['move', 'swap', 'color'];
    const pats = [{ o: objs, correct: true }]; const seen = new Set([key(objs)]);
    for (let t = 0; t < 80 && pats.length < 4; t++) { const m = mutate(r.pick(kinds)); const k = key(m.o); if (!seen.has(k)) { seen.add(k); pats.push({ o: m.o, correct: false, note: m.note, err: m.err }); } }
    const shuffledPats = r.shuffle(pats);

    const names = idxs.map((i) => cellName(i, cfg.cols)).join(', ');
    const c = cfg.c;
    return {
      kind: 'custom', deferClock: true, level: L, difficulty: Math.min(10, 1 + L * 0.9), type: 'vmc-' + mode, tag: mode,
      expectedSec: c, timeLimit: Math.round((c + 6) * F[L - 1] * (p.timeScale || 1)),
      solution: mode === 'pos' ? 'Felder ' + names : 'das Muster, das zuvor gezeigt wurde', explain: 'Ordne die Objekte beim Einprägen in Gruppen (Zeilen/Formen), statt einzelne Felder zu merken.',
      custom: {
        render(stage, api) {
          const info = h('div', { class: 'vmc-info' }, 'Merke dir ' + (cfg.obj ? 'Objekte und Positionen' : 'die markierten Felder') + ' …');
          const wrap = h('div', { class: 'vmc-wrap' });
          stage.appendChild(info); stage.appendChild(wrap);
          const exam = api.isExam;
          let phase = 'show', sel = new Set(), maskTimer = null;
          wrap.appendChild(board(cfg, objs, { size: 48 }));
          api.setTimeout(() => {
            phase = 'delay';
            U.clear(wrap); wrap.appendChild(board(cfg, null, { size: 48 }));
            info.textContent = 'Einen Moment …';
            if (cfg.mask) {
              let n = 0;
              const flick = () => {
                if (phase !== 'delay' || !api.alive()) return;
                const g = wrap.firstChild; if (!g) return;
                g._cells.forEach((cl) => cl.classList.remove('noise'));
                for (let k = 0; k < 4; k++) g._cells[r.int(0, total - 1)].classList.add('noise');
                maskTimer = setTimeout(flick, 350 + (n++ % 3) * 120);
              };
              flick();
            }
            api.setTimeout(recall, cfg.delay);
          }, cfg.show);

          function recall() {
            phase = 'recall'; clearTimeout(maskTimer);
            U.clear(wrap);
            if (mode === 'pos') {
              info.textContent = `Welche Felder waren markiert? (${cfg.k} Felder)`;
              const g = board(cfg, null, {
                size: 48,
                onCell: (i, el) => { if (sel.has(i)) { sel.delete(i); el.classList.remove('sel'); } else { sel.add(i); el.classList.add('sel'); } counter.textContent = sel.size + ' / ' + cfg.k + ' gewählt'; },
              });
              const counter = h('div', { class: 'vmc-count' }, '0 / ' + cfg.k + ' gewählt');
              const ok = h('button', { type: 'button', class: 'btn primary', onclick: confirm }, 'Bestätigen (Enter)');
              wrap.appendChild(g); wrap.appendChild(counter); wrap.appendChild(ok);
              api.onKey((e) => { if (e.key === 'Enter') { confirm(); return true; } return false; });
              function confirm() {
                if (phase !== 'recall') return; phase = 'done';
                const chosen = Array.from(sel), hits = chosen.filter((i) => i in objs).length, fp = chosen.length - hits, miss = cfg.k - hits;
                if (!exam) g._cells.forEach((cl, i) => { if (i in objs) cl.classList.add(sel.has(i) ? 'right' : 'missed'); else if (sel.has(i)) cl.classList.add('wrong'); });
                const correct = fp === 0 && miss === 0;
                api.submit({ correct, errorType: correct ? null : 'Gedächtnisfehler', detail: correct ? null : `${miss} fehlend, ${fp} zu viel`, meta: { hits, falsePos: fp, missed: miss, k: cfg.k } });
              }
            } else {
              info.textContent = 'Welches Muster wurde gezeigt?';
              const opts = shuffledPats.map((pp) => ({ node: board(cfg, pp.o, { size: cfg.cols * cfg.rows > 12 ? 20 : 26, mini: true }), correct: pp.correct, note: pp.note, err: pp.err }));
              const ans = DLR.ui.answer.choices(wrap, opts, (i) => {
                if (phase !== 'recall') return; phase = 'done';
                const o = opts[i];
                api.submit({ correct: o.correct, errorType: o.correct ? null : o.err, detail: o.note || null, meta: { k: cfg.k } });
              }, { labels: ['A', 'B', 'C', 'D'], cols: 4 });
              api.onKey(ans.keyHandler);
            }
            api.resetClock();
          }
          return () => { clearTimeout(maskTimer); };
        },
      },
    };
  }

  DLR.gen.vmc = { generate, board, LEVELS: LV };
  DLR.registerModule({
    id: 'VMC', name: 'Visuelles Gedächtnis', kind: 'trial', axis: 'Gedächtnis', heavy: false, minSlot: 180,
    defaultError: 'Gedächtnisfehler', reactionBased: false,
    desc: 'Felder oder Objekte werden kurz gezeigt. Nach einer Verzögerung müssen Positionen wiedergegeben oder das richtige Muster erkannt werden – mit ähnlichen Farben und Formen, kürzerer Anzeigezeit und Störreizen in der Verzögerung.',
    intro: {
      how: ['Merke dir die Felder (später Objekte mit Form und Farbe).', 'Nach kurzer Pause: Felder anklicken und bestätigen bzw. das gezeigte Muster wählen.', 'Ab Level 9 stören Flackerreize die Pause.'],
      keys: 'Klick / Enter · A–D',
    },
    generate,
  });
})();
