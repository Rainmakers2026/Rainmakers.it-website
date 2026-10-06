import type { Dictionary, Locale } from '@/content/types';
import { rainforest } from '@/content/shared';
import { formatDate, formatNumber } from '@/lib/i18n';
import { cssVars } from '../ui';

/** Real Italian Rainforest figures (content/shared.ts) as an accessible bar chart. */
export function RainforestStats({ dict, locale }: { dict: Dictionary['rainforest']; locale: Locale }) {
  const { stats } = rainforest;
  const max = Math.max(...stats.categories.map((c) => c.count));
  const italy = stats.countries.find((c) => c.code === 'IT')?.count ?? 0;

  return (
    <figure className="rf-stats reveal">
      <figcaption className="rf-stats__title">{dict.statsTitle}</figcaption>
      <div className="rf-stats__totals">
        <p>
          <strong className="rf-stats__big" data-count={stats.activeOrganisations}>
            {formatNumber(stats.activeOrganisations, locale)}
          </strong>
          <span>{dict.statsTotalLabel}</span>
        </p>
        <p>
          <strong className="rf-stats__big rf-stats__big--alt">{formatNumber(italy, locale)}</strong>
          <span>{dict.statsCountriesLabel}</span>
        </p>
      </div>
      <ul className="rf-bars">
        {stats.categories.map((c, i) => (
          <li key={c.key} className="rf-bar" style={cssVars({ '--w': `${(c.count / max) * 100}%`, '--i': i })}>
            <span className="rf-bar__label">{dict.categories[c.key]}</span>
            <span className="rf-bar__track" aria-hidden>
              <span className="rf-bar__fill" />
            </span>
            <span className="rf-bar__value">{formatNumber(c.count, locale)}</span>
          </li>
        ))}
      </ul>
      <p className="rf-stats__source">
        {dict.statsSource} {formatDate(stats.asOf, locale)}
      </p>
    </figure>
  );
}
