/* PHY-Generator. Alle Werte sind so konstruiert, dass die Lösung sauber und nachvollziehbar berechenbar ist.
   Konstanten: g = 10 m/s², Wasser 1000 kg/m³, c_Wasser = 4,2 kJ/(kg·K). Flugphysik nutzt ausgewiesene Faustformeln. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];
  const n = (v, d) => U.fmtNum(v, d == null ? 2 : d);

  function options(r, ans, wrongs, unit, dec, allowNeg) {
    const fmt = (v) => n(v, dec == null ? 2 : dec) + (unit ? ' ' + unit : '');
    const out = [{ label: fmt(ans), correct: true }], seen = new Set([fmt(ans)]);
    const add = (v, err, note) => {
      if (out.length >= 4 || !isFinite(v) || (!allowNeg && v <= 0)) return;
      const l = fmt(v); if (seen.has(l) || l === fmt(-0)) return;
      seen.add(l); out.push({ label: l, correct: false, err: err || 'Rechenfehler', note });
    };
    wrongs.forEach((w) => add(w.v, w.err, w.note));
    [2, 0.5, 10, 0.1, 1.5, 4].forEach((f) => add(ans * f, 'Rechenfehler', 'Zehnerpotenz/Faktor'));
    const step = Math.max(1, Math.round(Math.abs(ans) * 0.1));
    [1, -1, 2, -2, 3, -3, 5, -5].forEach((k) => add(ans + k * step, 'Rechenfehler'));
    return out;
  }

  const T = {
    newton(r, L) {
      const m = r.pick([2, 4, 5, 10, 20, 50, 100]), a = r.pick([2, 3, 4, 5, 6]);
      const mode = r.pick(['F', 'a', 'm']);
      if (mode === 'F') return { text: `Ein Körper der Masse ${m} kg wird mit ${a} m/s² beschleunigt. Welche resultierende Kraft wirkt?`, ans: m * a, unit: 'N', c: 8, diff: 1.5, wrongs: [{ v: m / a, err: 'technische Fehlinterpretation' }, { v: m + a }], explain: `F = m·a = ${m} × ${a} = ${m * a} N.` };
      if (mode === 'a') return { text: `Eine Kraft von ${m * a} N wirkt auf eine Masse von ${m} kg. Beschleunigung?`, ans: a, unit: 'm/s²', c: 8, diff: 1.5, wrongs: [{ v: m * a * m, err: 'technische Fehlinterpretation' }, { v: m / a }], explain: `a = F/m = ${m * a}/${m} = ${a} m/s².` };
      return { text: `Eine Kraft von ${m * a} N erzeugt eine Beschleunigung von ${a} m/s². Wie groß ist die Masse?`, ans: m, unit: 'kg', c: 8, diff: 2, wrongs: [{ v: m * a * a, err: 'technische Fehlinterpretation' }, { v: m + a }], explain: `m = F/a = ${m * a}/${a} = ${m} kg.` };
    },
    weight(r) {
      const m = r.pick([5, 12, 60, 75, 80, 120]), on = r.pick([['der Erde', 10], ['dem Mond', 1.6]]);
      const g = on[1]; const ans = m * g;
      return { text: `Wie groß ist die Gewichtskraft einer Masse von ${m} kg auf ${on[0]} (g = ${n(g, 1)} m/s²)?`, ans, unit: 'N', c: 7, diff: 1.5, wrongs: [{ v: m, err: 'technische Fehlinterpretation', note: 'Masse mit Gewicht verwechselt' }, { v: m / g }], explain: `F_G = m·g = ${m} × ${n(g, 1)} = ${n(ans, 1)} N.` };
    },
    work(r) {
      const F0 = r.pick([100, 150, 200, 250, 400]), s = r.pick([4, 6, 10, 12, 20]);
      const W = F0 * s;
      if (r.chance(0.5)) return { text: `Eine Kraft von ${F0} N verschiebt einen Körper um ${s} m in Kraftrichtung. Verrichtete Arbeit?`, ans: W, unit: 'J', c: 8, diff: 2, wrongs: [{ v: F0 + s }, { v: F0 / s, err: 'technische Fehlinterpretation' }], explain: `W = F·s = ${F0} × ${s} = ${W} J.` };
      const t = r.pick([5, 10, 20, 25].filter((x) => W % x === 0)), P = W / t;
      return { text: `Dafür werden ${t} s benötigt. Wie groß ist die mittlere Leistung?`, ans: P, unit: 'W', c: 12, diff: 3, wrongs: [{ v: W * t, err: 'technische Fehlinterpretation' }, { v: W / (t + 5) }], explain: `P = W/t = ${W}/${t} = ${P} W.` };
    },
    energy(r) {
      const m = r.pick([2, 4, 5, 10, 20]);
      if (r.chance(0.5)) { const h = r.pick([2, 5, 8, 10, 20]); return { text: `Ein Körper (${m} kg) wird ${h} m hoch gehoben (g = 10 m/s²). Zuwachs an potentieller Energie?`, ans: m * 10 * h, unit: 'J', c: 9, diff: 2.5, wrongs: [{ v: m * h }, { v: (m * 10 * h) / 2, err: 'technische Fehlinterpretation' }], explain: `E_pot = m·g·h = ${m} × 10 × ${h} = ${m * 10 * h} J.` }; }
      const v = r.pick([2, 4, 5, 10, 20]); return { text: `Ein Körper (${m} kg) bewegt sich mit ${v} m/s. Wie groß ist seine kinetische Energie?`, ans: 0.5 * m * v * v, unit: 'J', c: 11, diff: 3.5, wrongs: [{ v: m * v * v, err: 'technische Fehlinterpretation', note: 'Faktor ½ vergessen' }, { v: 0.5 * m * v, err: 'technische Fehlinterpretation', note: 'v nicht quadriert' }], explain: `E_kin = ½·m·v² = 0,5 × ${m} × ${v}² = ${0.5 * m * v * v} J.` };
    },
    fall(r) {
      const h = r.pick([5, 20, 45, 80]);
      if (r.chance(0.5)) { const v = Math.sqrt(2 * 10 * h); return { text: `Ein Stein fällt reibungsfrei aus ${h} m Höhe (g = 10 m/s²). Aufprallgeschwindigkeit?`, ans: v, unit: 'm/s', c: 13, diff: 4.5, wrongs: [{ v: 10 * h, err: 'Rechenfehler' }, { v: h / 2 }, { v: v * 2 }], explain: `v = √(2·g·h) = √(2 × 10 × ${h}) = √${20 * h} = ${v} m/s.` }; }
      const t = Math.sqrt((2 * h) / 10); return { text: `Wie lange fällt ein Stein reibungsfrei aus ${h} m Höhe (g = 10 m/s²)?`, ans: t, unit: 's', c: 12, diff: 4.5, wrongs: [{ v: h / 10, err: 'technische Fehlinterpretation' }, { v: Math.sqrt(h) * 2 }, { v: t * 2 }], explain: `s = ½·g·t² → t = √(2h/g) = √(${2 * h}/10) = ${t} s.` };
    },
    kinematics(r) {
      const a = r.pick([2, 3, 4, 5]), t = r.pick([4, 6, 8, 10]);
      const k = r.pick(['v', 's', 'brake']);
      if (k === 'v') return { text: `Ein Fahrzeug beschleunigt aus dem Stand mit ${a} m/s² für ${t} s. Endgeschwindigkeit?`, ans: a * t, unit: 'm/s', c: 8, diff: 2.5, wrongs: [{ v: a + t }, { v: (a * t) / 2, err: 'technische Fehlinterpretation' }], explain: `v = a·t = ${a} × ${t} = ${a * t} m/s.` };
      if (k === 's') return { text: `Aus dem Stand beschleunigt mit ${a} m/s² über ${t} s. Zurückgelegte Strecke?`, ans: 0.5 * a * t * t, unit: 'm', c: 12, diff: 4, wrongs: [{ v: a * t * t, err: 'technische Fehlinterpretation', note: 'Faktor ½ vergessen' }, { v: a * t }], explain: `s = ½·a·t² = 0,5 × ${a} × ${t}² = ${0.5 * a * t * t} m.` };
      const v = r.pick([10, 20, 30]), ab = r.pick([2, 4, 5]); return { text: `Ein Fahrzeug bremst von ${v} m/s mit konstant ${ab} m/s² bis zum Stillstand. Bremsweg?`, ans: (v * v) / (2 * ab), unit: 'm', c: 14, diff: 5, wrongs: [{ v: (v * v) / ab, err: 'technische Fehlinterpretation' }, { v: v / ab, err: 'technische Fehlinterpretation' }], explain: `s = v²/(2a) = ${v * v}/${2 * ab} = ${(v * v) / (2 * ab)} m.` };
    },
    pressure(r, L) {
      if (r.chance(0.5)) { const A = r.pick([0.01, 0.02, 0.05, 0.1]), F0 = r.pick([200, 500, 1000, 2000]); const p = F0 / A; return { text: `Eine Kraft von ${F0} N wirkt gleichmäßig auf ${n(A, 2)} m². Welcher Druck entsteht?`, ans: p / 1000, unit: 'kPa', c: 10, diff: 3, wrongs: [{ v: (F0 * A) / 1000, err: 'technische Fehlinterpretation' }, { v: p }, { v: p / 100 }], explain: `p = F/A = ${F0}/${n(A, 2)} = ${p} Pa = ${p / 1000} kPa.`, dec: 1 }; }
      const h = r.pick([5, 10, 15, 20, 30]), ext = L >= 6 && r.chance(0.5);
      const p = 1000 * 10 * h / 1000 + (ext ? 100 : 0);
      return { text: `Wasserdruck in ${h} m Tiefe (ρ = 1000 kg/m³, g = 10 m/s²)${ext ? ', zusätzlich 100 kPa Luftdruck an der Oberfläche' : ''}?`, ans: p, unit: 'kPa', c: 11, diff: 4, wrongs: [{ v: p - (ext ? 100 : 0) + (ext ? 0 : 100), err: 'technische Fehlinterpretation' }, { v: h * 10 * 10 }, { v: p / 10 }], explain: `p = ρ·g·h = 1000 × 10 × ${h} = ${h * 10} kPa${ext ? ', plus 100 kPa = ' + p + ' kPa' : ''}.`, dec: 1 };
    },
    heat(r) {
      const m = r.pick([1, 2, 5, 10]), dT = r.pick([5, 10, 20, 25, 50].filter((x) => (m * x) % 5 === 0 || true));
      const Q = m * dT * 4.2;
      if (r.chance(0.6)) return { text: `Wie viel Wärme braucht man, um ${m} kg Wasser um ${dT} K zu erwärmen (c = 4,2 kJ/(kg·K))?`, ans: Q, unit: 'kJ', c: 12, diff: 4, wrongs: [{ v: m * dT, err: 'technische Fehlinterpretation', note: 'c vergessen' }, { v: (m * dT) / 4.2 }, { v: Q * 10 }], explain: `Q = m·c·ΔT = ${m} × 4,2 × ${dT} = ${n(Q, 1)} kJ.`, dec: 1 };
      const C = r.pick([0, 20, 37, 100, -10, 50]); return { text: `Wie viel Kelvin entsprechen ${C} °C?`, ans: C + 273.15, unit: 'K', c: 6, diff: 1.5, wrongs: [{ v: C + 273 + 10 }, { v: 273.15 - C, err: 'technische Fehlinterpretation' }, { v: C + 100 }], explain: `T = ${C} + 273,15 = ${n(C + 273.15, 2)} K.`, dec: 2 };
    },
    ohm(r) {
      const R = r.pick([5, 10, 12, 20, 30, 40]), I = r.pick([0.5, 1, 2, 3, 4]);
      const k = r.pick(['U', 'P', 'div']);
      if (k === 'U') return { text: `Durch einen Widerstand von ${R} Ω fließen ${n(I, 1)} A. Welche Spannung liegt an?`, ans: R * I, unit: 'V', c: 8, diff: 2.5, wrongs: [{ v: R / I, err: 'technische Fehlinterpretation' }, { v: R + I }], explain: `U = R·I = ${R} × ${n(I, 1)} = ${n(R * I, 1)} V.` };
      if (k === 'P') { const U0 = r.pick([12, 24, 230]), A = r.pick([1, 2, 4, 5]); return { text: `Ein Gerät liegt an ${U0} V und nimmt ${A} A auf. Leistung?`, ans: U0 * A, unit: 'W', c: 8, diff: 2.5, wrongs: [{ v: U0 / A, err: 'technische Fehlinterpretation' }, { v: U0 + A }], explain: `P = U·I = ${U0} × ${A} = ${U0 * A} W.` }; }
      const R1 = r.pick([10, 20, 30]), R2 = r.pick([10, 20, 30]), Ug = r.pick([6, 12, 24, 30]); const u2 = (Ug * R2) / (R1 + R2);
      if (!Number.isInteger(u2 * 10)) return T.ohm(r);
      return { text: `Zwei Widerstände R₁ = ${R1} Ω und R₂ = ${R2} Ω liegen in Reihe an ${Ug} V. Welche Spannung fällt an R₂ ab?`, ans: u2, unit: 'V', c: 15, diff: 5, wrongs: [{ v: (Ug * R1) / (R1 + R2), err: 'technische Fehlinterpretation', note: 'falscher Widerstand' }, { v: Ug / 2, err: 'technische Fehlinterpretation' }, { v: Ug - u2 + 1 }], explain: `Spannungsteiler: U₂ = U·R₂/(R₁+R₂) = ${Ug} × ${R2}/${R1 + R2} = ${n(u2, 2)} V.`, dec: 2 };
    },
    density(r) {
      const rho = r.pick([0.8, 0.85, 1.0, 2.7, 7.8]), V = r.pick([10, 20, 50, 100, 500]);
      return { text: `Ein Körper hat die Dichte ${n(rho, 2)} kg/l und ein Volumen von ${V} l. Welche Masse hat er?`, ans: rho * V, unit: 'kg', c: 9, diff: 2.5, wrongs: [{ v: V / rho, err: 'technische Fehlinterpretation' }, { v: rho + V }], explain: `m = ρ·V = ${n(rho, 2)} × ${V} = ${n(rho * V, 1)} kg.`, dec: 1 };
    },
    friction(r) {
      const mu = r.pick([0.1, 0.2, 0.25, 0.4, 0.5]), m = r.pick([20, 40, 50, 80, 100]);
      return { text: `Ein Körper (${m} kg) liegt auf einer waagerechten Fläche (μ = ${n(mu, 2)}, g = 10 m/s²). Welche Kraft überwindet die Gleitreibung gerade?`, ans: mu * m * 10, unit: 'N', c: 11, diff: 4, wrongs: [{ v: mu * m, err: 'technische Fehlinterpretation', note: 'g vergessen' }, { v: m * 10, err: 'technische Fehlinterpretation', note: 'μ vergessen' }], explain: `F_R = μ·F_N = ${n(mu, 2)} × ${m} × 10 = ${n(mu * m * 10, 1)} N.`, dec: 1 };
    },
    spring(r) {
      const k = r.pick([100, 200, 400, 500]), x = r.pick([0.05, 0.1, 0.2, 0.25]);
      return { text: `Eine Feder (k = ${k} N/m) wird um ${x * 100} cm gedehnt. Welche Kraft wirkt?`, ans: k * x, unit: 'N', c: 10, diff: 3, wrongs: [{ v: k * x * 100, err: 'technische Fehlinterpretation', note: 'Einheit cm/m' }, { v: k / x }], explain: `F = k·x = ${k} × ${x} = ${n(k * x, 1)} N.`, dec: 1 };
    },
    momentum(r) {
      const m1 = r.pick([2, 3, 4]), v1 = r.pick([6, 8, 10, 12]), m2 = r.pick([1, 2, 4].filter((x) => x !== m1));
      const v = (m1 * v1) / (m1 + m2); if (!Number.isInteger(v * 10)) return T.momentum(r);
      return { text: `Ein Wagen (${m1} kg, ${v1} m/s) stößt gegen einen ruhenden Wagen (${m2} kg) und bleibt haften. Gemeinsame Geschwindigkeit?`, ans: v, unit: 'm/s', c: 15, diff: 6, wrongs: [{ v: v1 / 2, err: 'technische Fehlinterpretation' }, { v: v1 * (m1 - m2) / (m1 + m2) || v1 + 1 }, { v: v1 }], explain: `Impulserhaltung: ${m1}×${v1} = (${m1}+${m2})×v → v = ${n(v, 2)} m/s.`, dec: 2 };
    },
    lift(r) {
      const pr = r.pick([[100, 200, 4], [80, 120, 2.25], [60, 90, 2.25], [100, 150, 2.25], [50, 100, 4]]), L1 = r.pick([2000, 4000, 8000, 10000]);
      return { text: `Bei ${pr[0]} kt erzeugt ein Flügel ${L1} N Auftrieb (gleicher Anstellwinkel). Auftrieb bei ${pr[1]} kt? (Auftrieb ∝ v²)`, ans: L1 * pr[2], unit: 'N', c: 13, diff: 5, wrongs: [{ v: (L1 * pr[1]) / pr[0], err: 'technische Fehlinterpretation', note: 'linear statt quadratisch' }, { v: L1 * pr[2] * (pr[1] / pr[0]) }], explain: `L₂ = L₁ × (v₂/v₁)² = ${L1} × (${pr[1]}/${pr[0]})² = ${n(L1 * pr[2], 0)} N.`, dec: 0 };
    },
    glide(r) {
      const opts = []; [2000, 3000, 4000, 5000, 6000].forEach((alt) => [10, 12, 15, 20].forEach((g) => { if ((alt * g) % 6000 === 0) opts.push([alt, g]); }));
      const pr = r.pick(opts);
      return { text: `Motorausfall in ${n(pr[0], 0)} ft über Grund. Gleitzahl ${pr[1]}:1 (1 NM ≈ 6000 ft). Wie weit kommt das Flugzeug im Gleitflug?`, ans: (pr[0] * pr[1]) / 6000, unit: 'NM', c: 14, diff: 5, wrongs: [{ v: pr[0] / pr[1] / 6, err: 'technische Fehlinterpretation' }, { v: (pr[0] * pr[1]) / 1000 }], explain: `Strecke = Höhe × Gleitzahl = ${pr[0]} × ${pr[1]} = ${pr[0] * pr[1]} ft = ${(pr[0] * pr[1]) / 6000} NM.`, dec: 1 };
    },
    climbGrad(r) {
      const gs = r.pick([60, 90, 120, 150, 180]), rate = r.pick([600, 900, 1200, 1500].filter((x) => (x * 60) % gs === 0));
      const ans = (rate * 60) / gs;
      return { text: `Steigrate ${rate} ft/min bei ${gs} kt Groundspeed. Steiggradient in ft pro NM?`, ans, unit: 'ft/NM', c: 15, diff: 6, wrongs: [{ v: rate / gs, err: 'technische Fehlinterpretation' }, { v: rate * gs / 60 }], explain: `${gs} kt = ${gs / 60} NM/min. Gradient = ${rate} / ${gs / 60} = ${ans} ft/NM.`, dec: 0 };
    },
    isa(r) {
      const alt = r.pick([2000, 4000, 6000, 8000, 10000, 12000, 18000, 24000, 30000]);
      const t = 15 - 2 * (alt / 1000);
      return { text: `Standardatmosphäre: 15 °C auf MSL, −2 °C je 1000 ft. Temperatur in ${n(alt, 0)} ft?`, ans: t, unit: '°C', c: 10, diff: 3.5, wrongs: [{ v: 15 + 2 * (alt / 1000) }, { v: 15 - alt / 1000 }], explain: `T = 15 − 2 × ${alt / 1000} = ${t} °C.`, dec: 0, allowNeg: true };
    },
    tas(r) {
      const alt = r.pick([5, 8, 10, 15]) * 1000, ias = r.pick([100, 150, 200, 250].filter((x) => (x * 0.02 * (alt / 1000)) % 1 === 0));
      const ans = ias * (1 + 0.02 * (alt / 1000));
      return { text: `IAS ${ias} kt in ${n(alt, 0)} ft. Faustformel: TAS ≈ IAS + 2 % je 1000 ft. TAS?`, ans, unit: 'kt', c: 14, diff: 5.5, wrongs: [{ v: ias * (1 + 0.02) }, { v: ias + alt / 1000 * 2 }, { v: ias * (1 - 0.02 * (alt / 1000)) }], explain: `Zuschlag = ${ias} × 0,02 × ${alt / 1000} = ${n(ias * 0.02 * (alt / 1000), 1)}; TAS = ${n(ans, 1)} kt.`, dec: 1 };
    },
    loadFactor(r) {
      const m = r.pick([800, 1000, 1200, 1500]);
      return { text: `Kurvenflug mit 60° Querneigung im Horizontalflug (Lastfaktor n = 1/cos φ, cos 60° = 0,5). Wie groß ist der nötige Auftrieb im Verhältnis zum Gewicht einer ${m}-kg-Maschine (in kg-Kraft)?`, ans: m * 2, unit: 'kp', c: 15, diff: 6, wrongs: [{ v: m }, { v: m * 1.5, err: 'technische Fehlinterpretation' }, { v: m * 4, err: 'technische Fehlinterpretation' }], explain: `n = 1/0,5 = 2 → Auftrieb = 2 × ${m} = ${m * 2} kp.`, dec: 0 };
    },
    mach(r) {
      const M = r.pick([0.6, 0.7, 0.75, 0.8, 0.85]), a = r.pick([600, 640, 660].filter((x) => Number.isInteger(x * M)));
      return { text: `Schallgeschwindigkeit in Reiseflughöhe ${a} kt. Bei Mach ${n(M, 2)}: Wahre Fluggeschwindigkeit (TAS)?`, ans: a * M, unit: 'kt', c: 9, diff: 4, wrongs: [{ v: a / M, err: 'technische Fehlinterpretation' }, { v: a * M * 1.15 }], explain: `TAS = M × a = ${n(M, 2)} × ${a} = ${n(a * M, 0)} kt.`, dec: 0 };
    },
    qnh(r) {
      const q = r.pick([983, 993, 1003, 1023, 1033]), d = q - 1013;
      return { text: `Bei QNH ${q} hPa (Standard 1013 hPa): Um wie viele ft liegt die Höhenmesseranzeige bei 1013-Einstellung gegenüber der Anzeige mit QNH-Einstellung? (1 hPa ≈ 30 ft)`, ans: Math.abs(d) * 30, unit: 'ft', c: 12, diff: 5, wrongs: [{ v: Math.abs(d) * 3, err: 'Rechenfehler' }, { v: Math.abs(d) * 300 }], explain: `Differenz ${Math.abs(d)} hPa × 30 ft = ${Math.abs(d) * 30} ft.`, dec: 0 };
    },
  };

  const POOLS = {
    1: ['weight', 'newton', 'ohm', 'density'],
    2: ['weight', 'newton', 'work', 'ohm', 'kinematics', 'density'],
    3: ['newton', 'work', 'energy', 'ohm', 'kinematics', 'friction', 'spring', 'heat'],
    4: ['energy', 'kinematics', 'pressure', 'heat', 'friction', 'spring', 'lift', 'isa'],
    5: ['energy', 'fall', 'kinematics', 'pressure', 'heat', 'lift', 'isa', 'glide', 'mach'],
    6: ['fall', 'pressure', 'heat', 'ohm', 'glide', 'climbGrad', 'tas', 'mach', 'qnh', 'momentum'],
  };
  [7, 8, 9, 10].forEach((l) => (POOLS[l] = ['fall', 'ohm', 'momentum', 'pressure', 'climbGrad', 'tas', 'loadFactor', 'glide', 'lift', 'qnh']));

  function generate(p) {
    const r = U.makeRng(p.seed);
    const L = U.clamp(p.level, 1, 10);
    if (DLR.data.conceptBank && r.chance(0.14)) return DLR.data.conceptBank.pick('PHY', p);
    const name = r.pick(POOLS[L]);
    const t = T[name](r, L);
    const typed = L >= 7;
    const dec = t.dec == null ? (Number.isInteger(t.ans) ? 0 : 2) : t.dec;
    const base = { level: L, difficulty: Math.min(10, t.diff + L * 0.3), type: name, prompt: t.text, expectedSec: t.c + (typed ? 2 : 0), timeLimit: Math.round(t.c * F[L - 1] * 1.15 * (p.timeScale || 1)), solution: n(t.ans, dec) + ' ' + t.unit, explain: t.explain };
    if (typed) return Object.assign(base, { kind: 'num', answer: Math.round(t.ans * 1000) / 1000, tolerance: dec === 0 ? 0 : Math.pow(10, -dec) / 2, unit: t.unit, decimals: dec > 0 || t.allowNeg, errFn: (v) => (Math.abs(v - t.ans) / Math.max(1, Math.abs(t.ans)) < 0.15 ? 'Rechenfehler' : 'technische Fehlinterpretation') });
    return Object.assign(base, { kind: 'mc', options: options(r, t.ans, t.wrongs.map((w) => Object.assign({}, w)), t.unit, dec, t.allowNeg), cols: 2 });
  }

  DLR.gen.physics = { generate, templates: T };
})();
