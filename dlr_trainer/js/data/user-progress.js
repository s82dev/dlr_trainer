/* Speichert jede einzelne Antwort (IndexedDB, Fallback: nur Arbeitsspeicher) und
   führt daneben kompakte Tagesaggregate, aus denen alle Langzeitstatistiken berechnet werden.
   Rohdaten älter als 400 Tage werden aus IndexedDB entfernt – die Aggregate bleiben. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const RECENT_DAYS = 60, KEEP_DAYS = 400;
  let db = null;
  let recent = [];
  let queue = [];
  let flushTimer = null;
  let persistent = false;

  function newAgg() { return { n: 0, c: 0, rt: 0, rtn: 0, rt2: 0, rtMin: null, spd: 0, spdn: 0, diff: 0, lv: 0, err: {}, mb: [] }; }

  function openDb() {
    return new Promise((resolve) => {
      try {
        if (!window.indexedDB) { resolve(null); return; }
        const req = indexedDB.open('dlr_trainer', 1);
        req.onupgradeneeded = (e) => {
          const d = e.target.result;
          const st = d.createObjectStore('attempts', { autoIncrement: true });
          st.createIndex('ts', 'ts');
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }

  function flush() {
    clearTimeout(flushTimer); flushTimer = null;
    if (!db || !queue.length) return;
    const batch = queue; queue = [];
    try {
      const tx = db.transaction('attempts', 'readwrite');
      const st = tx.objectStore('attempts');
      batch.forEach((a) => st.add(a));
    } catch (e) { /* Speicherfehler: Aggregate bleiben erhalten */ }
  }

  const progress = (DLR.progress = {
    newAgg,
    get persistent() { return persistent; },

    init() {
      return openDb().then((d) => {
        db = d; persistent = !!d;
        if (!db) return;
        return new Promise((resolve) => {
          try {
            const cut = Date.now() - RECENT_DAYS * 86400000;
            const tx = db.transaction('attempts', 'readwrite');
            const st = tx.objectStore('attempts');
            const idx = st.index('ts');
            idx.openCursor(IDBKeyRange.lowerBound(cut)).onsuccess = (e) => {
              const cur = e.target.result;
              if (cur) { recent.push(cur.value); cur.continue(); }
            };
            const old = Date.now() - KEEP_DAYS * 86400000;
            idx.openCursor(IDBKeyRange.upperBound(old)).onsuccess = (e) => {
              const cur = e.target.result;
              if (cur) { cur.delete(); cur.continue(); }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
            tx.onabort = () => resolve();
          } catch (e) { resolve(); }
        });
      });
    },

    /** Eine Antwort protokollieren (Rohdaten + Aggregat). */
    record(a) {
      const S = DLR.store.state;
      a.ts = a.ts || Date.now();
      if (a.responseTime != null && !isFinite(a.responseTime)) a.responseTime = null;
      recent.push(a);
      queue.push(a);
      if (!flushTimer) flushTimer = setTimeout(flush, 1200);

      const dk = U.dayKey(new Date(a.ts));
      const day = S.days[dk] || (S.days[dk] = { sec: 0, sessions: 0, mods: {}, sims: 0 });
      const g = day.mods[a.module] || (day.mods[a.module] = newAgg());
      g.n++;
      if (a.correct) g.c++; else { const t = a.errorType || 'Reaktionsfehler'; g.err[t] = (g.err[t] || 0) + 1; }
      const rt = a.responseTime;
      if (rt != null && rt >= 0) {
        g.rt += rt; g.rtn++; g.rt2 += rt * rt;
        if (g.rtMin == null || rt < g.rtMin) g.rtMin = rt;
        if (a.target > 0) { g.spd += Math.min(1, a.target / Math.max(rt, 0.05)); g.spdn++; }
      }
      g.diff += a.difficulty != null ? a.difficulty : a.level;
      g.lv += a.level;
      const mi = Math.min(a.minute || 0, 14);
      const b = g.mb[mi] || (g.mb[mi] = [0, 0]);
      b[0]++; if (a.correct) b[1]++;
      for (let i = 0; i < g.mb.length; i++) if (!g.mb[i]) g.mb[i] = [0, 0];
      DLR.store.save();
    },

    addSeconds(dk, sec) {
      const S = DLR.store.state;
      const day = S.days[dk] || (S.days[dk] = { sec: 0, sessions: 0, mods: {}, sims: 0 });
      day.sec += sec;
      DLR.store.save();
    },
    addSession(dk) {
      const S = DLR.store.state;
      const day = S.days[dk] || (S.days[dk] = { sec: 0, sessions: 0, mods: {}, sims: 0 });
      day.sessions++;
    },

    recent(filter) {
      filter = filter || {};
      return recent.filter((a) =>
        (!filter.module || a.module === filter.module) &&
        (!filter.sessionId || a.sessionId === filter.sessionId) &&
        (!filter.since || a.ts >= filter.since) &&
        (!filter.mode || a.mode === filter.mode));
    },
    count() { return recent.length; },

    exportAll() {
      flush();
      return new Promise((resolve) => {
        if (!db) { resolve(recent.slice()); return; }
        try {
          const out = [];
          db.transaction('attempts').objectStore('attempts').openCursor().onsuccess = (e) => {
            const cur = e.target.result;
            if (cur) { out.push(cur.value); cur.continue(); } else resolve(out);
          };
        } catch (e) { resolve(recent.slice()); }
      });
    },
    importAll(list) {
      recent = list.filter((a) => a.ts >= Date.now() - RECENT_DAYS * 86400000);
      return new Promise((resolve) => {
        if (!db) { resolve(); return; }
        try {
          const tx = db.transaction('attempts', 'readwrite');
          const st = tx.objectStore('attempts');
          st.clear();
          list.forEach((a) => st.add(a));
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch (e) { resolve(); }
      });
    },
    clearAll() {
      recent = []; queue = [];
      return new Promise((resolve) => {
        if (!db) { resolve(); return; }
        try {
          const tx = db.transaction('attempts', 'readwrite');
          tx.objectStore('attempts').clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch (e) { resolve(); }
      });
    },
    flush,
  });
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
})();
