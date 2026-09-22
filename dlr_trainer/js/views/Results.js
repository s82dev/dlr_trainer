(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  function moduleSummary(results) {
    const byMod = {};
    results.forEach((r) => {
      const attempts = r.attempts;
      const g = byMod[r.module] || (byMod[r.module] = { n: 0, c: 0, rts: [] });
      attempts.forEach((a) => { g.n++; if (a.correct) g.c++; if (a.responseTime != null) g.rts.push(a.responseTime); });
    });
    return byMod;
  }

  function overlayRoot() {
    const el = h('div', { class: 'ts', style: { overflowY: 'auto', display: 'block', padding: '0' } });
    const inner = h('div', { style: { maxWidth: '520px', margin: '0 auto', padding: '24px 18px calc(90px + env(safe-area-inset-bottom,0px))' } });
    el.appendChild(inner);
    document.body.appendChild(el);
    return { el, inner };
  }

  function trainingReport(session, plan) {
    const { el, inner } = overlayRoot();
    const totalSec = U.sum(session.results.map((r) => r.seconds));
    const allAttempts = session.results.flatMap((r) => r.attempts);
    const n = allAttempts.length, correct = allAttempts.filter((a) => a.correct).length;
    const rts = allAttempts.filter((a) => a.responseTime != null).map((a) => a.responseTime);
    inner.appendChild(h('h1', null, 'TRAINING ABGESCHLOSSEN'));
    inner.appendChild(h('div', { class: 'card' },
      h('div', { class: 'stat-grid' },
        h('div', { class: 'stat-box' }, h('div', { class: 'v' }, U.fmtHMS(totalSec)), h('div', { class: 'l' }, 'Dauer')),
        h('div', { class: 'stat-box' }, h('div', { class: 'v' }, String(n)), h('div', { class: 'l' }, 'Aufgaben')),
        h('div', { class: 'stat-box' }, h('div', { class: 'v' }, n ? String(correct) : '–'), h('div', { class: 'l' }, 'Richtig')),
        h('div', { class: 'stat-box' }, h('div', { class: 'v' }, n ? U.fmtPct(correct / n, 1) : 'Keine Daten'), h('div', { class: 'l' }, 'Genauigkeit')),
        h('div', { class: 'stat-box' }, h('div', { class: 'v' }, rts.length ? U.fmtSec(U.mean(rts), 2) : 'Keine Daten'), h('div', { class: 'l' }, 'Ø Reaktionszeit')))));

    if (session.levelEvents.length) {
      const card = h('div', { class: 'card' }, h('h3', null, 'Levelanpassungen'));
      session.levelEvents.forEach((ev) => card.appendChild(h('div', { class: 'result-item' }, h('span', null, ev.module), h('span', { class: 'mono' }, ev.from + ' → ' + ev.to))));
      inner.appendChild(card);
    }

    const byMod = moduleSummary(session.results);
    const modCard = h('div', { class: 'card' }, h('h3', null, 'Module heute'));
    Object.keys(byMod).forEach((id) => {
      const g = byMod[id];
      modCard.appendChild(h('div', { class: 'mod-row' }, h('span', { class: 'code' }, id), h('span', { class: 'small' }, g.n ? g.c + '/' + g.n + ' richtig' : 'Block gewertet'), h('span', { class: 'small muted' }, g.rts.length ? U.fmtSec(U.mean(g.rts), 2) : '')));
    });
    inner.appendChild(modCard);

    const errCounts = {};
    allAttempts.forEach((a) => { if (!a.correct && a.errorType) errCounts[a.errorType] = (errCounts[a.errorType] || 0) + 1; });
    const errTotal = U.sum(Object.values(errCounts));
    if (errTotal) {
      const ec = h('div', { class: 'card' }, h('h3', null, 'Was sollte trainiert werden?'));
      const top = Object.keys(errCounts).sort((a, b) => errCounts[b] - errCounts[a])[0];
      ec.appendChild(h('div', { class: 'trainer-note' }, `Bei ${Math.round((errCounts[top] / errTotal) * 100)} % deiner Fehler heute: ${top}.`));
      Object.keys(errCounts).sort((a, b) => errCounts[b] - errCounts[a]).forEach((k) => ec.appendChild(h('div', { class: 'err-row' }, h('span', null, k), h('span', { class: 'mono' }, String(errCounts[k])))));
      inner.appendChild(ec);
    }

    inner.appendChild(h('button', { type: 'button', class: 'btn primary big block', onclick: () => { el.remove(); DLR.app.navigate('home'); } }, 'Fertig'));
    inner.appendChild(h('div', { class: 'disclaimer' }, DLR.DISCLAIMER));
  }

  function simulationResult(summary) {
    const { el, inner } = overlayRoot();
    inner.appendChild(h('h1', null, 'TEST BEENDET'));
    inner.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('span', null, 'Gesamtdauer'), h('b', { class: 'mono' }, U.fmtHMS(summary.totalSec)))));

    const modCard = h('div', { class: 'card' }, h('h3', null, 'Modulübersicht'));
    summary.results.forEach((r) => {
      const s = DLR.scoring.summarize(r.attempts);
      modCard.appendChild(h('div', { class: 'mod-row' }, h('span', { class: 'code' }, r.module),
        h('span', { class: 'small' }, s.n ? 'Accuracy: ' + U.fmtPct(s.acc, 0) : 'Block gewertet'),
        h('span', { class: 'small muted' }, s.meanRt ? 'Speed: ' + U.fmtSec(s.meanRt, 2) : '')));
    });
    inner.appendChild(modCard);

    const radar = DLR.scoring.radar(30);
    const radarCard = h('div', { class: 'card' }, h('h3', null, 'Trainingsprofil'));
    if (radar.some((a) => a.value != null)) radarCard.appendChild(DLR.ui.radarChart(radar, { size: 300 }));
    else radarCard.appendChild(h('div', { class: 'empty-hint' }, 'Für ein vollständiges Profil sind mehr Trainingsdaten nötig.'));
    inner.appendChild(radarCard);

    inner.appendChild(h('div', { class: 'disclaimer' }, 'Dies ist deine persönliche Trainingsleistung – keine DLR-Bewertung und keine Aussage über das Bestehen eines echten Tests.'));
    inner.appendChild(h('button', { type: 'button', class: 'btn primary big block', onclick: () => { el.remove(); DLR.app.navigate('home'); } }, 'Fertig'));
  }

  DLR.views.trainingReport = trainingReport;
  DLR.views.simulationResult = simulationResult;
})();
