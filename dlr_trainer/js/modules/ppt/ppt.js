(function () {
  'use strict';
  const DLR = window.DLR;
  DLR.registerModule({
    id: 'PPT', name: 'Räumliches Denken – Würfelnetze', kind: 'trial', axis: 'Raum', heavy: false, minSlot: 180,
    defaultError: 'Wahrnehmungsfehler', reactionBased: false,
    desc: 'Ein 2D-Netz wird mental zum Würfel gefaltet. Welcher der Würfel A–D ist richtig – oder keiner (E)? Netze werden per 3D-Faltung erzeugt und mathematisch geprüft; Spiegel- und Rotationsfallen sind eingebaut.',
    intro: {
      how: ['Die Symbole des Netzes liegen nach dem Falten außen auf dem Würfel.', 'Achte auf Nachbarschaften, Drehung und Spiegelung der Symbole.', 'Ist keine Ansicht möglich, wähle E (Keiner).'],
      keys: 'A–D / E oder 1–5',
    },
    generate: (p) => DLR.gen.cube.generate(p),
  });
})();
