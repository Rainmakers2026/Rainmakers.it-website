/**
 * "Innovation is a state of mind" (2026-11-10): the original chalk drawing (assets-src/innovation-state-of-mind-original.png),
 * traced into vector shapes so it stays sharp at any size, recoloured for the site and lightly animated. The drawing is
 * not changed: every line comes from the original.
 *  - no background: the section colour shows through, so the black board disappears;
 *  - figures and umbrellas in soft white, raindrops in the brand periwinkle, the lettering with a slow sheen;
 *  - the drops fall a short way and fade, staggered, so it keeps raining around the two figures; drops of water keep
 *    falling from the overturned umbrella into the cup;
 *  - CSS animations inside the SVG (they run in an <img>), switched off with prefers-reduced-motion.
 * Writes public/brand/innovation-state-of-mind.svg.
 * Needs potrace, not a dependency of the site: npm i --no-save potrace && node scripts/generate-mind-art.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const potrace = require('potrace');

const root = path.join(__dirname, '..');
const SRC = path.join(root, 'assets-src', 'innovation-state-of-mind-original.png');
const OUT = path.join(root, 'public', 'brand', 'innovation-state-of-mind.svg');
/** Traced at 3× with a light blur: smooth curves instead of the JPEG staircase */
const S = 3;

const trace = (buf) =>
  new Promise((resolve, reject) =>
    potrace.trace(buf, { threshold: 150, turdSize: 4 * S * S, optTolerance: 0.4, alphaMax: 1 }, (err, svg) => (err ? reject(err) : resolve(svg))),
  );

/** Hand-checked corrections of the automatic sorting (top-left corner of the shape, rounded) */
const AS_DROP = ['407,0', '540,0', '565,28', '993,201', '138,276'];
const AS_ART = ['518,187', '732,422'];
const JUNK = ['0,0', '305,0', '926,0'];

let seed = 2011;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const r1 = (n) => Math.round(n * 100) / 100;

(async () => {
  const { data, info } = await sharp(SRC).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const inv = Buffer.alloc(w * h);
  for (let p = 0; p < w * h; p++) inv[p] = 255 - data[p];
  const big = await sharp(inv, { raw: { width: w, height: h, channels: 1 } })
    .resize(w * S, h * S, { kernel: 'lanczos3' })
    .blur(0.66 * S)
    .png()
    .toBuffer();
  const svg = await trace(big);
  const d = svg.match(/ d="([^"]+)"/)[1];

  // Split into closed shapes, then put each hole with the shape around it
  const items = d
    .split(/(?=M )/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const nums = s.match(/-?\d+(\.\d+)?/g).map(Number);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = nums[i] / S, y = nums[i + 1] / S;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      const dd = s.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round((Number(n) / S) * 10) / 10)).replace(/ ?([MCLZ]) ?/g, '$1').replace(/, /g, ' ');
      return { d: dd, x0, y0, x1, y1, area: (x1 - x0) * (y1 - y0) };
    });
  const inside = (a, b) => a !== b && a.x0 >= b.x0 - 0.5 && a.x1 <= b.x1 + 0.5 && a.y0 >= b.y0 - 0.5 && a.y1 <= b.y1 + 0.5 && a.area < b.area;
  for (const it of items) it.parent = items.filter((o) => inside(it, o)).sort((a, b) => a.area - b.area)[0] ?? null;
  const depth = (it) => (it.parent ? 1 + depth(it.parent) : 0);
  const shapes = [];
  for (const it of items) if (depth(it) % 2 === 0) shapes.push((it.shape = { d: [it.d], x0: it.x0, y0: it.y0, x1: it.x1, y1: it.y1, holes: 0 }));
  for (const it of items) {
    if (depth(it) % 2 === 0) continue;
    it.parent.shape.d.push(it.d);
    it.parent.shape.holes++;
  }

  const groups = { art: [], drop: [], text: [] };
  for (const c of shapes) {
    const key = `${Math.round(c.x0)},${Math.round(c.y0)}`;
    const cw = c.x1 - c.x0, ch = c.y1 - c.y0;
    if (JUNK.includes(key)) continue;
    let k = 'art';
    if (c.y0 > 495) k = 'text';
    else if (AS_DROP.includes(key)) k = 'drop';
    else if (AS_ART.includes(key)) k = 'art';
    else if (ch >= 14 && ch <= 52 && cw >= 6 && cw <= 30 && ch / cw > 1.1 && c.holes <= 1) k = 'drop';
    groups[k].push(c);
  }

  // Each drop falls a short way and fades, with its own pace and phase
  const drops = groups.drop
    .sort((a, b) => a.x0 - b.x0)
    .map((c) => {
      const dur = r1(2.2 + rand() * 1.4);
      const delay = r1(-rand() * dur);
      return `<path class="d" style="animation-duration:${dur}s;animation-delay:${delay}s" d="${c.d.join('')}"/>`;
    })
    .join('');
  const art = groups.art.map((c) => c.d.join('')).join('');
  const text = groups.text.map((c) => c.d.join('')).join('');

  // Water from the overturned umbrella's handle into the cup
  const drips = [0, 0.45, 0.9, 1.35]
    .map((t, i) => `<circle class="w" style="animation-delay:${t}s" cx="812" cy="292" r="${i % 2 ? 2.6 : 3.2}"/>`)
    .join('');

  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe6ff"/><stop offset="1" stop-color="#7b92e8"/></linearGradient>
<linearGradient id="tg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e4e9ff"/><stop offset="1" stop-color="#b8c6f5"/></linearGradient>
<linearGradient id="sg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fe3f5" stop-opacity="0"/><stop offset=".5" stop-color="#8fe3f5" stop-opacity=".9"/><stop offset="1" stop-color="#8fe3f5" stop-opacity="0"/></linearGradient>
<clipPath id="tc"><path clip-rule="evenodd" d="${text}"/></clipPath>
</defs>
<style>
.a{fill:#f2f5ff}
.d{fill:url(#dg);transform-box:fill-box;animation:fall 2.8s cubic-bezier(.4,0,.8,1) infinite both}
.w{fill:#8fe3f5;opacity:0;animation:pour 1.8s ease-in infinite}
.s{transform:translateX(-320px);animation:sheen 8s ease-in-out 1.5s infinite}
@keyframes fall{0%{transform:translateY(-16px);opacity:0}20%{opacity:1}72%{opacity:1}100%{transform:translateY(18px);opacity:0}}
@keyframes pour{0%{transform:translate(0,0);opacity:0}15%{opacity:1}55%{transform:translate(30px,10px)}85%{opacity:1}100%{transform:translate(48px,44px);opacity:0}}
@keyframes sheen{0%{transform:translateX(-320px)}45%,100%{transform:translateX(1260px)}}
@media (prefers-reduced-motion:reduce){.d,.w,.s{animation:none}.w{opacity:0}}
</style>
<path class="a" fill-rule="evenodd" d="${art}"/>
<g fill-rule="evenodd">${drops}</g>
${drips}
<g clip-path="url(#tc)"><rect y="495" width="${w}" height="${h - 495}" fill="url(#tg)"/><rect class="s" y="495" width="260" height="${h - 495}" fill="url(#sg)"/></g>
</svg>
`;
  fs.writeFileSync(OUT, out);
  console.log(OUT, `${(out.length / 1024).toFixed(0)} KB`, { art: groups.art.length, drops: groups.drop.length, text: groups.text.length });
})();
