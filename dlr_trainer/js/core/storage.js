/* Persistenter Zustand. Rohantworten liegen in IndexedDB (data/user-progress.js),
   Tagesaggregate, Level, Wiederholungsplan und Einstellungen hier in localStorage. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const KEY = 'dlr_trainer_state_v2';
  let state = null;
  let saveTimer = null;
  const memoryFallback = {};

  function lsGet() { try { return window.localStorage.getItem(KEY); } catch (e) { return memoryFallback[KEY] || null; } }
  function lsSet(v) { try { window.localStorage.setItem(KEY, v); } catch (e) { memoryFallback[KEY] = v; } }
  function lsDel() { try { window.localStorage.removeItem(KEY); } catch (e) { delete memoryFallback[KEY]; } }

  function defaults() {
    return {
      v: 2,
      created: Date.now(),
      settings: {
        startDate: null,
        testDate: null,
        onboarded: false,
        audio: true,
        volume: 0.6,
        speakNumbers: false,
        listeningTts: true,
        theme: 'system',
        capByPhase: true,
        reduceMotion: false,
        examOrder: ['ENS', 'TVT', 'PHY', 'KRN', 'RMS', 'OWT', 'VMC', 'SKT', 'WFG', 'PPT', 'MIC', 'PMT'],
        examPreset: 'kompakt',
        examSec: {},
      },
      modules: {},
      days: {},
      plans: {},
      sr: { items: [] },
      sessions: [],
      simulations: [],
      seenIntro: {},
    };
  }

  function merge(base, over) {
    for (const k in over) {
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], over[k]);
      else base[k] = over[k];
    }
    return base;
  }

  const store = (DLR.store = {
    get state() { return state; },
    load() {
      state = defaults();
      const raw = lsGet();
      if (raw) { try { merge(state, JSON.parse(raw)); } catch (e) { /* defekter Speicher -> Standard */ } }
      return state;
    },
    save() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(store.saveNow, 250);
    },
    saveNow() {
      clearTimeout(saveTimer);
      if (!state) return;
      // Sessions begrenzen (Rohdaten stehen in IndexedDB bzw. den Tagesaggregaten)
      if (state.sessions.length > 600) state.sessions = state.sessions.slice(-600);
      lsSet(JSON.stringify(state));
    },
    reset() { clearTimeout(saveTimer); lsDel(); state = defaults(); },
    exportState() { return JSON.stringify(state); },
    importState(json) {
      const obj = typeof json === 'string' ? JSON.parse(json) : json;
      if (!obj || typeof obj !== 'object' || !obj.settings) throw new Error('Ungültige Sicherungsdatei');
      state = merge(defaults(), obj);
      store.saveNow();
    },
    todayKey() { return DLR.util.dayKey(new Date()); },
  });

  window.addEventListener('beforeunload', () => store.saveNow());
  document.addEventListener('visibilitychange', () => { if (document.hidden) store.saveNow(); });
  store.load();
})();
