/**
 * White logos drawn as vectors, for the scrolling banners and the track record cards:
 *  - assets-src/logos/giveback → the Giveback initiatives: official logos in originals/ (StartuParty,
 *    Junior Jedi 2026-11-13, Italian Rainforest 2026-11-17, Imprenditore non sei solo) made white on transparent;
 *  - assets-src/logos/tribe/*.svg → Open Venture Building companies supplied only as small colour JPEGs (Buy Buy Shop,
 *    Trade to World, 2026-11-10): traced to white vector shapes from the originals kept in assets-src/logos/tribe/originals,
 *    so they stay sharp at any size.
 * Writes /public/brand/logos-white/<name>.webp, trimmed, and the sizes tables content/data/{giveback,tribe-vector}-logo-sizes.ts
 * (same format as logo-sizes.ts, which scripts/generate-white-logos.cjs rewrites from scratch).
 * Run after changing a source: node scripts/generate-giveback-logos.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'public', 'brand', 'logos-white');
const sets = [
  // density: the giveback sources are drawn small, the traced ones on a 4× canvas
  { dir: 'giveback', density: 144, table: 'giveback-logo-sizes.ts', name: 'givebackLogoSizes' },
  { dir: 'tribe', density: 36, table: 'tribe-vector-logo-sizes.ts', name: 'tribeVectorLogoSizes' },
];

/** Width cap for very large sources: ample for the ≤300 px dialog logo on 3× screens. */
const MAX_WIDTH = 1800;

/**
 * Raster logo → pure white logo on a transparent background, smooth ramp at the edges (keeps the antialiasing):
 *  - white on black (StartuParty, Junior Jedi): luminance becomes alpha;
 *  - colour or dark on white (Imprenditori anonimi, 2026-11-16; detected from the corners): distance from white
 *    (255 − darkest channel) becomes alpha, so coloured and grey parts all turn solid white.
 */
async function whiteOnTransparent(file) {
  // already white on transparent (Italian Rainforest, 2026-11-17): keep its alpha, scaled down to a sensible size
  const meta = await sharp(file).metadata();
  if (meta.hasAlpha) {
    const { data: a, info: ai } = await sharp(file)
      .resize({ width: Math.min(meta.width, MAX_WIDTH), withoutEnlargement: true })
      .extractChannel('alpha')
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (a[0] === 0 && a[a.length - 1] === 0) {
      const white = Buffer.alloc(ai.width * ai.height * 4, 255);
      for (let i = 0; i < ai.width * ai.height; i++) white[i * 4 + 3] = a[i];
      return sharp(await sharp(white, { raw: { width: ai.width, height: ai.height, channels: 4 } }).png().toBuffer());
    }
  }
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => (y * info.width + x) * info.channels;
  const corners = [px(0, 0), px(info.width - 1, 0), px(0, info.height - 1), px(info.width - 1, info.height - 1)];
  const lightBackground = corners.reduce((sum, i) => sum + data[i] + data[i + 1] + data[i + 2], 0) / 12 > 128;
  const [LOW, HIGH] = lightBackground ? [25, 140] : [40, 215];
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * info.channels];
    const g = data[i * info.channels + 1];
    const b = data[i * info.channels + 2];
    const v = lightBackground ? 255 - Math.min(r, g, b) : 0.299 * r + 0.587 * g + 0.114 * b;
    const a = Math.max(0, Math.min(255, Math.round(((v - LOW) / (HIGH - LOW)) * 255)));
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 255;
    out[i * 4 + 3] = a;
  }
  // kept at the source resolution (~700 px once trimmed): ample for the ≤120 px cards even on 3× screens
  const png = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  return sharp(png);
}

(async () => {
  for (const set of sets) {
    const srcDir = path.join(__dirname, '..', 'assets-src', 'logos', set.dir);
    const sizes = {};
    // Official logos supplied as rasters (StartuParty, Junior Jedi, Italian Rainforest, Imprenditore non sei solo) take precedence over an SVG
    const originalsDir = path.join(srcDir, 'originals');
    const originals = fs.existsSync(originalsDir) ? fs.readdirSync(originalsDir).filter((f) => /\.(webp|png|jpe?g)$/i.test(f)) : [];
    const jobs = [
      ...fs.readdirSync(srcDir).filter((f) => f.endsWith('.svg')).map((f) => ({ file: f.replace(/\.svg$/, '.webp'), svg: path.join(srcDir, f) })),
      ...originals.map((f) => ({ file: f.replace(/\.\w+$/, '.webp'), raster: path.join(originalsDir, f) })),
    ];
    const byFile = new Map(jobs.map((j) => [j.file, j]));
    for (const j of jobs) if (j.raster) byFile.set(j.file, j);
    for (const job of [...byFile.values()].sort((a, b) => a.file.localeCompare(b.file))) {
      const file = job.file;
      const { data, info } = await (job.svg ? sharp(job.svg, { density: set.density }) : await whiteOnTransparent(job.raster))
        .trim()
        .webp({ lossless: true })
        .toBuffer({ resolveWithObject: true });
      fs.writeFileSync(path.join(outDir, file), data);
      const raw = await sharp(data).ensureAlpha().raw().toBuffer();
      let sum = 0;
      for (let i = 3; i < raw.length; i += 4) sum += raw[i];
      sizes[file] = [info.width, info.height, Math.round((sum / (255 * info.width * info.height)) * 1000) / 1000];
      console.log(file, sizes[file]);
    }
    const rows = Object.entries(sizes).map(([f, v]) => `  '${f}': [${v.join(', ')}],`);
    fs.writeFileSync(
      path.join(__dirname, '..', 'content', 'data', set.table),
      `/** Generated by scripts/generate-giveback-logos.cjs — do not edit. Trimmed size (px) and ink density (0–1) of each white logo. */\nexport const ${set.name}: Record<string, [number, number, number]> = {\n${rows.join('\n')}\n};\n`,
    );
  }
})();
