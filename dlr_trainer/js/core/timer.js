/* Präziser, pausierbarer Countdown (performance.now statt Intervall-Zählung). */
(function () {
  'use strict';
  const DLR = window.DLR;
  const now = () => (window.performance && performance.now ? performance.now() : Date.now());

  class CountdownTimer {
    constructor(totalMs, opts) {
      opts = opts || {};
      this.totalMs = totalMs;
      this.onTick = opts.onTick || function () {};
      this.onEnd = opts.onEnd || function () {};
      this.interval = opts.interval || 100;
      this.running = false;
      this.ended = false;
      this._acc = 0;       // bereits verbrauchte Zeit (ms) vor letztem Start
      this._t0 = 0;
      this._iv = null;
    }
    start() {
      if (this.running || this.ended) return this;
      this.running = true; this._t0 = now();
      this._iv = setInterval(() => this._tick(), this.interval);
      this._tick();
      return this;
    }
    _tick() {
      const rem = this.remainingMs();
      this.onTick(rem, this.elapsedMs());
      if (rem <= 0 && !this.ended) { this.ended = true; this.stop(); this.onEnd(); }
    }
    pause() { if (!this.running) return; this._acc += now() - this._t0; this.running = false; clearInterval(this._iv); }
    resume() { if (this.running || this.ended) return; this.running = true; this._t0 = now(); this._iv = setInterval(() => this._tick(), this.interval); }
    stop() { if (this.running) { this._acc += now() - this._t0; } this.running = false; clearInterval(this._iv); }
    elapsedMs() { return this._acc + (this.running ? now() - this._t0 : 0); }
    remainingMs() { return Math.max(0, this.totalMs - this.elapsedMs()); }
    extend(ms) { this.totalMs += ms; }
  }

  DLR.core.Timer = CountdownTimer;
  DLR.core.now = now;
})();
