'use client';

import { useEffect, useId, useRef, useState, type ComponentType, type MouseEvent, type SVGProps } from 'react';
import Image from 'next/image';
import type { TrackCopy } from '@/content/types';
import { isPlaceholder } from '@/content/governance';
import { track, type AnalyticsEvent } from '@/lib/analytics';
import { ArrowRight, ArrowUpRight, Check, Close, Minus, IconChart, IconDocument, IconPie, IconTeam } from '../icons';

/**
 * Logo cards (Figma review 2026-10-15, "Le imprese che crescono con noi" mockup): glass cards with the white
 * logo, an outlined sector chip, a one-line description and a round arrow. A click opens the full profile in a
 * native modal <dialog> (focus trapped, Esc / backdrop close, focus returns to the card).
 * Data is prepared and localized on the server; logos are sized there to the same visual weight.
 */

export interface SizedLogo {
  src: string;
  width: number;
  height: number;
  /** Display size on the card and in the dialog */
  card: { width: number; height: number };
  dialog: { width: number; height: number };
}

export interface CardSection {
  icon: 'document' | 'team' | 'pie' | 'chart';
  title: string;
  /** Paragraphs */
  text?: string[];
  /** Label / value rows */
  facts?: { label: string; value: string }[];
}

export interface LogoCardItem {
  id: string;
  name: string;
  /** Shown as a white wordmark when no logo file is available */
  wordmark: string;
  logo?: SizedLogo;
  tag?: string;
  /** Second chip in the popup (Tribe: portfolio status) */
  status?: string;
  /** Marker in the card's top-right corner (Tribe: "Exit" or "Write-off") */
  badge?: string;
  /** Colour of the marker: green tick for exits, muted minus for write-offs */
  badgeTone?: 'exit' | 'writeoff';
  summary: string;
  sections: CardSection[];
  url?: string;
}

interface Props {
  kind: 'tribe' | 'advisory' | 'giveback';
  items: LogoCardItem[];
  labels: Pick<TrackCopy['explorer'], 'showAll' | 'showLess'>;
  cards: Pick<TrackCopy['cards'], 'open' | 'visit' | 'close'>;
  externalLabel: string;
  placeholderBadge: string;
  initialVisible?: number;
}

const icons: Record<CardSection['icon'], ComponentType<SVGProps<SVGSVGElement>>> = {
  document: IconDocument,
  team: IconTeam,
  pie: IconPie,
  chart: IconChart,
};

const fill = (t: string, key: string, v: string | number) => t.replace(`{${key}}`, String(v));

function Logo({ item, size }: { item: LogoCardItem; size: 'card' | 'dialog' }) {
  const box = item.logo?.[size];
  return (
    <span className={`logo-mark logo-mark--${size}`} aria-hidden>
      {item.logo && box ? (
        <Image src={item.logo.src} alt="" width={item.logo.width} height={item.logo.height} style={{ width: box.width, height: box.height }} sizes={`${box.width}px`} />
      ) : (
        <span className="logo-mark__name">{item.wordmark}</span>
      )}
    </span>
  );
}

export function LogoGrid({ kind, items, labels, cards, externalLabel, placeholderBadge, initialVisible = 9 }: Props) {
  const uid = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = showAll ? items : items.slice(0, initialVisible);
  const active = items.find((i) => i.id === openId) ?? null;

  // Opened once its content has rendered, so focus lands on the close button
  useEffect(() => {
    const d = dialogRef.current;
    if (openId && d && !d.open) d.showModal();
  }, [openId]);

  const open = (id: string) => {
    setOpenId(id);
    track(`${kind}_card_expand` as AnalyticsEvent, { item: id });
  };
  const close = () => dialogRef.current?.close();
  // A click on the backdrop (outside the panel) closes the dialog
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <div className="logo-grid">
      <ul className="logo-cards">
        {visible.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`logo-card${item.badge ? ' logo-card--badged' : ''}`}
              aria-haspopup="dialog"
              aria-controls={`${uid}-dialog`}
              aria-label={`${fill(cards.open, 'name', item.name)}${item.badge ? ` (${item.badge})` : ''}`}
              onClick={() => open(item.id)}
            >
              {item.badge ? (
                <span className={`logo-card__badge${item.badgeTone === 'writeoff' ? ' logo-card__badge--writeoff' : ''}`} aria-hidden>
                  {item.badgeTone === 'writeoff' ? <Minus /> : <Check />}
                  {item.badge}
                </span>
              ) : null}
              <span className="logo-card__frame">
                <Logo item={item} size="card" />
              </span>
              {/* the name, clearly visible; the category chip is shown only in the popup */}
              <span className="logo-card__name">{item.wordmark}</span>
              <span className="logo-card__foot">
                <span className="logo-card__summary">{item.summary}</span>
                <span className="logo-card__go" aria-hidden>
                  <ArrowRight />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {items.length > initialVisible ? (
        <button type="button" className="btn btn--secondary explorer__more" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
          {showAll ? labels.showLess : fill(labels.showAll, 'n', items.length)}
        </button>
      ) : null}

      <dialog id={`${uid}-dialog`} ref={dialogRef} className="logo-dialog" aria-labelledby={`${uid}-title`} onClose={() => setOpenId(null)} onClick={onDialogClick}>
        {active ? (
          <div className="logo-dialog__panel">
            <button type="button" className="logo-dialog__close" onClick={close} aria-label={cards.close}>
              <Close aria-hidden />
            </button>
            <div className="logo-dialog__head">
              <Logo item={active} size="dialog" />
              <h3 id={`${uid}-title`} className="logo-dialog__name">
                {active.wordmark}
              </h3>
              {active.tag || active.status ? (
                <p className="logo-dialog__chips">
                  {active.tag ? <span className="logo-chip">{active.tag}</span> : null}
                  {active.status ? <span className="logo-chip logo-chip--status">{active.status}</span> : null}
                </p>
              ) : null}
              <p className="logo-dialog__summary">{active.summary}</p>
            </div>

            {active.sections.map((s) => {
              const Icon = icons[s.icon];
              return (
                <section key={s.title} className="logo-dialog__block">
                  <Icon aria-hidden className="logo-dialog__icon" />
                  <div>
                    <h4>{s.title}</h4>
                    {s.text?.map((t) => (
                      <p key={t} className={isPlaceholder(t) ? 'ph' : undefined} title={isPlaceholder(t) ? placeholderBadge : undefined}>
                        {t}
                      </p>
                    ))}
                    {s.facts?.length ? (
                      <dl className="logo-dialog__facts">
                        {s.facts.map((f) => (
                          <div key={f.label}>
                            <dt>{f.label}</dt>
                            <dd>{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                </section>
              );
            })}

            {active.url ? (
              <a className="logo-dialog__visit" href={active.url} target="_blank" rel="noopener">
                <span>{cards.visit}</span>
                <ArrowUpRight aria-hidden />
                <span className="sr-only">
                  {' '}
                  — {active.name} {externalLabel}
                </span>
              </a>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
