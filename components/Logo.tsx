/**
 * TODO_CONFIRM — PROVISIONAL WORDMARK.
 * Replace with the official logo files once provided:
 *   public/brand/logo-standard-white.svg  (header/footer on dark backgrounds)
 *   public/brand/logo-square-color.png    (schema.org logo, 512×512)
 * Then swap this component's body for:
 *   <img src="/brand/logo-standard-white.svg" alt="Rainmakers" width={160} height={32} />
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`logo ${className}`} data-placeholder="logo">
      <svg className="logo__mark" viewBox="0 0 32 32" width="28" height="28" aria-hidden focusable="false">
        <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
        <circle cx="16" cy="9" r="3" fill="#7b92e8" />
        <circle cx="9" cy="20" r="3" fill="#2596be" />
        <circle cx="23" cy="20" r="3" fill="#4b61d1" />
        <path d="M16 9 9 20h14z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="logo__word">Rainmakers</span>
    </span>
  );
}
