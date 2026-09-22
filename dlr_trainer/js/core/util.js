/* ==========================================================================
   DLR Trainer – Basis-Utilities
   Eigene Trainingssimulation. Keine Verbindung zum DLR, keine Originalaufgaben.
   ========================================================================== */
(function () {
  'use strict';
  const DLR = (window.DLR = window.DLR || {});
  DLR.modules = {};
  DLR.moduleOrder = [];
  DLR.core = {};
  DLR.data = {};
  DLR.gen = {};
  DLR.ui = {};
  DLR.views = {};
  const U = (DLR.util = {});

  /* ---------- Zufall (seedbar, damit Aufgaben reproduzierbar sind) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  U.makeRng = function (seed) {
    seed = seed >>> 0 || 1;
    const f = mulberry32(seed);
    const r = {
      seed,
      next: f,
      int(a, b) { return a + Math.floor(f() * (b - a + 1)); },
      float(a, b) { return a + f() * (b - a); },
      pick(arr) { return arr[Math.floor(f() * arr.length)]; },
      chance(p) { return f() < p; },
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
      },
      sample(arr, n) { return r.shuffle(arr).slice(0, n); },
      sign() { return f() < 0.5 ? -1 : 1; },
    };
    return r;
  };
  U.newSeed = function () { return (Math.random() * 4294967296) >>> 0 || 1; };
  U.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  U.rand = function (a, b) { return a + Math.random() * (b - a); };
  U.randInt = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  U.hashStr = function (s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  U.uid = function () { return Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); };

  /* ---------- Mathe / Statistik ---------- */
  U.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.sum = (arr) => arr.reduce((s, v) => s + v, 0);
  U.mean = (arr) => (arr.length ? U.sum(arr) / arr.length : null);
  U.median = (arr) => {
    if (!arr.length) return null;
    const s = arr.slice().sort((a, b) => a - b), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  U.stdev = (arr) => {
    if (arr.length < 2) return 0;
    const m = U.mean(arr);
    return Math.sqrt(U.sum(arr.map((v) => (v - m) * (v - m))) / (arr.length - 1));
  };
  U.round = (v, d = 0) => { const p = Math.pow(10, d); return Math.round(v * p) / p; };
  U.gcd = (a, b) => (b ? U.gcd(b, a % b) : Math.abs(a));
  U.deg2rad = (d) => (d * Math.PI) / 180;
  U.normDeg = (d) => ((d % 360) + 360) % 360;

  /* ---------- Formatierung ---------- */
  U.pad2 = (n) => String(Math.floor(n)).padStart(2, '0');
  U.fmtClock = (sec) => { sec = Math.max(0, Math.round(sec)); return U.pad2(sec / 60) + ':' + U.pad2(sec % 60); };
  U.fmtHMS = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${U.pad2(m)}:${U.pad2(s)}` : `${U.pad2(m)}:${U.pad2(s)}`;
  };
  U.fmtNum = (n, dec = 1) => (n == null || isNaN(n) ? '–' : Number(n).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: dec }));
  U.fmtPct = (v, dec = 0) => (v == null || isNaN(v) ? 'Keine Daten' : U.fmtNum(v * 100, dec) + ' %');
  U.fmtSec = (v, dec = 2) => (v == null || isNaN(v) ? 'Keine Daten' : U.fmtNum(v, dec) + ' s');
  U.parseNumber = (str) => {
    if (typeof str === 'number') return str;
    const s = String(str).trim().replace(/\s+/g, '').replace(',', '.');
    if (!/^[-+−]?\d*\.?\d+$/.test(s)) return NaN;
    return parseFloat(s.replace('−', '-'));
  };

  /* ---------- Datum (lokal, als 'YYYY-MM-DD') ---------- */
  U.dayKey = (d) => {
    d = d || new Date();
    return d.getFullYear() + '-' + U.pad2(d.getMonth() + 1) + '-' + U.pad2(d.getDate());
  };
  U.parseKey = (key) => { const p = key.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12, 0, 0); };
  U.addDays = (key, n) => { const d = U.parseKey(key); d.setDate(d.getDate() + n); return U.dayKey(d); };
  U.diffDays = (a, b) => Math.round((U.parseKey(b) - U.parseKey(a)) / 86400000);
  U.fmtDate = (key) => { if (!key) return '–'; const p = key.split('-'); return `${p[2]}.${p[1]}.${p[0]}`; };
  U.weekdayShort = (key) => ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][U.parseKey(key).getDay()];
  U.parseDeDate = (str) => {
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(str).trim());
    if (!m) return null;
    return m[3] + '-' + U.pad2(+m[2]) + '-' + U.pad2(+m[1]);
  };

  /* ---------- DOM ---------- */
  U.h = function (tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'value') el.value = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (let i = 2; i < arguments.length; i++) U._append(el, arguments[i]);
    return el;
  };
  U._append = function (el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach((x) => U._append(el, x));
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  };
  const SVGNS = 'http://www.w3.org/2000/svg';
  U.svg = function (tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) { if (attrs[k] != null) el.setAttribute(k, attrs[k]); }
    for (let i = 2; i < arguments.length; i++) U._append(el, arguments[i]);
    return el;
  };
  U.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  U.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Gerät ---------- */
  U.device = function () {
    const touch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
    const w = window.innerWidth || 1024;
    return { touch, width: w, small: w < 900, desktop: !touch && w >= 900, mobile: touch && w < 700 };
  };

  /* ---------- Modul-Registrierung ---------- */
  DLR.registerModule = function (def) {
    DLR.modules[def.id] = def;
    if (DLR.moduleOrder.indexOf(def.id) < 0) DLR.moduleOrder.push(def.id);
  };
  DLR.MODULE_IDS = ['KRN', 'RMS', 'VMC', 'OWT', 'SKT', 'PPT', 'WFG', 'TVT', 'PHY', 'ENS', 'MIC', 'PMT', 'MTF'];
  DLR.ERROR_TYPES = ['zu langsam', 'falsche Regel', 'Rechenfehler', 'Gedächtnisfehler', 'Wahrnehmungsfehler', 'Reaktionsfehler', 'Ablenkung', 'Überlastung', 'technische Fehlinterpretation'];
  DLR.RADAR_AXES = ['Mathematik', 'Gedächtnis', 'Konzentration', 'Technik', 'Raum', 'Reaktion', 'Multitasking', 'Geschwindigkeit'];
  DLR.DISCLAIMER = 'Eigene Trainingssimulation. Keine Verbindung zum DLR, keine Original-Aufgaben, keine offiziellen Grenzwerte.';
})();
