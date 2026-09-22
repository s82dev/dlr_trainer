/* MIC – Monitoring & Instrument Coordination. Mehrere Instrumente laufen gleichzeitig; parallel dazu
   Regel-Teilaufgaben (Band halten, Kurs erreichen, akustisches Signal). Jede Teilaufgabe wird separat gemessen. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  const LV = {
    1: { dur: 40, tasks: ['band'], drift: 0.5, c: 40 },
    2: { dur: 45, tasks: ['band', 'signal'], drift: 0.6, c: 45 },
    3: { dur: 50, tasks: ['band', 'signal'], drift: 0.75, c: 50 },
    4: { dur: 55, tasks: ['band', 'signal', 'heading'], drift: 0.85, c: 55 },
    5: { dur: 60, tasks: ['band', 'signal', 'heading'], drift: 1.0, c: 60 },
    6: { dur: 65, tasks: ['band', 'signal', 'heading', 'vsi'], drift: 1.1, c: 65 },
    7: { dur: 70, tasks: ['band', 'signal', 'heading', 'vsi'], drift: 1.25, c: 70 },
    8: { dur: 75, tasks: ['band', 'signal', 'heading', 'vsi'], drift: 1.4, c: 75 },
    9: { dur: 85, tasks: ['band', 'signal', 'heading', 'vsi', 'alt'], drift: 1.55, c: 85 },
    10: { dur: 95, tasks: ['band', 'signal', 'heading', 'vsi', 'alt'], drift: 1.75, c: 95 },
  };

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10), cfg = LV[L];
    const speedTarget = [220, 240];
    const headingTargets = Array.from({ length: 3 + Math.floor(L / 2) }, () => r.int(0, 35) * 10);
    let hIdx = 0;
    const signalGap = () => 3200 + r.next() * 3800 - L * 180;
    return {
      kind: 'custom', deferClock: true, level: L, difficulty: Math.min(10, 2 + L * 0.85), type: 'mic', tag: 'MIC',
      expectedSec: cfg.dur, timeLimit: Math.round(cfg.dur + 12),
      solution: 'Alle Teilaufgaben gleichzeitig im Blick behalten', explain: 'Halte die Geschwindigkeit im Band, reagiere auf Signale und beachte Kurs-/Höhenaufgaben.',
      custom: {
        render(stage, api) {
          const grid = h('div', { class: 'mic-grid' });
          stage.appendChild(h('div', { class: 'mic-info' }, 'Mehrere Aufgaben gleichzeitig überwachen:'));
          stage.appendChild(grid);
          const scores = { band: { inN: 0, totN: 0 }, signal: { hits: 0, fa: 0, misses: 0, rts: [] }, heading: { hits: 0, total: 0 }, vsi: { inN: 0, totN: 0 }, alt: { hits: 0, total: 0 } };
          let stopped = false, raf = null, t0 = null, speed = 200, spdV = r.float(-1, 1), heading = r.int(0, 359), vsi = 0, vsiV = r.float(-1, 1), alt = r.int(50, 300) * 100;
          const cells = {};

          if (cfg.tasks.includes('band')) {
            const cell = h('div', { class: 'mic-cell' }, h('div', { class: 'mic-label' }, 'Geschwindigkeit im Band halten: ' + speedTarget[0] + '–' + speedTarget[1] + ' kt'));
            const g = DLR.ui.gauges.create('speed', { size: 150, arcs: [{ from: speedTarget[0], to: speedTarget[1], color: '#2fbf71' }] });
            cell.appendChild(g.el); grid.appendChild(cell); cells.band = g;
          }
          if (cfg.tasks.includes('heading')) {
            const cell = h('div', { class: 'mic-cell' });
            const tgt = h('div', { class: 'mic-label' }, 'Kurs erreichen: ' + String(headingTargets[0]).padStart(3, '0') + '°');
            const g = DLR.ui.gauges.create('hdg', { size: 150 });
            cell.appendChild(tgt); cell.appendChild(g.el); grid.appendChild(cell); cells.heading = g; cells.headingLabel = tgt;
          }
          if (cfg.tasks.includes('vsi')) {
            const cell = h('div', { class: 'mic-cell' }, h('div', { class: 'mic-label' }, 'Vertikalgeschw. im Band halten: −300…+300'));
            const g = DLR.ui.gauges.create('vsi', { size: 150, arcs: [{ from: -300, to: 300, color: '#2fbf71' }] });
            cell.appendChild(g.el); grid.appendChild(cell); cells.vsi = g;
          }
          if (cfg.tasks.includes('alt')) {
            const cell = h('div', { class: 'mic-cell' }, h('div', { class: 'mic-label' }, 'Höhe beobachten (nur ablesen)'));
            const g = DLR.ui.gauges.create('alt', { size: 150 });
            cell.appendChild(g.el); grid.appendChild(cell); cells.alt = g;
          }
          if (cfg.tasks.includes('signal')) {
            const cell = h('div', { class: 'mic-cell mic-signal' });
            cell.appendChild(h('div', { class: 'mic-label' }, 'Bei hohem Ton: Taste drücken / Tippen'));
            const btn = h('button', { type: 'button', class: 'rms-btn', onclick: () => sigResp() }, 'SIGNAL');
            const ind = h('div', { class: 'mic-sig-ind' });
            cell.appendChild(ind); cell.appendChild(btn); grid.appendChild(cell);
            cells.signalInd = ind;
          }

          let sigActive = false, sigT0 = 0, sigTimer = null, sigResponded = false;
          function scheduleSignal() { sigTimer = api.setTimeout(fireSignal, signalGap()); }
          function fireSignal() {
            if (stopped) return;
            const isHigh = r.chance(0.6);
            sigActive = true; sigResponded = false; sigT0 = DLR.core.now();
            cells.signalInd.classList.add(isHigh ? 'high' : 'low');
            DLR.audio.signal(isHigh ? 'high' : 'low');
            api.setTimeout(() => {
              if (!sigResponded && isHigh) scores.signal.misses++;
              cells.signalInd.classList.remove('high', 'low');
              sigActive = false;
              scheduleSignal();
            }, 1100);
            cells.signalInd._isHigh = isHigh;
          }
          function sigResp() {
            if (!sigActive || sigResponded) return;
            sigResponded = true;
            const rt = (DLR.core.now() - sigT0) / 1000;
            if (cells.signalInd._isHigh) { scores.signal.hits++; scores.signal.rts.push(rt); DLR.audio.chime(true); }
            else { scores.signal.fa++; DLR.audio.chime(false); }
          }
          if (cfg.tasks.includes('signal')) scheduleSignal();

          function tick(ts) {
            if (stopped) return;
            if (!t0) t0 = ts;
            const dt = Math.min(0.05, (ts - (tick._last || ts)) / 1000); tick._last = ts;
            if (cells.band) {
              if (Math.random() < 0.02) spdV += U.rand(-1, 1) * cfg.drift;
              spdV = U.clamp(spdV, -3, 3);
              speed = U.clamp(speed + spdV * dt * 12, 60, 280);
              cells.band.set(speed);
              scores.band.totN++; if (speed >= speedTarget[0] && speed <= speedTarget[1]) scores.band.inN++;
            }
            if (cells.vsi) {
              if (Math.random() < 0.025) vsiV += U.rand(-1, 1) * cfg.drift;
              vsiV = U.clamp(vsiV, -3, 3);
              vsi = U.clamp(vsi + vsiV * dt * 220, -2000, 2000);
              cells.vsi.set(vsi);
              scores.vsi.totN++; if (vsi >= -300 && vsi <= 300) scores.vsi.inN++;
            }
            if (cells.alt) { alt = U.clamp(alt + (vsi || 0) * dt / 60, 0, 39000); cells.alt.set(alt); }
            if (cells.heading) {
              const t = headingTargets[hIdx]; const diff = ((t - heading + 540) % 360) - 180;
              scores.heading.total++;
              if (Math.abs(diff) <= 5) { scores.heading.hits++; if (Math.abs(diff) <= 2 && hIdx < headingTargets.length - 1) { hIdx++; cells.headingLabel.textContent = 'Kurs erreichen: ' + String(headingTargets[hIdx]).padStart(3, '0') + '°'; } }
              heading = ((heading % 360) + 360) % 360;
              cells.heading.set(heading);
            }
            const elapsed = (ts - t0) / 1000;
            if (elapsed >= cfg.dur) { finish(); return; }
            raf = requestAnimationFrame(tick);
          }

          if (cfg.tasks.includes('heading')) {
            const controls = h('div', { class: 'mic-hdg-ctrl' },
              h('button', { type: 'button', class: 'btn ghost', onclick: () => (heading = (heading - 5 + 360) % 360) }, '◀ −5°'),
              h('button', { type: 'button', class: 'btn ghost', onclick: () => (heading = (heading + 5) % 360) }, '+5° ▶'));
            grid.lastChild.appendChild(controls);
          }
          api.onKey((e) => {
            if (e.code === 'Space' || e.key === ' ') { sigResp(); return true; }
            if (cfg.tasks.includes('heading') && e.key === 'ArrowLeft') { heading = (heading - 5 + 360) % 360; return true; }
            if (cfg.tasks.includes('heading') && e.key === 'ArrowRight') { heading = (heading + 5) % 360; return true; }
            return false;
          });

          function finish() {
            stopped = true; cancelAnimationFrame(raf); clearTimeout(sigTimer);
            const parts = [];
            let good = 0, count = 0;
            if (cfg.tasks.includes('band')) { const f = scores.band.totN ? scores.band.inN / scores.band.totN : 0; parts.push('Band ' + Math.round(f * 100) + '%'); count++; if (f >= 0.55) good++; }
            if (cfg.tasks.includes('vsi')) { const f = scores.vsi.totN ? scores.vsi.inN / scores.vsi.totN : 0; parts.push('VSI ' + Math.round(f * 100) + '%'); count++; if (f >= 0.5) good++; }
            if (cfg.tasks.includes('heading')) { const f = scores.heading.total ? scores.heading.hits / scores.heading.total : 0; parts.push('Kurs ' + Math.round(f * 100) + '%'); count++; if (f >= 0.5) good++; }
            if (cfg.tasks.includes('signal')) { const tot = scores.signal.hits + scores.signal.misses; const f = tot ? scores.signal.hits / tot : 1; parts.push('Signale ' + scores.signal.hits + '/' + tot); count++; if (f >= 0.6 && scores.signal.fa <= tot) good++; }
            const overall = count ? good / count : 0;
            const correct = overall >= 0.6;
            const meanRt = scores.signal.rts.length ? U.mean(scores.signal.rts) : null;
            api.submit({ correct, errorType: correct ? null : 'Überlastung', detail: parts.join(', '), meta: Object.assign({ block: true, blockAcc: overall, meanRt }, scores) });
          }
          api.resetClock();
          setTimeout(() => { raf = requestAnimationFrame(tick); }, 60);
          return () => { stopped = true; cancelAnimationFrame(raf); clearTimeout(sigTimer); };
        },
      },
    };
  }

  DLR.gen.mic = { generate };
  DLR.registerModule({
    id: 'MIC', name: 'Monitoring & Instrument Coordination', kind: 'trial', axis: 'Multitasking', heavy: true, minSlot: 360,
    defaultError: 'Überlastung', reactionBased: true,
    desc: 'Mehrere Instrumente und Teilaufgaben laufen gleichzeitig: Geschwindigkeit/Vertikalgeschwindigkeit im Band halten, Kurs erreichen, akustische Signale beantworten. Jede Teilaufgabe wird separat gemessen.',
    intro: { how: ['Alle sichtbaren Aufgaben laufen parallel.', 'Kurs mit den Pfeiltasten/Buttons ±5° ändern.', 'Bei hohem Signalton reagieren (Leertaste/Button), bei tiefem nicht.'], keys: 'Leertaste · Pfeiltasten' },
    generate,
  });
})();
