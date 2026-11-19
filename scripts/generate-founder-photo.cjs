/**
 * Founder photo: Francesco Inguscio on a plain white background, centred in a square for the round frame.
 * Source (2026-11-19): assets-src/founder/francesco-inguscio-slide-hires.png, a larger capture of the portfolio slide
 * (660×571, the person ~400 px wide) supplied by the team; it replaces the ~140 px crop of portfolio-slide-5.png.
 * Background = white plus the light/saturated blues of the Rainmakers logo and the rain shapes, flood-filled from the
 * edges so the person (navy shirt, skin, hair) is never touched; then the person is centred on white.
 * Run: node scripts/generate-founder-photo.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const SRC = path.join(root, 'assets-src', 'founder', 'francesco-inguscio-slide-hires.png');
const OUT = 720;

(async () => {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const px = (i) => [data[i * ch], data[i * ch + 1], data[i * ch + 2]];
  const isBg = (i) => {
    const [r, g, b] = px(i);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 150 && b >= r - 4) return true; // white, light grey, light blue (no warm skin tint)
    if (b > 170 && b > r + 50 && b > g + 30) return true; // logo / shape blues (the navy shirt is far darker)
    return false;
  };
  const bg = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !isBg(i)) continue;
    bg[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  // keep only the largest foreground component (drops stray bits of logo text or anti-aliasing)
  const comp = new Int32Array(w * h).fill(-1);
  let best = -1;
  let bestSize = 0;
  for (let s = 0, id = 0; s < w * h; s++) {
    if (bg[s] || comp[s] >= 0) continue;
    let size = 0;
    const st = [s];
    comp[s] = id;
    while (st.length) {
      const i = st.pop();
      size++;
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= w * h || bg[j] || comp[j] >= 0) continue;
        comp[j] = id;
        st.push(j);
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = id;
    }
    id++;
  }
  const mask = Buffer.alloc(w * h);
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let i = 0; i < w * h; i++) {
    if (comp[i] !== best) continue;
    mask[i] = 255;
    const x = i % w, y = (i / w) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  // softened edge, photo composited on white
  const soft = await sharp(mask, { raw: { width: w, height: h, channels: 1 } }).blur(0.8).toColourspace('b-w').extractChannel(0).raw().toBuffer();
  if (soft.length !== w * h) throw new Error(`mask has ${soft.length / (w * h)} channels`);
  const flat = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const a = soft[i] / 255;
    for (let c = 0; c < 3; c++) flat[i * 3 + c] = Math.round(data[i * ch + c] * a + 255 * (1 - a));
  }
  // square around the person, centred horizontally, a little air above the head; the bottom edge cuts the shirt
  const bw = maxX - minX + 1;
  const side = Math.round(Math.max(bw * 1.12, Math.min(h, maxY - minY + 1)));
  const cx = Math.round((minX + maxX) / 2);
  const top = Math.max(0, minY - Math.round(side * 0.06));
  const left = cx - Math.round(side / 2);
  const canvas = Buffer.alloc(side * side * 3, 255);
  for (let y = 0; y < side; y++) {
    const sy = top + y;
    if (sy >= h) break;
    for (let x = 0; x < side; x++) {
      const sx = left + x;
      if (sx < 0 || sx >= w) continue;
      for (let c = 0; c < 3; c++) canvas[(y * side + x) * 3 + c] = flat[(sy * w + sx) * 3 + c];
    }
  }
  await sharp(canvas, { raw: { width: side, height: side, channels: 3 } })
    .resize(OUT, OUT, { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: 92 })
    .toFile(path.join(root, 'public', 'brand', 'francesco-inguscio-2026.webp'));
  console.log('public/brand/francesco-inguscio-2026.webp', OUT, 'x', OUT, '| person bbox', { minX, maxX, minY, maxY }, '| square', side);
})();
