(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  function fmtMin(sec) { return U.fmtNum(sec / 60, sec % 60 === 0 ? 0 : 1); }

  function render(root) {
    U.clear(root);
    DLR.training.ensureStart();
    const today = U.dayKey();
    const dayIdx = DLR.training.dayIndex(today);
    const phase = DLR.training.phaseOf(dayIdx);
    const fp = DLR.training.finalPhase(today);
    const streak = DLR.training.streak(today);
    const day = DLR.store.state.days[today];
    const doneSec = (day && day.sec) || 0;
    const plan = DLR.training.buildDayPlan(today, DLR.training.DAY_MIN);
    const dueCount = DLR.sr.counts(today).due;

    const hero = h('div', { class: 'day-hero' },
      h('div', { class: 'row' },
        h('div', null, h('div', { class: 'day-num' }, 'TAG ' + dayIdx + ' / ' + DLR.training.TOTAL_DAYS), h('div', { class: 'day-phase' }, phase.name + ' · Jahr ' + phase.year)),
        h('div', { class: 'streak-badge' }, '🔥 ' + streak.current)),
      h('div', { class: 'day-sub' }, phase.seg + (fp ? ' · ' + fp.label : '')));
    root.appendChild(hero);

    if (fp) root.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', null, fp.label), h('span', { class: 'faint small' }, fp.daysLeft + ' Tage bis Testdatum')), h('div', { class: 'small muted', style: { marginTop: '6px' } }, fp.hint)));

    const notes = DLR.aiTrainer.notes(3);
    const trainerCard = h('div', { class: 'card' }, h('h3', null, 'KI-Trainer'));
    notes.forEach((n) => trainerCard.appendChild(h('div', { class: 'trainer-note' }, n.text)));
    root.appendChild(trainerCard);

    const planCard = h('div', { class: 'card' });
    planCard.appendChild(h('h3', null, 'Heute · ' + U.fmtNum(plan.totalMinutes, 0) + ' Minuten'));
    const list = h('div', { class: 'plan-list' });
    plan.slots.forEach((s) => {
      const mod = DLR.modules[s.id];
      list.appendChild(h('div', { class: 'plan-item' }, h('span', { class: 'code' }, s.id), h('span', { class: 'name' }, mod ? mod.name : s.id), h('span', { class: 'min' }, fmtMin(s.sec))));
    });
    planCard.appendChild(list);
    planCard.appendChild(h('div', { class: 'plan-total' }, h('span', null, 'Bereits trainiert heute'), h('span', { class: 'mono' }, fmtMin(doneSec))));
    if (dueCount > 0) planCard.appendChild(h('div', { class: 'small faint', style: { marginTop: '6px' } }, dueCount + ' Wiederholungen aus dem Spaced-Repetition-Plan sind enthalten.'));
    planCard.appendChild(h('button', {
      type: 'button', class: 'btn primary big block', style: { marginTop: '14px' },
      onclick: () => DLR.app.startTraining(plan),
    }, doneSec > 0 ? 'TRAINING FORTSETZEN' : 'TRAINING STARTEN'));
    root.appendChild(planCard);

    const countdown = DLR.store.state.settings.testDate;
    if (countdown) {
      const left = U.diffDays(today, countdown);
      root.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('span', null, 'Testdatum ' + U.fmtDate(countdown)), h('b', { class: 'mono' }, left >= 0 ? 'noch ' + left + ' Tage' : 'überschritten'))));
    }

    root.appendChild(h('button', { type: 'button', class: 'btn ghost block', onclick: () => DLR.app.navigate('exam') }, 'Vollständige Simulation starten (Exam Mode)'));
    root.appendChild(h('div', { class: 'disclaimer' }, DLR.DISCLAIMER));
  }

  DLR.views.dashboard = { render };
})();
