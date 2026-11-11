/**
 * White logos on a transparent background ("sfondo trasparente, corpo bianco" — Figma review 2026-10-15).
 * For every logo in /public/brand/{The-Tribe,Innovation-Advisory}-companies-favicons it writes
 * /public/brand/logos-white/<file>.webp:
 *  - logos already on a transparent background keep their shape and become white;
 *  - logos on a solid background: the background colour (read from the border) is knocked out and each
 *    pixel's opacity follows its colour distance from it, so text and details inside shapes stay readable;
 *  - transparent margins are trimmed, so every logo fills its frame the same way;
 *  - the trimmed sizes and the ink density (share of the box actually covered by the logo) go to
 *    content/data/logo-sizes.ts, used to give every logo the same visual weight.
 * Run after adding or replacing a logo: node scripts/generate-white-logos.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..', 'public', 'brand');
const outDir = path.join(root, 'logos-white');
const folders = ['The-Tribe-companies-favicons', 'Innovation-Advisory-companies-favicons'];

/** Per-logo tuning where the automatic result needs help (file name → options). */
const OVERRIDES = {
  // supplied with a thin frame / lighter edge around the background: drop the outer ring
  'agos.webp': { frame: true },
  'chiodiapaga.webp': { frame: true, upscale: 4 },
  // only small files exist (official sites checked 2026-10-16): enlarge the flat shape cleanly
  'antea.tech.webp': { upscale: 6 },
  'easysea.webp': { upscale: 3 },
  // the supplied file was cut on both sides (eagle and final "A"): replaced on 2026-10-21 with the complete logo from
  // confindustria.veneto.it (267×90, originals in assets-src/logos/)
  'confindustriaveneto.webp': { upscale: 4 },
};

/** Share of the trimmed box covered by the logo (mean alpha, 0–1): solid marks ≈ 0.6, thin wordmarks ≈ 0.15. */
async function inkDensity(file) {
  const { data, info } = await sharp(path.join(outDir, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i];
  return sum / (255 * info.width * info.height);
}

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function whiten(file, src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = w * h;
  let clear = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 16) clear++;
  const transparent = clear / px > 0.2;

  // Background colour: median of a ring just inside the edge (skips 1-px frames and anti-aliased borders)
  const inset = Math.max(3, Math.round(Math.min(w, h) * 0.02));
  const border = { r: [], g: [], b: [] };
  const push = (x, y) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 128) return;
    border.r.push(data[i]);
    border.g.push(data[i + 1]);
    border.b.push(data[i + 2]);
  };
  for (let x = inset; x < w - inset; x++) {
    push(x, inset);
    push(x, h - 1 - inset);
  }
  for (let y = inset; y < h - inset; y++) {
    push(inset, y);
    push(w - 1 - inset, y);
  }
  const bg = border.r.length ? { r: median(border.r), g: median(border.g), b: median(border.b) } : { r: 255, g: 255, b: 255 };

  const { threshold = 0.07, gain = 2.6, frame = false } = OVERRIDES[file] || {};
  const out = Buffer.alloc(px * 4);
  for (let p = 0; p < px; p++) {
    const i = p * 4;
    let a;
    if (transparent) {
      a = data[i + 3] / 255;
    } else {
      const d = Math.hypot(data[i] - bg.r, data[i + 1] - bg.g, data[i + 2] - bg.b) / 441.7;
      a = Math.min(1, Math.max(0, (d - threshold) * gain)) * (data[i + 3] / 255);
    }
    if (frame) {
      const x = p % w;
      const y = (p - x) / w;
      if (x < inset || y < inset || x >= w - inset || y >= h - inset) a = 0;
    }
    out[i] = out[i + 1] = out[i + 2] = 255;
    out[i + 3] = Math.round(a * 255);
  }

  // Trim to the visible logo (+2% padding)
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (out[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) throw new Error(`${file}: nothing left after knocking out the background`);
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  const width = Math.min(w, x1 + pad + 1) - left;
  const height = Math.min(h, y1 + pad + 1) - top;

  const trimmed = sharp(out, { raw: { width: w, height: h, channels: 4 } }).extract({ left, top, width, height });
  const { upscale = 1 } = OVERRIDES[file] || {};
  if (upscale > 1) {
    // Flat logos from tiny files: enlarge only the shape (alpha) with Lanczos, then steepen its edge so the outline
    // is crisp instead of blurred; the colour is plain white anyway.
    // alpha of the trimmed area, one byte per pixel, with a 2 px empty margin so the blur is not cut flat at
    // the edges (built by hand: sharp always applies extend() after resize(), whatever the call order)
    const M = 2;
    const sw = width + 2 * M;
    const sh = height + 2 * M;
    const shape = Buffer.alloc(sw * sh);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) shape[(y + M) * sw + (x + M)] = out[((top + y) * w + (left + x)) * 4 + 3];
    const W = sw * upscale;
    const H = sh * upscale;
    // the blur rounds off the pixel staircase of the small source before the edge is steepened again
    const alpha = await sharp(shape, { raw: { width: sw, height: sh, channels: 1 } })
      .resize(W, H, { kernel: 'lanczos3' })
      .blur(Math.max(0.3, upscale * 0.2))
      .linear(2.6, -0.8 * 255)
      .extractChannel(0)
      .raw()
      .toBuffer();
    const big = Buffer.alloc(W * H * 4, 255);
    for (let p = 0; p < W * H; p++) big[p * 4 + 3] = alpha[p];
    await sharp(big, { raw: { width: W, height: H, channels: 4 } })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(path.join(outDir, file));
    return { transparent, bg, width: W, height: H };
  }
  await trimmed.webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(outDir, file));
  return { transparent, bg, width, height };
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const seen = new Set();
  const sizes = {};
  for (const folder of folders) {
    for (const file of fs.readdirSync(path.join(root, folder)).filter((f) => f.endsWith('.webp'))) {
      if (seen.has(file)) continue; // same file supplied in both folders
      seen.add(file);
      const r = await whiten(file, path.join(root, folder, file));
      sizes[file] = [r.width, r.height, Math.round((await inkDensity(file)) * 1000) / 1000];
      console.log(`${r.transparent ? 'transparent' : `bg rgb(${r.bg.r},${r.bg.g},${r.bg.b})`.padEnd(11)}  ${String(r.width).padStart(4)}×${String(r.height).padEnd(4)} ${file}`);
    }
  }
  const body = Object.entries(sizes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([f, [w, h, d]]) => `  '${f}': [${w}, ${h}, ${d}],`)
    .join('\n');
  fs.writeFileSync(
    path.join(__dirname, '..', 'content', 'data', 'logo-sizes.ts'),
    `/** Generated by scripts/generate-white-logos.cjs — do not edit. Trimmed size (px) and ink density (0–1) of each white logo. */\nexport const logoSizes: Record<string, [number, number, number]> = {\n${body}\n};\n`,
  );
})();
