/* Adaptives Levelsystem (10 Level pro Modul).
   Ein Level-Up ergibt sich NICHT aus "X richtige Antworten", sondern aus einem Fenster von 10 Aufgaben:
     Accuracy ≥ 90 % (max. 1 Fehler)  UND  mittlere Zeit im Verhältnis zur Zielzeit ≤ 1,0  UND  Konstanz (CV der Zeit) ≤ 0,7.
   Level-Down bei Accuracy ≤ 50 %. Nach jeder Änderung startet ein frisches Fenster.
   Stream-Module (SKT, RMS, MIC, PMT, MTF) werden am Ende eines Blocks bewertet. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const WINDOW = 10;

  function modState(id) {
    const S = DLR.store.state;
    return S.modules[id] || (S.modules[id] = { level: 1, win: [], lastTrained: null, bestLevel: 1, timeScale: 1, log: [], atCap: false });
  }

  const adaptive = (DLR.adaptive = {
    WINDOW,
    state: modState,
    level(id) { return modState(id).level; },

    /** Harte Obergrenze aus dem aktuellen Curriculum-Abschnitt (abschaltbar in den Einstellungen). */
    cap(id, dateKey) {
      if (!DLR.store.state.settings.capByPhase) return 10;
      return DLR.training ? DLR.training.levelCap(dateKey || U.dayKey()) : 10;
    },
    /** Level, mit dem tatsächlich gespielt wird. */
    effectiveLevel(id, opts) {
      opts = opts || {};
      const base = Math.min(modState(id).level, adaptive.cap(id));
      return U.clamp(base + (opts.challenge ? 1 : 0), 1, 10);
    },
    /** Multiplikator für Zeitlimits, den der Trainer aus deinen Daten ableitet (0,8–1,25). */
    timeScale(id) { return modState(id).timeScale || 1; },
    setTimeScale(id, v) { modState(id).timeScale = U.clamp(v, 0.8, 1.25); DLR.store.save(); },

    frozen() {
      const f = DLR.training && DLR.training.finalPhase ? DLR.training.finalPhase(U.dayKey()) : null;
      return !!(f && f.freezeLevels);
    },

    _change(id, to, reason, dateKey) {
      const st = modState(id);
      const from = st.level;
      st.level = to; st.win = [];
      st.bestLevel = Math.max(st.bestLevel, to);
      st.log.push({ d: dateKey || U.dayKey(), from, to, reason });
      if (st.log.length > 60) st.log.shift();
      DLR.store.save();
      return { id, from, to, reason };
    },

    /** Einzelne Aufgabe eines Trial-Moduls einspeisen. ratio = Zeit / Zielzeit. */
    recordTrial(id, correct, rt, target) {
      if (adaptive.frozen()) return null;
      const st = modState(id);
      const ratio = rt != null && target > 0 ? rt / target : null;
      st.win.push([correct ? 1 : 0, ratio]);
      if (st.win.length > WINDOW) st.win.shift();
      if (st.win.length < WINDOW) return null;
      const errors = st.win.filter((w) => !w[0]).length;
      const acc = 1 - errors / WINDOW;
      const ratios = st.win.map((w) => w[1]).filter((r) => r != null);
      const medRatio = ratios.length ? U.median(ratios) : 1;
      const mean = ratios.length ? U.mean(ratios) : 1;
      const cv = ratios.length > 2 && mean > 0 ? U.stdev(ratios) / mean : 0;
      const cap = adaptive.cap(id);
      st.atCap = false;
      if (errors <= 1 && medRatio <= 1.0 && cv <= 0.7) {
        if (st.level < 10 && st.level < cap) return adaptive._change(id, st.level + 1, `Accuracy ${Math.round(acc * 100)} %, Zeit ${medRatio.toFixed(2)}× Ziel, Konstanz ok`);
        st.atCap = true;
      } else if (acc <= 0.5 && st.level > 1) {
        return adaptive._change(id, st.level - 1, `Accuracy ${Math.round(acc * 100)} % im Fenster`);
      }
      return null;
    },

    /** Blockbewertung für Stream-Module. summary: {n, acc, ratio (Zeit/Ziel oder null)} */
    evaluateBlock(id, summary) {
      if (adaptive.frozen()) return null;
      const st = modState(id);
      if (!summary || summary.n < 20) return null;
      const cap = adaptive.cap(id);
      const okTime = summary.ratio == null || summary.ratio <= 1.0;
      if (summary.acc >= 0.9 && okTime) {
        if (st.level < 10 && st.level < cap) return adaptive._change(id, st.level + 1, `Block-Accuracy ${Math.round(summary.acc * 100)} %`);
        st.atCap = true;
      } else if (summary.acc < 0.6 && st.level > 1) {
        return adaptive._change(id, st.level - 1, `Block-Accuracy ${Math.round(summary.acc * 100)} %`);
      }
      return null;
    },

    markTrained(id, dateKey) { const st = modState(id); st.lastTrained = dateKey || U.dayKey(); },
    reset(id) { const S = DLR.store.state; delete S.modules[id]; },
  });
})();
