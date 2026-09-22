/* Spaced Repetition für falsch beantwortete Aufgaben.
   Eine Aufgabe wird über (Modul, Seed, Level, Parameter) exakt reproduziert.
   Falsch -> nach 1 Tag fällig. Richtig -> nächste Stufe (3, 7, 14, 30, 60, 120 Tage).
   Erneut falsch -> Intervall zurück auf Stufe 0. Nach der letzten Stufe gilt die Aufgabe als gefestigt. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

  function items() { return DLR.store.state.sr.items; }

  const sr = (DLR.sr = {
    INTERVALS,

    /** Nach einer falschen Antwort aufrufen (nur bei reproduzierbaren Aufgaben). */
    addWrong(moduleId, spec, todayKey) {
      todayKey = todayKey || U.dayKey();
      const ex = items().find((i) => i.m === moduleId && i.seed === spec.seed && i.level === spec.level && JSON.stringify(i.params || null) === JSON.stringify(spec.params || null));
      if (ex) { ex.stage = 0; ex.lapses = (ex.lapses || 0) + 1; ex.due = U.addDays(todayKey, INTERVALS[0]); ex.last = todayKey; }
      else {
        items().push({ id: U.uid(), m: moduleId, seed: spec.seed, level: spec.level, params: spec.params || null, stage: 0, lapses: 0, created: todayKey, last: todayKey, due: U.addDays(todayKey, INTERVALS[0]) });
        if (items().length > 800) items().splice(0, items().length - 800);
      }
      DLR.store.save();
    },

    /** Ergebnis einer Wiederholung verbuchen. */
    review(id, correct, todayKey) {
      todayKey = todayKey || U.dayKey();
      const list = items();
      const i = list.findIndex((x) => x.id === id);
      if (i < 0) return null;
      const it = list[i];
      it.last = todayKey;
      if (correct) {
        it.stage++;
        if (it.stage >= INTERVALS.length) { list.splice(i, 1); DLR.store.save(); return { mastered: true }; }
        it.due = U.addDays(todayKey, INTERVALS[it.stage]);
      } else {
        it.stage = 0; it.lapses = (it.lapses || 0) + 1;
        it.due = U.addDays(todayKey, INTERVALS[0]);
      }
      DLR.store.save();
      return { stage: it.stage, due: it.due, mastered: false };
    },

    due(moduleId, todayKey, max) {
      todayKey = todayKey || U.dayKey();
      return items().filter((i) => (!moduleId || i.m === moduleId) && i.due <= todayKey).sort((a, b) => (a.due < b.due ? -1 : 1)).slice(0, max || 999);
    },
    dueCount(moduleId, todayKey) { return sr.due(moduleId, todayKey).length; },

    counts(todayKey) {
      todayKey = todayKey || U.dayKey();
      const by = {}; let due = 0;
      items().forEach((i) => {
        const b = by[i.m] || (by[i.m] = { total: 0, due: 0 });
        b.total++; if (i.due <= todayKey) { b.due++; due++; }
      });
      return { total: items().length, due, by };
    },
    upcoming(todayKey, n) {
      return items().slice().sort((a, b) => (a.due < b.due ? -1 : 1)).slice(0, n || 12);
    },
  });
})();
