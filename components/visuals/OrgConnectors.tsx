'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface Wire {
  /** Curve */
  d: string;
  /** Draw-in order */
  order: number;
}

/** Position of `el` inside `root`, from layout offsets (ignores the reveal transforms, so the wires land on the final boxes). */
function box(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/** Horizontal S-curve, leaving and arriving level. */
const sCurve = (sx: number, sy: number, ex: number, ey: number) => {
  const k = (ex - sx) * 0.55;
  return `M${sx} ${sy}C${sx + k} ${sy} ${ex - k} ${ey} ${ex} ${ey}`;
};

/** Vertical run that turns into the box with a rounded corner (stacked layout). */
const elbow = (sx: number, sy: number, ex: number, ey: number, r = 12) =>
  `M${sx} ${sy}L${sx} ${ey - r}Q${sx} ${ey} ${sx + r} ${ey}L${ex} ${ey}`;

/**
 * "Cosa fa Rainmakers": curved lines (no arrowheads since 2026-10-26) from the umbrella to each branch and from each
 * branch to its units,
 * drawn in SVG behind the boxes. Every wire starts and ends exactly on a box (nothing sticks out); re-measured on
 * resize. Wide screens: S-curves; one column: rounded elbows down a trunk. Decorative (aria-hidden); the chart is
 * readable without it (no JS, before hydration).
 */
export function OrgConnectors() {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [wires, setWires] = useState<Wire[]>([]);

  useEffect(() => {
    const svg = ref.current;
    const chart = svg?.parentElement;
    if (!svg || !chart) return;

    const measure = () => {
      const mark = chart.querySelector<HTMLElement>('.org__mark');
      const rootEl = chart.querySelector<HTMLElement>('.org__root');
      if (!mark || !rootEl) return;
      const m = box(mark, chart);
      // one column: the trunk leaves from under the whole root block (mark + name), never across the label
      const rb = box(rootEl, chart);
      const cx = m.x + m.w / 2;
      const by = rb.y + rb.h + 8;
      const stacked = getComputedStyle(chart).gridTemplateColumns.trim().split(/\s+/).length < 2;
      const out: Wire[] = [];
      chart.querySelectorAll<HTMLElement>('.org__branch').forEach((branch, i) => {
        const nodeEl = branch.querySelector<HTMLElement>('.org__node');
        if (!nodeEl) return;
        const n = box(nodeEl, chart);
        const ny = n.y + n.h / 2;
        if (stacked) {
          // trunk from under the umbrella, down the left edge, turning into each branch
          const tx = Math.max(10, n.x - 18);
          const start = `M${cx} ${by}C${cx} ${by + 30} ${tx} ${by + 6} ${tx} ${by + 40}`;
          out.push({ d: start + elbow(tx, by + 40, n.x - 4, ny).replace(/^M[^L]+/, ''), order: i });
        } else {
          out.push({ d: sCurve(m.x + m.w + 8, m.y + m.h / 2, n.x - 6, ny), order: i });
        }
        branch.querySelectorAll<HTMLElement>('.org__unit').forEach((unitEl) => {
          // aim at the unit's button, not the whole box: an opened description must not move the arrow
          const u = box(unitEl.querySelector<HTMLElement>('.org__unit-head') ?? unitEl, chart);
          const uy = u.y + u.h / 2;
          if (stacked) {
            const sx = n.x + 18;
            out.push({ d: elbow(sx, n.y + n.h + 2, u.x - 4, uy, 10), order: i + 0.5 });
          } else {
            out.push({ d: sCurve(n.x + n.w + 4, ny, u.x - 6, uy), order: i + 0.5 });
          }
        });
      });
      setSize({ w: chart.offsetWidth, h: chart.offsetHeight });
      setWires(out);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(chart);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, []);

  return (
    <svg ref={ref} className="org__wires" width={size.w} height={size.h} viewBox={`0 0 ${size.w || 1} ${size.h || 1}`} aria-hidden focusable="false">
      {wires.map((w, i) => (
        <g key={i} className="org__wire" style={{ '--o': w.order } as CSSProperties}>
          <path d={w.d} pathLength={1} className="org__wire-line" />
        </g>
      ))}
    </svg>
  );
}
