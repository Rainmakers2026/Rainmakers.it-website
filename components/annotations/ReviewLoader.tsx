'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

/**
 * Loads the internal annotation layer ONLY in review mode (?review=1, remembered in a non-secret
 * "rm_review" cookie; ?review=0 turns it off). Public visitors never download the layer's code,
 * and no annotation is ever part of the page HTML: the layer fetches them after team sign-in.
 */
const SiteAnnotationLayer = dynamic(() => import('./SiteAnnotationLayer'), { ssr: false });

const HINT = 'rm_review';

export function ReviewLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('review');
    if (param === '1') document.cookie = `${HINT}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;
    if (param === '0') document.cookie = `${HINT}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
    setActive(document.cookie.split(';').some((c) => c.trim() === `${HINT}=1`));
  }, []);

  if (!active) return null;
  return (
    <SiteAnnotationLayer
      onExit={() => {
        document.cookie = `${HINT}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
        setActive(false);
      }}
    />
  );
}
