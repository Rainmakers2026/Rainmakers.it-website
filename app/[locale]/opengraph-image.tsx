import { ImageResponse } from 'next/og';
import { isLocale } from '@/content/types';
import { getDictionary } from '@/lib/i18n';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Rainmakers';

// Deterministic "network" dots so the OG image matches the hero visual.
const dots = Array.from({ length: 38 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  const x = 640 + (a - Math.floor(a)) * 520;
  const y = 40 + (b - Math.floor(b)) * 550;
  const colors = ['#7b92e8', '#2596be', '#4b61d1', '#a9b8f2'];
  return { x, y, r: 4 + (i % 4) * 2, c: colors[i % 4] };
});

/** Localized Open Graph image (PRD §50), generated at build time. */
// `params` is a plain object in Next 15 and a Promise in Next 16 — awaiting works for both.
export default async function OpengraphImage({ params }: { params: { locale: string } | Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : 'it');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(135deg, #0a1828 0%, #1b3a5c 60%, #24477a 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <svg width="1200" height="630" style={{ position: 'absolute', inset: 0 }}>
          {dots.map((d, i) => {
            const n = dots[(i + 3) % dots.length];
            return <line key={`l${i}`} x1={d.x} y1={d.y} x2={n.x} y2={n.y} stroke="rgba(123,146,232,0.28)" strokeWidth="2" />;
          })}
          {dots.map((d, i) => (
            <circle key={`c${i}`} cx={d.x} cy={d.y} r={d.r} fill={d.c} />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 72px', width: 720 }}>
          <div style={{ fontSize: 26, letterSpacing: 6, textTransform: 'uppercase', color: '#7b92e8', fontWeight: 700 }}>
            Rainmakers
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, marginTop: 24, display: 'flex', flexWrap: 'wrap' }}>
            {dict.hero.title} {dict.hero.titleAccent} {dict.hero.titleTail}
          </div>
          <div style={{ fontSize: 28, marginTop: 28, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35 }}>
            {dict.hero.eyebrow}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
