import { headerCopy } from '@/lib/client-copy';
import type { Dictionary, Locale } from '@/content/types';
import { buildJsonLd } from '@/lib/seo';
import { Header } from './Header';
import { Footer } from './Footer';
import { ClientEffects } from './ClientEffects';
import { StickyCta } from './StickyCta';
import { JsonLd } from './JsonLd';
import { Hero } from './sections/Hero';
import { Challenge } from './sections/Challenge';
import { About } from './sections/About';
import { Value } from './sections/Value';
import { HowItWorks } from './sections/HowItWorks';
import { Rainforest } from './sections/Rainforest';
import { Community } from './sections/Community';
import { Proof } from './sections/Proof';
import { Audience } from './sections/Audience';
import { Join } from './sections/Join';
import { Faq } from './sections/Faq';
import { FinalCta } from './sections/FinalCta';

/**
 * The one-page narrative (PRD §14, §43):
 * ALONE (challenge) → CONNECTED (about, value) → INFORMED (how) → DISCOVERING (rainforest)
 * → COLLABORATING (community, proof) → GROWING (join).
 * Pure server component: no data fetching, so it can also be rendered by scripts/preview.
 */
export function HomePage({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <>
      <a href="#main" className="skip-link">
        {dict.a11y.skipToContent}
      </a>
      <div className="scroll-progress" aria-hidden />
      <Header dict={headerCopy(dict)} locale={locale} />
      <main id="main" tabIndex={-1}>
        <Hero dict={dict} locale={locale} />
        <Challenge dict={dict} />
        <About dict={dict} />
        <Value dict={dict} />
        <HowItWorks dict={dict} />
        <Rainforest dict={dict} locale={locale} />
        <Community dict={dict} />
        <Proof dict={dict} locale={locale} />
        <Audience dict={dict} />
        <Join dict={dict} locale={locale} />
        <Faq dict={dict} />
        <FinalCta dict={dict} locale={locale} />
      </main>
      <Footer dict={dict} locale={locale} />
      <StickyCta label={dict.cta.join} />
      <ClientEffects locale={locale} />
      <JsonLd data={buildJsonLd(dict)} />
    </>
  );
}
