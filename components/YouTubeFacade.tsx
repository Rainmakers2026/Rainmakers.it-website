'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Locale } from '@/content/types';
import { track } from '@/lib/analytics';

/**
 * Click-to-load YouTube player (PRD §6.4): shows the thumbnail first, then loads the
 * privacy-enhanced (youtube-nocookie) player only after the visitor asks for it.
 * Nothing from YouTube runs before the click; there is no autoplay with sound on page load.
 */
export function YouTubeFacade({ videoId, title, play, locale }: { videoId: string; title: string; play: string; locale: Locale }) {
  const [active, setActive] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (active) frame.current?.focus();
  }, [active]);

  return (
    <div className="yt">
      {active ? (
        <iframe
          ref={frame}
          className="yt__frame"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <button
          type="button"
          className="yt__facade"
          aria-label={`${play}: ${title}`}
          onClick={() => {
            setActive(true);
            track('video_play', { video: videoId, locale });
          }}
        >
          <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" fill sizes="(max-width: 960px) 100vw, 560px" className="yt__thumb" />
          <span className="yt__play" aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
          <span className="yt__label" aria-hidden>
            {play}
          </span>
        </button>
      )}
    </div>
  );
}
