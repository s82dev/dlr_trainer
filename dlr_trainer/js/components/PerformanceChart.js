/* Radar-Chart für das Leistungsprofil. Achsen ohne Daten werden als gestrichelte Linie ohne Punkt gezeigt. */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;
  const NS = 'http://www.w3.org/2000/svg';
  function el(t, a) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; }

  function radarChart(axes, opts) {
    opts = opts || {};
    const size = opts.size || 300, cx = size / 2, cy = size / 2, R = size * 0.34;
    const n = axes.length;
    const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, class: 'radar-svg', width: '100%', height: 'auto', role: 'img', 'aria-label': 'Leistungsprofil' });
    const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, frac) => [cx + R * frac * Math.cos(angle(i)), cy + R * frac * Math.sin(angle(i))];
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const pts = axes.map((_, i) => pt(i, f).join(',')).join(' ');
      svg.appendChild(el('polygon', { points: pts, fill: 'none', stroke: 'var(--border)', 'stroke-width': 1 }));
    });
    axes.forEach((_, i) => { const p = pt(i, 1); svg.appendChild(el('line', { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: 'var(--border)', 'stroke-width': 1 })); });
    const have = axes.filter((a) => a.value != null);
    if (have.length >= 3) {
      const poly = axes.map((a, i) => (a.value != null ? pt(i, U.clamp(a.value / 100, 0.04, 1)) : pt(i, 0.02))).map((p) => p.join(',')).join(' ');
      svg.appendChild(el('polygon', { points: poly, fill: 'color-mix(in srgb, var(--accent) 28%, transparent)', stroke: 'var(--accent)', 'stroke-width': 2 }));
    }
    axes.forEach((a, i) => {
      if (a.value == null) return;
      const p = pt(i, U.clamp(a.value / 100, 0.04, 1));
      svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: 3, fill: 'var(--accent)' }));
    });
    axes.forEach((a, i) => {
      const p = pt(i, 1.24);
      const anchor = Math.abs(Math.cos(angle(i))) < 0.15 ? 'middle' : Math.cos(angle(i)) > 0 ? 'start' : 'end';
      const t = el('text', { x: p[0], y: p[1], fill: a.value == null ? 'var(--text-faint)' : 'var(--text)', 'font-size': size * 0.032, 'text-anchor': anchor, 'dominant-baseline': 'central' });
      t.textContent = a.axis + (a.value != null ? ' ' + Math.round(a.value) : '');
      svg.appendChild(t);
    });
    return svg;
  }

  DLR.ui.radarChart = radarChart;
})();
