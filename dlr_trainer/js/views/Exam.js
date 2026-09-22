(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;
  const PRESETS = {
    kompakt: { label: 'Kompakt (~24 Min)', sec: 120 },
    standard: { label: 'Standard (~48 Min)', sec: 240 },
    lang: { label: 'Ausführlich (~72 Min)', sec: 360 },
  };

  function render(root) {
    U.clear(root);
    root.appendChild(h('h1', null, 'Exam Mode'));
    const st = DLR.store.state.settings;
    const order = st.examOrder.filter((id) => DLR.modules[id]);
    root.appendChild(h('div', { class: 'card exam-intro' },
      h('p', { class: 'small muted' }, 'Keine Hinweise, keine Erklärungen, keine Pausen zwischen Modulen, kein sofortiges Feedback. Das Ergebnis erscheint erst am Ende.'),
      h('ul', { class: 'exam-list' }, order.map((id) => h('li', null, id)))));

    const presetSel = h('div', { class: 'card' }, h('h3', null, 'Dauer je Modul'));
    const row = h('div', { class: 'stack' });
    Object.keys(PRESETS).forEach((k) => {
      row.appendChild(h('label', { class: 'toggle-row' },
        h('span', null, PRESETS[k].label),
        h('input', { type: 'radio', name: 'preset', checked: st.examPreset === k, onchange: () => { st.examPreset = k; DLR.store.saveNow(); } })));
    });
    presetSel.appendChild(row);
    root.appendChild(presetSel);

    root.appendChild(h('button', {
      type: 'button', class: 'btn primary big block',
      onclick: () => DLR.app.startExam(order, PRESETS[st.examPreset || 'kompakt'].sec),
    }, 'SIMULATION STARTEN'));
    root.appendChild(h('div', { class: 'disclaimer' }, 'Trainingssimulation. ' + DLR.DISCLAIMER));
  }

  DLR.views.exam = { render, PRESETS };
})();
