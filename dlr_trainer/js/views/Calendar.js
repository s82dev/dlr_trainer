(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  function render(root) {
    U.clear(root);
    root.appendChild(h('h1', null, '1.460-Tage-Kalender'));
    const start = DLR.training.startKey(), end = DLR.training.endKey(), today = U.dayKey();
    const frac = DLR.training.progressFrac();
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' }, h('span', null, 'Start: ' + U.fmtDate(start)), h('span', null, 'Ende: ' + U.fmtDate(end))),
      h('div', { class: 'pb', style: { marginTop: '10px', borderRadius: '4px' } }, h('div', { class: 'pb-fill', style: { width: (frac * 100) + '%' } })),
      h('div', { class: 'small muted', style: { marginTop: '6px' } }, 'Tag ' + DLR.training.dayIndex() + ' von ' + DLR.training.TOTAL_DAYS + ' · noch ' + DLR.training.daysLeft() + ' Tage')));

    for (let y = 1; y <= 4; y++) {
      const ys = U.addDays(start, (y - 1) * 365), ye = U.addDays(start, Math.min(DLR.training.TOTAL_DAYS, y * 365) - 1);
      if (ys > today && y > 1 && U.diffDays(today, ys) > 0) { /* trotzdem anzeigen, nur leer */ }
      root.appendChild(h('div', { class: 'card' }, h('h3', null, 'Jahr ' + y), DLR.ui.heatmap(ys, ye)));
    }

    const testDate = DLR.store.state.settings.testDate;
    const card = h('div', { class: 'card' }, h('h3', null, 'Testtag-Countdown'));
    if (testDate) {
      const left = U.diffDays(today, testDate);
      card.appendChild(h('div', { class: 'row' }, h('span', null, U.fmtDate(testDate)), h('b', { class: 'mono' }, left >= 0 ? left + ' Tage' : 'überschritten')));
      card.appendChild(h('button', { type: 'button', class: 'btn ghost', style: { marginTop: '10px' }, onclick: () => { DLR.store.state.settings.testDate = null; DLR.store.saveNow(); render(root); } }, 'Testdatum entfernen'));
    } else {
      const input = h('input', { type: 'date', class: 'mono' });
      card.appendChild(h('div', { class: 'field' }, h('label', null, 'Optionales Testdatum'), input));
      card.appendChild(h('button', { type: 'button', class: 'btn primary', onclick: () => { if (input.value) { DLR.store.state.settings.testDate = input.value; DLR.store.saveNow(); render(root); } } }, 'Speichern'));
    }
    root.appendChild(card);
  }

  DLR.views.calendar = { render };
})();
