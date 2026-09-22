/* ENS – Englisch: Grammatik, Wortschatz, Aviation Vocabulary, Lückentexte, Leseverstehen, schnelle
   Bedeutungszuordnung und Listening Mode (Funkphrasen per Sprachausgabe, mit Text-Fallback). */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const B = () => DLR.data.englishBank;
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];
  const ERR = 'Gedächtnisfehler';

  function tierMax(L) { return L <= 3 ? 1 : L <= 6 ? 2 : 3; }
  function opts(correct, wrongs, note) { return [{ label: correct, correct: true }].concat(wrongs.map((w) => ({ label: w, correct: false, err: ERR, note: note || 'Bedeutung/Regel verwechselt' }))); }
  function distract(r, pool, correct, n, key) {
    const c = r.shuffle(pool.filter((x) => x[key] !== correct)).slice(0, n).map((x) => x[key]);
    return c;
  }

  const T = {
    vocab(r, L) {
      const tier = r.pick([1, 2, 3].filter((t) => t <= tierMax(L) && t >= Math.max(1, tierMax(L) - 1)));
      const pool = B().VOCAB.filter((x) => x[2] === tier), it = r.pick(pool);
      return { prompt: `Which meaning fits <b>“${it[0]}”</b> best?`, options: opts(it[1], distract(r, pool, it[1], 3, 1)), cols: 1, c: 5.5 + tier, diff: 2 + tier * 1.5, solution: it[1], explain: `“${it[0]}” = ${it[1]}.` };
    },
    quick(r, L) {
      const tier = r.pick([1, 2].filter((t) => t <= Math.max(1, tierMax(L))));
      const pool = B().VOCAB.filter((x) => x[2] === tier), it = r.pick(pool);
      return { prompt: `Quick match: <b>${it[0]}</b>`, options: opts(it[1], distract(r, pool, it[1], 2, 1)), cols: 1, c: 4 + tier, diff: 1.5 + tier, solution: it[1], explain: `“${it[0]}” = ${it[1]}.` };
    },
    aviation(r, L) {
      const tier = r.pick([1, 2, 3].filter((t) => t <= tierMax(L)));
      const pool = B().AVIATION.filter((x) => x[2] === tier), it = r.pick(pool);
      if (r.chance(0.5)) return { prompt: `Which term matches: <i>“${it[1]}”</i>?`, options: opts(it[0], distract(r, pool, it[0], 3, 0), 'Fachbegriff verwechselt'), cols: 2, c: 7 + tier, diff: 2 + tier * 1.5, solution: it[0], explain: `${it[0]}: ${it[1]}.` };
      return { prompt: `What does <b>“${it[0]}”</b> mean?`, options: opts(it[1], distract(r, pool, it[1], 3, 1), 'Fachbegriff verwechselt'), cols: 1, c: 7 + tier, diff: 2 + tier * 1.5, solution: it[1], explain: `${it[0]}: ${it[1]}.` };
    },
    grammar(r, L) {
      const tier = tierMax(L);
      const pool = B().GRAMMAR.filter((x) => x[5] <= tier && x[5] >= Math.max(1, tier - 1)), it = r.pick(pool.length ? pool : B().GRAMMAR);
      const text = it[0].replace('___', '<span class="blank">_____</span>');
      return { prompt: text, options: opts(it[1], [it[2], it[3], it[4]], 'Grammatikregel'), cols: 2, c: 6 + it[5] * 1.5, diff: 2 + it[5] * 1.6, solution: it[1], explain: it[6] };
    },
    cloze(r, L) {
      const tier = tierMax(L);
      const pool = B().CLOZE.filter((x) => x.t <= tier), it = r.pick(pool);
      const which = r.int(0, it.blanks.length - 1);
      let text = it.text;
      it.blanks.forEach((b, i) => { text = text.replace('{' + (i + 1) + '}', i === which ? '<span class="blank">_____</span>' : '<b>' + b[0] + '</b>'); });
      const b = it.blanks[which];
      return { prompt: `<div class="passage">${text}</div><div class="sub">Choose the word or phrase that fits the gap.</div>`, options: opts(b[0], [b[1], b[2], b[3]], 'Lücke falsch gefüllt'), cols: 2, c: 10 + it.t * 2, diff: 2.5 + it.t * 1.6, solution: b[0], explain: 'Prüfe Grammatik und Sinn im Zusammenhang: ' + text.replace(/<[^>]+>/g, '') };
    },
    reading(r, L) {
      const tier = tierMax(L);
      const pool = B().READING.filter((x) => x.t <= tier && x.t >= Math.max(1, tier - 1)), it = r.pick(pool.length ? pool : B().READING);
      const q = r.pick(it.qs);
      const words = it.text.split(/\s+/).length;
      return { prompt: `<div class="passage">${it.text}</div><div class="sub"><b>${q[0]}</b></div>`, options: opts(q[1], [q[2], q[3], q[4]], 'Textstelle überlesen'), cols: 1, c: 6 + words / 5.5, diff: 3 + it.t * 1.6, solution: q[1], explain: 'Die Antwort steht direkt im Text.' };
    },
  };

  /* ---------- Listening ---------- */
  const digits = (s) => String(s).split('').join(' ');
  function numVariants(r, val, kind) {
    const s = String(val), out = new Set([s]);
    let guard = 0;
    while (out.size < 4 && guard++ < 60) {
      let v;
      if (kind === 'fl' || kind === 'spd' || kind === 'hdg' || kind === 'alt') {
        const step = kind === 'hdg' ? 10 : kind === 'alt' ? 1000 : kind === 'spd' ? 10 : 10;
        const d = r.pick([-2, -1, 1, 2]) * step; v = +val + d;
        if (r.chance(0.35)) { const a = s.split(''); if (a.length >= 3) { const i = r.int(0, a.length - 2); const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; v = +a.join(''); } }
        if (kind === 'hdg') v = ((v % 360) + 360) % 360;
        if (v <= 0 || v === +val) continue;
        v = kind === 'hdg' ? String(v).padStart(3, '0') : String(v);
      } else if (kind === 'rwy') v = String(r.int(1, 36)).padStart(2, '0') + r.pick(['', 'L', 'R', 'C']);
      else if (kind === 'freq') v = String(r.int(118, 136)) + '.' + r.pick(['1', '3', '5', '7', '9', '25', '75']);
      else v = String(r.int(1, 999));
      out.add(v);
    }
    return Array.from(out);
  }
  function atc(r, L) {
    const cs = r.sample(B().CS_LETTERS, 3);
    const csText = cs.join(' ');
    const kind = r.pick(['descend', 'turn', 'land', 'contact', 'climb']);
    let text, q, ans, vk, ctx = '';
    if (kind === 'descend') { const fl = r.int(6, 38) * 10, fl2 = Math.max(60, fl - r.int(2, 10) * 10); text = `${csText}, descend to flight level ${digits(fl)}, report passing flight level ${digits(fl2)}.`; if (r.chance(0.5)) { q = 'To which flight level were you cleared to descend?'; ans = String(fl); vk = 'fl'; } else { q = 'At which flight level should you report passing?'; ans = String(fl2); vk = 'fl'; } }
    else if (kind === 'turn') { const hdg = String(r.int(1, 36) * 10 % 360).padStart(3, '0'), spd = r.int(14, 25) * 10, dir = r.pick(['left', 'right']); text = `${csText}, turn ${dir} heading ${digits(hdg)}, reduce speed to ${digits(spd)} knots.`; if (r.chance(0.5)) { q = 'What heading were you given?'; ans = hdg; vk = 'hdg'; } else { q = 'To which speed (knots) should you reduce?'; ans = String(spd); vk = 'spd'; } }
    else if (kind === 'land') { const rwy = String(r.int(1, 36)).padStart(2, '0') + r.pick(['', 'L', 'R']), wd = String(r.int(1, 36) * 10 % 360).padStart(3, '0'), ws = r.int(3, 25); text = `${csText}, runway ${digits(rwy).replace(/L/, 'left').replace(/R/, 'right')}, wind ${digits(wd)} degrees ${digits(ws)} knots, cleared to land.`; if (r.chance(0.55)) { q = 'Which runway are you cleared to land on?'; ans = rwy; vk = 'rwy'; } else { q = 'What is the wind speed (knots)?'; ans = String(ws); vk = 'gen'; } }
    else if (kind === 'contact') { const f = B().FACILITIES ? r.pick(B().FACILITIES) : 'Tower', fr = r.int(118, 136) + '.' + r.pick(['1', '3', '5', '7', '9']); text = `${csText}, contact ${f} on ${digits(fr.split('.')[0])} decimal ${digits(fr.split('.')[1])}.`; q = 'On which frequency should you contact the controller?'; ans = fr; vk = 'freq'; }
    else { const alt = r.int(3, 15) * 1000, qnh = r.int(990, 1030); text = `${csText}, QNH ${digits(qnh)}, climb to altitude ${digits(alt)} feet.`; if (r.chance(0.5)) { q = 'To which altitude (ft) were you cleared?'; ans = String(alt); vk = 'alt'; } else { q = 'What QNH (hPa) were you given?'; ans = String(qnh); vk = 'qnh'; } }
    const vars = numVariants(r, ans, vk === 'qnh' ? 'spd' : vk);
    if (vk === 'qnh') { const s = new Set([ans]); while (s.size < 4) s.add(String(+ans + r.pick([-10, -5, 5, 10, 12, -12]))); vars.length = 0; Array.from(s).forEach((x) => vars.push(x)); }
    return { text, transcript: text.replace(/(\d) (?=\d)/g, '$1'), q, ans, options: vars.slice(0, 4).map((v) => ({ label: v, correct: v === ans })), cs: cs.join(' ') };
  }
  function listening(r, L, p) {
    const a = atc(r, L);
    const rate = 0.85 + L * 0.04;
    const shuffled = U.shuffle(a.options);
    return {
      kind: 'custom', deferClock: true, level: L, difficulty: 3.5 + L * 0.6, type: 'listening', tag: 'listening',
      expectedSec: 9 + (L >= 6 ? 2 : 0), timeLimit: Math.round(14 * F[L - 1] * (p.timeScale || 1)),
      solution: a.ans, explain: 'Transkript: “' + a.transcript + '”', reproducible: true,
      custom: {
        render(stage, api) {
          const st = DLR.store.state.settings;
          const ttsOk = DLR.audio.speechAvailable && DLR.audio.enabled && st.listeningTts !== false;
          const info = U.h('div', { class: 'listen-status' }, ttsOk ? 'Listening: Audio läuft …' : 'Audio nicht verfügbar – Transkript zur Übung:');
          const q = U.h('div', { class: 'prompt' }, U.h('b', null, a.q));
          const box = U.h('div', { class: 'listen-box' });
          stage.appendChild(U.h('div', { class: 'listen-head' }, U.h('span', { class: 'listen-icon', 'aria-hidden': 'true' }, '🎧'), info));
          stage.appendChild(box);
          let replays = 1, shown = false;
          const show = () => {
            if (shown || !api.alive()) return; shown = true;
            info.textContent = ttsOk ? 'Was hast du verstanden?' : info.textContent;
            stage.appendChild(q);
            const ans = DLR.ui.answer.choices(stage, shuffled.map((o) => ({ label: o.label })), (i) => {
              const ok = shuffled[i].correct;
              api.submit({ correct: ok, errorType: ok ? null : 'Wahrnehmungsfehler', detail: ok ? null : 'akustisch falsch verstanden', meta: { rate: rate } });
            }, { labels: ['1', '2', '3', '4'], cols: 4 });
            api.onKey(ans.keyHandler);
            if (ttsOk && replays > 0 && !api.isExam) {
              const btn = U.h('button', { type: 'button', class: 'btn ghost replay', onclick: () => { if (replays-- > 0) { btn.disabled = true; DLR.audio.speak(a.text, { lang: 'en-GB', rate }).then(() => { btn.disabled = false; }); } } }, '↻ Wiederholen (1×)');
              stage.appendChild(btn);
            }
            api.resetClock();
          };
          if (ttsOk) DLR.audio.speak(a.text, { lang: 'en-GB', rate }).then((ok) => { if (!api.alive()) return; if (!ok) { info.textContent = 'Audio nicht verfügbar – Transkript zur Übung:'; box.textContent = a.transcript; } show(); });
          else { box.textContent = a.transcript; show(); }
          return () => DLR.audio.cancelSpeech();
        },
      },
    };
  }

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10);
    const pool = L <= 2 ? [['quick', 3], ['vocab', 2], ['grammar', 3], ['aviation', 2]]
      : L <= 4 ? [['quick', 2], ['vocab', 2], ['grammar', 3], ['aviation', 3], ['cloze', 2], ['reading', 1], ['listening', 1]]
        : L <= 7 ? [['vocab', 2], ['grammar', 3], ['aviation', 3], ['cloze', 3], ['reading', 2], ['listening', 3]]
          : [['vocab', 2], ['grammar', 3], ['aviation', 3], ['cloze', 3], ['reading', 3], ['listening', 4]];
    const tot = U.sum(pool.map((x) => x[1])); let z = r.next() * tot, name = pool[0][0];
    for (const x of pool) { z -= x[1]; if (z <= 0) { name = x[0]; break; } }
    if (name === 'listening') return listening(r, L, p);
    const t = T[name](r, L);
    return {
      kind: 'mc', level: L, difficulty: Math.min(10, t.diff + L * 0.25), type: name, prompt: t.prompt, options: t.options, cols: t.cols,
      expectedSec: Math.round(t.c * 10) / 10, timeLimit: Math.round(t.c * F[L - 1] * 1.25 * (p.timeScale || 1)),
      solution: t.solution, explain: t.explain,
    };
  }

  DLR.gen.english = { generate, atc };
  DLR.registerModule({
    id: 'ENS', name: 'Englisch', kind: 'trial', axis: null, heavy: false, minSlot: 180,
    defaultError: ERR, reactionBased: false,
    desc: 'Grammatik, Wortschatz, Synonyme, Lückentexte, Textverständnis, Aviation Vocabulary und schnelle Bedeutungszuordnung. Der Listening Mode spielt Funkphrasen per Sprachausgabe ab; du wählst, was verstanden wurde.',
    intro: {
      how: ['Wähle die passende Antwort – Grammatik, Wortschatz, Fachbegriffe, Lücken, Lesetexte.', 'Listening: Kopfhörer empfohlen. Ohne Audio-Unterstützung des Browsers wird das Transkript angezeigt.', 'Ab Level 6 wird schneller gesprochen.'],
      keys: 'A–D oder 1–4',
    },
    generate,
  });
})();
