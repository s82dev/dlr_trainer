(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  function render(root) {
    U.clear(root);
    const st = DLR.store.state.settings;
    const wrap = h('div', { class: 'onb-step' });
    wrap.appendChild(h('h1', null, 'DLR-Trainer'));
    wrap.appendChild(h('p', { class: 'muted' }, 'Eine 4-Jahres-Trainingsplattform (1.460 Tage, täglich 30 Minuten) für Genauigkeit, Geschwindigkeit, Gedächtnis, Konzentration, räumliches Denken, Technik, Englisch und Multitasking.'));
    wrap.appendChild(h('ul', { class: 'intro-list', style: { textAlign: 'left', maxWidth: '380px', margin: '0 auto' } },
      h('li', null, '13 Trainingsmodule mit je 10 Leveln'),
      h('li', null, 'Adaptive Schwierigkeit aus echten Ergebnissen'),
      h('li', null, 'Spaced Repetition für falsch gelöste Aufgaben'),
      h('li', null, 'Exam Mode: vollständige Simulation ohne Hinweise')));

    const startInput = h('input', { type: 'date', class: 'mono', value: U.dayKey() });
    wrap.appendChild(h('div', { class: 'field', style: { maxWidth: '260px', margin: '16px auto' } }, h('label', null, 'Startdatum deines Plans'), startInput));

    wrap.appendChild(h('button', {
      type: 'button', class: 'btn primary big block', style: { maxWidth: '320px', margin: '10px auto 0' },
      onclick: () => {
        st.startDate = startInput.value || U.dayKey();
        st.onboarded = true;
        DLR.store.saveNow();
        DLR.app.navigate('home');
      },
    }, 'Training beginnen'));
    wrap.appendChild(h('div', { class: 'disclaimer', style: { maxWidth: '380px', margin: '16px auto 0' } }, DLR.DISCLAIMER));
    root.appendChild(wrap);
  }

  DLR.views.onboarding = { render };
})();
