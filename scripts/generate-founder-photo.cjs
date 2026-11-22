/**
 * Founder photo: Francesco Inguscio.
 * Source (2026-11-22): assets-src/founder/francesco-inguscio-2026.webp, a 1024×1024 portrait supplied by the team
 * (light wall background, person already centred). It replaces the cut-out of the portfolio slide.
 * The photo is only re-encoded for the web: no crop, no background change.
 * Run: node scripts/generate-founder-photo.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const SRC = path.join(root, 'assets-src', 'founder', 'francesco-inguscio-2026.webp');
const OUT = path.join(root, 'public', 'brand', 'francesco-inguscio-2026.webp');
const SIZE = 1024;

(async () => {
  await sharp(SRC)
    .resize(SIZE, SIZE, { fit: 'cover', kernel: 'lanczos3' })
    .webp({ quality: 90 })
    .toFile(OUT);
  console.log('public/brand/francesco-inguscio-2026.webp', SIZE, 'x', SIZE);
})();
