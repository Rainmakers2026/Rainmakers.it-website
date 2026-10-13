/**
 * Decorative band of Rainmakers keywords that slides sideways as the page scrolls (CSS scroll-driven
 * animation, compositor-only; static where unsupported or with reduced motion). Hidden from assistive tech.
 */
export function KeywordBand({ words, reverse = false }: { words: string[]; reverse?: boolean }) {
  const row = [...words, ...words];
  return (
    <div className={`kw-band${reverse ? ' kw-band--reverse' : ''}`} aria-hidden>
      <div className="kw-band__track">
        {row.map((w, i) => (
          <span key={i} className={`kw-band__word${i % 2 ? ' kw-band__word--outline' : ''}`}>
            {w}
            <svg className="kw-band__mark" viewBox="120 100 260 240" width="34" height="32" fill="currentColor" focusable="false">
              <path d="M343.3,127.6c-13.7,0-25.6-8.1-31-19.8c-5.4,11.7-17.3,19.8-31,19.8s-25.6-8.1-31-19.8 c-5.4,11.7-17.3,19.8-31,19.8s-25.6-8.1-31-19.8c-5.4,11.7-17.3,19.8-31,19.8s-25.5-8.1-30.9-19.7c8.7,58.1,57.4,103.2,117.1,106.4 v89.1c0,6.3-4.6,12-10.9,12.6c-7.2,0.7-13.4-5-13.4-12.1v-4.2c0-2.4-1.3-4.5-3.3-5.7l0,0c-4.4-2.5-9.9,0.6-9.9,5.7v3.4 c0,13.2,9.8,24.7,22.9,25.9c15,1.4,27.7-10.4,27.7-25.2v-89.6c60-3,108.8-48.1,117.6-106.4C368.8,119.5,357,127.6,343.3,127.6z" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
