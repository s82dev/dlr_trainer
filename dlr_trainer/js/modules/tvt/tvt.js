(function () {
  'use strict';
  const DLR = window.DLR;
  DLR.registerModule({
    id: 'TVT', name: 'Technisches Verständnis', kind: 'trial', axis: 'Technik', heavy: false, minSlot: 180,
    defaultError: 'technische Fehlinterpretation', reactionBased: false,
    desc: 'Zahnräder, Riementriebe, Hebel, Flaschenzüge, Hydraulik, Gasdruck, Schaltkreise, Schwerpunkt, Energie, Auftrieb und Bewegung. Aufgaben werden aus Parametern erzeugt und die Grafik folgt den Zahlen (Zähnezahl, Hebelarm, Eintauchtiefe …).',
    intro: {
      how: ['Alle Aufgaben gelten reibungsfrei und idealisiert.', 'Prüfe zuerst, was die Grafik tatsächlich zeigt (Zähnezahl, Abstände, Schalterstellung).', 'Antwort per Klick oder Taste A–D.'],
      keys: 'A–D oder 1–4',
    },
    generate: (p) => {
      // Ein Teil der Aufgaben stammt aus dem Konzeptpool (eigene Formulierungen), der Rest aus den Parametergeneratoren.
      const r = DLR.util.makeRng(p.seed ^ 0x9e3779b1);
      if (DLR.data.conceptBank && r.chance(0.16)) return DLR.data.conceptBank.pick('TVT', p);
      return DLR.gen.technical.generate(p);
    },
  });
})();
