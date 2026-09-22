/* Audio-Engine: akustische Signale (WebAudio) + Sprachausgabe (SpeechSynthesis).
   Alles ist optional; ohne Audio-Unterstützung fällt die App auf visuelle Hinweise zurück. */
(function () {
  'use strict';
  const DLR = window.DLR;
  let ctx = null, master = null;
  const synth = window.speechSynthesis || null;
  let voicesCache = null;

  function settings() { return DLR.store.state.settings; }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); master = ctx.createGain(); master.gain.value = settings().volume; master.connect(ctx.destination); }
      catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
    return ctx;
  }

  function voices() {
    if (!synth) return [];
    if (!voicesCache || !voicesCache.length) voicesCache = synth.getVoices();
    return voicesCache;
  }

  const audio = (DLR.audio = {
    /** Erst nach Nutzerinteraktion darf Audio starten. */
    unlock() { ensure(); if (synth) voices(); },
    get toneAvailable() { return !!(window.AudioContext || window.webkitAudioContext); },
    get speechAvailable() { return !!synth && typeof window.SpeechSynthesisUtterance === 'function'; },
    get enabled() { return !!settings().audio; },
    setVolume(v) { settings().volume = v; if (master) master.gain.value = v; },

    /** Einzelner Ton. Gibt true zurück, wenn tatsächlich ein Ton abgespielt wurde. */
    tone(freq, durMs, opts) {
      if (!audio.enabled) return false;
      const c = ensure();
      if (!c) return false;
      opts = opts || {};
      const t0 = c.currentTime + (opts.delay || 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.value = freq;
      const vol = opts.vol == null ? 0.5 : opts.vol;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.setValueAtTime(vol, t0 + durMs / 1000 - 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + durMs / 1000 + 0.02);
      return true;
    },
    /** Signaltöne für MIC/MTF: 'high' = Zielton, 'low' = Störton. */
    signal(kind) { return kind === 'low' ? audio.tone(520, 260, { type: 'triangle', vol: 0.45 }) : audio.tone(1240, 260, { type: 'sine', vol: 0.5 }); },
    chime(ok) { return ok ? audio.tone(880, 90, { vol: 0.18 }) : audio.tone(220, 140, { type: 'triangle', vol: 0.2 }); },

    /** Sprachausgabe. Löst nach Ende (oder Timeout) auf; false, falls nicht verfügbar. */
    speak(text, opts) {
      opts = opts || {};
      return new Promise((resolve) => {
        if (!audio.enabled || !audio.speechAvailable) { resolve(false); return; }
        try {
          synth.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = opts.lang || 'de-DE';
          u.rate = opts.rate || 1;
          u.volume = settings().volume;
          const v = voices().filter((x) => x.lang && x.lang.toLowerCase().indexOf(u.lang.toLowerCase().slice(0, 2)) === 0);
          const exact = v.filter((x) => x.lang.toLowerCase() === u.lang.toLowerCase());
          const pick = (exact[0] || v[0]);
          if (pick) u.voice = pick;
          let done = false;
          const fin = (ok) => { if (!done) { done = true; clearTimeout(guard); resolve(ok); } };
          u.onend = () => fin(true);
          u.onerror = () => fin(false);
          const guard = setTimeout(() => fin(true), Math.max(2500, text.length * 120 / (u.rate || 1)));
          synth.speak(u);
        } catch (e) { resolve(false); }
      });
    },
    cancelSpeech() { try { if (synth) synth.cancel(); } catch (e) { /* ignore */ } },
    hasVoice(lang) { return voices().some((x) => x.lang && x.lang.toLowerCase().indexOf(lang.toLowerCase().slice(0, 2)) === 0); },

    /** Rechenausdruck sprechbar machen. */
    mathToSpeech(str) {
      return String(str).replace(/×/g, ' mal ').replace(/÷/g, ' geteilt durch ').replace(/−/g, ' minus ').replace(/\+/g, ' plus ')
        .replace(/=/g, ' gleich ').replace(/%/g, ' Prozent ').replace(/:/g, ' zu ').replace(/\(/g, ' Klammer auf ').replace(/\)/g, ' Klammer zu ');
    },
  });

  if (synth && synth.addEventListener) synth.addEventListener('voiceschanged', () => { voicesCache = null; });
  ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => audio.unlock(), { once: true, capture: true }));
})();
