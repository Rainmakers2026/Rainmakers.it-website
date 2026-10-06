import type { Dictionary, Locale } from '@/content/types';
import type { Community as CommunityItem } from '@/content/shared';
import { rainforest } from '@/content/shared';
import { buildJsonLd } from '@/lib/seo';
import { headerCopy } from '@/lib/client-copy';
import { Header } from './Header';
import { Footer } from './Footer';
import { ClientEffects } from './ClientEffects';
import { StickyCta } from './StickyCta';
import { JsonLd } from './JsonLd';
import { Hero } from './sections/Hero';
import { Why } from './sections/Why';
import { About } from './sections/About';
import { Access } from './sections/Access';
import { Rainforest } from './sections/Rainforest';
import { Network } from './sections/Network';
import { HowItWorks } from './sections/HowItWorks';
import { Audience } from './sections/Audience';
import { Proof } from './sections/Proof';
import { Model } from './sections/Model';
import { TrackRecord } from './sections/TrackRecord';
import { Community } from './sections/Community';
import { Connect } from './sections/Connect';
import { Faq } from './sections/Faq';
import { FinalCta } from './sections/FinalCta';

/**
 * One-page narrative (PRD §7, §38): attention → understanding → interest → trust → discovery → action.
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
        <Hero dict={dict} locale={locale} />
        <Why dict={dict} />
        <About dict={dict} />
        <Access dict={dict} />
        <Rainforest dict={dict} locale={locale} />
        <Network dict={dict} />
        <HowItWorks dict={dict} />
        <Audience dict={dict} />
        <Model dict={dict} />
        <Proof dict={dict} />
        <Community dict={dict} locale={locale} communities={communities} />
        <Connect dict={dict} locale={locale} />
        <TrackRecord dict={dict} locale={locale} />
        <Faq dict={dict} />
        <FinalCta dict={dict} locale={locale} />
      </main>
      <Footer dict={dict} locale={locale} />
      <StickyCta label={dict.ui.cta.explore} href={rainforest.urlFor(locale)} external={dict.ui.a11y.external} />
      <ClientEffects locale={locale} />
      <JsonLd data={buildJsonLd(dict)} />
    </>
  );
}
