import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import type { Community as CommunityItem } from '@/content/shared';
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
import { HowItWorks } from './sections/HowItWorks';
import { Community } from './sections/Community';
import { Rainforest } from './sections/Rainforest';
import { Faq } from './sections/Faq';
import { Reviews } from './sections/Reviews';
import { FinalCta } from './sections/FinalCta';
import { KeywordBand } from './visuals/KeywordBand';

/**
 * One-page narrative (PRD §5.3): value proposition → benefits → proof (founder, track record)
 * → mechanism → community → Italian Rainforest → FAQ → what founders say → action.
 * Pure server component; communities are passed in by the page (Supabase or fallback).
 */
export function HomePage({ dict, locale, communities }: { dict: Dictionary; locale: Locale; communities: CommunityItem[] }) {
  return (
    <>
      <a href="#main" className="skip-link">
        {dict.ui.a11y.skipToContent}
      </a>
      <div className="scroll-progress" aria-hidden />
      <Header dict={headerCopy(dict)} locale={locale} />
      <main id="main" tabIndex={-1}>
        <Hero dict={dict} />
        <KeywordBand words={dict.ui.keywords} />
        <Benefits dict={dict} />
        <Founder dict={dict} locale={locale} />
        <TrackRecord dict={dict} locale={locale} />
        <HowItWorks dict={dict} />
        <Community dict={dict} locale={locale} communities={communities} />
        <Rainforest dict={dict} locale={locale} />
        <Faq dict={dict} />
        <Reviews dict={dict} />
        <KeywordBand words={dict.ui.keywords} reverse />
        <FinalCta dict={dict} locale={locale} />
      </main>
      <Footer dict={dict} locale={locale} />
      <StickyCta label={dict.ui.cta.start} href={`#${SECTION_IDS.connect}`} />
      <ClientEffects locale={locale} />
      <JsonLd data={buildJsonLd(dict)} />
    </>
  );
}
