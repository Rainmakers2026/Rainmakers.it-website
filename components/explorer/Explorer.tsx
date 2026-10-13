'use client';

import { useId, useMemo, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import type { TrackCopy } from '@/content/types';
import { isPlaceholder } from '@/content/governance';
import { track, type AnalyticsEvent } from '@/lib/analytics';
import { ArrowUpRight, Plus } from '../icons';

/**
 * Directory-style explorer (inspired by investor directories such as OpenVC):
 * searchable, filterable, sortable rows that expand in place to show the full profile.
 * Data is prepared and localized on the server; this island only handles interaction.
 */

export type Tone = 'active' | 'exit' | 'minority' | 'writeoff' | 'neutral' | 'nda';

export interface ExplorerItem {
  id: string;
  name: string;
  subtitle?: string;
  initials: string;
  favicon?: string;
  /** 'dark' = logo shown on a neutral dark plate (light-on-transparent logos, or supplied on a dark background). */
  faviconTone?: 'light' | 'dark';
  hue: number;
  badge: { label: string; tone: Tone };
  location?: string;
  year?: number;
  tags: string[];
  metrics: { label: string; value: string }[];
  summary: string;
  description: string;
  facts: { label: string; value: string }[];
  note?: string;
  url?: string;
  filter: string;
  size?: number;
  search: string;
}

interface Props {
  kind: 'tribe' | 'advisory';
  items: ExplorerItem[];
  filters: { value: string; label: string }[];
  labels: TrackCopy['explorer'];
  externalLabel: string;
  placeholderBadge: string;
  sorts: ('az' | 'recent' | 'oldest' | 'size')[];
  initialSort: 'az' | 'recent' | 'oldest' | 'size';
  initialVisible?: number;
}

const fill = (t: string, n: number) => t.replace('{n}', String(n));

export function Explorer({ kind, items, filters, labels, externalLabel, placeholderBadge, sorts, initialSort, initialVisible = 8 }: Props) {
  const uid = useId();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState(initialSort);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.filter] = (c[i.filter] || 0) + 1;
    return c;
  }, [items]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) => (filter === 'all' || i.filter === filter) && (!q || i.search.includes(q)));
    const by = {
      az: (a: ExplorerItem, b: ExplorerItem) => a.name.localeCompare(b.name),
      recent: (a: ExplorerItem, b: ExplorerItem) => (b.year ?? 0) - (a.year ?? 0) || a.name.localeCompare(b.name),
      oldest: (a: ExplorerItem, b: ExplorerItem) => (a.year ?? 9999) - (b.year ?? 9999) || a.name.localeCompare(b.name),
      size: (a: ExplorerItem, b: ExplorerItem) => (b.size ?? -1) - (a.size ?? -1) || a.name.localeCompare(b.name),
    }[sort];
    return [...list].sort(by);
  }, [items, query, filter, sort]);

  const narrowed = filter !== 'all' || query.trim() !== '';
  const visible = showAll || narrowed ? results : results.slice(0, initialVisible);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        track(`${kind}_card_expand` as AnalyticsEvent, { item: id });
      }
      return next;
    });
  };

  const choose = (value: string) => {
    setFilter(value);
    track('explorer_filter', { explorer: kind, filter: value });
  };

  return (
    <div className="explorer">
      <div className="explorer__toolbar">
        <div className="explorer__search">
          <label htmlFor={`${uid}-q`} className="sr-only">
            {labels.searchLabel}
          </label>
          <input id={`${uid}-q`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={labels.searchPlaceholder} autoComplete="off" />
        </div>
        <div className="explorer__sort">
          <label htmlFor={`${uid}-sort`}>{labels.sortLabel}</label>
          <select id={`${uid}-sort`} value={sort} onChange={(e) => setSort(e.target.value as Props['initialSort'])}>
            {sorts.map((s) => (
              <option key={s} value={s}>
                {labels.sorts[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="explorer__filters" role="group" aria-label={labels.filterLabel}>
        {[{ value: 'all', label: labels.all }, ...filters].map((f) => {
          const n = f.value === 'all' ? items.length : counts[f.value] || 0;
          if (f.value !== 'all' && !n) return null;
          return (
            <button key={f.value} type="button" className={`filter-chip filter-chip--${f.value}`} aria-pressed={filter === f.value} onClick={() => choose(f.value)}>
              {f.label}
              <span className="filter-chip__count">{n}</span>
            </button>
          );
        })}
      </div>

      <p className="explorer__count" aria-live="polite">
        {fill(labels.results, results.length)}
      </p>

      {results.length === 0 ? (
        <div className="explorer__empty">
          <p>{labels.noResults}</p>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            {labels.reset}
          </button>
        </div>
      ) : (
        <ul className="explorer__list">
          {visible.map((item) => {
            const isOpen = open.has(item.id);
            const panelId = `${uid}-${item.id}`;
            return (
              <li key={item.id} className={`xrow ${isOpen ? 'is-open' : ''}`}>
                <button type="button" className="xrow__head" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(item.id)}>
                  <span
                    className={`xrow__avatar${item.favicon ? ' xrow__avatar--logo' : ''}${item.favicon && item.faviconTone === 'dark' ? ' xrow__avatar--dark' : ''}`}
                    data-company={item.id}
                    style={{ ['--h' as string]: item.hue } as CSSProperties}
                    aria-hidden
                  >
                    {item.initials}
                    {/* Requested at the plate size (88×56, 2× for retina) so logos are not upscaled */}
                    {item.favicon ? <Image src={item.favicon} alt="" width={88} height={56} sizes="88px" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : null}
                  </span>
                  <span className="xrow__id">
                    <span className="xrow__name">{item.name}</span>
                    {item.subtitle ? <span className="xrow__sub">{item.subtitle}</span> : null}
                  </span>
                  <span className={`xbadge xbadge--${item.badge.tone}`}>{item.badge.label}</span>
                  <span className="xrow__where">
                    {item.location ? <span>{item.location}</span> : null}
                    {item.year ? <span className="xrow__year">{item.year}</span> : null}
                  </span>
                  <span className="xrow__tags">
                    {item.tags.slice(0, 2).map((t) => (
                      <span key={t} className="xtag">
                        {t}
                      </span>
                    ))}
                  </span>
                  <span className="xrow__metrics">
                    {item.metrics.map((m) => (
                      <span key={m.label} className="xmetric">
                        <strong>{m.value}</strong>
                        <span>{m.label}</span>
                      </span>
                    ))}
                  </span>
                  <span className="xrow__toggle">
                    <span className="sr-only">{isOpen ? labels.hide : labels.details}</span>
                    <Plus aria-hidden />
                  </span>
                </button>
                <div id={panelId} className="xrow__panel" hidden={!isOpen}>
                  <div className="xrow__body">
                    <p className="xrow__summary">{item.summary}</p>
                    <p className={isPlaceholder(item.description) ? 'ph' : ''} title={isPlaceholder(item.description) ? placeholderBadge : undefined}>
                      {item.description}
                    </p>
                    {item.note ? <p className="xrow__note">{item.note}</p> : null}
                    {item.url ? (
                      <a className="link-arrow xrow__link" href={item.url} target="_blank" rel="noopener">
                        {labels.website}
                        <span className="sr-only"> — {item.name} {externalLabel}</span>
                        <ArrowUpRight aria-hidden className="inline-icon" />
                      </a>
                    ) : null}
                  </div>
                  <dl className="xrow__facts">
                    {item.facts.map((f) => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!narrowed && results.length > initialVisible ? (
        <button type="button" className="btn btn--secondary explorer__more" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
          {showAll ? labels.showLess : fill(labels.showAll, results.length)}
        </button>
      ) : null}
    </div>
  );
}
