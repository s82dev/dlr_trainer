/* RMS – Running Memory (n-back). Zahlen erscheinen nacheinander; bei Treffer (aktuelle Zahl = Zahl vor n Schritten)
   reagieren. n wird durch die Adaptive Engine über das Level gesteuert (2..6-back). Blockbewertung am Ende. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  const NBACK = [2, 2, 2, 3, 3, 4, 4, 5, 5, 6];
  const LEN = [16, 18, 20, 22, 24, 26, 28, 30, 32, 34];
  const ISI = [2600, 2500, 2300, 2100, 1950, 1800, 1650, 1500, 1400, 1300]; // ms zwischen Reizen
  const MATCH_P = 0.32;

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10);
    const n = NBACK[L - 1], len = LEN[L - 1], isi = ISI[L - 1];
    const audio = L >= 5 && p.audioPreferred !== false;
    const seq = [];
    for (let i = 0; i < len; i++) {
      let match = i >= n && r.chance(MATCH_P);
      let v = match ? seq[i - n] : r.int(1, 9);
      if (!match && i >= n && v === seq[i - n]) match = true; // Zufallstreffer korrekt kennzeichnen
      seq.push(v);
    }
    const targets = seq.map((v, i) => i >= n && v === seq[i - n]);
    return {
      kind: 'custom', deferClock: true, level: L, difficulty: Math.min(10, 1.5 + n * 1.2), type: n + '-back', tag: 'RMS',
      expectedSec: (len * isi) / 1000, timeLimit: Math.round((len * isi) / 1000 + 8),
      solution: `${n}-back: reagieren, wenn die Zahl mit der vor ${n} Schritten übereinstimmt`,
      explain: 'Treffer: ' + targets.filter(Boolean).length + ' von ' + len + ' Reizen.',
      custom: {
        render(stage, api) {
          const info = h('div', { class: 'rms-info' }, `${n}-back: Drücke Leertaste/Tippe, wenn die Zahl mit der vor ${n} Schritten übereinstimmt.`);
          const big = h('div', { class: 'rms-num', 'aria-live': audio ? 'off' : 'polite' }, '');
          const hint = h('div', { class: 'rms-hint' }, Array.from({ length: n }, () => '·').join(' '));
          const fb = h('div', { class: 'rms-fb' });
          const btn = h('button', { type: 'button', class: 'rms-btn', onclick: () => respond() }, 'TREFFER');
          stage.appendChild(info); stage.appendChild(hint); stage.appendChild(big); stage.appendChild(fb); stage.appendChild(btn);
          let i = -1, waitingResp = false, results = [], respondedThis = false, timer = null, stopped = false;
          function onKey(e) { if (e.code === 'Space' || e.key === ' ') { respond(); return true; } return false; }
          api.onKey(onKey);
          function respond() {
            if (respondedThis || i < 0 || i >= seq.length) return;
            respondedThis = true;
            const ok = targets[i];
            fb.textContent = ok ? '✓' : '✗ (kein Treffer)'; fb.className = 'rms-fb ' + (ok ? 'ok' : 'bad');
            if (ok) DLR.audio.chime(true); else DLR.audio.chime(false);
          }
          function step() {
            i++;
            if (i >= seq.length || stopped) { finish(); return; }
            respondedThis = false; fb.textContent = ''; fb.className = 'rms-fb';
            big.textContent = String(seq[i]);
            big.classList.remove('pulse'); void big.offsetWidth; big.classList.add('pulse');
            if (audio) DLR.audio.speak(String(seq[i]), { lang: 'de-DE', rate: 1.1 });
            timer = api.setTimeout(() => {
              results.push({ idx: i, target: targets[i], hit: targets[i] && respondedThis, falseAlarm: !targets[i] && respondedThis });
              step();
            }, isi);
          }
          function finish() {
            const targetsN = targets.filter(Boolean).length;
            const hits = results.filter((x) => x.hit).length, fa = results.filter((x) => x.falseAlarm).length, omissions = targetsN - hits;
            const acc = targetsN ? hits / targetsN : 1;
            const correctOverall = targetsN === 0 ? fa === 0 : (acc >= 0.6 && fa <= Math.max(2, Math.round(len * 0.12)));
            api.submit({ correct: correctOverall, errorType: correctOverall ? null : (fa > omissions ? 'Reaktionsfehler' : 'Gedächtnisfehler'), detail: `${hits}/${targetsN} Treffer, ${fa} Fehlalarme`, meta: { hits, falseAlarms: fa, omissions, targets: targetsN, n, len, block: true, blockAcc: acc } });
          }
          api.resetClock();
          step();
          return () => { stopped = true; clearTimeout(timer); DLR.audio.cancelSpeech(); };
        },
      },
    };
  }

  DLR.gen.rms = { generate, NBACK };
  DLR.registerModule({
    id: 'RMS', name: 'Running Memory', kind: 'trial', axis: 'Gedächtnis', heavy: false, minSlot: 240,
    defaultError: 'Gedächtnisfehler', reactionBased: true,
    desc: 'Zahlen erscheinen einzeln nacheinander (2- bis 6-back, ab Level 5 zusätzlich gesprochen). Reagiere, wenn die aktuelle Zahl mit der Zahl vor n Schritten übereinstimmt.',
    intro: { how: ['Merke dir die letzten Zahlen fortlaufend.', 'Leertaste drücken (oder Button tippen) bei Übereinstimmung mit der Zahl vor n Schritten.', 'Die Bewertung erfolgt am Ende des gesamten Durchgangs.'], keys: 'Leertaste' },
    generate,
  });
})();
