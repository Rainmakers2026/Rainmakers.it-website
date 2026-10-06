'use client';

import { useEffect, useRef } from 'react';

/**
 * Generative hero visual (PRD §41–43): isolated points that progressively connect
 * into a network — ALONE → CONNECTED. Pure canvas, no dependencies, ~2KB.
 * - Respects prefers-reduced-motion (renders the final, connected state statically)
 * - Pauses when off-screen or when the tab is hidden
 */

const COLORS = ['#7b92e8', '#2596be', '#4b61d1', '#a9b8f2'];

interface Node {
  x: number;
  y: number;
  bx: number;
  by: number;
  r: number;
  c: string;
  phase: number;
  order: number;
}
interface Edge {
  a: number;
  b: number;
  order: number;
}
interface Pulse {
  edge: number;
  t: number;
  speed: number;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function HeroNetwork({ label }: { label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let pulses: Pulse[] = [];
    let raf = 0;
    let running = false;
    let start = 0;
    const BUILD_MS = 3800;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = mulberry32(2011);
      const mobile = width < 720;
      const count = mobile ? 34 : 64;
      // Bias the network to the right on desktop so the headline stays readable.
      const minX = mobile ? 0.04 : 0.42;
      const hub = { x: width * (mobile ? 0.62 : 0.72), y: height * (mobile ? 0.2 : 0.48) };

      nodes = Array.from({ length: count }, (_, i) => {
        const x = width * (minX + rand() * (0.97 - minX));
        // On mobile keep the network above the headline (text sits at the bottom of the hero).
        const y = height * (mobile ? 0.06 + rand() * 0.32 : 0.08 + rand() * 0.84);
        return {
          x,
          y,
          bx: x,
          by: y,
          r: i === 0 ? 5 : 1.6 + rand() * 2.4,
          c: COLORS[Math.floor(rand() * COLORS.length)],
          phase: rand() * Math.PI * 2,
          order: 0,
        };
      });
      nodes[0].x = nodes[0].bx = hub.x;
      nodes[0].y = nodes[0].by = hub.y;
      nodes[0].c = '#ffffff';

      // Connect each node to its 2–3 nearest neighbours.
      const seen = new Set<string>();
      edges = [];
      nodes.forEach((n, i) => {
        const nearest = nodes
          .map((m, j) => ({ j, d: Math.hypot(m.bx - n.bx, m.by - n.by) }))
          .filter((o) => o.j !== i)
          .sort((p, q) => p.d - q.d)
          .slice(0, i % 3 === 0 ? 3 : 2);
        for (const { j } of nearest) {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push({ a: i, b: j, order: 0 });
          }
        }
      });
      // Reveal order: by distance from the hub, so connections "grow" outwards.
      const maxD = Math.hypot(width, height);
      nodes.forEach((n) => (n.order = Math.hypot(n.bx - hub.x, n.by - hub.y) / maxD));
      edges.forEach((e) => (e.order = Math.max(nodes[e.a].order, nodes[e.b].order)));
      const maxOrder = Math.max(...edges.map((e) => e.order), 0.0001);
      edges.forEach((e) => (e.order /= maxOrder));
      pulses = [];
    };

    const draw = (now: number) => {
      const elapsed = reduce ? Infinity : now - start;
      const progress = Math.min(1, elapsed / BUILD_MS);
      const time = reduce ? 0 : now / 1000;
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x = n.bx + Math.sin(time * 0.5 + n.phase) * 4;
        n.y = n.by + Math.cos(time * 0.4 + n.phase) * 4;
      }

      // Edges
      ctx.lineWidth = 1;
      for (const e of edges) {
        const local = Math.max(0, Math.min(1, (progress * 1.25 - e.order) * 4));
        if (local <= 0) continue;
        const a = nodes[e.a];
        const b = nodes[e.b];
        ctx.strokeStyle = `rgba(123,146,232,${0.28 * local})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * local, a.y + (b.y - a.y) * local);
        ctx.stroke();
      }

      // Pulses travelling along edges once the network exists
      if (!reduce && progress >= 1) {
        if (pulses.length < 9 && Math.random() < 0.06) {
          pulses.push({ edge: Math.floor(Math.random() * edges.length), t: 0, speed: 0.006 + Math.random() * 0.01 });
        }
        pulses = pulses.filter((p) => (p.t += p.speed) < 1);
        for (const p of pulses) {
          const e = edges[p.edge];
          const a = nodes[e.a];
          const b = nodes[e.b];
          const x = a.x + (b.x - a.x) * p.t;
          const y = a.y + (b.y - a.y) * p.t;
          const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
          g.addColorStop(0, 'rgba(255,255,255,0.9)');
          g.addColorStop(1, 'rgba(37,150,190,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Nodes: dim and isolated first, brighter once connected
      for (const n of nodes) {
        const connected = Math.max(0, Math.min(1, (progress * 1.25 - n.order) * 4));
        ctx.globalAlpha = 0.45 + 0.55 * connected;
        ctx.fillStyle = n.c;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (0.85 + 0.15 * connected), 0, Math.PI * 2);
        ctx.fill();
        if (n === nodes[0]) {
          ctx.globalAlpha = 0.18 + 0.1 * Math.sin(time * 2);
          ctx.beginPath();
          ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      draw(now);
      if (running) raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    build();
    start = performance.now();
    if (reduce) draw(performance.now());

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()));
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener('visibilitychange', onVisibility);
    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        if (reduce) draw(performance.now());
      }, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      pause();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className="hero__canvas" role="img" aria-label={label} />;
}
