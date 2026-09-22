/* Trainings-Engine: 4-Jahres-Architektur (1.460 Tage), Tagesalgorithmus (30 Minuten), Final-Phase.
   Alles hier ist eine selbst gewählte Trainingsstrategie der App – keine offizielle DLR-Vorgabe. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const TOTAL_DAYS = 1460, DAY_MIN = 30;

  function settings() { return DLR.store.state.settings; }
  function startKey() { return settings().startDate || U.dayKey(); }
  function dayIndex(dateKey) { return U.diffDays(startKey(), dateKey || U.dayKey()) + 1; } // Tag 1 = Start
  function endKey() { return U.addDays(startKey(), TOTAL_DAYS - 1); }

  function phaseOf(dayIdx) {
    if (dayIdx <= 90) return { year: 1, seg: 'Grundlagen (Tag 1–90)', name: 'BEGINNER' };
    if (dayIdx <= 180) return { year: 1, seg: 'Geschwindigkeit (Tag 91–180)', name: 'BEGINNER' };
    if (dayIdx <= 365) return { year: 1, seg: 'Komplexität (Tag 181–365)', name: 'FOUNDATION' };
    if (dayIdx <= 730) return { year: 2, seg: 'Kombinationen', name: 'INTERMEDIATE' };
    if (dayIdx <= 1095) return { year: 3, seg: 'Belastung', name: 'ADVANCED' };
    return { year: 4, seg: 'Simulation', name: 'PERFORMANCE' };
  }

  /** Level-Obergrenze je Trainingstag (steigt schrittweise über die 4 Jahre). */
  function levelCap(dateKey) {
    const d = U.clamp(dayIndex(dateKey), 1, TOTAL_DAYS);
    if (d <= 14) return 2;
    if (d <= 30) return 3;
    if (d <= 60) return 4;
    if (d <= 90) return 5;
    if (d <= 180) return 6;
    if (d <= 365) return 7;
    if (d <= 730) return 8;
    if (d <= 1095) return 9;
    return 10;
  }

  /** Final-Preparation-Phase relativ zu einem optional gesetzten Testdatum. */
  function finalPhase(dateKey) {
    const td = settings().testDate;
    if (!td) return null;
    const left = U.diffDays(dateKey || U.dayKey(), td);
    if (left < 0 || left > 180) return null;
    let stage;
    if (left > 90) stage = { key: 'p180', label: 'Final Preparation', hint: 'Testdatum in Sicht – mehr Simulationsanteile ab jetzt.', simBoost: 0.1, timeBoost: 1, freezeLevels: false };
    else if (left > 60) stage = { key: 'p90', label: 'Simulationsphase', hint: 'Mehr vollständige Simulationen.', simBoost: 0.22, timeBoost: 1, freezeLevels: false };
    else if (left > 30) stage = { key: 'p60', label: 'Zeitdruckphase', hint: 'Zeitlimits werden realistischer (kein Bonus mehr).', simBoost: 0.3, timeBoost: 0.92, freezeLevels: false };
    else if (left > 14) stage = { key: 'p30', label: 'Testbedingungen', hint: 'Training läuft möglichst wie im Exam Mode.', simBoost: 0.4, timeBoost: 0.88, freezeLevels: false };
    else if (left > 7) stage = { key: 'p14', label: 'Stabilisierung', hint: 'Level werden gehalten, nicht mehr gesteigert.', simBoost: 0.3, timeBoost: 0.9, freezeLevels: true };
    else if (left > 1) stage = { key: 'p7', label: 'Reduziertes Training', hint: 'Kürzere, leichtere Einheiten zur Erholung.', simBoost: 0.1, timeBoost: 1, freezeLevels: true, lightLoad: true };
    else stage = { key: 'p1', label: 'Leichtes Training', hint: 'Kein harter Test heute – nur auflockern.', simBoost: 0, timeBoost: 1, freezeLevels: true, lightLoad: true, noSim: true };
    return Object.assign({ daysLeft: left }, stage);
  }

  function totals() {
    const days = DLR.store.state.days;
    let sec = 0, sessions = 0, sims = 0, trainedDays = 0;
    for (const k in days) { sec += days[k].sec || 0; sessions += days[k].sessions || 0; sims += days[k].sims || 0; if ((days[k].sec || 0) > 0) trainedDays++; }
    return { sec, minutes: sec / 60, sessions, sims, trainedDays };
  }
  function streak(todayKey) {
    todayKey = todayKey || U.dayKey();
    const days = DLR.store.state.days;
    let cur = 0, k = todayKey;
    if (!(days[k] && days[k].sec >= DAY_MIN * 60 * 0.5)) k = U.addDays(k, -1);
    while (days[k] && days[k].sec >= DAY_MIN * 60 * 0.5) { cur++; k = U.addDays(k, -1); }
    let best = 0, run = 0;
    const keys = Object.keys(days).sort();
    let prev = null;
    keys.forEach((dk) => {
      const ok = days[dk].sec >= DAY_MIN * 60 * 0.5;
      if (ok && (prev == null || U.diffDays(prev, dk) === 1)) run++; else run = ok ? 1 : 0;
      if (ok) { best = Math.max(best, run); prev = dk; } else prev = prev;
    });
    return { current: cur, best: Math.max(best, cur) };
  }

  /** Modulauswahl-Gewichte: 70% gezieltes Training (Schwächen), 20% bekannte Stärken, 10% neue Herausforderung. */
  function pickModulesForDay(dateKey, count) {
    dateKey = dateKey || U.dayKey();
    const cap = levelCap(dateKey);
    const active = DLR.MODULE_IDS.filter((id) => DLR.modules[id]);
    const info = active.map((id) => {
      const m = DLR.scoring.moduleScore(id, 30);
      const st = DLR.adaptive.state(id);
      const daysSince = st.lastTrained ? U.diffDays(st.lastTrained, dateKey) : 999;
      const due = DLR.sr.dueCount(id, dateKey);
      return { id, score: m.score, n: m.n, level: st.level, daysSince, due };
    });
    const weak = info.filter((x) => x.n >= 5 && x.score != null).sort((a, b) => a.score - b.score);
    const strong = info.filter((x) => x.n >= 5 && x.score != null).sort((a, b) => b.score - a.score);
    const fresh = info.filter((x) => x.n < 5);
    const stale = info.filter((x) => x.daysSince >= 5).sort((a, b) => b.daysSince - a.daysSince);
    const wantN = count || 6;
    const picks = [];
    const add = (arr) => { for (const x of arr) { if (picks.length >= wantN) return; if (!picks.find((p) => p.id === x.id)) picks.push(x); } };
    add(stale.slice(0, 2));
    add(fresh);
    add(weak.slice(0, Math.ceil(wantN * 0.7)));
    add(strong.slice(0, Math.ceil(wantN * 0.2)));
    add(info.filter((x) => !picks.find((p) => p.id === x.id)));
    return picks.slice(0, wantN).map((x) => x.id);
  }

  /** Tagesplan: Modul -> Sekunden, entsprechend Gewichtung, Ermüdung (schwere Module zuerst begrenzen) und Curriculum-Phase. */
  function buildDayPlan(dateKey, totalMinutes) {
    dateKey = dateKey || U.dayKey();
    totalMinutes = totalMinutes || DAY_MIN;
    const phase = phaseOf(dayIndex(dateKey));
    const fp = finalPhase(dateKey);
    if (fp && fp.lightLoad) totalMinutes = Math.max(10, Math.round(totalMinutes * (fp.key === 'p1' ? 0.4 : 0.6)));
    const totalSec = totalMinutes * 60;
    const heavyOk = dayIndex(dateKey) > 60; // MIC/MTF erst nach den ersten Wochen
    let ids = pickModulesForDay(dateKey, heavyOk ? 6 : 5);
    if (!heavyOk) ids = ids.filter((id) => !DLR.modules[id].heavy);
    if (!ids.length) ids = DLR.MODULE_IDS.slice(0, 5);
    const minSlot = (id) => Math.max(120, DLR.modules[id] ? DLR.modules[id].minSlot : 180);
    const weights = ids.map((id) => (DLR.modules[id] && DLR.modules[id].heavy ? 1.6 : 1));
    const wsum = U.sum(weights);
    let alloc = ids.map((id, i) => Math.max(minSlot(id), Math.round((totalSec * weights[i]) / wsum)));
    let over = U.sum(alloc) - totalSec;
    // proportional kürzen, ohne unter das Minimum zu fallen
    let guard = 0;
    while (over > 5 && guard++ < 50) {
      let cut = false;
      for (let i = 0; i < alloc.length && over > 5; i++) {
        if (alloc[i] > minSlot(ids[i])) { const d = Math.min(10, alloc[i] - minSlot(ids[i]), over); alloc[i] -= d; over -= d; cut = true; }
      }
      if (!cut) break;
    }
    const slots = ids.map((id, i) => ({ id, sec: alloc[i] }));
    return { dateKey, dayIndex: dayIndex(dateKey), phase, finalPhase: fp, totalMinutes: Math.round(U.sum(alloc)) / 60, slots, levelCap: levelCap(dateKey) };
  }

  DLR.training = {
    TOTAL_DAYS, DAY_MIN, dayIndex, phaseOf, levelCap, finalPhase, totals, streak, buildDayPlan, pickModulesForDay,
    startKey, endKey,
    daysLeft(dateKey) { return Math.max(0, TOTAL_DAYS - dayIndex(dateKey || U.dayKey())); },
    progressFrac(dateKey) { return U.clamp(dayIndex(dateKey || U.dayKey()) / TOTAL_DAYS, 0, 1); },
    ensureStart() { if (!settings().startDate) { settings().startDate = U.dayKey(); DLR.store.saveNow(); } },
  };
})();
