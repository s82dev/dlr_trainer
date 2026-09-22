/* Session-Manager: spielt eine Sequenz von Modul-Slots (normales Training) oder eine volle Simulation
   (Exam Mode) ab und sammelt die Ergebnisse für den Trainingsbericht. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;

  function runOneModule(modId, seconds, opts) {
    return new Promise((resolve) => {
      const mod = DLR.modules[modId];
      const exam = !!opts.exam;
      const screen = opts.screen;
      const sessionId = opts.sessionId;
      const today = U.dayKey();
      const logged = [];
      screen.setModule(modId, mod.name);
      const timer = new DLR.core.Timer(seconds * 1000, {
        onTick: (rem) => { screen.setTime(rem / 1000); screen.setProgress(1 - rem / (seconds * 1000)); },
        onEnd: () => { runner.stop(); finish(); },
      });
      let taskCount = 0;
      const ctx = {
        box: screen.body, screen, timer, today,
        feedback: !exam, adapt: true, reviews: !exam, challenge: false,
        fixedLevel: exam ? Math.min(DLR.adaptive.level(modId), DLR.training.levelCap(today)) : null,
        timeScale: exam ? 1 : DLR.adaptive.timeScale(modId),
        phase: DLR.training.phaseOf(DLR.training.dayIndex(today)),
        getLevel() { return DLR.adaptive.effectiveLevel(modId); },
        setTaskCount(n) { taskCount = n; screen.setTask(n); },
        log(att) { att.sessionId = sessionId; att.mode = exam ? 'exam' : 'training'; att.minute = Math.floor(timer.elapsedMs() / 60000); logged.push(att); DLR.progress.record(att); },
        onLevelEvent(ev) { if (opts.onLevelEvent) opts.onLevelEvent(modId, ev); },
        fail(msg) { console.error(modId, msg); },
      };
      const runner = DLR.ui.runTrials(mod, ctx);
      let done = false;
      function finish() {
        if (done) return; done = true;
        DLR.adaptive.markTrained(modId, today);
        if (!exam && DLR.modules[modId].reactionBased) {
          // Blockmodule liefern ihre Bewertung bereits pro Aufgabe über evaluateBlock (siehe TrainingSession/log)
        }
        resolve({ module: modId, seconds, attempts: logged, count: taskCount });
      }
      timer.start();
      runner.start();
    });
  }

  /** Trainingseinheit: Slots nacheinander abspielen. onProgress(info) für UI-Updates. */
  function runTraining(plan, opts) {
    opts = opts || {};
    const screen = new DLR.ui.TestScreen({ exam: false });
    const sessionId = U.uid();
    const results = [];
    const levelEvents = [];
    let i = 0, cancelled = false;
    const totalSec = U.sum(plan.slots.map((s) => s.sec));
    let elapsedBefore = 0;

    function onLevelEvent(modId, ev) { levelEvents.push(Object.assign({ module: modId }, ev)); }

    function step() {
      if (cancelled) return;
      if (i >= plan.slots.length) { return finishAll(); }
      const slot = plan.slots[i];
      if (opts.onSlotStart) opts.onSlotStart(slot, i, plan.slots.length);
      runOneModule(slot.id, slot.sec, { screen, sessionId, onLevelEvent }).then((res) => {
        results.push(res);
        elapsedBefore += slot.sec;
        DLR.progress.addSeconds(U.dayKey(), slot.sec);
        DLR.store.save();
        if (opts.onSlotEnd) opts.onSlotEnd(res, elapsedBefore, totalSec);
        i++;
        if (!cancelled) step();
      });
    }
    function finishAll() {
      DLR.progress.addSession(U.dayKey());
      screen.destroy();
      if (opts.onDone) opts.onDone({ sessionId, results, levelEvents, totalSec });
    }
    step();
    return {
      cancel() { cancelled = true; screen.destroy(); if (opts.onCancel) opts.onCancel({ sessionId, results, levelEvents }); },
    };
  }

  /** Exam Mode: feste Reihenfolge, keine Hinweise/Pausen/Feedback, Ergebnis erst am Ende. */
  function runExam(order, secondsPerModule, opts) {
    opts = opts || {};
    const screen = new DLR.ui.TestScreen({ exam: true });
    const sessionId = U.uid();
    const results = []; let i = 0, cancelled = false;
    const totalSec = order.length * secondsPerModule;
    let elapsedBefore = 0;
    function step() {
      if (cancelled) return;
      if (i >= order.length) return finishAll();
      const modId = order[i];
      if (opts.onSlotStart) opts.onSlotStart(modId, i, order.length);
      runOneModule(modId, secondsPerModule, { screen, sessionId, exam: true }).then((res) => {
        results.push(res); elapsedBefore += secondsPerModule;
        DLR.progress.addSeconds(U.dayKey(), secondsPerModule);
        if (opts.onSlotEnd) opts.onSlotEnd(res, elapsedBefore, totalSec);
        i++; if (!cancelled) step();
      });
    }
    function finishAll() {
      DLR.progress.addSession(U.dayKey());
      const dk = U.dayKey(); const day = DLR.store.state.days[dk] || (DLR.store.state.days[dk] = { sec: 0, sessions: 0, mods: {}, sims: 0 });
      day.sims = (day.sims || 0) + 1;
      const summary = { id: U.uid(), date: dk, results, totalSec: U.sum(results.map((r) => r.seconds)), order };
      DLR.store.state.simulations.push(summary);
      if (DLR.store.state.simulations.length > 40) DLR.store.state.simulations.shift();
      DLR.store.save();
      screen.destroy();
      if (opts.onDone) opts.onDone(summary);
    }
    step();
    return { cancel() { cancelled = true; screen.destroy(); if (opts.onCancel) opts.onCancel(); } };
  }

  DLR.session = { runTraining, runExam, runOneModule };
})();
