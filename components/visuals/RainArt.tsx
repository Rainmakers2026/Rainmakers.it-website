import type { CSSProperties } from 'react';
import { HERO_SVG_INNER } from './heroArtMarkup';

/**
 * Illustration (static SVG in /public/art) + animated rain falling into the Rainmakers umbrellas.
 * The drops and splashes are plain elements animated with transform/opacity only (compositor thread,
 * no JavaScript per frame). They run only while the illustration is on screen (`data-fx` →
 * ClientEffects toggles `is-active`) and are hidden with prefers-reduced-motion.
 * Coordinates come from scripts/generate-art.cjs (viewBox units of the SVG).
 */
export interface RainTarget {
  /** bowl centre x */
  x: number;
  /** rim y */
  rimY: number;
  /** umbrella width */
  w: number;
}

const DURATION = 2.6; // seconds — keep in sync with the CSS keyframes (rm-fall / rm-splash)
const pct = (n: number) => `${Math.round(n * 10000) / 100}%`;

export function RainArt({
  src,
  width,
  height,
  alt,
  from,
  targets,
  dropsPerTarget = 2,
  priority = false,
  markup,
  pulses = [],
  className = '',
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** y where the drops start (cloud underside / sky) */
  from: number;
  targets: RainTarget[];
  dropsPerTarget?: number;
  priority?: boolean;
  /** Inline SVG markup (above the fold: paints with the HTML, no request, not an LCP image) */
  markup?: string;
  /** Glowing points (cities) that pulse: viewBox coordinates; hub = bigger, double ring */
  pulses?: { x: number; y: number; hub?: boolean }[];
  className?: string;
}) {
  const drops = targets.flatMap((t, i) =>
    Array.from({ length: dropsPerTarget }, (_, k) => ({
      key: `${i}-${k}`,
      x: t.x + (k - (dropsPerTarget - 1) / 2) * t.w * 0.24,
      bottom: t.rimY - 4,
      rimY: t.rimY,
      w: t.w,
      delay: -((i * 0.83 + k * 1.37) % DURATION), // negative: already raining on first paint
    })),
  );
  return (
    <div className={`rain-art ${className}`} data-fx>
      {markup ? (
        <svg
          className="rain-art__img"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={alt}
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- static SVG illustration, already optimal
        <img
          className="rain-art__img"
          src={src}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}
      <div className="rain-art__fx" aria-hidden>
        {pulses.map((p, i) => (
          <span
            key={`p-${i}`}
            className={`rain-pulse${p.hub ? ' rain-pulse--hub' : ''}`}
            style={{ left: pct(p.x / width), top: pct(p.y / height), '--d': `${-((i * 0.77) % 3.2)}s` } as CSSProperties}
          />
        ))}
        {drops.map((d) => (
          <span
            key={d.key}
            className="rain-drop"
            style={{ left: pct(d.x / width), top: pct(from / height), height: pct((d.bottom - from) / height), '--d': `${d.delay}s` } as CSSProperties}
          />
        ))}
        {drops.map((d) => (
          <span
            key={`s-${d.key}`}
            className="rain-splash"
            style={{ left: pct(d.x / width), top: pct(d.rimY / height), width: pct((d.w * 0.5) / width), '--d': `${d.delay}s` } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

/** Coordinates of public/art/hero-rainmakers.svg (1200 × 900, from scripts/generate-art.cjs); rendered inline (heroArtMarkup.ts). */
export const HERO_ART = {
  src: '/art/hero-rainmakers.svg',
  markup: HERO_SVG_INNER,
  width: 1200,
  height: 900,
  from: 270,
  dropsPerTarget: 1,
  targets: [
    { x: 289, rimY: 693, w: 42 },
    { x: 371, rimY: 690, w: 42 },
    { x: 443, rimY: 693, w: 42 },
    { x: 515, rimY: 696, w: 42 },
    { x: 587, rimY: 699, w: 42 },
    { x: 251, rimY: 747, w: 50 },
    { x: 323, rimY: 743, w: 50 },
    { x: 409, rimY: 739, w: 50 },
    { x: 481, rimY: 743, w: 50 },
    { x: 553, rimY: 747, w: 50 },
  ],
  pulses: [
    { x: 560, y: 318, hub: true },
    { x: 484.7, y: 325.2 },
    { x: 531.8, y: 339.5 },
    { x: 705.2, y: 321.7 },
    { x: 652.2, y: 340.1 },
    { x: 641.9, y: 357.2 },
    { x: 701.7, y: 416.8 },
    { x: 819.5, y: 464.8 },
    { x: 994.6, y: 464.7 },
    { x: 762.5, y: 366.4 },
    { x: 653.1, y: 308.6 },
    { x: 423, y: 529.9 },
    { x: 758, y: 619.4 },
    { x: 927.8, y: 680.7 },
    { x: 806, y: 402.6 },
    { x: 990.9, y: 555.6 },
  ],
};

/** Coordinates of public/art/shelter-harvest.svg (1000 × 560): rain is collected only on the right. */
export const SHELTER_ART = {
  src: '/art/shelter-harvest.svg',
  width: 1000,
  height: 560,
  from: 20,
  targets: [
    { x: 620, rimY: 226, w: 84 },
    { x: 794, rimY: 190, w: 104 },
    { x: 920, rimY: 226, w: 84 },
  ],
};
