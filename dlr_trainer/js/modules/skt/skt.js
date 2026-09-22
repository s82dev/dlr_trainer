/* SKT – Konzentration. Ein Strom von Reizen (Form + Farbe + Punktzahl) läuft; nach einer Regel muss reagiert
   werden (Treffer) oder nicht (Nicht-Treffer). Die Regel wechselt alle paar Runden (angekündigt).
   Blockbewertung: Treffer, Fehlalarme, Auslassungen, Reaktionszeit. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
  const COLORS = [['red', '#dc2626'], ['blue', '#2563eb'], ['green', '#16a34a'], ['yellow', '#d97706']];
  const SHAPE_NAME = { circle: 'Kreis', square: 'Quadrat', triangle: 'Dreieck', diamond: 'Raute' };

  const LV = {
    1: { isi: [1500, 1900], n: 26, blocks: 1, rules: ['color'], vals: [1, 3], c: 45 },
    2: { isi: [1350, 1750], n: 30, blocks: 1, rules: ['color', 'shape'], vals: [1, 4], c: 48 },
    3: { isi: [1200, 1600], n: 34, blocks: 2, rules: ['color', 'shape'], vals: [1, 5], c: 52 },
    4: { isi: [1050, 1450], n: 38, blocks: 2, rules: ['color', 'shape', 'colorshape'], vals: [1, 5], c: 56 },
    5: { isi: [950, 1300], n: 44, blocks: 3, rules: ['color', 'shape', 'colorshape', 'value'], vals: [1, 6], c: 60 },
    6: { isi: [850, 1200], n: 50, blocks: 3, rules: ['color', 'shape', 'colorshape', 'value', 'valuecolor'], vals: [1, 6], c: 65 },
    7: { isi: [750, 1100], n: 56, blocks: 4, rules: ['colorshape', 'value', 'valuecolor', 'valueshape'], vals: [1, 7], c: 72 },
    8: { isi: [700, 1000], n: 64, blocks: 4, rules: ['colorshape', 'value', 'valuecolor', 'valueshape', 'all3'], vals: [1, 7], c: 80 },
    9: { isi: [620, 900], n: 72, blocks: 5, rules: ['valuecolor', 'valueshape', 'all3'], vals: [1, 8], c: 88 },
    10: { isi: [550, 820], n: 82, blocks: 6, rules: ['valuecolor', 'valueshape', 'all3'], vals: [1, 8], c: 96 },
  };
  const RULE_TXT = {
    color: (c) => `Reagiere nur bei <b style="color:${COLORS.find((x) => x[0] === c.c)[1]}">${{ red: 'Rot', blue: 'Blau', green: 'Grün', yellow: 'Gelb' }[c.c]}</b>.`,
    shape: (c) => `Reagiere nur bei <b>${SHAPE_NAME[c.s]}</b>.`,
    colorshape: (c) => `Reagiere nur, wenn Farbe <b style="color:${COLORS.find((x) => x[0] === c.c)[1]}">${{ red: 'Rot', blue: 'Blau', green: 'Grün', yellow: 'Gelb' }[c.c]}</b> UND Form <b>${SHAPE_NAME[c.s]}</b> übereinstimmen.`,
    value: (c) => `Reagiere nur bei Punktzahl <b>${c.v}</b>.`,
    valuecolor: (c) => `Reagiere nur, wenn Farbe <b style="color:${COLORS.find((x) => x[0] === c.c)[1]}">${{ red: 'Rot', blue: 'Blau', green: 'Grün', yellow: 'Gelb' }[c.c]}</b> UND Punktzahl <b>${c.v}</b> übereinstimmen.`,
    valueshape: (c) => `Reagiere nur, wenn Form <b>${SHAPE_NAME[c.s]}</b> UND Punktzahl <b>${c.v}</b> übereinstimmen.`,
    all3: (c) => `Reagiere nur, wenn Farbe <b style="color:${COLORS.find((x) => x[0] === c.c)[1]}">${{ red: 'Rot', blue: 'Blau', green: 'Grün', yellow: 'Gelb' }[c.c]}</b>, Form <b>${SHAPE_NAME[c.s]}</b> UND Punktzahl <b>${c.v}</b> übereinstimmen.`,
  };
  function matches(rule, crit, stim) {
    if (rule === 'color') return stim.c === crit.c;
    if (rule === 'shape') return stim.s === crit.s;
    if (rule === 'colorshape') return stim.c === crit.c && stim.s === crit.s;
    if (rule === 'value') return stim.v === crit.v;
    if (rule === 'valuecolor') return stim.c === crit.c && stim.v === crit.v;
    if (rule === 'valueshape') return stim.s === crit.s && stim.v === crit.v;
    return stim.c === crit.c && stim.s === crit.s && stim.v === crit.v;
  }
  function stimSvg(s) {
    const box = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    box.setAttribute('viewBox', '0 0 100 100'); box.setAttribute('width', 96); box.setAttribute('height', 96);
    const col = COLORS.find((x) => x[0] === s.c)[1];
    let el; const mk = (t, a) => { const e = document.createElementNS('http://www.w3.org/2000/svg', t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    if (s.s === 'circle') el = mk('circle', { cx: 50, cy: 50, r: 34 });
    else if (s.s === 'square') el = mk('rect', { x: 16, y: 16, width: 68, height: 68 });
    else if (s.s === 'triangle') el = mk('polygon', { points: '50,10 90,85 10,85' });
    else el = mk('polygon', { points: '50,8 92,50 50,92 8,50' });
    el.setAttribute('fill', col); box.appendChild(el);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', 50); t.setAttribute('y', 58); t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', 30); t.setAttribute('font-weight', '800');
    t.setAttribute('fill', '#fff'); t.textContent = s.v; box.appendChild(t);
    return box;
  }

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10), cfg = LV[L];
    const rounds = [];
    let crit = null, rule = null;
    const perBlock = Math.ceil(cfg.n / cfg.blocks);
    for (let i = 0; i < cfg.n; i++) {
      if (i % perBlock === 0) { rule = r.pick(cfg.rules); crit = { c: r.pick(COLORS)[0], s: r.pick(SHAPES), v: r.int(cfg.vals[0], cfg.vals[1]) }; }
      const target = r.chance(0.3);
      let stim;
      if (target) stim = { c: crit.c, s: crit.s, v: crit.v, forced: {} };
      else {
        do { stim = { c: r.pick(COLORS)[0], s: r.pick(SHAPES), v: r.int(cfg.vals[0], cfg.vals[1]) }; } while (matches(rule, crit, stim));
      }
      rounds.push({ rule, crit, stim, isNew: i % perBlock === 0, target: matches(rule, crit, stim) });
    }
    return {
      kind: 'custom', deferClock: true, level: L, difficulty: Math.min(10, 1 + L * 0.9), type: 'skt', tag: 'SKT',
      expectedSec: cfg.c, timeLimit: Math.round(cfg.c + cfg.n * 0.4 + 10),
      solution: 'Reagiere gemäß der jeweils angezeigten Regel', explain: rounds.filter((x) => x.target).length + ' von ' + cfg.n + ' Reizen waren Treffer.',
      custom: {
        render(stage, api) {
          const ruleBox = h('div', { class: 'skt-rule' });
          const stimBox = h('div', { class: 'skt-stim' });
          const fb = h('div', { class: 'skt-fb' });
          const btn = h('button', { type: 'button', class: 'rms-btn', onclick: () => respond() }, 'TREFFER');
          const progress = h('div', { class: 'skt-progress' });
          stage.appendChild(ruleBox); stage.appendChild(progress); stage.appendChild(stimBox); stage.appendChild(fb); stage.appendChild(btn);
          let i = -1, responded = false, t0 = 0, results = [], timer = null, stopped = false;
          api.onKey((e) => { if (e.code === 'Space' || e.key === ' ') { respond(); return true; } return false; });
          function respond() {
            if (responded || i < 0 || i >= rounds.length) return;
            responded = true;
            const rt = (DLR.core.now() - t0) / 1000;
            const round = rounds[i];
            const ok = round.target;
            fb.textContent = ok ? '✓' : '✗'; fb.className = 'skt-fb ' + (ok ? 'ok' : 'bad');
            results.push({ idx: i, target: round.target, hit: ok, falseAlarm: !ok, rt });
            DLR.audio.chime(ok);
          }
          function step() {
            i++;
            if (i >= rounds.length || stopped) { finish(); return; }
            const round = rounds[i];
            responded = false; fb.textContent = ''; fb.className = 'skt-fb';
            if (round.isNew) { ruleBox.innerHTML = RULE_TXT[round.rule](round.crit); ruleBox.classList.remove('flash'); void ruleBox.offsetWidth; ruleBox.classList.add('flash'); }
            progress.textContent = (i + 1) + ' / ' + rounds.length;
            U.clear(stimBox); stimBox.appendChild(stimSvg(round.stim));
            t0 = DLR.core.now();
            const dur = r_between(cfg.isi[0], cfg.isi[1]);
            timer = api.setTimeout(() => {
              if (!responded) results.push({ idx: i, target: round.target, hit: false, falseAlarm: false, omission: round.target, rt: null });
              step();
            }, dur);
          }
          function r_between(a, b) { return a + Math.random() * (b - a); }
          function finish() {
            const targetsN = rounds.filter((x) => x.target).length;
            const hits = results.filter((x) => x.hit).length, fa = results.filter((x) => x.falseAlarm).length, omissions = results.filter((x) => x.omission).length;
            const rts = results.filter((x) => x.hit && x.rt != null).map((x) => x.rt);
            const acc = rounds.length ? (hits + (rounds.length - targetsN - fa)) / rounds.length : 1;
            const meanRt = rts.length ? U.mean(rts) : null;
            const correctOverall = acc >= 0.85 && fa <= Math.max(2, Math.round(rounds.length * 0.06));
            api.submit({ correct: correctOverall, errorType: correctOverall ? null : (fa > omissions ? 'Reaktionsfehler' : 'Ablenkung'), detail: `${hits}/${targetsN} Treffer, ${fa} Fehlalarme, ${omissions} ausgelassen`, meta: { hits, falseAlarms: fa, omissions, targets: targetsN, n: rounds.length, meanRt, block: true, blockAcc: acc } });
          }
          api.resetClock();
          step();
          return () => { stopped = true; clearTimeout(timer); };
        },
      },
    };
  }

  DLR.gen.skt = { generate };
  DLR.registerModule({
    id: 'SKT', name: 'Konzentration', kind: 'trial', axis: 'Konzentration', heavy: false, minSlot: 240,
    defaultError: 'Ablenkung', reactionBased: true,
    desc: 'Ein Strom aus Form, Farbe und Punktzahl läuft; nach wechselnder Regel reagieren oder nicht. Die Regel wird angekündigt und ändert sich alle paar Runden.',
    intro: { how: ['Reagiere per Leertaste/Button nur, wenn der Reiz zur aktuell gezeigten Regel passt.', 'Die Regel steht oben und wechselt im Verlauf.', 'Reaktionsgeschwindigkeit zählt mit.'], keys: 'Leertaste' },
    generate,
  });
})();
