import type { CSSProperties, ReactNode } from 'react';
import type { Intent } from '@/content/types';
import { ArrowRight, ArrowUpRight } from './icons';

type Variant = 'primary' | 'secondary' | 'ghost';

interface CtaProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  /** Analytics event name (see lib/analytics.ts). */
  track?: string;
  /** Where on the page the CTA lives — sent as event property. */
  location?: string;
  /** Preselects the lead form intent. */
  intent?: Intent;
  external?: boolean;
  externalLabel?: string;
  className?: string;
}

/** Server-rendered CTA. Clicks are tracked globally by <ClientEffects /> via data-attributes. */
export function Cta({
  href,
  children,
  variant = 'primary',
  track,
  location,
  intent,
  external,
  externalLabel,
  className = '',
}: CtaProps) {
  return (
    <a
      href={href}
      className={`btn btn--${variant} ${className}`}
      data-track={track}
      data-location={location}
      data-intent={intent}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
    >
      <span>{children}</span>
      {external ? <ArrowUpRight aria-hidden /> : <ArrowRight aria-hidden />}
      {external && externalLabel ? <span className="sr-only"> {externalLabel}</span> : null}
    </a>
  );
}

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  tone?: 'base' | 'raised' | 'deep';
}

export function Section({ id, children, className = '', labelledBy, tone = 'base' }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`section section--${tone} ${className}`}>
      <div className="container">{children}</div>
    </section>
  );
}

interface HeaderProps {
  eyebrow: string;
  title: string;
  id: string;
  intro?: string;
  align?: 'left' | 'center';
  index?: string;
}

export function SectionHeader({ eyebrow, title, id, intro, align = 'left', index }: HeaderProps) {
  return (
    <header className={`section-header section-header--${align} reveal`}>
      <p className="eyebrow">
        {index ? <span className="eyebrow__index">{index}</span> : null}
        {eyebrow}
      </p>
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
