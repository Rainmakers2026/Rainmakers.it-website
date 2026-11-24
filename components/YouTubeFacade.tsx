'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Locale } from '@/content/types';
import { track } from '@/lib/analytics';

const ORIGIN = 'https://www.youtube-nocookie.com';

/**
 * YouTube player (PRD §6.4) on the privacy-enhanced youtube-nocookie domain. By default it is click-to-load: the
 * thumbnail first, the player only after the visitor asks for it.
 * `autoplayInView` (founder TEDx video, team request 2026-11-24): the player loads and starts by itself when the video
 * scrolls into view, with sound. Browsers only allow sound after the visitor has interacted with the page (a click or a
 * key, not a scroll): when the unmuted start is refused, the video plays muted and the sound comes on at the visitor's
 * first click, tap or key press anywhere (or with the "Attiva audio" button). It pauses when it leaves the screen.
 */
export function YouTubeFacade({
  videoId,
  title,
  play,
  locale,
  autoplayInView = false,
}: {
  videoId: string;
  title: string;
  play: string;
  locale: Locale;
  autoplayInView?: boolean;
}) {
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const playing = useRef(false);
  const visible = useRef(false);
  const started = useRef(false);

  const send = useCallback((func: string) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), ORIGIN);
  }, []);

  const unmute = useCallback(() => {
    send('unMute');
    send('playVideo');
    setMuted(false);
  }, [send]);

  // Start when the video scrolls into view, pause when it leaves
  useEffect(() => {
    if (!autoplayInView || !box.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (!started.current) {
            started.current = true;
            setActive(true);
            track('video_play', { video: videoId, locale, trigger: 'in_view' });
          }
          send('playVideo');
        } else send('pauseVideo');
      },
      { threshold: 0.5 },
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [autoplayInView, send, videoId, locale]);

  // Player state from the iframe API; fall back to a muted start if the browser refuses sound
  useEffect(() => {
    if (!autoplayInView || !active) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== ORIGIN || event.source !== frame.current?.contentWindow) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const state = data?.info?.playerState;
        if (typeof state === 'number') playing.current = state === 1;
      } catch {
        /* not a player message */
      }
    };
    window.addEventListener('message', onMessage);
    const fallback = window.setTimeout(() => {
      if (playing.current || !visible.current) return;
      send('mute');
      send('playVideo');
      setMuted(true);
    }, 1800);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(fallback);
    };
  }, [autoplayInView, active, send]);

  // Sound on at the first real interaction with the page
  useEffect(() => {
    if (!muted) return;
    const on = () => unmute();
    const opts = { once: true, capture: true } as const;
    document.addEventListener('pointerdown', on, opts);
    document.addEventListener('keydown', on, opts);
    return () => {
      document.removeEventListener('pointerdown', on, opts);
      document.removeEventListener('keydown', on, opts);
    };
  }, [muted, unmute]);

  useEffect(() => {
    if (active && !autoplayInView) frame.current?.focus();
  }, [active, autoplayInView]);

  const origin = typeof window === 'undefined' ? '' : `&origin=${encodeURIComponent(window.location.origin)}`;
  const params = autoplayInView ? `autoplay=1&rel=0&playsinline=1&enablejsapi=1${origin}` : 'autoplay=1&rel=0';

  return (
    <div className="yt" ref={box}>
      {active ? (
        <>
          <iframe
            ref={frame}
            className="yt__frame"
            src={`${ORIGIN}/embed/${videoId}?${params}`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => {
              // subscribe to player state updates
              frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoId }), ORIGIN);
              if (visible.current) send('playVideo');
            }}
          />
          {muted ? (
            <button type="button" className="yt__unmute" onClick={unmute}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
              </svg>
              {locale === 'it' ? 'Attiva audio' : 'Turn sound on'}
            </button>
          ) : null}
        </>
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
