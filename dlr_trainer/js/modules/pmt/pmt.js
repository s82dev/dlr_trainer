/* PMT – Psychomotorik. Ein Ziel bewegt sich (wechselnde Geschwindigkeit/Richtung); der Nutzer hält den
   Cursor (Maus/Touch) möglichst nah am Ziel oder verfolgt eine Linie. Abweichung wird laufend gemessen. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  const LV = {
    1: { dur: 20, speed: 0.35, jitter: 0.15, mode: 'follow', r: 26, c: 20 },
    2: { dur: 22, speed: 0.45, jitter: 0.2, mode: 'follow', r: 24, c: 22 },
    3: { dur: 24, speed: 0.55, jitter: 0.28, mode: 'follow', r: 22, c: 24 },
    4: { dur: 26, speed: 0.65, jitter: 0.35, mode: 'follow', r: 20, c: 26 },
    5: { dur: 28, speed: 0.75, jitter: 0.45, mode: 'follow', r: 18, c: 28 },
    6: { dur: 28, speed: 0.85, jitter: 0.55, mode: 'follow', r: 17, c: 30 },
    7: { dur: 30, speed: 0.95, jitter: 0.65, mode: 'track', r: 16, c: 32 },
    8: { dur: 30, speed: 1.1, jitter: 0.75, mode: 'track', r: 15, c: 34 },
    9: { dur: 32, speed: 1.25, jitter: 0.9, mode: 'track', r: 14, c: 36 },
    10: { dur: 34, speed: 1.45, jitter: 1.05, mode: 'track', r: 13, c: 38 },
  };
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10), cfg = LV[L];
    return {
      kind: 'custom', deferClock: true, level: L, difficulty: Math.min(10, 1 + L * 0.9), type: cfg.mode, tag: 'PMT',
      expectedSec: cfg.dur, timeLimit: Math.round(cfg.dur * F[L - 1] * (p.timeScale || 1) + 6),
      solution: 'Ziel so genau wie möglich mit dem Cursor verfolgen',
      custom: {
        render(stage, api) {
          const desc = h('div', { class: 'pmt-info' }, cfg.mode === 'follow' ? 'Halte den Cursor auf dem beweglichen Ziel.' : 'Folge dem Ziel entlang seines Kurses; es wechselt Richtung und Tempo.');
          const areaWrap = h('div', { class: 'pmt-area-wrap' });
          const area = h('div', { class: 'pmt-area', tabindex: 0 });
          const target = h('div', { class: 'pmt-target', style: { width: cfg.r * 2 + 'px', height: cfg.r * 2 + 'px' } });
          const cursor = h('div', { class: 'pmt-cursor' });
          area.appendChild(target); area.appendChild(cursor);
          areaWrap.appendChild(area);
          stage.appendChild(desc); stage.appendChild(areaWrap);
          if (DLR.util.device().mobile) stage.appendChild(h('div', { class: 'pmt-note' }, 'Am besten mit dem Finger direkt auf dem Ziel verfolgen.'));

          let W = 0, H = 0, tx = 0.5, ty = 0.5, vx = r.float(-1, 1), vy = r.float(-1, 1), mx = null, my = null;
          const speeds = [];
          let samples = [], raf = null, t0 = 0, running = false, stopped = false;
          function size() { const rc = area.getBoundingClientRect(); W = rc.width; H = rc.height; }
          function normV() { const m = Math.hypot(vx, vy) || 1; vx /= m; vy /= m; }
          normV();

          function onMove(e) {
            const rc = area.getBoundingClientRect();
            const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rc.left;
            const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rc.top;
            mx = U.clamp(cx / rc.width, 0, 1); my = U.clamp(cy / rc.height, 0, 1);
            cursor.style.left = mx * 100 + '%'; cursor.style.top = my * 100 + '%'; cursor.classList.add('active');
          }
          area.addEventListener('mousemove', onMove);
          area.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
          area.addEventListener('touchstart', (e) => { e.preventDefault(); onMove(e); }, { passive: false });

          function tick(ts) {
            if (stopped) return;
            if (!t0) t0 = ts;
            const dt = Math.min(0.05, ((tick._last ? ts - tick._last : 16)) / 1000); tick._last = ts;
            size();
            if (r.next() < 0.02 * cfg.jitter * 4) { vx += r.float(-1, 1) * cfg.jitter; vy += r.float(-1, 1) * cfg.jitter; normV(); }
            tx += (vx * cfg.speed * dt * 55) / Math.max(W, 1);
            ty += (vy * cfg.speed * dt * 55) / Math.max(H, 1);
            if (tx < 0.06) { tx = 0.06; vx = Math.abs(vx); } if (tx > 0.94) { tx = 0.94; vx = -Math.abs(vx); }
            if (ty < 0.08) { ty = 0.08; vy = Math.abs(vy); } if (ty > 0.92) { ty = 0.92; vy = -Math.abs(vy); }
            target.style.left = tx * 100 + '%'; target.style.top = ty * 100 + '%';
            if (mx != null) {
              const dx = (mx - tx) * W, dy = (my - ty) * H;
              const dist = Math.hypot(dx, dy);
              samples.push(dist);
              const onTarget = dist <= cfg.r;
              target.classList.toggle('hit', onTarget);
            }
            const elapsed = (ts - t0) / 1000;
            if (elapsed >= cfg.dur) { finish(); return; }
            raf = requestAnimationFrame(tick);
          }
          function finish() {
            stopped = true; cancelAnimationFrame(raf);
            if (!samples.length) { api.submit({ correct: false, errorType: 'Reaktionsfehler', detail: 'keine Eingabe erkannt' }); return; }
            const md = U.median(samples), norm = 1 - U.clamp(md / (Math.min(W, H) * 0.5), 0, 1);
            const within = samples.filter((d) => d <= cfg.r).length / samples.length;
            const correct = within >= 0.45;
            api.submit({ correct, errorType: correct ? null : 'Reaktionsfehler', detail: `${Math.round(within * 100)}% Zeit im Zielbereich, mittlere Abweichung ${Math.round(md)} px`, meta: { within, medianDev: md, precision: norm, samples: samples.length } });
          }
          api.resetClock();
          setTimeout(() => { size(); raf = requestAnimationFrame(tick); }, 60);
          return () => { stopped = true; cancelAnimationFrame(raf); area.removeEventListener('mousemove', onMove); };
        },
      },
    };
  }

  DLR.gen.pmt = { generate };
  DLR.registerModule({
    id: 'PMT', name: 'Psychomotorik', kind: 'trial', axis: 'Reaktion', heavy: false, minSlot: 240,
    defaultError: 'Reaktionsfehler', reactionBased: true,
    desc: 'Ein bewegliches Ziel muss mit Maus oder Finger möglichst genau verfolgt werden. Geschwindigkeit, Richtungswechsel und Zielgröße nehmen mit dem Level zu.',
    intro: { how: ['Bewege Maus oder Finger auf das Ziel und bleibe möglichst genau darauf.', 'Das Ziel wird kleiner und schneller, je höher das Level.'], keys: 'Maus / Touch' },
    generate,
  });
})();
