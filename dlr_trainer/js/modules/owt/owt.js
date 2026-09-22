(function () {
  'use strict';
  const DLR = window.DLR;
  DLR.registerModule({
    id: 'OWT', name: 'Visuelle Wahrnehmung – Instrumente', kind: 'trial', axis: 'Konzentration', heavy: false, minSlot: 180,
    defaultError: 'Wahrnehmungsfehler', reactionBased: false,
    desc: 'Analoge Instrumente (Geschwindigkeit, Höhe mit drei Zeigern, Kurs, Vertikalgeschwindigkeit) müssen tatsächlich abgelesen werden. Skalen sind mathematisch exakt; später gedreht, mit mehreren Instrumenten und kurzer Sichtzeit.',
    intro: {
      how: ['Lies den Zeigerstand exakt ab – die Skalen sind vereinfacht linear.', 'Höhe: drei Zeiger (10.000 / 1.000 / 100 ft).', 'Kurs: Wert unter der gelben Marke.', 'Ab höheren Leveln sind Skalen gedreht und die Anzeige verschwindet nach kurzer Zeit.'],
      keys: 'Zahl + Enter bzw. 1–5 / A–D',
    },
    generate: (p) => DLR.gen.instruments.generate(p),
  });
})();
