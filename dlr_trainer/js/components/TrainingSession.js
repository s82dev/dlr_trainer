/* TrialRunner – führt aufgabenbasierte Module (KRN, PPT, WFG, TVT, PHY, ENS, OWT, VMC) aus.
   Er erzeugt Aufgaben aus Seeds (reproduzierbar), misst Zeiten, klassifiziert Fehler,
   speist Adaptive Engine + Spaced Repetition und zeigt im Training Feedback (im Exam-Mode keines). */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  DLR.ui.runTrials = function runTrials(mod, ctx) {
    const box = ctx.box;
    let stopped = false, n = 0, cur = null, keyH = null, cleanup = null, tlTimer = null, continueFn = null, feedbackOpen = false;
    const timeouts = [];
    const reviewQ = ctx.reviews ? DLR.sr.due(mod.id, ctx.today, 3) : [];
    let sinceReview = 0;

    function later(fn, ms) { const id = setTimeout(() => { if (!stopped) fn(); }, ms); timeouts.push(id); return id; }
    function clearAll() { timeouts.forEach(clearTimeout); timeouts.length = 0; clearTimeout(tlTimer); tlTimer = null; }
    function cleanTask() {
      clearAll(); keyH = null;
      if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
      DLR.audio.cancelSpeech();
    }

    function onKey(e) {
      if (stopped) return;
      if (feedbackOpen) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (continueFn) continueFn(); }
        return;
      }
      if (keyH && keyH(e)) { e.preventDefault(); e.stopPropagation(); }
    }
    document.addEventListener('keydown', onKey, true);

    function next() {
      if (stopped) return;
      cleanTask();
      let spec, review = null, task = null;
      for (let attempt = 0; attempt < 4 && !task; attempt++) {
        if (attempt === 0 && reviewQ.length && n >= 1 && (sinceReview >= 2 || Math.random() < 0.3)) {
          review = reviewQ.shift();
          spec = { seed: review.seed, level: review.level, params: review.params };
          sinceReview = 0;
        } else {
          review = null;
          spec = { seed: U.newSeed(), level: ctx.fixedLevel || ctx.getLevel(), params: null };
          sinceReview++;
        }
        try {
          task = mod.generate({ seed: spec.seed, level: spec.level, params: spec.params, timeScale: ctx.timeScale, phase: ctx.phase });
        } catch (err) { console.error('Aufgabengenerator', mod.id, err); task = null; }
      }
      if (!task) { ctx.fail && ctx.fail('Aufgabe konnte nicht erzeugt werden'); return; }
      task.level = task.level || spec.level;
      if (task.params && !spec.params) spec.params = task.params;
      cur = { task, spec, review, t0: 0, done: false, started: false };
      n++; ctx.setTaskCount(n);
      present();
    }

    function startClock() {
      cur.t0 = DLR.core.now(); cur.started = true;
      clearTimeout(tlTimer);
      const lim = cur.task.timeLimit;
      if (lim && lim > 0) {
        tlTimer = setTimeout(() => { if (!stopped) finish(null, true); }, lim * 1000);
        if (cur.bar && ctx.feedback) {
          cur.bar.style.transition = 'none'; cur.bar.style.width = '100%';
          void cur.bar.offsetWidth;
          cur.bar.style.transition = 'width ' + lim + 's linear'; cur.bar.style.width = '0%';
        }
      }
    }

    function present() {
      const task = cur.task;
      U.clear(box); box.className = 'ts-body';
      const stage = h('div', { class: 'trial kind-' + (task.kind || 'mc') + ' mod-' + mod.id });
      box.appendChild(stage);
      if (cur.review && ctx.feedback) stage.appendChild(h('div', { class: 'trial-tag' }, 'Wiederholung'));
      if (task.prompt) stage.appendChild(h('div', { class: 'prompt', html: task.prompt }));
      if (task.visual) {
        const v = h('div', { class: 'visual' });
        if (typeof task.visual === 'function') task.visual(v, { later, alive: () => !stopped && cur && !cur.done }); else v.innerHTML = task.visual;
        stage.appendChild(v);
        if (task.exposureMs) {
          later(() => { v.classList.add('faded'); v.setAttribute('aria-hidden', 'true'); }, task.exposureMs);
          stage.appendChild(h('div', { class: 'expo-note' }, 'Figur wird nur kurz gezeigt'));
        }
      }
      cur.bar = null;
      if (task.timeLimit && ctx.feedback) {
        cur.bar = h('div', { class: 'tbar-fill' });
        stage.appendChild(h('div', { class: 'tbar', title: 'Zeitlimit dieser Aufgabe' }, cur.bar));
      }
      if (task.speech && DLR.store.state.settings.speakNumbers) DLR.audio.speak(task.speech, { lang: task.speechLang || 'de-DE' });

      const kind = task.kind || 'mc';
      if (kind === 'mc') {
        const order = task.noShuffle ? task.options.map((o, i) => i) : U.shuffle(task.options.map((o, i) => i));
        const shown = order.map((i) => task.options[i]);
        const ans = DLR.ui.answer.choices(stage, shown, (i) => finish({ opt: shown[i] }, false), { labels: task.labels, cols: task.cols });
        keyH = ans.keyHandler;
      } else if (kind === 'num') {
        DLR.ui.answer.numeric(stage, (v) => finish({ value: v }, false), { unit: task.unit, decimals: task.decimals });
      } else if (kind === 'custom') {
        const api = {
          box: stage,
          level: task.level,
          isExam: !ctx.feedback,
          audio: DLR.audio,
          submit(res) { finish(res, false); },
          resetClock() { if (cur && !cur.done) startClock(); },
          setTimeout(fn, ms) { return later(fn, ms); },
          onKey(fn) { keyH = fn; },
          alive() { return !stopped && cur && !cur.done; },
        };
        const c = task.custom.render(stage, api);
        if (typeof c === 'function') cleanup = c;
      }
      if (!task.deferClock) startClock();
    }

    function evaluate(task, resp, timedOut, elapsed) {
      if (timedOut) return { correct: false, errorType: 'zu langsam', detail: 'Zeitlimit überschritten', timedOut: true };
      const kind = task.kind || 'mc';
      if (kind === 'mc') {
        const o = resp.opt;
        return { correct: !!o.correct, errorType: o.correct ? null : (o.err || mod.defaultError || 'Wahrnehmungsfehler'), detail: o.note || null };
      }
      if (kind === 'num') {
        const tol = (task.tolerance || 0) + 1e-9;
        const ok = Math.abs(resp.value - task.answer) <= tol;
        return { correct: ok, errorType: ok ? null : (task.errFn ? task.errFn(resp.value) : mod.defaultError || 'Rechenfehler'), detail: ok ? null : 'Eingabe: ' + U.fmtNum(resp.value, 3) };
      }
      return resp; // custom: {correct, errorType, detail, meta}
    }

    function finish(resp, timedOut) {
      if (!cur || cur.done || stopped) return;
      cur.done = true;
      clearTimeout(tlTimer);
      const task = cur.task;
      const elapsed = Math.max(0.001, (DLR.core.now() - cur.t0) / 1000);
      const res = evaluate(task, resp, timedOut, elapsed);
      const att = {
        exerciseId: mod.id + '-' + cur.spec.seed + '-' + task.level,
        module: mod.id, level: task.level, difficulty: task.difficulty != null ? task.difficulty : task.level,
        correct: !!res.correct, responseTime: elapsed, reactionTime: mod.reactionBased ? elapsed : null,
        errorType: res.correct ? null : (res.errorType || 'Reaktionsfehler'),
        target: task.expectedSec || null, task: task.tag || null,
        meta: Object.assign({ seed: cur.spec.seed, review: !!cur.review, challenge: !!ctx.challenge, detail: res.detail || null, timedOut: !!res.timedOut }, res.meta || {}),
      };
      ctx.log(att);
      // Spaced Repetition
      if (cur.review) DLR.sr.review(cur.review.id, !!res.correct, ctx.today);
      else if (!res.correct && mod.reproducible !== false) DLR.sr.addWrong(mod.id, { seed: cur.spec.seed, level: task.level, params: cur.spec.params }, ctx.today);
      // Adaptivität: nur reguläre Aufgaben (keine Wiederholung, keine Challenge)
      if (ctx.adapt && !cur.review && !ctx.challenge) {
        const ev = DLR.adaptive.recordTrial(mod.id, !!res.correct, elapsed, task.expectedSec);
        if (ev && ctx.onLevelEvent) ctx.onLevelEvent(ev);
      }
      if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
      if (ctx.feedback) showFeedback(res, task, elapsed);
      else later(next, 0);
    }

    function showFeedback(res, task, elapsed) {
      feedbackOpen = true;
      ctx.timer.pause();
      const ok = res.correct;
      ctx.screen.flash(ok);
      const ov = h('div', { class: 'fb ' + (ok ? 'fb-ok' : 'fb-bad'), role: 'status' });
      ov.appendChild(h('div', { class: 'fb-title' }, ok ? 'Richtig' : (res.timedOut ? 'Zeit abgelaufen' : 'Falsch')));
      ov.appendChild(h('div', { class: 'fb-time' }, U.fmtNum(elapsed, 2) + ' s' + (task.expectedSec ? ' · Zielzeit ' + U.fmtNum(task.expectedSec, 1) + ' s' : '')));
      if (!ok) {
        if (task.solution) ov.appendChild(h('div', { class: 'fb-solution' }, h('span', { class: 'fb-label' }, 'Richtig: '), h('strong', { html: task.solution })));
        if (res.errorType) ov.appendChild(h('div', { class: 'fb-err' }, 'Fehlertyp: ' + res.errorType + (res.detail ? ' – ' + res.detail : '')));
        if (task.explain) ov.appendChild(h('div', { class: 'fb-explain', html: task.explain }));
      }
      const go = () => {
        if (!feedbackOpen) return;
        feedbackOpen = false; continueFn = null;
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        ctx.timer.resume();
        if (!stopped) next();
      };
      if (ok) {
        box.appendChild(ov);
        later(go, 650);
        continueFn = null;
      } else {
        ov.appendChild(h('button', { type: 'button', class: 'btn primary fb-next', onclick: go }, 'Weiter (Enter)'));
        box.appendChild(ov);
        let armed = false;
        later(() => { armed = true; }, 350);
        continueFn = () => { if (armed) go(); };
        // Für Auto-Weiter im "richtig"-Fall braucht go trotzdem Zugriff
      }
      if (ok) continueFn = null;
    }

    return {
      start() { next(); },
      stop() {
        stopped = true;
        feedbackOpen = false;
        cleanTask();
        document.removeEventListener('keydown', onKey, true);
      },
      count() { return n; },
    };
  };
})();
