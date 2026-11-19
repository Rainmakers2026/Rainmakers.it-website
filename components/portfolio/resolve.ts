import type { Locale } from '@/content/types';
import { founderIntro, portfolioSlides, type PortfolioLogo } from '@/content/data/founder-portfolio';
import { portfolioLogoSizes } from '@/content/data/portfolio-logo-sizes';
import { logoBox, whiteLogo, type LogoImage } from '@/content/data/logos';

/** A carousel logo, sized on the server to the same visual weight as its neighbours. */
export interface PfLogo {
  name: string;
  src: string | null;
  width: number;
  height: number;
  badge?: 'exit' | 'min' | 'off';
  look?: 'black' | 'faded';
  soon?: boolean;
}

export interface PfSlide {
  id: string;
  unit: string;
  lead?: string;
  paragraphs: string[];
  bulletsIntro?: string;
  bullets?: string[];
  logos?: PfLogo[];
  panelNote?: string;
  moreLogos?: PfLogo[];
  video?: { id: string; title: string };
  stat?: { value: string; label: string };
  soon?: string;
}

export interface PfIntro {
  name: string;
  studied: string;
  worked: string;
  doing: string;
  studiedAt: PfLogo[];
  workedAt: PfLogo[];
  moreInfo: string;
  linkedin: { label: string; url: string };
}

/**
 * Frames sized up on 2026-11-17 ("loghi ben visibili"): every logo covers about the same area, and `minH` keeps wide,
 * thin wordmarks (Innovatec, Coppa+Landini…) from shrinking to an unreadable strip.
 */
type Frame = { area: number; maxW: number; maxH: number; minH: number };
const FRAMES = {
  intro: { area: 8200, maxW: 230, maxH: 80, minH: 34 },
  unit: { area: 8400, maxW: 210, maxH: 76, minH: 34 },
  /** only a few logos on the slide (Builder): larger */
  feature: { area: 13500, maxW: 210, maxH: 112, minH: 48 },
  tribe: { area: 3900, maxW: 128, maxH: 50, minH: 24 },
  black: { area: 4200, maxW: 70, maxH: 70, minH: 0 },
} satisfies Record<string, Frame>;

/** Optical corrections for marks that read lighter than their ink suggests (faint seals, thin lettering). */
const TUNE: Record<string, number> = { angelsforum: 1.3, santaclara: 1.2, innovatec: 1.15, futurefashion: 1.15, impactscool: 1.15 };

function image(src: PortfolioLogo['src']): LogoImage | undefined {
  if (src.startsWith('site:')) return whiteLogo(src.slice(5));
  if (src.startsWith('pf:')) {
    const name = src.slice(3);
    const size = portfolioLogoSizes[name];
    if (!size) return undefined;
    const [width, height, density] = size;
    return { src: `/brand/portfolio/${name}.webp`, width, height, density, tune: TUNE[name] ?? 1 };
  }
  return undefined;
}

function sized(logo: PortfolioLogo, frame: Frame): PfLogo {
  const img = image(logo.src);
  // logos on a black disc sit in a fixed round badge, so they are fitted inside it
  const f = logo.look === 'black' ? FRAMES.black : frame;
  const box = img ? logoBox(img, f.area, f.maxW, f.maxH, 4) : { width: 0, height: 0 };
  if (img && box.height < f.minH) {
    const ratio = img.width / img.height;
    box.width = Math.round(Math.min(f.maxW, f.minH * ratio));
    box.height = Math.round(box.width / ratio);
  }
  return { name: logo.name, src: img?.src ?? null, ...box, badge: logo.badge, look: logo.look, soon: logo.soon };
}

export function portfolioFor(locale: Locale): { intro: PfIntro; slides: PfSlide[] } {
  const i = founderIntro;
  const intro: PfIntro = {
    name: i.name,
    studied: i.studied[locale],
    worked: i.worked[locale],
    doing: i.doing[locale],
    studiedAt: i.studiedAt.map((x) => sized(x, FRAMES.intro)),
    workedAt: i.workedAt.map((x) => sized(x, FRAMES.intro)),
    moreInfo: i.moreInfo[locale],
    linkedin: i.linkedin,
  };
  const slides = portfolioSlides.map(
    (s): PfSlide => ({
      id: s.id,
      unit: s.unit,
      lead: s.lead?.[locale],
      paragraphs: s.paragraphs[locale],
      bulletsIntro: s.bulletsIntro?.[locale],
      bullets: s.bullets?.[locale],
      logos: s.logos?.map((x) => sized(x, s.id === 'accelerator' ? FRAMES.tribe : s.logos!.length <= 3 ? FRAMES.feature : FRAMES.unit)),
      panelNote: s.panelNote?.[locale],
      moreLogos: s.moreLogos?.map((x) => sized(x, FRAMES.tribe)),
      video: s.video ? { id: s.video.id, title: s.video.title[locale] } : undefined,
      stat: s.stat ? { value: s.stat.value, label: s.stat.label[locale] } : undefined,
      soon: s.soon?.[locale],
    }),
  );
  return { intro, slides };
}
