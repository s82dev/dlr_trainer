(function () {
  'use strict';
  const DLR = window.DLR;
  DLR.registerModule({
    id: 'PHY', name: 'Physik', kind: 'trial', axis: 'Technik', heavy: false, minSlot: 180,
    defaultError: 'technische Fehlinterpretation', reactionBased: false,
    desc: 'Newtonsche Grundprinzipien, Kraft, Arbeit, Energie, Druck, Temperatur, Elektrik und einfache Flugphysik. Jede Aufgabe ist nachvollziehbar berechenbar; bei Fehlern erscheint der Rechenweg.',
    intro: {
      how: ['g = 10 m/s², Wasser 1000 kg/m³ – falls nichts anderes angegeben.', 'Bis Level 6 Auswahlantworten, danach Zahleneingabe.', 'Flugphysik nutzt ausgewiesene Faustformeln.'],
      keys: 'A–D / Zahl + Enter',
    },
    generate: (p) => DLR.gen.physics.generate(p),
  });
})();
