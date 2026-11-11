import type { Locale, RainforestCopy } from '@/content/types';
import { rainforest } from '@/content/shared';
import { formatDate, formatNumber } from '@/lib/i18n';
import { cssVars } from '../ui';
import { CountUp } from './CountUp';

/** Categories shown; the rest are summarised in one line, to keep the focus on the totals (team request, 2026-10-19). */
const SHOWN = 4;

/**
 * Italian Rainforest public figures (VERIFIED, dated — content/shared.ts), shortened: the two totals count up when
 * they scroll into view, then the four largest categories as bars that fill one after the other.
 */
export function RainforestStats({ dict, locale }: { dict: RainforestCopy; locale: Locale }) {
  const { stats } = rainforest;
  const sorted = [...stats.categories].sort((a, b) => b.count - a.count);
  const shown = sorted.slice(0, SHOWN);
  const hidden = sorted.length - shown.length;
  const max = shown[0]?.count ?? 1;

  return (
    <figure className="rf-stats rf-stats--compact reveal">
      <figcaption className="rf-stats__title">{dict.statsTitle}</figcaption>
      <div className="rf-stats__totals">
        <p>
          <strong className="rf-stats__big">
            <CountUp value={formatNumber(stats.activeOrganisations, locale)} />
          </strong>
          <span>{dict.statsTotalLabel}</span>
        </p>
        <p>
          <strong className="rf-stats__big rf-stats__big--alt">
            <CountUp value={formatNumber(stats.italy, locale)} />
          </strong>
          <span>{dict.statsItalyLabel}</span>
        </p>
      </div>
      <ul className="rf-bars">
        {shown.map((c, i) => (
          <li key={c.key} className="rf-bar" style={cssVars({ '--w': `${(c.count / max) * 100}%`, '--i': i })}>
            <span className="rf-bar__label">{dict.categories[c.key]}</span>
            <span className="rf-bar__track" aria-hidden>
              <span className="rf-bar__fill" />
            </span>
            <span className="rf-bar__value">{formatNumber(c.count, locale)}</span>
          </li>
        ))}
      </ul>
      {hidden > 0 ? <p className="rf-stats__more">{dict.statsMore.replace('{n}', String(hidden))}</p> : null}
      <p className="rf-stats__source">
        {dict.statsSource} {formatDate(stats.asOf, locale)}
      </p>
    </figure>
  );
}
