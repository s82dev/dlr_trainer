/* Konzept-Pool: eigene, kurze Verständnisfragen. Erste Antwort = richtige Antwort (wird beim Anzeigen gemischt).
   Ergänzt die parametrisierten Generatoren; alle Inhalte sind selbst formuliert. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const F = [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.85, 1.7, 1.55, 1.4];

  const ITEMS = [
    // ---- Technik ----
    ['TVT', 1, 4, 'Ein längerer Hebelarm bei gleicher Kraft bewirkt …', ['ein größeres Drehmoment', 'ein kleineres Drehmoment', 'keine Änderung des Drehmoments', 'eine kleinere Kraft am Drehpunkt'], 'Drehmoment = Kraft × Hebelarm.'],
    ['TVT', 1, 5, 'Warum lässt sich eine Mutter mit einem langen Schraubenschlüssel leichter lösen?', ['Der lange Hebelarm erzeugt bei gleicher Kraft ein größeres Drehmoment.', 'Ein langer Schlüssel ist schwerer.', 'Die Reibung im Gewinde sinkt.', 'Die Mutter wird dadurch kleiner.'], 'M = F·l.'],
    ['TVT', 2, 6, 'Zwei ineinandergreifende Zahnräder: Das kleinere hat halb so viele Zähne. Wie verhalten sich die Drehzahlen?', ['Das kleinere dreht doppelt so schnell.', 'Das kleinere dreht halb so schnell.', 'Beide drehen gleich schnell.', 'Das kleinere dreht viermal so schnell.'], 'Die Drehzahlen verhalten sich umgekehrt wie die Zähnezahlen.'],
    ['TVT', 2, 6, 'Bei gleichem Druck: Was passiert mit der Kraft, wenn die Kolbenfläche verdoppelt wird?', ['Die Kraft verdoppelt sich.', 'Die Kraft halbiert sich.', 'Die Kraft bleibt gleich.', 'Die Kraft vervierfacht sich.'], 'F = p·A.'],
    ['TVT', 3, 7, 'Zwei gleiche Lampen werden statt in Reihe nun parallel an dieselbe Batterie geschaltet. Was gilt für die Helligkeit jeder Lampe?', ['Jede Lampe leuchtet heller als in Reihe.', 'Jede Lampe leuchtet dunkler als in Reihe.', 'Die Helligkeit bleibt gleich.', 'Nur eine Lampe leuchtet.'], 'Parallel liegt an jeder Lampe die volle Spannung.'],
    ['TVT', 3, 8, 'Ein Gefäß mit breiter Basis und tief liegendem Schwerpunkt ist im Vergleich zu einem schmalen, hohen Gefäß …', ['standfester', 'weniger standfest', 'gleich standfest', 'nur bei Wasserfüllung standfester'], 'Kippen tritt ein, wenn die Schwerpunkt-Lotrechte die Standfläche verlässt.'],
    ['TVT', 2, 8, 'Ein Fluid in einem geschlossenen Behälter wird an einer Stelle unter Druck gesetzt. Der zusätzliche Druck …', ['wirkt an allen Stellen des Fluids gleich stark', 'wirkt nur an der Druckstelle', 'nimmt mit dem Abstand linear ab', 'wirkt nur nach unten'], 'Pascalsches Prinzip.'],
    ['TVT', 4, 9, 'Ein Schalter liegt parallel zu einer Lampe. Schließt man den Schalter, dann …', ['erlischt die Lampe (Kurzschluss der Lampe)', 'leuchtet die Lampe heller', 'ändert sich nichts', 'brennt die Lampe durch'], 'Der Strom nimmt den widerstandsfreien Weg über den Schalter.'],
    ['TVT', 3, 9, 'Ein Körper rutscht eine reibungsfreie schiefe Ebene hinab. Welche Größe bestimmt seine Beschleunigung (bei gleicher Erdbeschleunigung)?', ['der Neigungswinkel', 'seine Masse', 'seine Farbe', 'die Länge der Ebene'], 'a = g·sin α – unabhängig von der Masse.'],
    ['TVT', 5, 10, 'Ein Druckbehälter wird erwärmt (Volumen konstant). Der Druck …', ['steigt', 'sinkt', 'bleibt gleich', 'wird null'], 'Bei konstantem Volumen ist p proportional zur absoluten Temperatur.'],
    ['TVT', 1, 5, 'Welche Größe ändert ein Flaschenzug NICHT?', ['die aufzuwendende Arbeit (idealisiert)', 'die nötige Zugkraft', 'die Länge des gezogenen Seils', 'die Anzahl tragender Seile'], 'Kraft wird gespart, dafür wächst der Weg – die Arbeit bleibt gleich.'],
    ['TVT', 3, 8, 'Ein Kondensator ist für Gleichstrom nach dem Aufladen …', ['ein Unterbrecher (kein Strom)', 'ein Kurzschluss', 'ein Widerstand von 1 Ω', 'eine Spannungsquelle'], 'Im Gleichstromfall fließt nach dem Aufladen kein Strom mehr.'],
    // ---- Physik ----
    ['PHY', 1, 5, 'Ein Körper bewegt sich reibungsfrei mit konstanter Geschwindigkeit geradeaus. Die resultierende Kraft auf ihn ist …', ['null', 'größer als null und konstant', 'gleich seinem Gewicht', 'gleich der Geschwindigkeit'], 'Trägheitsprinzip: keine Änderung der Bewegung ohne resultierende Kraft.'],
    ['PHY', 1, 5, 'Verdoppelt man die Masse bei gleicher Kraft, so …', ['halbiert sich die Beschleunigung', 'verdoppelt sich die Beschleunigung', 'bleibt die Beschleunigung gleich', 'vervierfacht sich die Beschleunigung'], 'a = F / m.'],
    ['PHY', 2, 6, 'Auf einer Waage im ruhenden Aufzug steht eine Person. Der Aufzug beschleunigt nach oben. Die Waage zeigt …', ['mehr als das Ruhegewicht', 'weniger als das Ruhegewicht', 'genau das Ruhegewicht', 'null'], 'N = m(g + a).'],
    ['PHY', 2, 6, 'Zwei Körper unterschiedlicher Masse fallen im Vakuum aus gleicher Höhe. Sie …', ['kommen gleichzeitig unten an', 'der schwerere ist zuerst unten', 'der leichtere ist zuerst unten', 'der schwerere fällt doppelt so schnell'], 'Die Fallbeschleunigung hängt nicht von der Masse ab.'],
    ['PHY', 3, 7, 'Wird die Geschwindigkeit eines Körpers verdoppelt, so …', ['vervierfacht sich seine kinetische Energie', 'verdoppelt sich seine kinetische Energie', 'halbiert sich seine kinetische Energie', 'bleibt sie gleich'], 'E = ½mv².'],
    ['PHY', 2, 7, 'Ein Widerstand wird an eine höhere Spannung gelegt (Widerstand konstant). Der Strom …', ['steigt proportional zur Spannung', 'sinkt', 'bleibt gleich', 'steigt quadratisch'], 'Ohmsches Gesetz: I = U / R.'],
    ['PHY', 3, 8, 'Warum sinkt die Lufttemperatur in der Standardatmosphäre mit der Höhe?', ['Die Luft dehnt sich bei sinkendem Druck aus und kühlt ab.', 'Die Sonne strahlt in der Höhe weniger.', 'Die Luft wird dünner und dadurch dichter.', 'Der Wind kühlt die Luft.'], 'Ausdehnung geht mit Abkühlung einher.'],
    ['PHY', 4, 9, 'Ein Flugzeug fliegt im stationären Horizontalflug. Wie verhalten sich Auftrieb und Gewicht?', ['Der Auftrieb ist gleich dem Gewicht.', 'Der Auftrieb ist größer als das Gewicht.', 'Der Auftrieb ist kleiner als das Gewicht.', 'Der Auftrieb ist gleich dem Widerstand.'], 'Gleichgewicht der Kräfte in senkrechter Richtung.'],
    ['PHY', 4, 10, 'Bei einer Kurve mit 60° Querneigung im Horizontalflug beträgt der Lastfaktor …', ['2', '1', '1,5', '4'], 'n = 1 / cos φ, cos 60° = 0,5.'],
    ['PHY', 3, 9, 'Die Bernoulli-Gleichung sagt: Strömt ein Fluid schneller, dann …', ['sinkt der statische Druck', 'steigt der statische Druck', 'bleibt der statische Druck gleich', 'wird die Temperatur null'], 'Konstante Gesamtenergie im Strömungsfeld.'],
    ['PHY', 1, 6, 'Welche Einheit hat die Leistung?', ['Watt', 'Joule', 'Newton', 'Pascal'], 'P = W / t, Einheit W = J/s.'],
    ['PHY', 2, 7, 'Welche Temperatur entspricht 0 °C in Kelvin?', ['273,15 K', '0 K', '100 K', '373,15 K'], 'T[K] = T[°C] + 273,15.'],
  ];

  DLR.data.conceptBank = {
    count(m) { return ITEMS.filter((i) => i[0] === m).length; },
    pick(m, p) {
      const r = U.makeRng((p.seed ^ 0x51ed270b) >>> 0);
      const L = U.clamp(p.level, 1, 10);
      let pool = ITEMS.filter((i) => i[0] === m && L >= i[1] && L <= i[2] + 2);
      if (!pool.length) pool = ITEMS.filter((i) => i[0] === m);
      const it = r.pick(pool);
      const err = m === 'PHY' ? 'technische Fehlinterpretation' : 'technische Fehlinterpretation';
      const options = it[4].map((t, i) => ({ label: t, correct: i === 0, err, note: i === 0 ? null : 'Begriff/Prinzip verwechselt' }));
      const c = 8 + it[3].length / 12;
      return {
        kind: 'mc', level: L, difficulty: Math.min(10, (it[1] + it[2]) / 2), type: 'konzept', prompt: it[3], options, cols: 1,
        expectedSec: Math.round(c * 10) / 10, timeLimit: Math.round(c * F[L - 1] * 1.2 * (p.timeScale || 1)),
        solution: it[4][0], explain: it[5],
      };
    },
  };
})();
