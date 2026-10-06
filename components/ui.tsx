import type { CSSProperties, ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight } from './icons';

type Variant = 'primary' | 'secondary' | 'ghost';

interface CtaProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  /** Analytics event name (see lib/analytics.ts). */
  track?: string;
  /** Where on the page the CTA lives — sent as event property. */
  location?: string;
  external?: boolean;
  externalLabel?: string;
  className?: string;
}

/** Server-rendered CTA. Clicks are tracked globally by <ClientEffects /> via data-attributes. */
export function Cta({ href, children, variant = 'primary', track, location, external, externalLabel, className = '' }: CtaProps) {
  const inPage = href.startsWith('#');
  return (
    <a
      href={href}
      className={`btn btn--${variant} ${className}`}
      data-track={track}
      data-location={location}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
    >
      <span>{children}</span>
      {external ? <ArrowUpRight aria-hidden /> : inPage ? <ArrowDown aria-hidden /> : <ArrowRight aria-hidden />}
      {external && externalLabel ? <span className="sr-only"> {externalLabel}</span> : null}
    </a>
  );
}

interface HeaderProps {
  eyebrow: string;
  title: string;
  id: string;
  intro?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({ eyebrow, title, id, intro, align = 'left' }: HeaderProps) {
  return (
    <header className={`section-header section-header--${align} reveal`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="h2">
        {title}
      </h2>
      {intro ? <p className="lead">{intro}</p> : null}
    </header>
  );
}

/** Typed helper for CSS custom properties in inline styles. */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}
