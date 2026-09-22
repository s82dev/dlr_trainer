(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  /** Zeichnet eine Heatmap von startKey bis endKey (oder heute, falls früher). */
  function heatmap(startKey, endKey, opts) {
    opts = opts || {};
    const today = U.dayKey();
    const lastDay = endKey < today ? endKey : today;
    const days = DLR.store.state.days;
    // Auf Wochenbeginn (Montag) ausrichten, damit Zeilen = Wochentage stimmen
    const firstDow = U.parseKey(startKey).getDay();
    const mondayOffset = (firstDow + 6) % 7;
    const gridStart = U.addDays(startKey, -mondayOffset);
    const totalDays = U.diffDays(gridStart, lastDay) + 1;
    const wrap = h('div', { class: 'heatmap-wrap' });
    const grid = h('div', { class: 'heatmap' });
    let k = gridStart;
    for (let i = 0; i < totalDays; i++) {
      const sec = (days[k] && days[k].sec) || 0;
      const min = sec / 60;
      let lvl = 0;
      if (k > lastDay || k < startKey) lvl = -1;
      else if (min >= 30) lvl = 4;
      else if (min >= 15) lvl = 3;
      else if (min > 0) lvl = 2;
      const cell = h('div', { class: 'hm-cell', title: U.fmtDate(k) + ': ' + Math.round(min) + ' min' });
      if (lvl >= 0) cell.setAttribute('data-lvl', String(lvl));
      else cell.style.visibility = 'hidden';
      grid.appendChild(cell);
      k = U.addDays(k, 1);
    }
    wrap.appendChild(grid);
    const legend = h('div', { class: 'hm-legend' }, 'Weniger',
      h('div', { class: 'hm-cell', 'data-lvl': '0' }), h('div', { class: 'hm-cell', 'data-lvl': '2' }), h('div', { class: 'hm-cell', 'data-lvl': '3' }), h('div', { class: 'hm-cell', 'data-lvl': '4' }), 'Mehr');
    const box = h('div', null, wrap, legend);
    return box;
  }

  DLR.ui.heatmap = heatmap;
})();
