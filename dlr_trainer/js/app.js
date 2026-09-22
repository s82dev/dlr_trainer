(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  const TABS = [
    { id: 'home', ic: '🏠', label: 'Heute', view: 'dashboard' },
    { id: 'modules', ic: '🧩', label: 'Module', view: 'modules' },
    { id: 'calendar', ic: '📅', label: 'Kalender', view: 'calendar' },
    { id: 'stats', ic: '📊', label: 'Statistik', view: 'stats' },
    { id: 'exam', ic: '🧪', label: 'Exam', view: 'exam' },
    { id: 'settings', ic: '⚙️', label: 'Mehr', view: 'settings' },
  ];

  let root, current = 'home';

  function navigate(id) {
    current = id;
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    U.clear(root);
    const topbar = h('div', { class: 'topbar' },
      h('div', { class: 'brand' }, h('span', { class: 'dot' }), 'DLR TRAINER'),
      h('div', { class: 'topbar-actions' }, h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Einstellungen', onclick: () => navigate('settings') }, '⚙')));
    root.appendChild(topbar);
    const content = h('div', { id: 'view' });
    root.appendChild(content);

    const tab = TABS.find((t) => t.id === current) || TABS[0];
    DLR.views[tab.view].render(content);

    const tabbar = h('div', { class: 'tabbar' }, h('div', { class: 'tabbar-inner' }, TABS.map((t) =>
      h('button', { type: 'button', class: 'tab' + (t.id === current ? ' active' : ''), onclick: () => navigate(t.id) },
        h('span', { class: 'ic' }, t.ic), t.label))));
    root.appendChild(tabbar);
  }

  function showIntro(modId) {
    const mod = DLR.modules[modId];
    if (!mod) return;
    const overlay = h('div', { class: 'ts', style: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' } });
    const card = h('div', { class: 'card', style: { maxWidth: '420px', width: '100%' } },
      h('h2', null, modId + ' · ' + mod.name),
      h('p', { class: 'small muted' }, mod.desc),
      h('ul', { class: 'intro-list' }, mod.intro.how.map((t) => h('li', null, t))),
      h('div', { class: 'small faint', style: { marginTop: '8px' } }, 'Steuerung: ' + mod.intro.keys),
      h('div', { class: 'row', style: { marginTop: '16px', gap: '8px' } },
        h('button', { type: 'button', class: 'btn ghost', style: { flex: 1 }, onclick: () => overlay.remove() }, 'Schließen'),
        h('button', { type: 'button', class: 'btn primary', style: { flex: 1 }, onclick: () => { overlay.remove(); startSingle(modId, 300); } }, 'Starten')));
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function startTraining(plan) {
    DLR.audio.unlock();
    DLR.session.runTraining(plan, {
      onDone: (session) => DLR.views.trainingReport(session, plan),
    });
  }

  function startSingle(modId, seconds) {
    DLR.audio.unlock();
    const plan = { slots: [{ id: modId, sec: seconds }] };
    DLR.session.runTraining(plan, { onDone: (session) => DLR.views.trainingReport(session, plan) });
  }

  function startExam(order, secondsPerModule) {
    DLR.audio.unlock();
    DLR.session.runExam(order, secondsPerModule, { onDone: (summary) => DLR.views.simulationResult(summary) });
  }

  function boot() {
    root = document.getElementById('app');
    DLR.views.settings.applyTheme();
    DLR.progress.init().then(() => {
      if (!DLR.store.state.settings.onboarded) { current = 'onboarding'; U.clear(root); DLR.views.onboarding.render(root); return; }
      DLR.training.ensureStart();
      render();
    });
  }

  DLR.app = { navigate, showIntro, startTraining, startSingle, startExam, boot };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
