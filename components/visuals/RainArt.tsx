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

/** Coordinates of public/art/hero-rainmakers.svg (1200 × 900); rendered inline (heroArtMarkup.ts). */
export const HERO_ART = {
  src: '/art/hero-rainmakers.svg',
  markup: HERO_SVG_INNER,
  width: 1200,
  height: 900,
  from: 312,
  targets: [
    { x: 338, rimY: 502, w: 92 },
    { x: 473, rimY: 462, w: 102 },
    { x: 654, rimY: 422, w: 132 },
    { x: 786, rimY: 462, w: 102 },
    { x: 918, rimY: 502, w: 92 },
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
