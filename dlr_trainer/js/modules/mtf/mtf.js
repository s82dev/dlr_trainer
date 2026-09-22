/* MTF – echte Multitasking-Simulation: LINKS Geschwindigkeit überwachen, MITTE Formen erkennen (Regel),
   RECHTS Kurs überwachen, UNTEN akustische Signale beantworten – alles gleichzeitig, separat gemessen. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;
  const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
  const NS = 'http://www.w3.org/2000/svg';

  const LV = {
    1: { dur: 45, isi: 2000, drift: 0.5, sigGap: [3200, 4800] },
    2: { dur: 50, isi: 1800, drift: 0.6, sigGap: [3000, 4500] },
    3: { dur: 55, isi: 1650, drift: 0.7, sigGap: [2800, 4200] },
    4: { dur: 60, isi: 1500, drift: 0.8, sigGap: [2600, 4000] },
    5: { dur: 65, isi: 1350, drift: 0.9, sigGap: [2400, 3800] },
    6: { dur: 70, isi: 1250, drift: 1.0, sigGap: [2200, 3600] },
    7: { dur: 80, isi: 1150, drift: 1.15, sigGap: [2000, 3400] },
    8: { dur: 90, isi: 1050, drift: 1.3, sigGap: [1900, 3200] },
    9: { dur: 100, isi: 950, drift: 1.5, sigGap: [1800, 3000] },
    10: { dur: 115, isi: 850, drift: 1.7, sigGap: [1700, 2800] },
  };

  function shapeIcon(shape, hit) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 60 60'); s.setAttribute('width', 56); s.setAttribute('height', 56);
    const mk = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    let el;
    if (shape === 'circle') el = mk('circle', { cx: 30, cy: 30, r: 22 });
    else if (shape === 'square') el = mk('rect', { x: 8, y: 8, width: 44, height: 44 });
    else if (shape === 'triangle') el = mk('polygon', { points: '30,6 54,52 6,52' });
    else el = mk('polygon', { points: '30,4 56,30 30,56 4,30' });
    el.setAttribute('fill', '#2563eb'); s.appendChild(el); return s;
  }

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10), cfg = LV[L];
    const targetShape = r.pick(SHAPES);
    const speedBand = [220, 240];
    const headingTarget = r.int(0, 35) * 10;
    return {
      kind: 'custom', deferClock: true, level: L, difficulty: Math.min(10, 3 + L * 0.7), type: 'mtf', tag: 'MTF',
      expectedSec: cfg.dur, timeLimit: Math.round(cfg.dur + 10),
      solution: 'Alle vier Bereiche gleichzeitig bearbeiten',
      explain: 'LINKS: Geschwindigkeit im Band halten. MITTE: nur bei „' + targetShape + '“ reagieren. RECHTS: Kurs ' + String(headingTarget).padStart(3, '0') + '° halten. UNTEN: bei hohem Ton reagieren.',
      custom: {
        render(stage, api) {
          const wrap = h('div', { class: 'mtf-wrap' });
          const left = h('div', { class: 'mtf-zone mtf-left' }, h('div', { class: 'mtf-label' }, 'Geschwindigkeit: ' + speedBand[0] + '–' + speedBand[1] + ' kt'));
          const mid = h('div', { class: 'mtf-zone mtf-mid' }, h('div', { class: 'mtf-label' }, 'Nur bei ' + shapeName(targetShape) + ' reagieren'));
          const right = h('div', { class: 'mtf-zone mtf-right' }, h('div', { class: 'mtf-label' }, 'Kurs halten: ' + String(headingTarget).padStart(3, '0') + '°'));
          const bottom = h('div', { class: 'mtf-zone mtf-bottom' }, h('div', { class: 'mtf-label' }, 'Bei hohem Ton reagieren'));
          wrap.appendChild(left); wrap.appendChild(mid); wrap.appendChild(right); wrap.appendChild(bottom);
          stage.appendChild(wrap);

          const speedG = DLR.ui.gauges.create('speed', { size: 130, arcs: [{ from: speedBand[0], to: speedBand[1], color: '#2fbf71' }] });
          left.appendChild(speedG.el);
          const shapeBox = h('div', { class: 'mtf-shape-box' }); mid.appendChild(shapeBox);
          const shapeBtn = h('button', { type: 'button', class: 'rms-btn small', onclick: () => shapeResp() }, 'TREFFER (Enter)');
          mid.appendChild(shapeBtn);
          const hdgG = DLR.ui.gauges.create('hdg', { size: 130 });
          right.appendChild(hdgG.el);
          const hdgCtrl = h('div', { class: 'mic-hdg-ctrl' },
            h('button', { type: 'button', class: 'btn ghost', onclick: () => (heading = (heading - 5 + 360) % 360) }, '◀'),
            h('button', { type: 'button', class: 'btn ghost', onclick: () => (heading = (heading + 5) % 360) }, '▶'));
          right.appendChild(hdgCtrl);
          const sigInd = h('div', { class: 'mic-sig-ind' });
          const sigBtn = h('button', { type: 'button', class: 'rms-btn small', onclick: () => sigResp() }, 'SIGNAL (Leertaste)');
          bottom.appendChild(sigInd); bottom.appendChild(sigBtn);

          const sc = { band: { in: 0, tot: 0 }, shape: { hits: 0, fa: 0, misses: 0, total: 0 }, hdg: { hits: 0, tot: 0 }, sig: { hits: 0, fa: 0, misses: 0, rts: [] } };
          let stopped = false, raf = null, t0 = null;
          let speed = 200, spdV = r.float(-1, 1), heading = r.int(0, 359);
          let curShape = null, shapeResponded = false, shapeIsTarget = false, shapeTimer = null;
          let sigActive = false, sigResponded = false, sigT0 = 0, sigTimer = null, sigIsHigh = false;

          function shapeName(s) { return { circle: 'Kreis', square: 'Quadrat', triangle: 'Dreieck', diamond: 'Raute' }[s]; }
          function nextShape() {
            if (stopped) return;
            shapeIsTarget = r.chance(0.32);
            curShape = shapeIsTarget ? targetShape : r.pick(SHAPES.filter((s) => s !== targetShape));
            shapeResponded = false;
            U.clear(shapeBox); shapeBox.appendChild(shapeIcon(curShape));
            sc.shape.total++;
            shapeTimer = api.setTimeout(() => { if (shapeIsTarget && !shapeResponded) sc.shape.misses++; nextShape(); }, cfg.isi);
          }
          function shapeResp() {
            if (shapeResponded || curShape == null) return;
            shapeResponded = true;
            if (shapeIsTarget) { sc.shape.hits++; DLR.audio.chime(true); } else { sc.shape.fa++; DLR.audio.chime(false); }
          }
          nextShape();

          function scheduleSignal() { sigTimer = api.setTimeout(fireSignal, U.rand(cfg.sigGap[0], cfg.sigGap[1])); }
          function fireSignal() {
            if (stopped) return;
            sigIsHigh = r.chance(0.55); sigActive = true; sigResponded = false; sigT0 = DLR.core.now();
            sigInd.classList.add(sigIsHigh ? 'high' : 'low');
            DLR.audio.signal(sigIsHigh ? 'high' : 'low');
            api.setTimeout(() => { if (sigIsHigh && !sigResponded) sc.sig.misses++; sigInd.classList.remove('high', 'low'); sigActive = false; scheduleSignal(); }, 1050);
          }
          function sigResp() {
            if (!sigActive || sigResponded) return;
            sigResponded = true;
            const rt = (DLR.core.now() - sigT0) / 1000;
            if (sigIsHigh) { sc.sig.hits++; sc.sig.rts.push(rt); DLR.audio.chime(true); } else { sc.sig.fa++; DLR.audio.chime(false); }
          }
          scheduleSignal();

          api.onKey((e) => {
            if (e.key === 'Enter') { shapeResp(); return true; }
            if (e.code === 'Space' || e.key === ' ') { sigResp(); return true; }
            if (e.key === 'ArrowLeft') { heading = (heading - 5 + 360) % 360; return true; }
            if (e.key === 'ArrowRight') { heading = (heading + 5) % 360; return true; }
            return false;
          });

          function tick(ts) {
            if (stopped) return;
            if (!t0) t0 = ts;
            const dt = Math.min(0.05, (ts - (tick._last || ts)) / 1000); tick._last = ts;
            if (Math.random() < 0.02) spdV += U.rand(-1, 1) * cfg.drift;
            spdV = U.clamp(spdV, -3, 3);
            speed = U.clamp(speed + spdV * dt * 12, 60, 280);
            speedG.set(speed);
            sc.band.tot++; if (speed >= speedBand[0] && speed <= speedBand[1]) sc.band.in++;
            heading = ((heading % 360) + 360) % 360;
            hdgG.set(heading);
            sc.hdg.tot++; const diff = Math.abs(((headingTarget - heading + 540) % 360) - 180); if (diff <= 6) sc.hdg.hits++;
            const elapsed = (ts - t0) / 1000;
            if (elapsed >= cfg.dur) { finish(); return; }
            raf = requestAnimationFrame(tick);
          }

          function finish() {
            stopped = true; cancelAnimationFrame(raf); clearTimeout(shapeTimer); clearTimeout(sigTimer);
            const fBand = sc.band.tot ? sc.band.in / sc.band.tot : 0;
            const fHdg = sc.hdg.tot ? sc.hdg.hits / sc.hdg.tot : 0;
            const shapeTot = sc.shape.hits + sc.shape.misses; const fShape = shapeTot ? sc.shape.hits / shapeTot : 1;
            const sigTot = sc.sig.hits + sc.sig.misses; const fSig = sigTot ? sc.sig.hits / sigTot : 1;
            const parts = [`Band ${Math.round(fBand * 100)}%`, `Formen ${sc.shape.hits}/${shapeTot} (${sc.shape.fa} FA)`, `Kurs ${Math.round(fHdg * 100)}%`, `Signale ${sc.sig.hits}/${sigTot} (${sc.sig.fa} FA)`];
            const scoresArr = [fBand >= 0.5, fShape >= 0.6 && sc.shape.fa <= shapeTot, fHdg >= 0.45, fSig >= 0.6 && sc.sig.fa <= sigTot];
            const overall = scoresArr.filter(Boolean).length / scoresArr.length;
            const correct = overall >= 0.6;
            const meanRt = sc.sig.rts.length ? U.mean(sc.sig.rts) : null;
            api.submit({ correct, errorType: correct ? null : 'Überlastung', detail: parts.join(' · '), meta: { block: true, blockAcc: overall, meanRt, band: sc.band, shape: sc.shape, hdg: sc.hdg, sig: sc.sig } });
          }
          api.resetClock();
          setTimeout(() => { raf = requestAnimationFrame(tick); }, 60);
          return () => { stopped = true; cancelAnimationFrame(raf); clearTimeout(shapeTimer); clearTimeout(sigTimer); };
        },
      },
    };
  }
  function shapeName(s) { return { circle: 'Kreis', square: 'Quadrat', triangle: 'Dreieck', diamond: 'Raute' }[s]; }

  DLR.gen.mtf = { generate };
  DLR.registerModule({
    id: 'MTF', name: 'Multitasking', kind: 'trial', axis: 'Multitasking', heavy: true, minSlot: 420,
    defaultError: 'Überlastung', reactionBased: true,
    desc: 'Vier Aufgaben gleichzeitig: links Geschwindigkeit im Band halten, mittig Formen nach Regel erkennen, rechts Kurs halten, unten akustische Signale beantworten. Die anspruchsvollste Kombination der Plattform.',
    intro: { how: ['Alle vier Bereiche laufen parallel – priorisiere kurz nacheinander.', 'Enter = Formtreffer, Leertaste = Signal, Pfeiltasten = Kurs.'], keys: 'Enter · Leertaste · Pfeiltasten' },
    generate,
  });
})();
