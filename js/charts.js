/* Tiny dependency-free SVG charts */
(function () {
  const C = { teal: '#166534', teal2: '#4ade80', amber: '#f59e0b', orange: '#ea580c', track: '#e3eeec', blue: '#0369a1', violet: '#7c3aed' };
  function ring(val, max, size, label, sub, color) {
    const p = max ? Math.min(val / max, 1) : 0, sw = size * 0.11, rad = (size - sw) / 2, circ = 2 * Math.PI * rad;
    const col = color || (val > max * 1.05 ? C.orange : C.teal);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${rad}" fill="none" stroke="${C.track}" stroke-width="${sw}"/>
      ${p > 0 ? '' : '<!--'}<circle cx="${size / 2}" cy="${size / 2}" r="${rad}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${circ * p} ${circ}" transform="rotate(-90 ${size / 2} ${size / 2})"/>${p > 0 ? '' : '-->'}
      <text x="50%" y="${sub ? '48%' : '55%'}" class="ring-label" font-size="${size * 0.2}">${label}</text>
      ${sub ? `<text x="50%" y="66%" text-anchor="middle" font-size="${size * 0.1}" fill="#5b7471">${sub}</text>` : ''}</svg>`;
  }
  function donut(parts, size) {
    const tot = parts.reduce((a, p) => a + p.v, 0) || 1, sw = size * 0.18, rad = (size - sw) / 2, circ = 2 * Math.PI * rad;
    let off = 0;
    const segs = parts.map(p => { const len = circ * p.v / tot; const s = `<circle cx="${size / 2}" cy="${size / 2}" r="${rad}" fill="none" stroke="${p.c}" stroke-width="${sw}" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`; off += len; return s; }).join('');
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${rad}" fill="none" stroke="${C.track}" stroke-width="${sw}"/>${segs}</svg>`;
  }
  function bar(label, val, target, unit, isLimit) {
    const p = target ? val / target : 0;
    const cls = isLimit ? (p > 1 ? 'bad' : p > 0.8 ? 'warn' : '') : '';
    return `<div class="bar"><div class="lab"><span>${label}</span><span><b>${fmt(val)}</b> / ${fmt(target)} ${unit}</span></div><div class="trk"><div class="fill ${cls}" style="width:${Math.min(100, p * 100)}%"></div></div></div>`;
  }
  function fmt(v) { return v >= 100 ? Math.round(v).toLocaleString('en') : Math.round(v * 10) / 10; }
  /* series: [{pts:[{x:Date,y}], color, name}], band: [lo,hi] */
  function line(series, opt = {}) {
    const W = 340, H = opt.h || 170, P = { l: 34, r: 10, t: 12, b: 22 };
    const all = series.flatMap(s => s.pts);
    if (!all.length) return '';
    let ys = all.map(p => p.y); if (opt.band) ys = ys.concat(opt.band);
    let lo = Math.min(...ys), hi = Math.max(...ys); const pad = (hi - lo) * 0.15 || 5; lo -= pad; hi += pad;
    const xs = all.map(p => +p.x); let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 864e5; x1 += 864e5; }
    const X = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), Y = y => P.t + (1 - (y - lo) / (hi - lo)) * (H - P.t - P.b);
    let g = '';
    for (let i = 0; i <= 3; i++) { const v = lo + (hi - lo) * i / 3; g += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e8f0ee"/><text x="${P.l - 5}" y="${Y(v) + 4}" font-size="10" text-anchor="end" fill="#7a918e">${Math.round(v)}</text>`; }
    if (opt.band) g += `<rect x="${P.l}" width="${W - P.l - P.r}" y="${Y(opt.band[1])}" height="${Math.max(0, Y(opt.band[0]) - Y(opt.band[1]))}" fill="#16a34a" opacity=".08"/>`;
    const d0 = new Date(x0), d1 = new Date(x1); const f = d => (d.getMonth() + 1) + '/' + d.getDate();
    g += `<text x="${P.l}" y="${H - 5}" font-size="10" fill="#7a918e">${f(d0)}</text><text x="${W - P.r}" y="${H - 5}" font-size="10" text-anchor="end" fill="#7a918e">${f(d1)}</text>`;
    const paths = series.map(s => { const pts = [...s.pts].sort((a, b) => a.x - b.x); const d = pts.map((p, i) => (i ? 'L' : 'M') + X(+p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round"/>` + pts.map(p => `<circle cx="${X(+p.x)}" cy="${Y(p.y)}" r="3.2" fill="#fff" stroke="${s.color}" stroke-width="2"/>`).join(''); }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">${g}${paths}</svg>`;
  }
  window.NolaCharts = { ring, donut, bar, line, fmt, C };
})();
