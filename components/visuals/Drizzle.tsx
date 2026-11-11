/**
 * Light drizzle (2026-10-26). Two layers of thin streaks drawn as a tiled SVG background (app/globals.css → .drizzle)
 * that slide down with transform only (compositor, no JavaScript). `page`: fixed over the whole one-page, very faint
 * so it never competes with the copy; `hero`: inside the above-the-fold, a little denser over the photo.
 * Decorative; hidden with prefers-reduced-motion.
 */
export function Drizzle({ variant = 'page' }: { variant?: 'page' | 'hero' }) {
  return <div className={`drizzle drizzle--${variant}`} aria-hidden />;
}
