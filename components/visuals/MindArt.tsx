import type { CSSProperties } from 'react';

/** Rain over the two figures: [x, start y, delay s]; deterministic so server and client markup match. */
const DROPS: [number, number, number][] = [
  [128, 8, 0],
  [168, 22, 0.7],
  [214, 4, 1.3],
  [252, 18, 0.4],
  [352, 10, 0.9],
  [384, 26, 0.2],
  [412, 2, 1.5],
  [444, 20, 0.6],
  [476, 12, 1.1],
  [540, 24, 0.3],
  [86, 30, 1.6],
  [580, 6, 1],
];

/** Water poured from the bowl onto the sprout */
const POUR: [number, number, number][] = [
  [482, 92, 0],
  [500, 138, 0.45],
  [516, 186, 0.9],
];

/**
 * "Innovation is a state of mind" (2026-10-26): the chalk drawing redrawn as a modern flat illustration in the brand
 * palette. Left, muted: someone sheltering under an open umbrella; right, in the brand gradient: someone turning the
 * umbrella over — the Rainmakers mark — collecting the rain and watering a sprout. Inline SVG (no request); the drops
 * move with transform/opacity only, paused off-screen (data-fx) and hidden with reduced motion.
 */
export function MindArt({ label, caption }: { label: string; caption: [string, string] }) {
  return (
    <figure className="mind reveal" data-fx>
      <svg className="mind__art" viewBox="0 0 640 330" role="img" aria-label={label}>
        <defs>
          <linearGradient id="mind-brand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8fa3f0" />
            <stop offset="1" stopColor="#3f56c9" />
          </linearGradient>
          <linearGradient id="mind-muted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5b6b80" />
            <stop offset="1" stopColor="#2b3a52" />
          </linearGradient>
          <linearGradient id="mind-leaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8ff0c8" />
            <stop offset="1" stopColor="#2ba7c9" />
          </linearGradient>
          <linearGradient id="mind-drop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dfe6ff" stopOpacity="0" />
            <stop offset="1" stopColor="#9fe4f7" />
          </linearGradient>
          <linearGradient id="mind-ground" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7b92e8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#7b92e8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#7b92e8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="mind-glow">
            <stop offset="0" stopColor="#4b61d1" stopOpacity="0.55" />
            <stop offset="1" stopColor="#4b61d1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* glow behind the Rainmaker */}
        <circle cx="430" cy="170" r="170" fill="url(#mind-glow)" />

        {/* rain */}
        {DROPS.map(([x, y, d]) => (
          <path key={x} className="mind__drop" style={{ '--d': `${d}s` } as CSSProperties} d={`M${x} ${y}c-3 6-5 9-5 12a5 5 0 0 0 10 0c0-3-2-6-5-12z`} fill="url(#mind-drop)" />
        ))}

        <path d="M40 300H600" stroke="url(#mind-ground)" strokeWidth="2" strokeLinecap="round" />

        {/* left: sheltering under an open umbrella */}
        <g className="mind__shelter">
          <path d="M96 116Q180 30 264 116Q243 104 222 116Q201 104 180 116Q159 104 138 116Q117 104 96 116Z" fill="url(#mind-muted)" />
          <path d="M138 116L180 58L222 116" fill="none" stroke="#8a9bb4" strokeOpacity="0.35" strokeWidth="2" />
          <path d="M180 58V50" stroke="#5b6b80" strokeWidth="4" strokeLinecap="round" />
          <path d="M180 116V238a9 9 0 0 1-18 0" fill="none" stroke="#8a9bb4" strokeWidth="4" strokeLinecap="round" />
          <circle cx="150" cy="168" r="16" fill="#8a9bb4" />
          <rect x="128" y="192" width="44" height="108" rx="22" fill="url(#mind-muted)" />
          <path d="M164 206Q176 214 180 228" fill="none" stroke="#8a9bb4" strokeWidth="8" strokeLinecap="round" />
          {/* drops bouncing off */}
          <path d="M100 104l-10-8M260 104l10-8M90 120l-12 2M270 120l12 2" stroke="#9fe4f7" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* right: the umbrella turned over — the Rainmakers mark — collects the rain */}
        <g className="mind__maker">
          <path d="M346 66Q362 80 378 66Q394 80 410 66Q426 80 442 66Q458 80 474 66Q462 140 410 148Q358 140 346 66Z" fill="url(#mind-brand)" />
          <path d="M378 66L410 148L442 66" fill="none" stroke="#dfe6ff" strokeOpacity="0.35" strokeWidth="2" />
          <ellipse className="mind__water" cx="410" cy="70" rx="58" ry="6" fill="#9fe4f7" opacity="0.8" />
          <path d="M410 148V236a9 9 0 0 0 18 0" fill="none" stroke="#dfe6ff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="452" cy="168" r="16" fill="#dfe6ff" />
          <rect x="430" y="192" width="44" height="108" rx="22" fill="url(#mind-brand)" />
          <path d="M438 206Q424 214 418 228" fill="none" stroke="#dfe6ff" strokeWidth="8" strokeLinecap="round" />
          {POUR.map(([x, y, d]) => (
            <path key={y} className="mind__pour" style={{ '--d': `${d}s` } as CSSProperties} d={`M${x} ${y}c-2.5 5-4 7.5-4 10a4 4 0 0 0 8 0c0-2.5-1.5-5-4-10z`} fill="#9fe4f7" />
          ))}
        </g>

        {/* the sprout */}
        <g className="mind__sprout">
          <path d="M532 300C532 276 530 262 535 244" fill="none" stroke="url(#mind-leaf)" strokeWidth="4" strokeLinecap="round" />
          <path d="M534 262C552 246 570 250 574 236C556 230 538 240 534 262Z" fill="url(#mind-leaf)" />
          <path d="M532 278C514 266 500 270 496 256C514 252 528 260 532 278Z" fill="url(#mind-leaf)" />
        </g>
      </svg>
      <figcaption className="mind__caption">
        {caption[0]} <em>{caption[1]}</em>
      </figcaption>
    </figure>
  );
}
