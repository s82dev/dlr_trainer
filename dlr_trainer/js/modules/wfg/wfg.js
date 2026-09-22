(function () {
  'use strict';
  const DLR = window.DLR;
  DLR.registerModule({
    id: 'WFG', name: 'Wegfiguren', kind: 'trial', axis: 'Raum', heavy: false, minSlot: 180,
    defaultError: 'Wahrnehmungsfehler', reactionBased: false,
    desc: 'Eine Linie wird mental von Start bis Ende verfolgt. Gefragt wird nach Links-/Rechtsabbiegungen, Richtungswechseln, Kreuzungen oder der Endrichtung – später mit gedrehten Figuren, mehreren Linien und kurzer Sichtzeit.',
    intro: {
      how: ['Der Punkt markiert den Start, der Pfeil das Ende.', '„Links/rechts“ gilt aus Sicht der Figur in Fahrtrichtung, nicht aus Sicht des Bildschirms.', 'Ab höheren Leveln ist die Figur nur kurz sichtbar.'],
      keys: 'Zahl + Enter',
    },
    generate: (p) => DLR.gen.paths.generate(p),
  });
})();
