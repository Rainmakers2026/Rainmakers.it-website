import { brand } from '@/content/shared';

type Variant = 'white' | 'black' | 'color' | 'squareWhite' | 'squareBlack' | 'squareColor';

/**
 * Logo with background-aware variants (PRD §31): use `white` on dark backgrounds,
 * `black`/`color` on light ones, `square*` for compact contexts.
 * Until the official files are in public/brand/ (set `brand.available` in content/shared.ts)
 * a provisional wordmark is rendered — TO VERIFY / PLACEHOLDER.
 */
export function Logo({ variant = 'white', className = '' }: { variant?: Variant; className?: string }) {
  const square = variant.startsWith('square');
  if (brand.available) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.files[variant]}
        alt="Rainmakers"
        className={`logo-img ${square ? 'logo-img--square' : ''} ${className}`}
        width={square ? 36 : 168}
        height={36}
      />
    );
  }
  const dark = variant === 'black' || variant === 'squareBlack';
  return (
    <span className={`logo ${dark ? 'logo--dark' : ''} ${className}`} data-placeholder="logo">
      <svg className="logo__mark" viewBox="0 0 32 32" width="28" height="28" aria-hidden focusable="false">
        <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
        <circle cx="16" cy="9" r="3" fill="#7b92e8" />
        <circle cx="9" cy="20" r="3" fill="#2596be" />
        <circle cx="23" cy="20" r="3" fill="#4b61d1" />
        <path d="M16 9 9 20h14z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      {square ? <span className="sr-only">Rainmakers</span> : <span className="logo__word">Rainmakers</span>}
    </span>
  );
}
