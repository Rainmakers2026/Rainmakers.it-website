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
function hero() {
  const W = 1200;
  const H = 900;
  const parts = [];
  // stars / particles
  for (let i = 0; i < 70; i++) {
    const x = rand() * W;
    const y = rand() * 620;
    parts.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + rand() * 1.4)}" fill="${C.light}" opacity="${f(0.15 + rand() * 0.45)}"/>`);
  }
  // faint perspective grid (map-like, as in Italian Rainforest)
  const grid = [];
  for (let i = 0; i <= 10; i++) grid.push(`<path d="M${f(60 + i * 108)},120 L${f(20 + i * 116)},760" />`);
  for (let j = 0; j <= 5; j++) grid.push(`<path d="M40,${f(150 + j * 110)} Q600,${f(130 + j * 110)} 1160,${f(150 + j * 110)}" />`);
  parts.push(`<g stroke="${C.peri}" stroke-opacity=".07" stroke-width="1" fill="none">${grid.join('')}</g>`);

  // ── The cloud: a network of people and connections ──
  const cloudCircles = [
    [420, 250, 78], [505, 200, 100], [625, 168, 120], [748, 196, 104], [842, 248, 76], [560, 262, 86], [700, 262, 92],
  ];
  parts.push(`<g>${cloudCircles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 46}" fill="url(#cloudGlow)"/>`).join('')}</g>`);
  parts.push(`<g>${cloudCircles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#cloud)"/>`).join('')}</g>`);
  // cloud underside flat edge
  parts.push(`<path d="M352,300 C470,322 760,322 908,300" stroke="${C.light}" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  // nodes + edges inside the cloud
  const nodes = [];
  for (let i = 0; i < 34; i++) {
    const [cx, cy, r] = cloudCircles[i % cloudCircles.length];
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * r * 0.78;
    nodes.push([cx + Math.cos(a) * d, Math.min(cy + Math.sin(a) * d, 292)]);
  }
  const edges = [];
  nodes.forEach((n, i) => {
    const near = nodes.map((m, j) => [j, Math.hypot(m[0] - n[0], m[1] - n[1])]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2);
    for (const [j] of near) if (i < j) edges.push(`<line x1="${f(n[0])}" y1="${f(n[1])}" x2="${f(nodes[j][0])}" y2="${f(nodes[j][1])}"/>`);
  });
  parts.push(`<g stroke="${C.light}" stroke-opacity=".38" stroke-width="1.2">${edges.join('')}</g>`);
  parts.push(`<g fill="${C.white}">${nodes.map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 5 === 0 ? 4.2 : 2.4}" opacity="${i % 5 === 0 ? 0.95 : 0.7}"/>`).join('')}</g>`);
  // hubs inside the cloud: small Rainmakers marks (as on the Italian Rainforest map)
  const hubs = [[505, 205, 30], [628, 158, 38], [752, 210, 30]];
  for (const [x, y, w] of hubs) {
    parts.push(`<circle cx="${x}" cy="${y + 6}" r="${w * 0.95}" fill="url(#halo)"/>`);
    parts.push(umbrella(x, y, w).svg);
  }

  // ── Wind from the left: what turns the umbrellas inside out ──
  parts.push(`<g fill="none" stroke="${C.peri}" stroke-linecap="round" stroke-opacity=".45" stroke-width="2.2">
<path d="M40,430 C120,410 170,452 250,428 C290,416 300,392 282,380"/>
<path d="M70,486 C160,470 210,506 300,486"/>
<path d="M30,540 C110,528 150,560 230,546 C262,540 270,524 258,516"/></g>`);

  // ── Milan on the horizon, behind the ridge ──
  parts.push(skyline(800, 92, 1.05, 0.9));
  parts.push(skyline(806, 860, 0.8, 0.6));

  // ── The hill / ridge ──
  parts.push(`<path d="M0,808 C260,742 940,742 1200,808 L1200,900 L0,900 Z" fill="url(#hill)"/>`);
  parts.push(`<path d="M0,808 C260,742 940,742 1200,808" stroke="${C.peri}" stroke-opacity=".12" stroke-width="14" fill="none"/>`);
  parts.push(`<path d="M0,808 C260,742 940,742 1200,808" stroke="${C.peri}" stroke-opacity=".6" stroke-width="2" fill="none"/>`);

  // ── People holding inside-out umbrellas (the Rainmakers mark) ──
  const crowd = [
    // [x, headY, scale, umbrellaWidth, armSide, umbrellaOffsetX]
    [372, 640, 0.92, 92, -1, -34],
    [497, 612, 1.0, 102, -1, -24],
    [628, 590, 1.12, 132, 1, 26],
    [762, 612, 1.0, 102, 1, 24],
    [884, 640, 0.92, 92, 1, 34],
  ];
  const overlay = [];
  // umbrellas first (behind people's arms), halos around the central rainmaker
  const umbrellas = crowd.map(([x, headY, s, uw, , off]) => {
    const cx = x + off;
    const rimY = headY - 150 * s;
    return { ...umbrella(cx, rimY, uw), cx };
  });
  parts.push(`<g>${umbrellas.map((u) => `<path d="M${f(u.cx - 10)},318 L${f(u.cx + 10)},318 L${f(u.cx + u.w * 0.48)},${f(u.rimY - 4)} L${f(u.cx - u.w * 0.48)},${f(u.rimY - 4)} Z" fill="url(#shaft)"/>`).join('')}</g>`);
  const main = umbrellas[2];
  for (const r of [86, 124, 164]) parts.push(`<circle cx="${f(main.cx)}" cy="${f(main.rimY + 26)}" r="${r}" fill="none" stroke="${C.light}" stroke-opacity="${f(0.32 - r / 900)}" stroke-width="1.4"/>`);
  for (const u of umbrellas) {
    parts.push(`<ellipse cx="${f(u.cx)}" cy="${f(u.rimY + 14)}" rx="${f(u.w * 0.75)}" ry="${f(u.w * 0.55)}" fill="url(#halo)"/>`);
    parts.push(u.svg);
    // collected light: sparkles resting in the bowl (prosperity, opportunities)
    parts.push(`<g fill="${C.white}">${[-0.22, 0, 0.2].map((k, i) => `<circle cx="${f(u.cx + k * u.w)}" cy="${f(u.rimY - 4 - (i === 1 ? 6 : 0))}" r="${i === 1 ? 2.6 : 1.8}" opacity=".9"/>`).join('')}</g>`);
    overlay.push({ x: u.cx, rimY: u.rimY, w: u.w });
  }
  // light flowing from each umbrella down through the people into the ground → roots
  const roots = [];
  crowd.forEach(([x], i) => {
    const gx = x + (i - 2) * 6;
    roots.push(`<path d="M${gx},806 C${gx - 30},830 ${gx - 50},852 ${gx - 80},876"/><path d="M${gx},806 C${gx + 24},836 ${gx + 40},858 ${gx + 70},884"/><path d="M${gx},806 V884"/>`);
  });
  void roots; // hidden behind the figures: not drawn
  crowd.forEach(([x, headY, s, , side], i) => {
    parts.push(person(x, headY, s, { arm: umbrellas[i].grip, armSide: side }));
  });

  // ── Growth: shoots between people and a young tree of light on the right (→ Italian Rainforest) ──
  for (const [x, y, h, s] of [[176, 792, 34, 0.85], [236, 784, 44, 1], [286, 780, 28, 0.75], [978, 784, 36, 0.9]]) parts.push(sprout(x, y, h, s));
  const tx = 1060;
  const ty = 800;
  const branches = [
    `M${tx},${ty} C${tx},${ty - 60} ${tx - 4},${ty - 110} ${tx},${ty - 170}`,
    `M${tx},${ty - 70} C${tx - 30},${ty - 90} ${tx - 50},${ty - 120} ${tx - 64},${ty - 150}`,
    `M${tx},${ty - 96} C${tx + 30},${ty - 112} ${tx + 48},${ty - 140} ${tx + 58},${ty - 168}`,
    `M${tx},${ty - 140} C${tx - 18},${ty - 156} ${tx - 26},${ty - 178} ${tx - 30},${ty - 198}`,
    `M${tx},${ty - 150} C${tx + 16},${ty - 170} ${tx + 22},${ty - 192} ${tx + 22},${ty - 214}`,
  ];
  parts.push(`<g stroke="${C.mint}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85">${branches.map((d) => `<path d="${d}"/>`).join('')}</g>`);
  const leaves = [[tx - 64, ty - 150], [tx + 58, ty - 168], [tx - 30, ty - 198], [tx + 22, ty - 214], [tx, ty - 170], [tx - 40, ty - 124], [tx + 36, ty - 134]];
  parts.push(`<g>${leaves.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 26 : 18}" fill="url(#glowLeaf)"/>`).join('')}</g>`);
  parts.push(`<g>${leaves.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 9 : 6}" fill="${i % 2 ? C.cyan : C.mint}" opacity=".85"/>`).join('')}</g>`);

  // ── Clients on their way to the entrepreneurs, along a lit path ──
  parts.push(`<path d="M1200,872 C1120,864 1060,846 990,826" stroke="${C.peri}" stroke-opacity=".5" stroke-width="2" stroke-dasharray="1 8" stroke-linecap="round" fill="none"/>`);
  for (const [x, y, k] of [[1004, 832, 0.9], [1052, 848, 1], [1104, 860, 1.1], [1160, 870, 1.2]]) parts.push(walker(x, y, k));

  // ── Faint dotted rain trajectories from the cloud to each umbrella (animated drops follow them) ──
  const trails = overlay.map((o) => `<path d="M${f(o.x)},312 L${f(o.x)},${f(o.rimY - 18)}" />`);
  parts.push(`<g stroke="${C.light}" stroke-opacity=".28" stroke-width="1.6" stroke-dasharray="2 9" stroke-linecap="round">${trails.join('')}</g>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Rainmakers</title>
<desc id="d">Over the Milan skyline, a cloud made of connections pours light on entrepreneurs who hold umbrellas turned inside out — the Rainmakers mark — and collect it; shoots and a young tree grow, and clients walk towards them along a lit path.</desc>
${defs()}
${parts.join('\n')}
</svg>`;
  fs.writeFileSync(`${out}/hero-rainmakers.svg`, svg);
  return { W, H, overlay, cloudBottom: 312 };
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
