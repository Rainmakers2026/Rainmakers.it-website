/**
 * Founder photo (2026-11-17): Francesco Inguscio cut out of the portfolio slide supplied by the team
 * (assets-src/founder/portfolio-slide-5.png), on a plain white background for the round frame.
 * The slide is a screenshot: the head-and-shoulders area is ~150 px, upscaled here — replace with the original
 * photo file when available for a truly high-resolution image.
 * Background = light pixels with no warm (skin) tint, flood-filled from the edges so the person is never touched.
 * Run: node scripts/generate-founder-photo.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const CROP = { left: 872, top: 212, width: 140, height: 140 };
const OUT = 720;

(async () => {
  const { data, info } = await sharp(path.join(root, 'assets-src', 'founder', 'portfolio-slide-5.png'))
    .extract(CROP)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const lum = (i) => 0.299 * data[i * ch] + 0.587 * data[i * ch + 1] + 0.114 * data[i * ch + 2];
  const isBg = (i) => lum(i) > 150 && data[i * ch + 2] >= data[i * ch] - 4;
  const bg = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  // the bottom edge cuts through the shirt: only seed it where it really is background
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
  // mask (person = 255), softened at the edge
  const mask = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = bg[i] ? 0 : 255;
  const big = { width: OUT, height: OUT };
  const soft = await sharp(mask, { raw: { width: w, height: h, channels: 1 } }).resize({ ...big, kernel: 'lanczos3' }).blur(1.2).toColourspace('b-w').extractChannel(0).raw().toBuffer();
  const photo = await sharp(data, { raw: { width: w, height: h, channels: ch } }).resize({ ...big, kernel: 'lanczos3' }).sharpen({ sigma: 0.8 }).raw().toBuffer();
  const out = Buffer.alloc(OUT * OUT * 3);
  for (let i = 0; i < OUT * OUT; i++) {
    const a = soft[i] / 255;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(photo[i * ch + c] * a + 255 * (1 - a));
  }
  await sharp(out, { raw: { width: OUT, height: OUT, channels: 3 } }).webp({ quality: 90 }).toFile(path.join(root, 'public', 'brand', 'francesco-inguscio-2026.webp'));
  console.log('public/brand/francesco-inguscio-2026.webp', OUT, 'x', OUT);
})();
