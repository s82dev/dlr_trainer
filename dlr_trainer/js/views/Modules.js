(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  function render(root) {
    U.clear(root);
    root.appendChild(h('h1', null, 'Module'));
    DLR.MODULE_IDS.forEach((id) => {
      const mod = DLR.modules[id];
      if (!mod) return;
      const m = DLR.scoring.moduleScore(id, 30);
      const lvl = DLR.adaptive.level(id);
      const due = DLR.sr.dueCount(id);
      const card = h('div', { class: 'card' },
        h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, id + ' · ' + mod.name), h('span', { class: 'mono small muted' }, 'Level ' + lvl + '/10')),
        h('div', { class: 'small muted', style: { marginTop: '6px' } }, mod.desc),
        h('div', { class: 'row', style: { marginTop: '10px' } },
          h('span', { class: 'small' }, m.n >= DLR.scoring.MIN_N ? 'Genauigkeit ' + U.fmtPct(m.acc, 0) + ' · ' + m.n + ' Aufgaben (30 Tage)' : 'Noch keine ausreichenden Daten'),
          due ? h('span', { class: 'chip' }, due + ' fällig') : null),
        h('div', { class: 'row', style: { marginTop: '10px', gap: '8px' } },
          h('button', { type: 'button', class: 'btn primary', style: { flex: 1 }, onclick: () => DLR.app.startSingle(id, 300) }, 'Trainieren (5 Min)'),
          h('button', { type: 'button', class: 'btn ghost', onclick: () => DLR.app.showIntro(id) }, 'Anleitung')));
      root.appendChild(card);
    });
  }

  DLR.views.modules = { render };
})();
