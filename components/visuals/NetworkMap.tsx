'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { HowCopy, NetworkNodeCopy } from '@/content/types';

/**
 * Interactive network (PRD §8.2): the entrepreneur at the centre, connected to people, knowledge,
 * community, opportunities, ecosystem and growth, which are linked to each other. Selecting a node
 * highlights its relationships. Conceptual only: no metrics or real relationships are simulated.
 * - Real <button>s (keyboard + screen readers), state announced in a live region
 * - Gentle auto-tour until the user interacts; disabled with prefers-reduced-motion
 */

type Key = NetworkNodeCopy['key'];

/** How the elements reinforce each other (besides each one's link to the centre). */
const LINKS: [Key, Key][] = [
  ['people', 'knowledge'],
  ['people', 'community'],
  ['knowledge', 'community'],
  ['community', 'opportunities'],
  ['people', 'opportunities'],
  ['ecosystem', 'people'],
  ['ecosystem', 'opportunities'],
  ['opportunities', 'growth'],
  ['knowledge', 'growth'],
];

const SIZE = 600;
const C = SIZE / 2;
const R = 215;

type Copy = Pick<HowCopy, 'centerLabel' | 'hint' | 'nodes' | 'mapLabel'>;

export function NetworkMap({ copy }: { copy: Copy }) {
  const uid = useId();
  const [selected, setSelected] = useState<Key | null>(null);
  const [touched, setTouched] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const positions = Object.fromEntries(
    copy.nodes.map((n, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / copy.nodes.length;
      return [n.key, { x: C + R * Math.cos(a), y: C + R * Math.sin(a) }];
    }),
  ) as Record<Key, { x: number; y: number }>;

  // Start the draw-in when the map scrolls into view
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !('IntersectionObserver' in window)) return setVisible(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-tour through the nodes until the user takes over
  useEffect(() => {
    if (touched || !visible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const id = window.setInterval(() => {
      setSelected(copy.nodes[i % copy.nodes.length].key);
      i++;
    }, 2800);
    return () => window.clearInterval(id);
  }, [touched, visible, copy.nodes]);

  const pick = (key: Key) => {
    setTouched(true);
    setSelected((cur) => (cur === key ? null : key));
  };

  const related = (key: Key) =>
    new Set<Key>(LINKS.filter(([a, b]) => a === key || b === key).map(([a, b]) => (a === key ? b : a)));
  const rel = selected ? related(selected) : null;
  const active = copy.nodes.find((n) => n.key === selected);

  return (
    <div ref={rootRef} className={`netmap ${visible ? 'is-visible' : ''} ${selected ? 'has-selection' : ''}`}>
      <div className="netmap__stage" role="group" aria-label={copy.mapLabel}>
        <svg className="netmap__svg" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden focusable="false">
          <defs>
            <radialGradient id={`${uid}-glow`}>
              <stop offset="0%" stopColor="#4b61d1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#4b61d1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={C} cy={C} r={R + 40} fill={`url(#${uid}-glow)`} />
          <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 8" />
          {LINKS.map(([a, b], i) => {
            const on = selected && (a === selected || b === selected);
            return (
              <line
                key={`${a}-${b}`}
                className={`netmap__edge ${on ? 'is-on' : ''}`}
                style={{ transitionDelay: `${300 + i * 60}ms` }}
                x1={positions[a].x}
                y1={positions[a].y}
                x2={positions[b].x}
                y2={positions[b].y}
                pathLength={1}
              />
            );
          })}
          {copy.nodes.map((n, i) => {
            const on = !selected || selected === n.key;
            return (
              <line
                key={`c-${n.key}`}
                className={`netmap__spoke ${on ? 'is-on' : ''}`}
                style={{ transitionDelay: `${i * 70}ms` }}
                x1={C}
                y1={C}
                x2={positions[n.key].x}
                y2={positions[n.key].y}
                pathLength={1}
              />
            );
          })}
          {selected ? (
            <circle className="netmap__pulse" r="5" fill="#ffffff">
              <animateMotion dur="1.6s" repeatCount="indefinite" path={`M${C},${C} L${positions[selected].x},${positions[selected].y}`} />
            </circle>
          ) : null}
        </svg>

        <span className="netmap__center" aria-hidden>
          {copy.centerLabel}
        </span>

        {copy.nodes.map((n) => {
          const p = positions[n.key];
          const state = selected === n.key ? 'is-selected' : rel?.has(n.key) ? 'is-related' : selected ? 'is-dim' : '';
          return (
            <button
              key={n.key}
              type="button"
              className={`netmap__node ${state}`}
              style={{ left: `${(p.x / SIZE) * 100}%`, top: `${(p.y / SIZE) * 100}%` }}
              aria-pressed={selected === n.key}
              aria-controls={`${uid}-detail`}
              onClick={() => pick(n.key)}
            >
              {n.label}
            </button>
          );
        })}
      </div>

      <div id={`${uid}-detail`} className="netmap__detail" aria-live="polite">
        {active ? (
          <>
            <p className="netmap__detail-title">{active.label}</p>
            <p>{active.text}</p>
            {rel && rel.size ? (
              <p className="netmap__detail-links">
                ↔ {copy.nodes.filter((n) => rel.has(n.key)).map((n) => n.label).join(' · ')}
              </p>
            ) : null}
          </>
        ) : (
          <p className="netmap__hint">{copy.hint}</p>
        )}
      </div>

      {/* Full text alternative, always available to assistive tech and without JS */}
      <ul className="sr-only">
        {copy.nodes.map((n) => (
          <li key={n.key}>
            {n.label}: {n.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
