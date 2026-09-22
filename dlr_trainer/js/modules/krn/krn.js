(function () {
  'use strict';
  const DLR = window.DLR;
  DLR.registerModule({
    id: 'KRN', name: 'Kopfrechnen', kind: 'trial', axis: 'Mathematik', heavy: false, minSlot: 180,
    defaultError: 'Rechenfehler', reactionBased: false,
    desc: 'Grundrechenarten, Kettenrechnungen, Prozent, Verhältnis, Einheiten, Geschwindigkeit/Weg/Zeit und kombinierte Textaufgaben – ohne Taschenrechner und ohne Papier.',
    intro: {
      how: ['Rechne im Kopf. Kein Taschenrechner, kein Papier.', 'Tippe das Ergebnis ein und bestätige mit Enter (Dezimalzahlen mit Komma oder Punkt).', 'Jede Aufgabe hat ein eigenes Zeitlimit.'],
      keys: 'Zahlen + Enter',
    },
    generate: (p) => DLR.gen.arithmetic.generate(p),
  });
})();
