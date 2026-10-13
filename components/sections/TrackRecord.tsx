import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { tribe, type TribeCompany } from '@/content/data/tribe';
import { advisory, type AdvisoryProject } from '@/content/data/advisory';
import { fillTokens, formatNumber } from '@/lib/i18n';
import { Explorer, type ExplorerItem, type Tone } from '../explorer/Explorer';
import { SectionHeader, cssVars } from '../ui';

const initials = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}\s+&]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Stable hue per name so avatars keep their colour across renders and languages. */
const hue = (name: string) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return 200 + (h % 60); // stay within the brand's blue range (200–260)
};

const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const tribeFavicons: Record<string, string> = {
  'startup-geeks': 'startupgeeks.webp',
  trovabando: 'trovabando.webp',
  easysea: 'easysea.webp',
  noonic: 'noonic.webp',
  'future-fashion': 'DIS.webp',
  designwanted: 'designwanted.webp',
  verbalizza: 'verbalizza.webp',
  zanze: 'zanzexvi.webp',
  kampaay: 'kampaay.webp',
  mapadore: 'mapadore.webp',
  ncode: 'ncode.webp',
  'coppa-landini': 'coppalandini.webp',
  crowdchicken: 'crowdchicken.webp',
  'this-is-not-a-sushi-bar': 'thisisnotsushibar.webp',
  backbone: 'backbone.webp',
  'chi-odia-paga': 'chiodiapaga.webp',
  'robo-for-it': 'robo4it.webp',
  fornace: 'fornacestudio.webp',
  bidtotrip: 'bidtotrip.webp',
  startuphome: 'startuphome.webp',
  instilla: 'instilla.webp',
  gellify: 'gellify.webp',
  'startup-wise-guys': 'startupwiseguys.webp',
};

const advisoryFavicons: Record<string, string> = {
  '360-capital': '360capitalpartners.webp',
  agos: 'agos.webp',
  antea: 'antea.tech.webp',
  // Keyed by the data slug (content/data/advisory.ts); the file name keeps the supplied spelling
  assolombarda: 'assolombardia.webp',
  'art-er': 'art-er.webp',
  'cciaa-milano': 'innovhub.webp',
  'cdp-vc': 'cdpventurecapital.webp',
  coeso: 'coeso.webp',
  'confindustria-veneto': 'confindustriaveneto.webp',
  'confindustria-verona': 'confindustriaverona.webp',
  'credit-agricole': 'credit-agricole-levillagebyca.webp',
  electrolux: 'electrolux.webp',
  ey: 'ey.webp',
  feduf: 'feduf.webp',
  finservice: 'gruppofinservice.webp',
  'intesa-off': 'intesasanpaolo.webp',
  'intesa-adottup': 'intesasanpaolo.webp',
  oltre: 'oltreimpact.webp',
  rcs: 'corrieredellasera.webp',
  siamosoci: 'mamacrowd.webp',
  startupitalia: 'startupitalia.webp',
  'talent-garden': 'talentgarden.webp',
  'tetra-pak': 'tetrapak.webp',
  unicredit: 'unicreditstartlab.webp',
  bicocca: 'ibicocca.unimib.webp',
  vita: 'vita.webp',
};

/**
 * Logos that are light-on-transparent (invisible on white) or supplied on their own dark background:
 * shown on a neutral dark plate instead of white. Checked visually against the supplied files.
 */
const darkPlateLogos = new Set(['easysea', 'gellify', 'fornace', 'noonic', 'antea', 'oltre']);

function tribeItems(dict: Dictionary, locale: Locale): ExplorerItem[] {
  const t = dict.track;
  const f = t.explorer.fields;
  return tribe.map((c: TribeCompany) => {
    const sector = c.sector?.[locale];
    const metrics = [
      ...(c.fte != null ? [{ label: f.fte, value: formatNumber(c.fte, locale) }] : []),
      ...(c.revenueK != null ? [{ label: `${f.revenue} ${t.explorer.revenueUnit}`, value: formatNumber(c.revenueK, locale) }] : []),
    ];
    const facts = [
      { label: f.status, value: t.tribe.statusLabels[c.status] },
      ...(sector ? [{ label: f.sector, value: sector }] : []),
      ...(c.city ? [{ label: f.city, value: c.city }] : []),
      ...(c.founded ? [{ label: f.founded, value: String(c.founded) }] : []),
      ...(c.fte != null ? [{ label: `${f.fte} (2023)`, value: formatNumber(c.fte, locale) }] : []),
      ...(c.revenueK != null ? [{ label: `${f.revenue} (2023)`, value: `${formatNumber(c.revenueK, locale)} ${t.explorer.revenueUnit}` }] : []),
      ...(c.website ? [{ label: t.explorer.website, value: host(c.website) }] : []),
    ];
    return {
      id: c.slug,
      name: c.name,
      initials: initials(c.name),
      favicon: tribeFavicons[c.slug] ? `/brand/The-Tribe-companies-favicons/${tribeFavicons[c.slug]}` : undefined,
      faviconTone: darkPlateLogos.has(c.slug) ? 'dark' : 'light',
      hue: hue(c.name),
      badge: { label: t.tribe.statusLabels[c.status], tone: c.status as Tone },
      location: c.city ?? undefined,
      year: c.founded ?? undefined,
      tags: sector ? [sector] : [],
      metrics,
      summary: c.summary[locale],
      description: c.description[locale],
      facts,
      note: c.note?.[locale],
      url: c.website ?? undefined,
      filter: c.status,
      size: c.revenueK ?? c.fte ?? undefined,
      search: [c.name, sector, c.city, c.summary[locale]].filter(Boolean).join(' ').toLowerCase(),
    };
  });
}

function advisoryItems(dict: Dictionary, locale: Locale): ExplorerItem[] {
  const t = dict.track;
  const f = t.explorer.fields;
  return advisory.map((p: AdvisoryProject) => ({
    id: p.slug,
    name: p.client,
    subtitle: p.project,
    initials: initials(p.client),
    favicon: advisoryFavicons[p.slug] ? `/brand/Innovation-Advisory-companies-favicons/${advisoryFavicons[p.slug]}` : undefined,
    faviconTone: darkPlateLogos.has(p.slug) ? 'dark' : 'light',
    hue: hue(p.client),
    badge: { label: t.advisory.typeLabels[p.type], tone: 'neutral' as Tone },
    location: p.location,
    year: p.year,
    tags: [p.typeLabel[locale]],
    metrics: [{ label: f.impact, value: p.impact[locale] }],
    summary: p.summary[locale],
    description: p.description[locale],
    facts: [
      { label: f.client, value: p.client },
      { label: f.project, value: p.project },
      { label: f.type, value: p.typeLabel[locale] },
      { label: f.location, value: p.location },
      { label: f.year, value: String(p.year) },
      { label: f.impact, value: p.impact[locale] },
      ...(p.website ? [{ label: t.explorer.website, value: host(p.website) }] : []),
    ],
    url: p.website ?? undefined,
    filter: p.type,
    search: [p.client, p.project, p.location, p.typeLabel[locale], p.summary[locale]].join(' ').toLowerCase(),
  }));
}

/** Proof (PRD §5.3 step 3): key figures, Tribe and innovation advisory explorers (testimonials: Reviews section). */
export function TrackRecord({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.track;
  return (
    <section id={SECTION_IDS.track} className="section section--base track" aria-labelledby="track-title">
      <div className="container">
        <SectionHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} id="track-title" />
        <dl className="track__stats">
          {t.stats.map((s, i) => (
            <div key={s.label} className="track__stat reveal" style={cssVars({ '--i': i })}>
              <dt>{fillTokens(s.value)}</dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>

        <div id={SECTION_IDS.tribe} className="track__block">
          <header className="track__head reveal">
            <h3 className="track__title">{t.tribe.title}</h3>
            <p>{t.tribe.intro}</p>
          </header>
          <Explorer
            kind="tribe"
            items={tribeItems(dict, locale)}
            filters={(['active', 'exit', 'minority', 'writeoff'] as const).map((v) => ({ value: v, label: t.tribe.statusLabels[v] }))}
            labels={t.explorer}
            externalLabel={dict.ui.a11y.external}
            placeholderBadge={dict.ui.placeholderBadge}
            sorts={['az', 'recent', 'oldest', 'size']}
            initialSort="size"
            initialVisible={4}
          />
          <p className="track__note">{t.tribe.dataNote}</p>
        </div>

        <div id={SECTION_IDS.advisory} className="track__block">
          <header className="track__head reveal">
            <h3 className="track__title">{t.advisory.title}</h3>
            <p>{t.advisory.intro}</p>
          </header>
          <Explorer
            kind="advisory"
            items={advisoryItems(dict, locale)}
            filters={(['corporate', 'investor', 'association', 'institution', 'third_sector'] as const).map((v) => ({ value: v, label: t.advisory.typeLabels[v] }))}
            labels={t.explorer}
            externalLabel={dict.ui.a11y.external}
            placeholderBadge={dict.ui.placeholderBadge}
            sorts={['az', 'recent', 'oldest']}
            initialSort="recent"
            initialVisible={4}
          />
          <p className="track__note">{t.advisory.dataNote}</p>
        </div>
      </div>
    </section>
  );
}
