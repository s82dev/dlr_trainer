(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  function render(root) {
    U.clear(root);
    root.appendChild(h('h1', null, 'Trainingsprofil'));
    const tot = DLR.training.totals();
    const streak = DLR.training.streak();

    const grid = h('div', { class: 'stat-grid' });
    const box = (v, l) => h('div', { class: 'stat-box' }, h('div', { class: 'v' }, v), h('div', { class: 'l' }, l));
    grid.appendChild(box(U.fmtNum(tot.minutes, 0), 'Gesamtminuten'));
    grid.appendChild(box(String(tot.trainedDays), 'Trainingstage'));
    grid.appendChild(box(String(streak.current), 'Aktuelle Streak'));
    grid.appendChild(box(String(streak.best), 'Längste Streak'));
    root.appendChild(h('div', { class: 'card' }, h('h3', null, 'Langzeitstatistik'), grid));

    const dims = DLR.scoring.skillDims(30);
    const radarCard = h('div', { class: 'card' }, h('h3', null, 'Leistungsprofil (30 Tage)'));
    const radar = DLR.RADAR_AXES.map((a) => ({ axis: a, value: DLR.scoring.radar(30).find((x) => x.axis === a).value }));
    const anyData = radar.some((a) => a.value != null);
    if (anyData) radarCard.appendChild(DLR.ui.radarChart(radar, { size: 320 }));
    else radarCard.appendChild(h('div', { class: 'empty-hint' }, 'Keine Daten – trainiere mindestens ' + DLR.scoring.MIN_N + ' Aufgaben je Modul für ein Profil.'));
    root.appendChild(radarCard);

    const modCard = h('div', { class: 'card' }, h('h3', null, 'Module'));
    DLR.MODULE_IDS.forEach((id) => {
      if (!DLR.modules[id]) return;
      const m = DLR.scoring.moduleScore(id, 30);
      const lvl = DLR.adaptive.level(id);
      const row = h('div', { class: 'mod-row' },
        h('span', { class: 'code' }, id),
        h('div', { class: 'bar' }, h('i', { style: { width: (m.score == null ? 0 : U.clamp(m.score, 0, 100)) + '%' } })),
        h('span', { class: 'lvl' }, m.n >= DLR.scoring.MIN_N ? 'Lv ' + lvl + ' · ' + U.fmtPct(m.acc, 0) : 'Lv ' + lvl + ' · –'));
      modCard.appendChild(row);
    });
    root.appendChild(modCard);

    const all = DLR.scoring.lastDays(null, 30);
    const errCard = h('div', { class: 'card' }, h('h3', null, 'Fehlerklassifizierung (30 Tage)'));
    const total = U.sum(Object.values(all.err));
    if (!total) errCard.appendChild(h('div', { class: 'empty-hint' }, 'Keine Fehlerdaten vorhanden.'));
    else Object.keys(all.err).sort((a, b) => all.err[b] - all.err[a]).forEach((k) => {
      errCard.appendChild(h('div', { class: 'err-row' }, h('span', null, k), h('span', { class: 'mono' }, all.err[k] + ' (' + U.fmtNum((all.err[k] / total) * 100, 0) + ' %)')));
    });
    root.appendChild(errCard);

    const srCard = h('div', { class: 'card' }, h('h3', null, 'Spaced Repetition'));
    const c = DLR.sr.counts();
    srCard.appendChild(h('div', { class: 'row' }, h('span', null, 'Heute fällig'), h('b', { class: 'mono' }, String(c.due))));
    srCard.appendChild(h('div', { class: 'row' }, h('span', null, 'Insgesamt im Wiederholungsspeicher'), h('span', { class: 'mono' }, String(c.total))));
    root.appendChild(srCard);
  }

  DLR.views.stats = { render };
})();
