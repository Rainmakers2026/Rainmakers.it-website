import type { CSSProperties } from 'react';

/**
 * Living Italian Rainforest background (decorative): fine rain through the canopy, drifting mist and
 * glowing points — the organisations mapped by Italian Rainforest. Transform/opacity animations only,
 * paused off-screen (`data-fx` on the section) and hidden with prefers-reduced-motion.
 * Deterministic positions (no Math.random) so server and client render the same markup.
 */
const DROPS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: -((i * 0.53) % 1.9),
  duration: 1.15 + ((i * 7) % 6) * 0.11,
  opacity: 0.34 + ((i * 5) % 4) * 0.1,
}));

const NODES = [
  [12, 22], [24, 64], [36, 38], [47, 78], [58, 26], [66, 58], [74, 18], [83, 70], [91, 40], [18, 86],
].map(([left, top], i) => ({ left, top, delay: -(i * 0.7) }));

/**
 * `rain`: the falling rain ("Cosa fa Rainmakers", over the rainforest photo); `nodes`: the glowing organisations
 * (Italian Rainforest). Both scenes share the mist.
 */
export function RainforestFx({ rain = true, nodes = true }: { rain?: boolean; nodes?: boolean }) {
  return (
    <div className="rf-fx" aria-hidden>
      <div className="rf-fx__mist rf-fx__mist--a" />
      <div className="rf-fx__mist rf-fx__mist--b" />
      {rain ? (
        <div className="rf-fx__rain">
          {DROPS.map((d, i) => (
            <span key={i} className="rf-fx__drop" style={{ left: `${d.left}%`, '--d': `${d.delay}s`, '--t': `${d.duration}s`, '--o': d.opacity } as CSSProperties} />
          ))}
        </div>
      ) : null}
      {(nodes ? NODES : []).map((n, i) => (
        <span key={i} className="rf-fx__node" style={{ left: `${n.left}%`, top: `${n.top}%`, '--d': `${n.delay}s` } as CSSProperties} />
      ))}
    </div>
  );
}
