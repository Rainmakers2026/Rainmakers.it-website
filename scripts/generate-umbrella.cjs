/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
/**
 * "Perché Rainmakers" image with the background removed (Figma review 2026-10-15/16).
 * The supplied picture (1280×720, umbrella on the right of a near-black background) is cropped around the subject,
 * then its background is turned into transparency against the section colour (--bg-base #0e2136): every pixel
 * keeps exactly the look it had with `mix-blend-mode: lighten` over the section, but as a plain transparent image,
 * so it is correct from the first frame (no blending, no dependency on animations or stacking contexts).
 * The top edge, where the crop cuts the glow behind the umbrella, is faded out.
 * Usage: node scripts/generate-umbrella.cjs <source image> → public/brand/benefits-umbrella.webp
 */
const path = require('path');
const sharp = require('sharp');

const SECTION = [14, 33, 54]; // --bg-base
const CROP = { left: 460, top: 160, width: 790, height: 474 };
const TOP_FADE = 0.22; // share of the height faded at the top

(async () => {
  const src = process.argv[2];
  if (!src) throw new Error('usage: node scripts/generate-umbrella.cjs <source image>');
  const { data, info } = await sharp(src).extract(CROP).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const out = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    const y = Math.floor(p / w);
    // what "lighten" over the section would show
    const r = [0, 1, 2].map((c) => Math.max(data[p * 3 + c], SECTION[c]));
    // colour-to-alpha against the section colour
    let a = Math.max(...[0, 1, 2].map((c) => (r[c] - SECTION[c]) / (255 - SECTION[c])));
    const colour = [0, 1, 2].map((c) => (a > 0 ? SECTION[c] + (r[c] - SECTION[c]) / a : 0));
    const t = Math.min(1, y / (h * TOP_FADE));
    a *= t * t * (3 - 2 * t); // smoothstep fade at the top
    out[p * 4] = Math.round(colour[0]);
    out[p * 4 + 1] = Math.round(colour[1]);
    out[p * 4 + 2] = Math.round(colour[2]);
    out[p * 4 + 3] = Math.round(a * 255);
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(path.join(__dirname, '..', 'public', 'brand', 'benefits-umbrella.webp'));
  console.log(`benefits-umbrella.webp ${w}×${h}`);
})();
