import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import { bannerLogos } from '@/content/data/logos';
import { buildJsonLd } from '@/lib/seo';
import { headerCopy } from '@/lib/client-copy';
import { Header } from './Header';
import { Footer } from './Footer';
import { ClientEffects } from './ClientEffects';
import { StickyCta } from './StickyCta';
import { JsonLd } from './JsonLd';
import { Hero } from './sections/Hero';
import { Benefits } from './sections/Benefits';
import { Founder } from './sections/Founder';
import { TrackRecord } from './sections/TrackRecord';
import { Services } from './sections/Services';
import { Drizzle } from './visuals/Drizzle';
import { Reviews } from './sections/Reviews';
import { FinalCta } from './sections/FinalCta';
import { LogoMarquee } from './visuals/LogoMarquee';

/**
 * One-page narrative, in the order of the header (2026-10-27): the purpose (hero, "Perché") → clients and Giveback
 * initiatives → "Come": "C'è chi vede il futuro…" and meaningful innovation → "Cosa": what Rainmakers does, its
 * figures and structure chart → "Chi": the founder → track record (Open Venture Building, Advisory, Giveback) → what
 * founders say → "Contattaci": "Come vuoi iniziare?" and the newsletter.
 * FAQ section removed in the Figma review of 2026-10-15, the maxims band ("Le regole del rainmaking") on 2026-10-23
 * — they move to social media as a series; the Italian Rainforest section (photo background) on 2026-11-10 — Italian
 * Rainforest stays as a Giveback unit of the chart. Components and copy kept for a possible return.
 */
export function HomePage({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <>
      <a href="#main" className="skip-link">
        {dict.ui.a11y.skipToContent}
      </a>
      <div className="scroll-progress" aria-hidden />
      {/* light drizzle over the whole page, faint enough never to compete with the copy */}
      <Drizzle />
      <Header dict={headerCopy(dict)} locale={locale} />
      <main id="main" tabIndex={-1}>
        <Hero dict={dict} />
        <LogoMarquee logos={bannerLogos} />
        <Benefits dict={dict} />
        <Services dict={dict} />
        <Founder dict={dict} locale={locale} />
        <TrackRecord dict={dict} locale={locale} />
        <Reviews dict={dict} />
        <LogoMarquee logos={bannerLogos} reverse />
        <FinalCta dict={dict} locale={locale} />
      </main>
      <Footer dict={dict} locale={locale} />
      <StickyCta label={dict.ui.cta.start} href={`#${SECTION_IDS.connect}`} />
      <ClientEffects locale={locale} />
      <JsonLd data={buildJsonLd(dict)} />
    </>
  );
}
