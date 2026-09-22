/* Scoring-Engine – berechnet ausschließlich aus real gespeicherten Ergebnissen.
   Ohne Daten liefert sie null ("Keine Daten"), niemals erfundene Werte.
   Zielwerte (expectedSec) sind interne Trainings-Referenzen, keine offiziellen Grenzwerte. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const MIN_N = 10;

  const AXIS_MAP = {
    Mathematik: ['KRN'],
    'Gedächtnis': ['RMS', 'VMC'],
    Konzentration: ['SKT', 'OWT'],
    Technik: ['TVT', 'PHY'],
    Raum: ['PPT', 'WFG'],
    Reaktion: ['PMT', 'SKT', 'MIC'],
    Multitasking: ['MIC', 'MTF'],
  };
  const REACTION_MODULES = ['SKT', 'PMT', 'MIC', 'MTF', 'RMS'];

  function S() { return DLR.store.state; }

  const scoring = (DLR.scoring = {
    MIN_N,
    AXIS_MAP,
    REACTION_MODULES,

    mergeAgg(d, s) {
      d.n += s.n; d.c += s.c; d.rt += s.rt; d.rtn += s.rtn; d.rt2 += s.rt2;
      if (s.rtMin != null && (d.rtMin == null || s.rtMin < d.rtMin)) d.rtMin = s.rtMin;
      d.spd += s.spd; d.spdn += s.spdn; d.diff += s.diff; d.lv += s.lv;
      for (const k in s.err) d.err[k] = (d.err[k] || 0) + s.err[k];
      (s.mb || []).forEach((b, i) => {
        const t = d.mb[i] || (d.mb[i] = [0, 0]);
        t[0] += b[0]; t[1] += b[1];
      });
      return d;
    },

    /** Aggregat eines Moduls (oder aller Module, wenn mod == null) im Zeitraum [from, to] (Tages-Keys). */
    aggRange(mod, fromKey, toKey) {
      const out = DLR.progress.newAgg();
      const days = S().days;
      for (const dk in days) {
        if ((fromKey && dk < fromKey) || (toKey && dk > toKey)) continue;
        const mods = days[dk].mods;
        if (mod) { if (mods[mod]) scoring.mergeAgg(out, mods[mod]); }
        else for (const m in mods) scoring.mergeAgg(out, mods[m]);
      }
      return out;
    },
    lastDays(mod, days, endKey) {
      endKey = endKey || U.dayKey();
      return scoring.aggRange(mod, U.addDays(endKey, -(days - 1)), endKey);
    },

    metrics(g) {
      const n = g.n;
      const meanRt = g.rtn ? g.rt / g.rtn : null;
      let cons = null;
      if (g.rtn >= 5 && meanRt > 0) {
        const variance = Math.max(0, g.rt2 / g.rtn - meanRt * meanRt);
        const cv = Math.sqrt(variance) / meanRt;
        cons = 100 * U.clamp(1 - (cv - 0.15) / 0.85, 0, 1);
      }
      return {
        n, correct: g.c, wrong: n - g.c,
        acc: n ? g.c / n : null,
        errRate: n ? (n - g.c) / n : null,
        meanRt, minRt: g.rtMin,
        speed: g.spdn >= 5 ? 100 * (g.spd / g.spdn) : null,
        consistency: cons,
        avgLevel: n ? g.lv / n : null,
        avgDiff: n ? g.diff / n : null,
        err: g.err,
      };
    },

    /** Gesamtwert eines Moduls 0–100 (aus Genauigkeit, Tempo, erreichtem Level) oder null ohne Daten. */
    moduleScore(mod, days) {
      const g = scoring.lastDays(mod, days || 30);
      const m = scoring.metrics(g);
      const level = DLR.adaptive ? DLR.adaptive.level(mod) : 1;
      if (m.n < MIN_N) return Object.assign({ score: null, level }, m);
      const acc = m.acc * 100;
      const speed = m.speed == null ? acc : m.speed;
      const lvl = ((level - 1) / 9) * 100;
      return Object.assign({ score: 0.45 * acc + 0.25 * speed + 0.3 * lvl, level }, m);
    },

    endurance(mod, days) {
      const g = scoring.lastDays(mod, days || 60);
      const b = g.mb.filter((x) => x && x[0] >= 8);
      if (b.length < 4) return null;
      const first = b.slice(0, 2), last = b.slice(-2);
      const acc = (arr) => U.sum(arr.map((x) => x[1])) / U.sum(arr.map((x) => x[0]));
      const a1 = acc(first), a2 = acc(last);
      const drop = a1 - a2;
      return { first: a1, last: a2, drop, index: 100 * U.clamp(1 - Math.max(0, drop) * 2, 0, 1), minutes: b.length };
    },

    avg(vals) { const v = vals.filter((x) => x != null && !isNaN(x)); return v.length ? U.mean(v) : null; },

    skillDims(days) {
      days = days || 30;
      const ids = DLR.MODULE_IDS;
      const ms = {}; ids.forEach((id) => (ms[id] = scoring.moduleScore(id, days)));
      const have = ids.filter((id) => ms[id].n >= MIN_N);
      const all = scoring.lastDays(null, days);
      const tot = scoring.metrics(all);
      const comp = (id) => (ms[id].n >= MIN_N ? 0.6 * ms[id].acc * 100 + 0.4 * (ms[id].speed == null ? ms[id].acc * 100 : ms[id].speed) : null);
      const end = scoring.avg(ids.map((id) => { const e = scoring.endurance(id, Math.max(days, 60)); return e ? e.index : null; }));
      return {
        Accuracy: tot.n >= MIN_N ? tot.acc * 100 : null,
        Speed: scoring.avg(have.map((id) => ms[id].speed)),
        Consistency: scoring.avg(have.map((id) => ms[id].consistency)),
        Endurance: end,
        'Working Memory': scoring.avg(['RMS', 'VMC'].map(comp)),
        Reaction: scoring.avg(['SKT', 'PMT', 'MIC'].map(comp)),
        Precision: scoring.avg(['PMT', 'OWT', 'WFG'].map((id) => (ms[id].n >= MIN_N ? ms[id].acc * 100 : null))),
        _modules: ms,
      };
    },

    radar(days) {
      days = days || 30;
      const ms = {}; DLR.MODULE_IDS.forEach((id) => (ms[id] = scoring.moduleScore(id, days)));
      const out = DLR.RADAR_AXES.map((axis) => {
        if (axis === 'Geschwindigkeit') {
          const v = DLR.MODULE_IDS.filter((id) => ms[id].n >= MIN_N && ms[id].speed != null).map((id) => ms[id].speed);
          return { axis, value: v.length ? U.mean(v) : null };
        }
        const v = AXIS_MAP[axis].filter((id) => ms[id].score != null).map((id) => ms[id].score);
        return { axis, value: v.length ? U.mean(v) : null };
      });
      return out;
    },

    /** Genauigkeit pro Minute innerhalb eines Blocks – zur Erkennung von Leistungsabfall. */
    minuteCurve(attempts) {
      const by = {};
      attempts.forEach((a) => { const m = a.minute || 0; (by[m] || (by[m] = { n: 0, c: 0 })); by[m].n++; if (a.correct) by[m].c++; });
      return Object.keys(by).map(Number).sort((a, b) => a - b).map((m) => ({ minute: m + 1, n: by[m].n, acc: by[m].c / by[m].n }));
    },

    /** Zusammenfassung einer Liste von Antworten (z. B. eines Trainingsblocks). */
    summarize(attempts) {
      const g = DLR.progress.newAgg();
      attempts.forEach((a) => {
        g.n++; if (a.correct) g.c++; else { const t = a.errorType || 'Reaktionsfehler'; g.err[t] = (g.err[t] || 0) + 1; }
        if (a.responseTime != null) {
          g.rt += a.responseTime; g.rtn++; g.rt2 += a.responseTime * a.responseTime;
          if (g.rtMin == null || a.responseTime < g.rtMin) g.rtMin = a.responseTime;
          if (a.target > 0) { g.spd += Math.min(1, a.target / Math.max(a.responseTime, 0.05)); g.spdn++; }
        }
        g.lv += a.level; g.diff += a.difficulty != null ? a.difficulty : a.level;
      });
      return scoring.metrics(g);
    },
  });
})();
