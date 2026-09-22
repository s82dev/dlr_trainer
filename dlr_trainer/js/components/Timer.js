/* Kleine UI-Bausteine: Timer-Anzeige und Fortschrittsbalken. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;

  class TimerDisplay {
    constructor(cls) { this.el = U.h('span', { class: 'ts-timer ' + (cls || ''), 'aria-live': 'off' }, '00:00'); }
    set(sec) {
      const t = U.fmtClock(Math.ceil(sec));
      if (this.el.textContent !== t) this.el.textContent = t;
      this.el.classList.toggle('low', sec <= 10);
    }
  }

  class ProgressBar {
    constructor(cls) {
      this.fill = U.h('div', { class: 'pb-fill' });
      this.el = U.h('div', { class: 'pb ' + (cls || ''), role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 }, this.fill);
    }
    set(frac) {
      const p = U.clamp(frac, 0, 1) * 100;
      this.fill.style.width = p.toFixed(1) + '%';
      this.el.setAttribute('aria-valuenow', Math.round(p));
    }
  }

  DLR.ui.TimerDisplay = TimerDisplay;
  DLR.ui.ProgressBar = ProgressBar;
})();
