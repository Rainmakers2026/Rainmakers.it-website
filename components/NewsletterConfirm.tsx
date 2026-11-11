'use client';

import { useState } from 'react';
import type { Locale } from '@/content/types';
import { track } from '@/lib/analytics';

type State = 'idle' | 'sending' | 'confirmed' | 'already_confirmed' | 'expired' | 'invalid' | 'error';

/**
 * Double opt-in step 2. Confirmation needs an explicit click (POST), so link scanners that open
 * emails automatically cannot confirm on the person's behalf. Once confirmed, the personal unsubscribe link is shown
 * (the same one as at the bottom of the newsletter emails), so the whole cycle can be tested from the site.
 */
export function NewsletterConfirm({ locale, token }: { locale: Locale; token: string | null }) {
  const [state, setState] = useState<State>(token ? 'idle' : 'invalid');
  const [unsubscribeUrl, setUnsubscribeUrl] = useState<string | null>(null);
  const it = locale === 'it';
  const copy = it
    ? {
        title: 'Conferma la tua iscrizione',
        text: 'Un ultimo passo: conferma di voler ricevere Gocce di Innovazione, la newsletter mensile di Rainmakers.',
        unsubscribe: 'Non vuoi più riceverla? Annulla l’iscrizione',
        button: 'Conferma l’iscrizione',
        sending: 'Conferma in corso…',
        confirmed: 'Iscrizione confermata. Benvenuto! Ti abbiamo inviato un’email di benvenuto.',
        already_confirmed: 'La tua iscrizione era già confermata. Grazie!',
        expired: 'Il link è scaduto. Iscriviti di nuovo dal sito per ricevere un nuovo link di conferma.',
        invalid: 'Il link non è valido. Usa il link più recente ricevuto via email, oppure iscriviti di nuovo dal sito.',
        error: 'Non è stato possibile confermare l’iscrizione. Riprova tra qualche minuto.',
        back: 'Torna alla home',
      }
    : {
        title: 'Confirm your subscription',
        text: 'One last step: confirm that you want to receive Gocce di Innovazione, the Rainmakers monthly newsletter.',
        unsubscribe: 'No longer interested? Unsubscribe',
        button: 'Confirm subscription',
        sending: 'Confirming…',
        confirmed: 'Subscription confirmed. Welcome! We have sent you a welcome email.',
        already_confirmed: 'Your subscription was already confirmed. Thank you!',
        expired: 'This link has expired. Subscribe again from the website to get a new confirmation link.',
        invalid: 'This link is not valid. Use the most recent link we emailed you, or subscribe again from the website.',
        error: 'We could not confirm your subscription. Please try again in a few minutes.',
        back: 'Back to home',
      };

  async function confirm() {
    if (!token || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/newsletter/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { state?: State; unsubscribeUrl?: string | null };
      setUnsubscribeUrl(typeof data.unsubscribeUrl === 'string' ? data.unsubscribeUrl : null);
      const next: State = data.state && data.state in copy ? data.state : 'error';
      setState(next);
      if (next === 'confirmed') track('newsletter_signup', { step: 'confirmed', locale });
    } catch {
      setState('error');
    }
  }

  const done = state === 'confirmed' || state === 'already_confirmed';
  const problem = state === 'expired' || state === 'invalid' || state === 'error';

  return (
    <div className="newsletter-confirm">
      <h1 className="h2">{copy.title}</h1>
      {done ? (
        <>
          <p className="form-status form-status--success" role="status">{copy[state]}</p>
          {unsubscribeUrl ? (
            <p>
              <a href={unsubscribeUrl}>{copy.unsubscribe}</a>
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="lead">{copy.text}</p>
          {problem ? <p className="form-status form-status--error" role="alert">{copy[state]}</p> : null}
          {state !== 'invalid' && state !== 'expired' ? (
            <button type="button" className="btn btn--primary" onClick={confirm} disabled={state === 'sending'} aria-busy={state === 'sending'}>
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
