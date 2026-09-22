/* Analoge Instrumente als SVG. Skala und Zeiger sind rein mathematisch definiert (Wert -> Winkel),
   keine statischen Bilder. Instrumente lassen sich per `rot` drehen (Skala gedreht, Beschriftung bleibt lesbar).
   Vereinfachte, lineare Skalen für Trainingszwecke – keine realen Flugzeugmuster. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  const polar = (r, ang) => { const a = ((ang - 90) * Math.PI) / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
  const P = (pt) => pt[0].toFixed(2) + ',' + pt[1].toFixed(2);

  const SPEC = {
    speed: { name: 'Geschwindigkeit', short: 'IAS', unit: 'kt', min: 0, max: 280, step: 5, angle: (v) => 210 + (v / 280) * 300 },
    alt: { name: 'Höhe', short: 'ALT', unit: 'ft', min: 0, max: 39980, step: 20, angle: null },
    hdg: { name: 'Kurs', short: 'HDG', unit: '°', min: 0, max: 355, step: 5, angle: null },
    vsi: { name: 'Vertikalgeschwindigkeit', short: 'VS', unit: 'ft/min', min: -2000, max: 2000, step: 100, angle: (v) => 270 + (v / 2000) * 170 },
  };

  function baseFace(svg, rot) {
    svg.appendChild(el('circle', { cx: 0, cy: 0, r: 107, fill: '#1c2530', stroke: '#3a4656', 'stroke-width': 2 }));
    svg.appendChild(el('circle', { cx: 0, cy: 0, r: 100, fill: '#0b1016' }));
  }
  function tick(svg, ang, len, w, col) {
    const a = polar(98, ang), b = polar(98 - len, ang);
    svg.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col || '#dfe6ee', 'stroke-width': w, 'stroke-linecap': 'butt' }));
  }
  function label(svg, ang, r, text, size) {
    const p = polar(r, ang);
    svg.appendChild(el('text', { x: p[0], y: p[1], fill: '#e8edf3', 'font-size': size || 15, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'ui-monospace, Menlo, Consolas, monospace', 'font-weight': 600 }, text));
  }
  function arc(svg, a1, a2, col) {
    const p1 = polar(91, a1), p2 = polar(91, a2);
    const large = ((a2 - a1 + 360) % 360) > 180 ? 1 : 0;
    svg.appendChild(el('path', { d: `M ${P(p1)} A 91 91 0 ${large} 1 ${P(p2)}`, fill: 'none', stroke: col, 'stroke-width': 5 }));
  }
  function needle(len, w, col, tail) {
    const g = el('g');
    g.appendChild(el('polygon', { points: `0,${-len} ${-w},${tail || 12} ${w},${tail || 12}`, fill: col }));
    return g;
  }
  function cap(svg) { svg.appendChild(el('circle', { cx: 0, cy: 0, r: 6, fill: '#2b3644', stroke: '#0b1016', 'stroke-width': 1.5 })); }

  /** type: 'speed' | 'alt' | 'hdg' | 'vsi'. opts: {size, rot, arcs:[{from,to,color}], fine (feinere Skala)} */
  function create(type, opts) {
    opts = opts || {};
    const rot = opts.rot || 0, spec = SPEC[type];
    const svg = el('svg', { viewBox: '-110 -110 220 220', width: opts.size || 168, height: opts.size || 168, class: 'gauge gauge-' + type, role: 'img', 'aria-label': spec.name });
    baseFace(svg, rot);
    let setFn;

    if (type === 'speed' || type === 'vsi') {
      const ang = (v) => spec.angle(v) + rot;
      if (opts.arcs) opts.arcs.forEach((a) => arc(svg, ang(a.from), ang(a.to), a.color));
      if (type === 'speed') {
        for (let v = 0; v <= 280; v += 5) { const major = v % 20 === 0; tick(svg, ang(v), major ? 14 : (v % 10 === 0 ? 9 : 5), major ? 2.4 : 1.2); }
        for (let v = 0; v <= 280; v += 40) label(svg, ang(v), 70, String(v));
      } else {
        const inc = opts.fine ? 50 : 100;
        for (let v = -2000; v <= 2000; v += inc) { const major = v % 500 === 0; tick(svg, ang(v), major ? 14 : 7, major ? 2.4 : 1.2); }
        for (let v = -2000; v <= 2000; v += 500) label(svg, ang(v), 70, String(Math.abs(v) / 100), 15);
        svg.appendChild(el('text', { x: 0, y: -22, fill: '#8fa0b3', 'font-size': 9, 'text-anchor': 'middle', 'font-family': 'ui-monospace, monospace' }, '×100 ft/min'));
      }
      svg.appendChild(el('text', { x: 0, y: 46, fill: '#8fa0b3', 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'ui-monospace, monospace' }, spec.short + ' ' + spec.unit));
      const n = needle(84, 3.4, '#f5b83d'); svg.appendChild(n); cap(svg);
      setFn = (v) => n.setAttribute('transform', `rotate(${ang(U.clamp(v, spec.min, spec.max)).toFixed(2)})`);
    } else if (type === 'alt') {
      for (let i = 0; i < 50; i++) { const major = i % 5 === 0; tick(svg, i * 7.2 + rot, major ? 14 : 6, major ? 2.4 : 1.1); }
      for (let d = 0; d < 10; d++) label(svg, d * 36 + rot, 70, String(d), 17);
      svg.appendChild(el('text', { x: 0, y: 40, fill: '#8fa0b3', 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'ui-monospace, monospace' }, 'ALT ft'));
      const h10k = needle(46, 5.5, '#dfe6ee', 4), h1k = needle(62, 4, '#f5b83d', 8), h100 = needle(88, 2.2, '#ffffff', 16);
      h10k.firstChild.setAttribute('points', '0,-46 -7,-28 -4,-28 -4,8 4,8 4,-28 7,-28');
      [h10k, h1k, h100].forEach((n) => svg.appendChild(n)); cap(svg);
      setFn = (v) => {
        v = U.clamp(v, 0, 99999);
        h100.setAttribute('transform', `rotate(${((v % 1000) / 1000 * 360 + rot).toFixed(2)})`);
        h1k.setAttribute('transform', `rotate(${(((v % 10000) / 10000) * 360 + rot).toFixed(2)})`);
        h10k.setAttribute('transform', `rotate(${((v / 100000) * 360 + rot).toFixed(2)})`);
      };
    } else { // hdg
      const card = el('g'); svg.appendChild(card);
      const names = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
      for (let d = 0; d < 360; d += 5) {
        const major = d % 10 === 0;
        const a = polar(98, d), b = polar(98 - (major ? 12 : 6), d);
        card.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#dfe6ee', 'stroke-width': d % 30 === 0 ? 2.4 : 1.2 }));
        if (d % 30 === 0) {
          const p = polar(72, d);
          const t = el('text', { x: p[0], y: p[1], fill: names[d] ? '#f5b83d' : '#e8edf3', 'font-size': 15, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'ui-monospace, monospace', 'font-weight': 700, transform: `rotate(${d} ${p[0]} ${p[1]})` }, names[d] || String(d / 10));
          card.appendChild(t);
        }
      }
      // feste Marke (Lubber-Linie) bei Winkel rot
      const lm = el('polygon', { points: '0,-104 -7,-90 7,-90', fill: '#f5b83d', transform: `rotate(${rot})` });
      svg.appendChild(lm);
      svg.appendChild(el('path', { d: 'M0,-20 L5,8 L0,4 L-5,8 Z', fill: '#dfe6ee', transform: `rotate(${rot})` }));
      svg.appendChild(el('text', { x: 0, y: 46, fill: '#8fa0b3', 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'ui-monospace, monospace' }, 'HDG °'));
      setFn = (v) => card.setAttribute('transform', `rotate(${(rot - U.normDeg(v)).toFixed(2)})`);
    }
    const g = { type, el: svg, spec, rot, value: null, set(v) { g.value = v; setFn(v); } };
    return g;
  }

  DLR.ui.gauges = { create, SPEC };
})();
