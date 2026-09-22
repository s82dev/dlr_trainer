(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const h = U.h;

  function toggle(label, checked, onchange) {
    return h('div', { class: 'toggle-row' }, h('span', null, label),
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked, onchange: (e) => onchange(e.target.checked) }), h('span', { class: 'track' })));
  }

  function render(root) {
    U.clear(root);
    root.appendChild(h('h1', null, 'Einstellungen'));
    const st = DLR.store.state.settings;

    const audioCard = h('div', { class: 'card' }, h('h3', null, 'Audio'));
    audioCard.appendChild(toggle('Ton & Sprachausgabe aktiv', st.audio, (v) => { st.audio = v; DLR.store.saveNow(); }));
    audioCard.appendChild(toggle('Zahlen bei Kopfrechnen vorlesen', st.speakNumbers, (v) => { st.speakNumbers = v; DLR.store.saveNow(); }));
    audioCard.appendChild(toggle('Listening-Modus (ENS) per Sprachausgabe', st.listeningTts !== false, (v) => { st.listeningTts = v; DLR.store.saveNow(); }));
    const vol = h('input', { type: 'range', min: 0, max: 100, value: Math.round(st.volume * 100), oninput: (e) => { DLR.audio.setVolume(e.target.value / 100); DLR.store.save(); } });
    audioCard.appendChild(h('div', { class: 'field' }, h('label', null, 'Lautstärke'), vol));
    root.appendChild(audioCard);

    const themeCard = h('div', { class: 'card' }, h('h3', null, 'Darstellung'));
    const sel = h('select', { onchange: (e) => { st.theme = e.target.value; applyTheme(); DLR.store.saveNow(); } },
      h('option', { value: 'system', selected: st.theme === 'system' }, 'System'),
      h('option', { value: 'dark', selected: st.theme === 'dark' }, 'Dunkel'),
      h('option', { value: 'light', selected: st.theme === 'light' }, 'Hell'));
    themeCard.appendChild(h('div', { class: 'field' }, h('label', null, 'Theme'), sel));
    root.appendChild(themeCard);

    const trainCard = h('div', { class: 'card' }, h('h3', null, 'Training'));
    trainCard.appendChild(toggle('Level durch Curriculum-Phase begrenzen', st.capByPhase, (v) => { st.capByPhase = v; DLR.store.saveNow(); }));
    const startInput = h('input', { type: 'date', class: 'mono', value: st.startDate || '' });
    trainCard.appendChild(h('div', { class: 'field' }, h('label', null, 'Startdatum des 4-Jahres-Plans'), startInput,
      h('button', { type: 'button', class: 'btn ghost small', style: { alignSelf: 'flex-start' }, onclick: () => { if (startInput.value) { st.startDate = startInput.value; DLR.store.saveNow(); DLR.app.navigate('home'); } } }, 'Startdatum setzen')));
    root.appendChild(trainCard);

    const dataCard = h('div', { class: 'card' }, h('h3', null, 'Daten'));
    dataCard.appendChild(h('button', { type: 'button', class: 'btn ghost block', onclick: exportData }, 'Sicherung exportieren (JSON)'));
    const fileInput = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onchange: importData });
    dataCard.appendChild(h('button', { type: 'button', class: 'btn ghost block', style: { marginTop: '8px' }, onclick: () => fileInput.click() }, 'Sicherung importieren'));
    dataCard.appendChild(fileInput);
    dataCard.appendChild(h('button', { type: 'button', class: 'btn danger block', style: { marginTop: '8px' }, onclick: resetAll }, 'Alle Daten zurücksetzen'));
    root.appendChild(dataCard);

    root.appendChild(h('div', { class: 'card' }, h('h3', null, 'Über'), h('div', { class: 'small muted' }, DLR.DISCLAIMER)));
  }

  function applyTheme() {
    const t = DLR.store.state.settings.theme;
    document.documentElement.setAttribute('data-theme', t === 'system' ? '' : t);
  }

  async function exportData() {
    const state = JSON.parse(DLR.store.exportState());
    const attempts = await DLR.progress.exportAll();
    const blob = new Blob([JSON.stringify({ state, attempts, exportedAt: new Date().toISOString() }, null, 0)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dlr-trainer-backup-' + U.dayKey() + '.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  function importData(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.state) DLR.store.importState(data.state);
        if (data.attempts) await DLR.progress.importAll(data.attempts);
        alert('Sicherung importiert.');
        DLR.app.navigate('settings');
      } catch (err) { alert('Import fehlgeschlagen: Datei ungültig.'); }
    };
    reader.readAsText(file);
  }
  function resetAll() {
    if (!confirm('Wirklich alle Trainingsdaten unwiderruflich löschen?')) return;
    DLR.store.reset();
    DLR.progress.clearAll().then(() => { DLR.app.navigate('home'); location.reload(); });
  }

  DLR.views.settings = { render, applyTheme };
})();
