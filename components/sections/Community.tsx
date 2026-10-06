import type { Dictionary, Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import type { Community as CommunityItem } from '@/content/shared';
import { isPlaceholder } from '@/content/governance';
import { PhText } from '../PhText';
import { WhatsApp } from '../icons';
import { SectionHeader, cssVars } from '../ui';

/** 09 — Community / WhatsApp: conversion section, data-driven (PRD §16–17). */
export function Community({ dict, locale, communities }: { dict: Dictionary; locale: Locale; communities: CommunityItem[] }) {
  const c = dict.community;
  return (
    <section id={SECTION_IDS.community} className="section section--deep community" aria-labelledby="community-title">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} intro={c.text} id="community-title" />
        <div className="community__spaces reveal">
          <span className="community__spaces-label">{c.spacesLabel}</span>
          <ul className="tags">
            {c.spaces.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <h3 className="h3 community__list-title reveal">{c.listTitle}</h3>
        <ul className="community__list">
          {communities.map((item, i) => {
            const name = item.name[locale];
            const description = item.description[locale];
            const canJoin = item.status === 'active' && !!item.whatsappUrl && !isPlaceholder(item.whatsappUrl);
            return (
              <li key={item.slug} className={`community-card reveal is-${item.status}`} style={cssVars({ '--i': i % 3 })}>
                <div className="community-card__body">
                  {item.category ? (
                    <p className="community-card__meta">
                      <span className="sr-only">{c.categoryLabel}: </span>
                      {item.category}
                      {item.target ? ` · ${c.targetLabel} ${item.target}` : ''}
                    </p>
                  ) : null}
                  <PhText as="h4" className="community-card__name" value={name} badge={dict.ui.placeholderBadge} />
                  {description ? <PhText as="p" value={description} badge={dict.ui.placeholderBadge} /> : null}
                </div>
                {canJoin ? (
                  <a
                    className="btn btn--primary btn--block"
                    href={item.whatsappUrl!}
                    target="_blank"
                    rel="noopener"
                    data-track="whatsapp_click"
                    data-location="community_section"
                    data-community={item.slug}
                  >
                    <WhatsApp aria-hidden />
                    <span>{c.join}</span>
                    <span className="sr-only">
                      {' '}
                      — {name} {dict.ui.a11y.external}
                    </span>
                  </a>
                ) : (
                  <p className="community-card__status">
                    {item.status === 'full' ? c.full : item.status === 'coming_soon' ? c.comingSoon : null}
                    {!item.whatsappUrl && item.status !== 'full' ? <PhText className="community-card__missing" value={c.linkMissing} badge={dict.ui.placeholderBadge} /> : null}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <p className="community__note reveal">
          {c.note}{' '}
          <a href={`#${SECTION_IDS.connect}`} className="link-arrow link-arrow--down" data-track="contact_cta_click" data-location="community_note">
            {dict.ui.cta.connect}
          </a>
        </p>
      </div>
    </section>
  );
}
