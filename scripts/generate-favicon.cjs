/**
 * Browser-tab icon (app/icon.png, 2026-11-17): the Rainmakers umbrella and ring in the brand blue (#4b61d1, --c-indigo,
 * the colour of the official logo) on a white disc; transparent outside the circle, so no corners show on the tab.
 * Source: assets-src/favicon/icon-source.png (white umbrella and ring on navy, the ring touching the edges).
 * Run: node scripts/generate-favicon.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const path = require('path');
const sharp = require('sharp');

const BLUE = [0x4b, 0x61, 0xd1];
const root = path.join(__dirname, '..');

(async () => {
  const { data, info } = await sharp(path.join(root, 'assets-src', 'favicon', 'icon-source.png'))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // ink: white parts of the source (umbrella, ring) → blue; navy background → white
      const lum = data[i * channels];
      const ink = Math.max(0, Math.min(1, (lum - 20) / 215));
      // antialiased disc edge
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const cover = Math.max(0, Math.min(1, r - d + 0.5));
      for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.round(255 + (BLUE[c] - 255) * ink);
      out[i * 4 + 3] = Math.round(cover * 255);
    }
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(root, 'app', 'icon.png'));
  console.log('app/icon.png', w, 'x', h);
})();
