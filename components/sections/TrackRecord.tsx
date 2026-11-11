import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { tribe } from '@/content/data/tribe';
import { advisory, type AdvisoryProject } from '@/content/data/advisory';
import { giveback } from '@/content/data/giveback';
import { advisoryLogoFiles, givebackLogoFiles, logoBox, tribeLogoFiles, whiteLogo } from '@/content/data/logos';
import { formatNumber } from '@/lib/i18n';
import { LogoGrid, type LogoCardItem, type SizedLogo } from '../explorer/LogoGrid';
import { SectionHeader } from '../ui';

const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** Alphabetical, case- and accent-insensitive (team request, 2026-10-19). */
const byName = (a: string, b: string) => a.localeCompare(b, 'it', { sensitivity: 'base' });

/** White logo sized to the same visual weight on the card and in the dialog. */
function sized(file: string | undefined): SizedLogo | undefined {
  const logo = whiteLogo(file);
  if (!logo) return undefined;
  return {
    ...logo,
    card: logoBox(logo, 15500, 240, 96),
    dialog: logoBox(logo, 21000, 300, 116),
  };
}

/** Shown on request although their website is not on record yet (2026-11-10). */
const SHOWN_WITHOUT_WEBSITE = new Set(['buy-buy-shop']);
/**
 * Temporarily hidden (team request, 2026-10-16): companies without a verified website or logo.
 * Remove this filter once their website and logo have been confirmed.
 */
const verified = (i: LogoCardItem) => !!i.logo && (!!i.url || SHOWN_WITHOUT_WEBSITE.has(i.id));

/** Alphabetical order. */
function tribeItems(dict: Dictionary, locale: Locale): LogoCardItem[] {
  const t = dict.track;
  const f = t.explorer.fields;
  return [...tribe]
    .sort((a, b) => byName(a.name, b.name))
    .map((c): LogoCardItem => {
      const sector = c.sector?.[locale];
      const note = c.note?.[locale];
      return {
        id: c.slug,
        name: c.name,
        wordmark: c.name,
        logo: sized(tribeLogoFiles[c.slug]),
        tag: sector,
        status: t.tribe.statusLabels[c.status],
        // visible marker on the card for exits and write-offs (team request, 2026-10-23), in different colours
        badge: c.status === 'exit' || c.status === 'writeoff' ? t.tribe.statusLabels[c.status] : undefined,
        badgeTone: c.status === 'exit' || c.status === 'writeoff' ? c.status : undefined,
        summary: c.summary[locale],
        sections: [
          {
            icon: 'document',
            title: t.cards.project,
            text: [c.description[locale]],
          },
          {
            icon: 'pie',
            title: t.cards.participation,
            facts: [{ label: f.status, value: t.tribe.statusLabels[c.status] }],
            text: [t.cards.statusText[c.status], ...(note ? [note] : [])],
          },
          {
            icon: 'chart',
            title: t.cards.keyFacts,
            facts: [
              ...(sector ? [{ label: f.sector, value: sector }] : []),
              ...(c.city ? [{ label: f.city, value: c.city }] : []),
              ...(c.founded ? [{ label: f.founded, value: String(c.founded) }] : []),
              ...(c.fte != null
                ? [
                    {
                      label: `${f.fte} (2023)`,
                      value: formatNumber(c.fte, locale),
                    },
                  ]
                : []),
              ...(c.revenueK != null
                ? [
                    {
                      label: `${f.revenue} (2023)`,
                      value: `${formatNumber(c.revenueK, locale)} ${t.explorer.revenueUnit}`,
                    },
                  ]
                : []),
              ...(c.website ? [{ label: t.explorer.website, value: host(c.website) }] : []),
            ],
          },
        ],
        url: c.website ?? undefined,
      };
    });
}

/** Alphabetical order (by client, then project). */
function advisoryItems(dict: Dictionary, locale: Locale): LogoCardItem[] {
  const t = dict.track;
  const f = t.explorer.fields;
  return [...advisory]
    .sort((a, b) => byName(a.client, b.client) || byName(a.project, b.project))
    .map((p: AdvisoryProject): LogoCardItem => ({
      id: p.slug,
      name: `${p.client} — ${p.project}`,
      wordmark: p.client,
      logo: sized(advisoryLogoFiles[p.slug]),
      tag: p.typeLabel[locale],
      summary: p.summary[locale],
      sections: [
        {
          icon: 'document',
          title: `${t.cards.project}: ${p.project}`,
          text: [p.description[locale]],
        },
        { icon: 'team', title: t.cards.impact, text: [p.impact[locale]] },
        {
          icon: 'chart',
          title: t.cards.keyFacts,
          facts: [
            { label: f.client, value: p.client },
            { label: f.type, value: p.typeLabel[locale] },
            { label: f.location, value: p.location },
            { label: f.year, value: String(p.year) },
            ...(p.website ? [{ label: t.explorer.website, value: host(p.website) }] : []),
          ],
        },
      ],
      url: p.website ?? undefined,
    }));
}

/** Giveback initiatives, in the order of the chart. */
function givebackItems(dict: Dictionary, locale: Locale): LogoCardItem[] {
  const t = dict.track;
  return giveback.map((g): LogoCardItem => ({
    id: g.slug,
    name: g.name,
    wordmark: g.name,
    logo: sized(givebackLogoFiles[g.slug]),
    tag: t.giveback.typeLabel,
    summary: g.summary[locale],
    sections: [
      {
        icon: 'document',
        title: t.cards.project,
        text: [g.description[locale]],
      },
    ],
    url: g.website ?? undefined,
  }));
}

/**
 * Track record (PRD §5.3 step 3): header, then the logo cards of Open Venture Building (the Tribe), Advisory and the
 * Giveback initiatives (team edits, 2026-10-27; testimonials: Reviews section).
 */
export function TrackRecord({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.track;
  const labels = { showAll: t.explorer.showAll, showLess: t.explorer.showLess };
  // Giveback first, then Open Venture Building and Advisory (2026-11-11, as in the chart)
  const blocks = [
    // no website on record yet: shown without the verified filter
    {
      id: SECTION_IDS.givebackInitiatives,
      kind: 'giveback' as const,
      eyebrow: t.giveback.title,
      title: t.giveback.intro,
      items: givebackItems(dict, locale),
      note: '',
    },
    {
      id: SECTION_IDS.tribe,
      kind: 'tribe' as const,
      eyebrow: t.tribe.title,
      title: t.tribe.intro,
      items: tribeItems(dict, locale).filter(verified),
      note: t.tribe.dataNote,
    },
    {
      id: SECTION_IDS.advisory,
      kind: 'advisory' as const,
      eyebrow: t.advisory.title,
      title: t.advisory.intro,
      items: advisoryItems(dict, locale).filter(verified),
      note: t.advisory.dataNote,
    },
  ];
  return (
    <section id={SECTION_IDS.track} className="section section--base track" aria-labelledby="track-title">
      <div className="container">
        {/* The network map and the row of figures were removed on 2026-10-26 */}
        <SectionHeader title={t.title} intro={t.intro} id="track-title" />

        {blocks.map((b) => (
          <div key={b.id} id={b.id} className="track__block portfolio">
            <header className="portfolio__head reveal">
              <h3 className="portfolio__name">{b.eyebrow}</h3>
              <p className="portfolio__title">{b.title}</p>
            </header>
            <LogoGrid
              kind={b.kind}
              items={b.items}
              labels={labels}
              cards={t.cards}
              externalLabel={dict.ui.a11y.external}
              placeholderBadge={dict.ui.placeholderBadge}
            />
            {b.note ? <p className="track__note">{b.note}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
