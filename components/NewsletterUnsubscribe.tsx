'use client';

import { useState } from 'react';
import type { Locale } from '@/content/types';
import { track } from '@/lib/analytics';

type State = 'idle' | 'sending' | 'unsubscribed' | 'already' | 'invalid' | 'error';

/**
 * Unsubscribe from "Gocce di Innovazione" (link at the bottom of every newsletter email). Needs an explicit click
 * (POST), so link scanners cannot unsubscribe anyone; the signed link only works for its own contact.
 */
export function NewsletterUnsubscribe({ locale, contact, signature }: { locale: Locale; contact: string | null; signature: string | null }) {
  const [state, setState] = useState<State>(contact && signature ? 'idle' : 'invalid');
  const copy =
    locale === 'it'
      ? {
          title: 'Annulla l’iscrizione',
          text: 'Non riceverai più Gocce di Innovazione, la newsletter mensile di Rainmakers. Puoi iscriverti di nuovo quando vuoi dal sito.',
          button: 'Annulla l’iscrizione',
          sending: 'Un momento…',
          unsubscribed: 'Fatto: la tua iscrizione è stata annullata. Non riceverai più la newsletter.',
          already: 'La tua iscrizione era già stata annullata.',
          invalid: 'Il link non è valido. Usa il link in fondo all’ultima newsletter ricevuta, oppure scrivi a info@rainmakers.it.',
          error: 'Non è stato possibile completare la richiesta. Riprova tra qualche minuto.',
          back: 'Torna alla home',
        }
      : {
          title: 'Unsubscribe',
          text: 'You will no longer receive Gocce di Innovazione, the Rainmakers monthly newsletter. You can subscribe again any time from the website.',
          button: 'Unsubscribe',
          sending: 'One moment…',
          unsubscribed: 'Done: you have been unsubscribed and will no longer receive the newsletter.',
          already: 'You had already unsubscribed.',
          invalid: 'This link is not valid. Use the link at the bottom of the latest newsletter, or write to info@rainmakers.it.',
          error: 'We could not complete your request. Please try again in a few minutes.',
          back: 'Back to home',
        };

  async function unsubscribe() {
    if (!contact || !signature || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ c: contact, t: signature }),
      });
      const data = (await res.json().catch(() => ({}))) as { state?: State };
      const next: State = data.state && data.state in copy ? data.state : 'error';
      setState(next);
      if (next === 'unsubscribed') track('newsletter_signup', { step: 'unsubscribed', locale });
    } catch {
      setState('error');
    }
  }

  const done = state === 'unsubscribed' || state === 'already';
  return (
    <div className="newsletter-confirm">
      <h1 className="h2">{copy.title}</h1>
      {done ? (
        <p className="form-status form-status--success" role="status">
          {copy[state]}
        </p>
      ) : (
        <>
          <p className="lead">{copy.text}</p>
          {state === 'invalid' || state === 'error' ? (
            <p className="form-status form-status--error" role="alert">
              {copy[state]}
            </p>
          ) : null}
          {state !== 'invalid' ? (
            <button type="button" className="btn btn--primary" onClick={unsubscribe} disabled={state === 'sending'} aria-busy={state === 'sending'}>
              {state === 'sending' ? copy.sending : copy.button}
            </button>
          ) : null}
        </>
      )}
      <p>
        <a className="link-arrow" href={`/${locale}`}>
          {copy.back}
        </a>
      </p>
    </div>
  );
}
