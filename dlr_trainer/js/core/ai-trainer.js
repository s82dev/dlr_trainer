/* KI-Trainer: keine Chat-Motivationssprüche, sondern kurze Sätze aus echten Datenvergleichen
   (z. B. Genauigkeit vor 14 Tagen vs. jetzt). Ohne ausreichend Daten wird das offen gesagt. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;

  function trend(modId, days) {
    const now = DLR.scoring.lastDays(modId, days);
    const prevEnd = U.addDays(U.dayKey(), -days);
    const prev = DLR.scoring.aggRange(modId, U.addDays(prevEnd, -days), prevEnd);
    const mNow = DLR.scoring.metrics(now), mPrev = DLR.scoring.metrics(prev);
    return { now: mNow, prev: mPrev };
  }

  function notes(limit) {
    limit = limit || 4;
    const out = [];
    DLR.MODULE_IDS.forEach((id) => {
      if (!DLR.modules[id]) return;
      const t = trend(id, 14);
      if (t.now.n < DLR.scoring.MIN_N) return;
      if (t.prev.n >= 8 && t.now.acc != null && t.prev.acc != null) {
        const d = (t.now.acc - t.prev.acc) * 100;
        if (Math.abs(d) >= 6) {
          out.push({ mod: id, text: `Deine ${id}-Genauigkeit hat sich in den letzten 14 Tagen von ${U.fmtNum(t.prev.acc * 100, 0)} % auf ${U.fmtNum(t.now.acc * 100, 0)} % ${d > 0 ? 'verbessert' : 'verschlechtert'}.`, dir: d > 0 ? 1 : -1 });
        }
      }
      if (t.prev.speed != null && t.now.speed != null && Math.abs(t.now.speed - t.prev.speed) < 4 && t.now.acc != null && t.now.acc - (t.prev.acc || 0) > 0.08) {
        out.push({ mod: id, text: `Deine Genauigkeit in ${id} steigt, die Geschwindigkeit bleibt dagegen nahezu gleich – als Nächstes engere Zeitlimits.`, dir: 0 });
      }
    });
    const end = DLR.scoring.endurance(null, 30);
    if (end && end.drop > 0.08) out.push({ text: `Bei längeren Einheiten sinkt deine Genauigkeit im Schnitt um ${U.fmtNum(end.drop * 100, 0)} Prozentpunkte – ein Hinweis auf Ermüdung unter Belastung.`, dir: -1 });
    const dueTotal = DLR.sr.counts().due;
    if (dueTotal > 0) out.push({ text: `${dueTotal} zuvor falsch gelöste Aufgabe${dueTotal === 1 ? '' : 'n'} ${dueTotal === 1 ? 'ist' : 'sind'} heute zur Wiederholung fällig.`, dir: 0 });
    if (!out.length) return [{ text: 'Noch nicht genug Trainingsdaten für eine Verlaufsanalyse. Trainiere weiter, um erste Trends zu sehen.', dir: 0 }];
    return out.slice(0, limit);
  }

  DLR.aiTrainer = { notes, trend };
})();
