/* TestScreen – die eigentliche Testansicht.
   OBEN: Modul · Aufgabe · Timer. MITTE: große Aufgabe. Keine Sidebar, kein Dashboard, keine Ablenkung. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;

  class TestScreen {
    constructor(opts) {
      opts = opts || {};
      this.exam = !!opts.exam;
      this.timer = new DLR.ui.TimerDisplay();
      this.progress = new DLR.ui.ProgressBar('ts-progress');
      this.codeEl = U.h('span', { class: 'ts-code' }, '');
      this.metaEl = U.h('span', { class: 'ts-meta' }, '');
      this.taskEl = U.h('span', { class: 'ts-task' }, '');
      this.body = U.h('div', { class: 'ts-body', tabindex: '-1' });
      this.overlay = null;
      this.root = U.h('div', { class: 'ts ' + (this.exam ? 'ts-exam' : 'ts-training'), role: 'dialog', 'aria-label': 'Testansicht' },
        U.h('div', { class: 'ts-top' },
          U.h('div', { class: 'ts-left' }, this.codeEl, this.metaEl),
          U.h('div', { class: 'ts-center' }, this.taskEl),
          U.h('div', { class: 'ts-right' }, this.timer.el)),
        this.progress.el,
        this.body);
      document.body.appendChild(this.root);
      document.body.classList.add('in-test');
    }
    setModule(code, meta) { this.codeEl.textContent = code; this.metaEl.textContent = meta || ''; }
    setTask(n, total) {
      this.taskEl.textContent = n > 0 ? 'Aufgabe ' + U.pad2(n) + (total ? ' / ' + total : '') : '';
    }
    setTime(sec) { this.timer.set(sec); }
    setProgress(f) { this.progress.set(f); }
    clearBody() { U.clear(this.body); this.body.className = 'ts-body'; }
    showCenter(node) { this.clearBody(); this.body.appendChild(U.h('div', { class: 'ts-center-card' }, node)); }
    flash(ok) {
      this.body.classList.remove('flash-ok', 'flash-bad');
      void this.body.offsetWidth;
      this.body.classList.add(ok ? 'flash-ok' : 'flash-bad');
    }
    destroy() {
      if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
      document.body.classList.remove('in-test');
    }
  }

  DLR.ui.TestScreen = TestScreen;
})();
