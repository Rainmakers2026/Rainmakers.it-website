// Generates the two Rainmakers illustrations (static SVG) + the coordinates of the animated rain overlay.
// Usage: node scripts/generate-art.cjs <outDir> [<inline hero TS module>]
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const fs = require('fs');
const out = process.argv[2];

// Official Rainmakers mark (logo SVG, path #31): umbrella turned inside out by the wind, rim like water.
const UMBRELLA =
  'M343.3,127.6c-13.7,0-25.6-8.1-31-19.8c-5.4,11.7-17.3,19.8-31,19.8s-25.6-8.1-31-19.8 c-5.4,11.7-17.3,19.8-31,19.8s-25.6-8.1-31-19.8c-5.4,11.7-17.3,19.8-31,19.8s-25.5-8.1-30.9-19.7c8.7,58.1,57.4,103.2,117.1,106.4 v89.1c0,6.3-4.6,12-10.9,12.6c-7.2,0.7-13.4-5-13.4-12.1v-4.2c0-2.4-1.3-4.5-3.3-5.7l0,0c-4.4-2.5-9.9,0.6-9.9,5.7v3.4 c0,13.2,9.8,24.7,22.9,25.9c15,1.4,27.7-10.4,27.7-25.2v-89.6c60-3,108.8-48.1,117.6-106.4C368.8,119.5,357,127.6,343.3,127.6z';
// Symbol box: x 120..380 (260), y 100..340 (240). Bowl centre x=250, rim y≈108, grip y≈300.
const SYM = { x0: 120, y0: 100, w: 260, h: 240, cx: 250, rim: 110, grip: 300 };

const C = { white: '#ffffff', peri: '#7b92e8', light: '#c9d3f7', indigo: '#4b61d1', cyan: '#2596be', navy: '#1b3a5c', dark: '#0b1a2c', mint: '#6fd3a8' };
const f = (n) => Math.round(n * 10) / 10;
let seed = 2011;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function defs(extra = '') {
  return `<defs>
  <symbol id="rm" viewBox="${SYM.x0} ${SYM.y0} ${SYM.w} ${SYM.h}"><path d="${UMBRELLA}"/></symbol>
  <!-- Glows are radial gradients, not blur filters: SVG filters are costly to rasterise and delayed first paint -->
  <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.light}" stop-opacity="0"/><stop offset="1" stop-color="${C.light}" stop-opacity=".16"/></linearGradient>
  <radialGradient id="glowSm"><stop offset="0" stop-color="${C.white}" stop-opacity=".5"/><stop offset=".5" stop-color="${C.light}" stop-opacity=".16"/><stop offset="1" stop-color="${C.light}" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowLeaf"><stop offset="0" stop-color="${C.mint}" stop-opacity=".55"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
  <radialGradient id="cloudGlow"><stop offset=".55" stop-color="${C.indigo}" stop-opacity=".32"/><stop offset="1" stop-color="${C.indigo}" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="${C.white}" stop-opacity=".55"/><stop offset=".45" stop-color="${C.peri}" stop-opacity=".22"/><stop offset="1" stop-color="${C.peri}" stop-opacity="0"/></radialGradient>
  <linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b52b8" stop-opacity=".55"/><stop offset="1" stop-color="#1b3a5c" stop-opacity=".35"/></linearGradient>
  <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#132c47"/><stop offset="1" stop-color="#0a1828"/></linearGradient>
  <linearGradient id="leaf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.mint}"/></linearGradient>
  <linearGradient id="streak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.light}" stop-opacity="0"/><stop offset="1" stop-color="${C.light}" stop-opacity=".5"/></linearGradient>
  ${extra}
</defs>`;
}

/** Umbrella (official mark) placed so that its bowl centre is at (cx, rimY) with width w. Returns geometry. */
function umbrella(cx, rimY, w, { fill = C.white, glow = true, opacity = 1 } = {}) {
  const s = w / SYM.w;
  const x = cx - (SYM.cx - SYM.x0) * s;
  const y = rimY - (SYM.rim - SYM.y0) * s;
  const halo = glow ? `<ellipse cx="${f(cx)}" cy="${f(rimY + w * 0.12)}" rx="${f(w * 0.68)}" ry="${f(w * 0.5)}" fill="url(#glowSm)" opacity="${opacity}"/>` : '';
  const svg = `${halo}<use href="#rm" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(SYM.h * s)}" fill="${fill}" opacity="${opacity}"/>`;
  return { svg, grip: { x: cx, y: y + (SYM.grip - SYM.y0) * s }, rimY, w };
}

/** Line-art person (head + rounded torso), like the Italian Rainforest visual language. */
function person(px, headY, scale = 1, { arm = null, armSide = 1 } = {}) {
  const r = 24 * scale;
  const sh = headY + r + 10 * scale; // shoulders
  const bw = 52 * scale;
  const bottom = 900;
  const body = `<path d="M${f(px - bw)},${bottom} V${f(sh + 38 * scale)} Q${f(px - bw)},${f(sh)} ${f(px - 16 * scale)},${f(sh)} H${f(px + 16 * scale)} Q${f(px + bw)},${f(sh)} ${f(px + bw)},${f(sh + 38 * scale)} V${bottom} Z" fill="${C.dark}" stroke="${C.light}" stroke-width="2" stroke-opacity=".85"/>`;
  const head = `<circle cx="${f(px)}" cy="${f(headY)}" r="${f(r)}" fill="${C.dark}" stroke="${C.light}" stroke-width="2" stroke-opacity=".85"/>`;
  let armSvg = '';
  if (arm) {
    const sx = px + armSide * 30 * scale;
    const sy = sh + 14 * scale;
    armSvg = `<line x1="${f(sx)}" y1="${f(sy)}" x2="${f(arm.x)}" y2="${f(arm.y + 6)}" stroke="${C.light}" stroke-opacity=".85" stroke-width="${f(17 * scale)}" stroke-linecap="round"/><line x1="${f(sx)}" y1="${f(sy)}" x2="${f(arm.x)}" y2="${f(arm.y + 6)}" stroke="${C.dark}" stroke-width="${f(13 * scale)}" stroke-linecap="round"/>`;
  }
  // arm drawn before body so the shoulder joint is hidden behind the torso outline
  return armSvg + body + head;
}

function sprout(x, y, h, s = 1) {
  return `<g opacity=".95"><path d="M${x},${y} C${x},${y - h * 0.4} ${x + 2},${y - h * 0.7} ${x},${y - h}" stroke="${C.mint}" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"/>
<path d="M${x},${y - h * 0.62} C${x - 18 * s},${y - h * 0.7} ${x - 26 * s},${y - h * 0.95} ${x - 24 * s},${y - h * 1.08} C${x - 10 * s},${y - h * 1.04} ${x - 2 * s},${y - h * 0.86} ${x},${y - h * 0.62}Z" fill="url(#leaf)"/>
<path d="M${x},${y - h * 0.8} C${x + 18 * s},${y - h * 0.88} ${x + 28 * s},${y - h * 1.12} ${x + 26 * s},${y - h * 1.26} C${x + 10 * s},${y - h * 1.22} ${x + 2 * s},${y - h * 1.04} ${x},${y - h * 0.8}Z" fill="url(#leaf)"/></g>`;
}

/** Milan skyline (Duomo, Torre Velasca, Pirellone, UniCredit, Bosco Verticale): where Rainmakers has been since 2011. */
function skyline(base, x0, k = 1, op = 1) {
  const g = [];
  const X = (v) => f(x0 + v * k);
  const Y = (v) => f(base - v * k);
  const fill = '#11263d';
  const line = `stroke="${C.light}" stroke-opacity=".28" stroke-width="1.2"`;
  // Duomo: facade + spires
  g.push(`<path d="M${X(0)},${Y(0)} V${Y(46)} L${X(30)},${Y(70)} L${X(60)},${Y(46)} V${Y(0)} Z" fill="${fill}" ${line}/>`);
  for (const [sx, h] of [[4, 72], [16, 80], [30, 104], [44, 80], [56, 72]]) g.push(`<path d="M${X(sx - 2)},${Y(46)} L${X(sx)},${Y(h)} L${X(sx + 2)},${Y(46)}" fill="${fill}" ${line}/>`);
  g.push(`<circle cx="${X(30)}" cy="${Y(107)}" r="${f(2.2 * k)}" fill="#ffd27a" opacity=".9"/>`); // the Madonnina
  // Torre Velasca (mushroom top)
  g.push(`<path d="M${X(84)},${Y(0)} V${Y(70)} H${X(78)} V${Y(96)} H${X(112)} V${Y(70)} H${X(106)} V${Y(0)} Z" fill="${fill}" ${line}/>`);
  // Pirellone (slim slab)
  g.push(`<path d="M${X(130)},${Y(0)} V${Y(118)} L${X(140)},${Y(122)} L${X(150)},${Y(118)} V${Y(0)} Z" fill="${fill}" ${line}/>`);
  // Bosco Verticale: two towers covered in trees (→ Italian Rainforest)
  for (const [bx, h] of [[176, 92], [204, 74]]) {
    g.push(`<rect x="${X(bx)}" y="${Y(h)}" width="${f(20 * k)}" height="${f(h * k)}" fill="${fill}" ${line}/>`);
    for (let r = 6; r < h - 4; r += 9) for (const c of [3, 10, 17]) if ((r + c) % 3) g.push(`<circle cx="${X(bx + c)}" cy="${Y(r)}" r="${f(2.1 * k)}" fill="${(r + c) % 2 ? C.mint : C.cyan}" opacity=".55"/>`);
  }
  // UniCredit tower with spire
  g.push(`<path d="M${X(246)},${Y(0)} V${Y(84)} Q${X(262)},${Y(132)} ${X(278)},${Y(84)} V${Y(0)} Z" fill="${fill}" ${line}/>`);
  g.push(`<line x1="${X(262)}" y1="${Y(118)}" x2="${X(262)}" y2="${Y(162)}" ${line}/>`);
  // lit windows: the businesses of the city
  for (const [wx, wh] of [[86, 64], [134, 110], [250, 78], [10, 40], [40, 40]]) for (let r = 8; r < wh; r += 11) g.push(`<rect x="${X(wx + ((r * 7) % 9))}" y="${Y(r)}" width="${f(3 * k)}" height="${f(2.4 * k)}" fill="${C.light}" opacity="${f(0.25 + ((r * 13) % 5) / 10)}"/>`);
  return `<g opacity="${op}">${g.join('')}</g>`;
}

/** Small walking figure (a client on the way), facing left. */
function walker(x, y, k) {
  const r = 6 * k;
  return `<g stroke="${C.light}" stroke-opacity=".8" stroke-width="1.6" fill="${C.dark}" stroke-linecap="round">
<path d="M${f(x - 5 * k)},${f(y)} L${f(x - 1 * k)},${f(y - 14 * k)} L${f(x + 5 * k)},${f(y)}" fill="none"/>
<rect x="${f(x - 7 * k)}" y="${f(y - 30 * k)}" width="${f(14 * k)}" height="${f(18 * k)}" rx="${f(6 * k)}"/>
<circle cx="${f(x - 1 * k)}" cy="${f(y - 30 * k - r - 2 * k)}" r="${f(r)}"/></g>`;
}

// ───────────────────────────── HERO (1200 × 900) ─────────────────────────────
// Italy seen at night: a glowing map with Rainmakers umbrellas pinned on the cities, Milan (home since 2011)
// as the hub of the network; a cloud over the north rains opportunities on a crowd of small rainmakers
// holding the inside-out umbrella, while clients walk towards them along a lit path.

/** Approximate Italian coastline / borders (lon, lat). Simplified on purpose: a recognisable silhouette. */
const ITALY = {
  main: [
    [7.53, 43.79], [8.2, 43.95], [8.9, 44.41], [9.5, 44.22], [9.85, 44.07], [10.25, 43.85], [10.3, 43.5], [10.5, 42.95],
    [11.1, 42.55], [11.8, 42.1], [12.25, 41.75], [12.6, 41.45], [13.05, 41.25], [13.6, 41.22], [14.0, 40.98],
    [14.25, 40.82], [14.45, 40.62], [14.8, 40.65], [15.0, 40.35], [15.5, 40.05], [15.75, 39.85], [16.05, 39.3],
    [16.1, 38.85], [15.9, 38.7], [15.65, 38.25], [15.65, 37.97], [16.05, 37.93], [16.55, 38.42], [16.6, 38.8],
    [17.15, 39.05], [17.1, 39.42], [16.6, 39.7], [16.55, 39.95], [17.2, 40.45], [17.75, 40.3], [18.05, 40.05],
    [18.36, 39.8], [18.5, 40.15], [18.0, 40.65], [17.4, 40.95], [16.85, 41.13], [16.05, 41.45], [15.9, 41.6],
    [16.2, 41.9], [15.95, 41.95], [15.1, 41.95], [14.6, 42.15], [14.2, 42.47], [13.85, 42.9], [13.6, 43.5],
    [13.0, 43.85], [12.57, 44.06], [12.28, 44.42], [12.5, 44.95], [12.2, 45.25], [12.35, 45.45], [13.1, 45.7],
    [13.77, 45.65], [13.7, 46.05], [13.5, 46.45], [12.7, 46.65], [12.1, 46.95], [11.5, 47.0], [10.45, 46.85],
    [10.1, 46.4], [9.3, 46.5], [9.0, 45.85], [8.7, 46.1], [8.4, 46.45], [7.86, 45.92], [7.0, 45.85], [6.8, 45.5],
    [7.1, 45.2], [6.65, 44.9], [6.95, 44.55], [6.95, 44.2], [7.53, 43.79],
  ],
  sicily: [
    [15.55, 38.27], [15.25, 37.85], [15.1, 37.5], [15.3, 37.05], [15.1, 36.68], [14.25, 37.06], [13.58, 37.28],
    [12.6, 37.65], [12.45, 38.02], [13.36, 38.15], [14.0, 38.04], [14.8, 38.15], [15.55, 38.27],
  ],
  sardinia: [
    [9.2, 41.25], [9.6, 40.95], [9.75, 40.35], [9.65, 39.6], [9.55, 39.15], [9.1, 39.2], [8.6, 38.9], [8.4, 39.1],
    [8.45, 39.75], [8.4, 40.4], [8.2, 40.6], [8.2, 40.92], [8.8, 40.95], [9.2, 41.25],
  ],
};
const CITIES = [
  ['Milano', 9.19, 45.46, 'hub'], ['Torino', 7.68, 45.07], ['Genova', 8.93, 44.41], ['Venezia', 12.33, 45.44],
  ['Bologna', 11.34, 44.49], ['Firenze', 11.25, 43.77], ['Roma', 12.5, 41.9], ['Napoli', 14.27, 40.85],
  ['Bari', 16.87, 41.12], ['Ancona', 13.5, 43.6], ['Trento', 11.12, 46.07], ['Cagliari', 9.11, 39.22],
  ['Palermo', 13.36, 38.12], ['Catania', 15.09, 37.5], ['Pescara', 14.2, 42.46], ['Cosenza', 16.25, 39.3],
];

function hero() {
  const W = 1200;
  const H = 900;
  const parts = [];

  // ── Camera in orbit over the Tyrrhenian Sea, looking north towards the Alps (true perspective) ──
  const ALT = 0.12; // in Earth radii (~760 km)
  const rad = (d) => (d * Math.PI) / 180;
  const vec = (lon, lat) => [Math.cos(rad(lat)) * Math.cos(rad(lon)), Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat))];
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const sc = (a, k) => a.map((v) => v * k);
  const norm = (a) => sc(a, 1 / Math.hypot(...a));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const camSurf = vec(13, 31);
  const cam = sc(camSurf, 1 + ALT);
  const fwd = norm(sub(vec(11, 48), cam));
  const right = norm(cross(fwd, camSurf));
  const up = cross(right, fwd);
  const raw = (p) => {
    const v = sub(p, cam);
    const z = dot(v, fwd);
    return [dot(v, right) / z, dot(v, up) / z];
  };
  const m0 = raw(vec(9.19, 45.46));
  const s0 = raw(vec(15.1, 36.7));
  const F = 440 / (m0[1] - s0[1]);
  const X0 = 560 - F * m0[0];
  const Y0 = 318 + F * m0[1];
  const toXY = (q) => [X0 + F * q[0], Y0 - F * q[1]];
  const P = ([lon, lat]) => toXY(raw(vec(lon, lat)));
  const seen = ([lon, lat]) => dot(vec(lon, lat), cam) > 1; // on the hemisphere cap visible from the camera
  const pathOf = (pts) => `M${pts.map((p) => P(p).map(f).join(',')).join(' L')} Z`;

  // horizon (limb): circle of tangency, projected
  const c0 = sc(camSurf, 1 / (1 + ALT));
  const rr = Math.sqrt(1 - 1 / (1 + ALT) ** 2);
  const u = norm(cross(camSurf, [0, 0, 1]));
  const w = cross(camSurf, u);
  const limb = [];
  for (let t = 0; t < 360; t += 1.5) {
    const p = c0.map((v, i) => v + rr * (Math.cos(rad(t)) * u[i] + Math.sin(rad(t)) * w[i]));
    if (dot(sub(p, cam), fwd) > 0) limb.push(toXY(raw(p)));
  }
  const hz = limb.filter(([x, y]) => x > -300 && x < W + 300 && y > -300 && y < H).sort((a, b) => a[0] - b[0]);
  const hzD = hz.map((p) => p.map(Math.round).join(',')).join(' L');
  const hzMid = hz.reduce((m, p) => (p[1] < m ? p[1] : m), Infinity);

  // space
  for (let i = 0; i < 70; i++) {
    const x = rand() * W;
    const y = rand() * (hzMid + 30);
    parts.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + rand() * 1.3)}" fill="${C.light}" opacity="${f(0.15 + rand() * 0.5)}"/>`);
  }
  // the Earth below the horizon, with a dawn of brand light along the limb
  parts.push(`<path d="M${hzD} L${W + 300},${H + 10} L-300,${H + 10} Z" fill="url(#earth)"/>`);
  parts.push(`<path d="M${hzD}" fill="none" stroke="${C.cyan}" stroke-opacity=".18" stroke-width="34"/>`);
  parts.push(`<path d="M${hzD}" fill="none" stroke="${C.peri}" stroke-opacity=".35" stroke-width="10"/>`);
  parts.push(`<path d="M${hzD}" fill="none" stroke="#e6ecff" stroke-opacity=".9" stroke-width="1.6"/>`);
  parts.push(`<ellipse cx="${f(W * 0.62)}" cy="${f(hzMid + 6)}" rx="520" ry="60" fill="url(#dawn)"/>`);

  // graticule converging to the horizon
  const lines = [];
  const poly = (pts) => {
    const vis = pts.filter(seen);
    if (vis.length < 2) return;
    lines.push(`<path d="M${vis.map((p) => P(p).map(Math.round).join(',')).join(' L')}"/>`);
  };
  for (let lon = -6; lon <= 34; lon += 2) poly(Array.from({ length: 28 }, (_, i) => [lon, 26 + i * 2.2]));
  for (let lat = 28; lat <= 80; lat += 2) poly(Array.from({ length: 40 }, (_, i) => [-30 + i * 1.8, lat]));
  parts.push(`<g fill="none" stroke="${C.light}" stroke-opacity=".08" stroke-width="1">${lines.join('')}</g>`);

  // ── Italy: halo, land, coastline, night texture ──
  const land = [ITALY.main, ITALY.sicily, ITALY.sardinia].map(pathOf).join(' ');
  parts.push(`<path d="${land}" fill="none" stroke="${C.indigo}" stroke-opacity=".3" stroke-width="16" stroke-linejoin="round"/>`);
  parts.push(`<path d="${land}" fill="url(#italy)" stroke="#dfe6ff" stroke-opacity=".9" stroke-width="1.6" stroke-linejoin="round"/>`);
  parts.push(`<path d="${land}" fill="url(#mapDots)" opacity=".45"/>`);

  // city lights: a warm-white core with a small cluster around it (life, business)
  const hub = P([9.19, 45.46]);
  const pulses = [];
  const arcs = [];
  for (const [, lon, lat, kind] of CITIES) {
    const [x, y] = P([lon, lat]);
    if (y > H - 10 || x < 0 || x > W) continue;
    pulses.push({ x: f(x), y: f(y), hub: kind === 'hub' });
    const cluster = Array.from({ length: kind === 'hub' ? 9 : 4 }, () => [x + (rand() - 0.5) * 18, y + (rand() - 0.5) * 9]);
    parts.push(`<g fill="#fff4d6">${cluster.map(([a, b]) => `<circle cx="${f(a)}" cy="${f(b)}" r="${f(0.7 + rand() * 0.9)}" opacity="${f(0.5 + rand() * 0.4)}"/>`).join('')}</g>`);
    parts.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${kind === 'hub' ? 26 : 10}" fill="url(#glowSm)"/><circle cx="${f(x)}" cy="${f(y)}" r="${kind === 'hub' ? 4.5 : 2.4}" fill="${C.white}"/>`);
    if (kind === 'hub') continue;
    const mx = (hub[0] + x) / 2;
    const my = Math.min(hub[1], y) - 28 - Math.abs(x - hub[0]) * 0.1;
    arcs.push(`<path d="M${f(hub[0])},${f(hub[1])} Q${f(mx)},${f(my)} ${f(x)},${f(y)}"/>`);
  }
  parts.push(`<g fill="none" stroke="url(#arc)" stroke-width="1.4" stroke-linecap="round">${arcs.join('')}</g>`);
  // Milan, the hub: Rainmakers' umbrella planted where it all started (2011)
  parts.push(umbrella(hub[0], hub[1] - 20, 26).svg);

  // ── The cloud rising over the horizon (no mark inside: it is the network itself) ──
  const cloudCircles = [[262, 214, 52], [330, 178, 70], [420, 160, 82], [510, 176, 70], [578, 212, 50], [380, 222, 60], [470, 224, 62]];
  parts.push(`<g>${cloudCircles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 46}" fill="url(#cloudGlow)"/>`).join('')}</g>`);
  parts.push(`<g>${cloudCircles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#cloud)"/>`).join('')}</g>`);
  // rim light from the dawn on the top of the cloud
  parts.push(`<g fill="none" stroke="#e6ecff" stroke-opacity=".35" stroke-width="1.6">${cloudCircles.slice(0, 5).map(([x, y, r]) => `<path d="M${f(x - r * 0.7)},${f(y - r * 0.7)} A${r},${r} 0 0 1 ${f(x + r * 0.7)},${f(y - r * 0.7)}"/>`).join('')}</g>`);
  parts.push(`<path d="M214,256 C320,276 520,276 624,256" stroke="${C.light}" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  // a few glints of light inside the cloud: opportunities forming
  parts.push(`<g fill="#fff">${[[350, 196], [418, 178], [482, 204], [300, 228], [540, 230], [440, 236]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.3}" opacity=".85"/>`).join('')}</g>`);

  // ── Foreground: a shore with a crowd of small rainmakers (bottom left, over the Tyrrhenian) ──
  parts.push(`<path d="M-10,812 C160,770 520,762 760,812 C820,826 860,860 880,910 L-10,910 Z" fill="url(#hill)"/>`);
  parts.push(`<path d="M-10,812 C160,770 520,762 760,812 C820,826 860,860 880,910" stroke="${C.peri}" stroke-opacity=".14" stroke-width="14" fill="none"/>`);
  parts.push(`<path d="M-10,812 C160,770 520,762 760,812 C820,826 860,860 880,910" stroke="${C.peri}" stroke-opacity=".65" stroke-width="2" fill="none"/>`);
  const back = [150, 222, 294, 366, 438, 510, 582].map((x, i) => [x, 744 + Math.abs(i - 3) * 3, 0.36, 42, i < 3 ? -1 : 1, i < 3 ? -5 : 5]);
  const front = [186, 258, 330, 402, 474, 546, 618].map((x, i) => [x, 808 + Math.abs(i - 3) * 4, 0.46, 50, i < 3 ? -1 : 1, i < 3 ? -7 : 7]);
  const overlay = [];
  const drawRow = (row) => {
    const us = row.map(([x, headY, s, uw, , off]) => ({ ...umbrella(x + off, headY - 150 * s, uw), cx: x + off }));
    for (const uu of us) {
      parts.push(`<ellipse cx="${f(uu.cx)}" cy="${f(uu.rimY + 6)}" rx="${f(uu.w * 0.72)}" ry="${f(uu.w * 0.5)}" fill="url(#halo)"/>`);
      parts.push(uu.svg);
      parts.push(`<g fill="${C.white}">${[-0.2, 0, 0.18].map((k, i) => `<circle cx="${f(uu.cx + k * uu.w)}" cy="${f(uu.rimY - 3 - (i === 1 ? 3 : 0))}" r="${i === 1 ? 1.7 : 1.2}" opacity=".9"/>`).join('')}</g>`);
      if (uu.cx > 230 && uu.cx < 610) overlay.push({ x: uu.cx, rimY: uu.rimY, w: uu.w });
    }
    row.forEach(([x, headY, s, , side], i) => parts.push(person(x, headY, s, { arm: us[i].grip, armSide: side })));
  };
  drawRow(back);
  drawRow(front);
  for (const [x, y, h, s] of [[72, 806, 28, 0.75], [104, 800, 36, 0.85], [676, 806, 28, 0.75]]) parts.push(sprout(x, y, h, s));

  // clients walking in from the right along a lit path, towards the rainmakers
  parts.push(`<path d="M1210,872 C1080,860 900,846 720,834" stroke="${C.peri}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="1 8" stroke-linecap="round" fill="none"/>`);
  for (const [x, y, k] of [[760, 838, 0.72], [824, 843, 0.78], [892, 849, 0.84], [966, 855, 0.9], [1044, 862, 0.96]]) parts.push(walker(x, y, k));

  // faint rain trails from the cloud (the animated drops follow them)
  parts.push(`<g stroke="${C.light}" stroke-opacity=".2" stroke-width="1.4" stroke-dasharray="2 9" stroke-linecap="round">${overlay.map((o) => `<path d="M${f(o.x)},270 L${f(o.x)},${f(o.rimY - 12)}"/>`).join('')}</g>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Rainmakers</title>
<desc id="d">Italy seen from orbit at night, along the curve of the Earth: its cities glow and are connected to Milan; a cloud rising over the horizon rains on a crowd of small entrepreneurs holding umbrellas turned inside out — the Rainmakers mark — while clients walk towards them along a lit path.</desc>
${defs(`<linearGradient id="italy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c43a0" stop-opacity=".55"/><stop offset="1" stop-color="#1b3a5c" stop-opacity=".75"/></linearGradient>
  <pattern id="mapDots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r=".9" fill="${C.light}" opacity=".55"/></pattern>
  <linearGradient id="earth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17305a"/><stop offset=".18" stop-color="#0e2240"/><stop offset="1" stop-color="#0a1828"/></linearGradient>
  <radialGradient id="dawn"><stop offset="0" stop-color="#bfe9ff" stop-opacity=".35"/><stop offset=".5" stop-color="${C.cyan}" stop-opacity=".12"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
  <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="${C.peri}" stop-opacity=".25"/></linearGradient>`)}
${parts.join('\n')}
</svg>`;
  fs.writeFileSync(`${out}/hero-rainmakers.svg`, svg);
  return { W, H, overlay, pulses, cloudBottom: 270 };
}

// ───────────────────── BENEFITS: shelter vs harvest (1000 × 560) ─────────────────────
function shelter() {
  const W = 1000;
  const H = 560;
  const p = [];
  // rain everywhere (static streaks)
  for (let i = 0; i < 46; i++) {
    const x = 20 + rand() * 960;
    const y = 20 + rand() * 260;
    p.push(`<line x1="${f(x)}" y1="${f(y)}" x2="${f(x - 4)}" y2="${f(y + 22)}" stroke="url(#streak)" stroke-width="2" stroke-linecap="round"/>`);
  }
  p.push(skyline(492, 520, 0.62, 0.55));
  // ground
  p.push(`<path d="M0,500 C300,478 700,478 1000,500 L1000,560 L0,560 Z" fill="url(#hill)"/>`);
  p.push(`<path d="M0,500 C300,478 700,478 1000,500" stroke="${C.peri}" stroke-opacity=".45" stroke-width="1.6" fill="none"/>`);

  // LEFT — alone, sheltering under an open umbrella: the rain bounces off
  const lx = 220;
  const dome = `<path d="M${lx - 92},210 Q${lx},110 ${lx + 92},210 Q${lx + 69},196 ${lx + 46},210 Q${lx + 23},196 ${lx},210 Q${lx - 23},196 ${lx - 46},210 Q${lx - 69},196 ${lx - 92},210 Z" fill="#2a3f5c" stroke="${C.light}" stroke-opacity=".55" stroke-width="2"/>`;
  p.push(dome);
  p.push(`<line x1="${lx}" y1="210" x2="${lx}" y2="318" stroke="${C.light}" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>`);
  // drops deflected away from the closed-off umbrella
  p.push(`<g stroke="${C.light}" stroke-opacity=".45" stroke-width="2" stroke-linecap="round" fill="none">
<path d="M${lx - 70},174 q-16,-14 -30,-6"/><path d="M${lx - 30},146 q-10,-16 -26,-14"/><path d="M${lx + 30},146 q10,-16 26,-14"/><path d="M${lx + 70},174 q16,-14 30,-6"/></g>`);
  // the person, muted
  const lone = person(lx + 30, 372, 0.95, { arm: { x: lx, y: 306 }, armSide: -1 }).replace(/stroke-opacity="\.85"/g, 'stroke-opacity=".45"');
  p.push(lone);

  // divider: a gust of wind that turns the umbrella over
  p.push(`<g fill="none" stroke="${C.peri}" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round">
<path d="M380,300 C430,280 470,320 520,296 C548,284 552,262 536,254"/><path d="M400,340 C450,330 490,354 540,340"/></g>`);
  // …and the wind lifts an umbrella, turning it inside out mid-air (the moment the mark is born)
  p.push(`<g transform="rotate(-24 470 214)">${umbrella(470, 214, 64, { opacity: 0.85 }).svg}</g>`);
  p.push(`<g fill="none" stroke="${C.light}" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"><path d="M420,236 q14,-26 40,-34"/><path d="M432,254 q20,-24 46,-26"/></g>`);

  // RIGHT — together, umbrellas turned inside out: the rain is collected and becomes growth
  const group = [
    [650, 352, 0.9, 84, -1, -30],
    [770, 330, 1.0, 104, 1, 24],
    [890, 352, 0.9, 84, 1, 30],
  ];
  const us = group.map(([x, headY, s, uw, , off]) => ({ ...umbrella(x + off, headY - 140 * s, uw), cx: x + off }));
  // threads connecting the umbrellas (the network)
  p.push(`<path d="M${f(us[0].cx)},${f(us[0].rimY - 6)} Q${f((us[0].cx + us[1].cx) / 2)},${f(us[1].rimY - 60)} ${f(us[1].cx)},${f(us[1].rimY - 6)} Q${f((us[1].cx + us[2].cx) / 2)},${f(us[1].rimY - 60)} ${f(us[2].cx)},${f(us[2].rimY - 6)}" stroke="${C.light}" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="3 7" fill="none"/>`);
  // puddles of collected rain at their feet, with ripples
  for (const [x, w] of [[588, 34], [710, 40], [830, 40], [952, 34]]) {
    p.push(`<ellipse cx="${x}" cy="526" rx="${w}" ry="10" fill="url(#glowSm)" opacity=".7"/>`);
    p.push(`<g fill="none" stroke="${C.light}" stroke-width="1.2"><ellipse cx="${x}" cy="526" rx="${f(w * 0.5)}" ry="5" stroke-opacity=".4"/><ellipse cx="${x}" cy="526" rx="${f(w * 0.85)}" ry="8" stroke-opacity=".18"/></g>`);
  }
  for (const u of us) {
    p.push(`<ellipse cx="${f(u.cx)}" cy="${f(u.rimY + 12)}" rx="${f(u.w * 0.8)}" ry="${f(u.w * 0.6)}" fill="url(#halo)"/>`);
    p.push(u.svg);
    p.push(`<g fill="${C.white}">${[-0.2, 0, 0.18].map((k, i) => `<circle cx="${f(u.cx + k * u.w)}" cy="${f(u.rimY - 4 - (i === 1 ? 5 : 0))}" r="${i === 1 ? 2.4 : 1.7}"/>`).join('')}</g>`);
  }
  group.forEach(([x, headY, s, , side], i) => p.push(person(x, headY, s, { arm: us[i].grip, armSide: side })));
  for (const [x, h, s] of [[548, 30, 0.8], [584, 22, 0.65], [968, 32, 0.85]]) p.push(sprout(x, 494, h, s));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Shelter or harvest</title>
<desc id="d">On the left a person alone shelters under an open umbrella and the rain bounces off; on the right, after a gust of wind, three people hold umbrellas turned inside out — the Rainmakers mark — collect the rain and shoots grow at their feet.</desc>
${defs()}
${p.join('\n')}
</svg>`;
  fs.writeFileSync(`${out}/shelter-harvest.svg`, svg);
  return { W, H, overlay: us.map((u) => ({ x: u.cx, rimY: u.rimY, w: u.w })) };
}

const result = { hero: hero(), shelter: shelter() };
fs.writeFileSync(`${out}/coords.json`, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result));

// Optional: the hero is also emitted as inline markup (ids prefixed) so it renders with the HTML,
// without an extra request and without becoming the LCP image. Usage: node generate-art.cjs <outDir> <tsModule>
if (process.argv[3]) {
  const raw = fs.readFileSync(`${out}/hero-rainmakers.svg`, 'utf8');
  const inner = raw
    .replace(/^<svg[^>]*>\n?/, '')
    .replace(/\n?<\/svg>\s*$/, '')
    .replace(/<title[\s\S]*?<\/desc>\n?/, '')
    .replace(/id="([\w-]+)"/g, 'id="ha-$1"')
    .replace(/url\(#([\w-]+)\)/g, 'url(#ha-$1)')
    .replace(/href="#([\w-]+)"/g, 'href="#ha-$1"');
  fs.writeFileSync(process.argv[3], `// Generated by scripts/generate-art.cjs: do not edit by hand.\nexport const HERO_SVG_INNER =\n  ${JSON.stringify(inner)};\n`);
}
