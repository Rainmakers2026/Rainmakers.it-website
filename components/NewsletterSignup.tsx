'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Locale } from '@/content/types';
import { track } from '@/lib/analytics';
import { Close } from './icons';

/** Server outcomes of POST /api/newsletter (lib/brevo/workflows.ts → SubscribeState). */
type Outcome = 'pending' | 'pending_recent' | 'already' | 'email_failed' | 'invalid' | 'rate_limited' | 'error';
type Status = 'idle' | 'sending' | Outcome;

/**
 * Newsletter signup with double opt-in: this form only requests the subscription; the address joins
 * the Brevo list "Contatti" after the person confirms from the email.
 */
export function NewsletterSignup({ locale, className = '', source }: { locale: Locale; className?: string; source?: 'footer' | 'final' | 'news' | 'popup' }) {
  const id = useId();
  const dialog = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [started, setStarted] = useState(0);

  const copy = locale === 'it'
    ? {
        trigger: 'Iscriviti alla newsletter',
        title: 'Rainmakers, una volta al mese',
        text: 'Ricevi gli highlight dell’ecosistema e i link agli ultimi articoli in un solo clic.',
        email: 'Email',
        consent: 'Acconsento a ricevere la newsletter Rainmakers e ho letto l’informativa privacy.',
        submit: 'Iscrivimi',
        sending: 'Invio…',
        close: 'Chiudi',
        pending: 'Quasi fatto: ti abbiamo inviato un’email. Clicca sul link per confermare l’iscrizione (controlla anche lo spam).',
        pending_recent: 'Ti abbiamo appena inviato l’email di conferma: controlla la tua casella (anche lo spam). Puoi richiederne un’altra tra qualche minuto.',
        already: 'Questo indirizzo è già iscritto alla newsletter. Grazie!',
        email_failed: 'Abbiamo registrato la tua richiesta, ma non siamo riusciti a inviare l’email di conferma. Riprova tra qualche minuto.',
        invalid: 'Inserisci un indirizzo email valido e accetta l’informativa.',
        rate_limited: 'Troppi tentativi. Riprova tra qualche minuto.',
        error: 'Non è stato possibile completare l’iscrizione. Riprova.',
      }
    : {
        trigger: 'Subscribe to the newsletter',
        title: 'Rainmakers, once a month',
        text: 'Get ecosystem highlights and links to the latest articles in one click.',
        email: 'Email',
        consent: 'I agree to receive the Rainmakers newsletter and have read the privacy policy.',
        submit: 'Subscribe',
        sending: 'Sending…',
        close: 'Close',
        pending: 'Almost done: we have sent you an email. Click the link to confirm your subscription (check your spam folder too).',
        pending_recent: 'We have just sent you the confirmation email: please check your inbox (and spam). You can request another one in a few minutes.',
        already: 'This address is already subscribed to the newsletter. Thank you!',
        email_failed: 'We saved your request but could not send the confirmation email. Please try again in a few minutes.',
        invalid: 'Please enter a valid email address and accept the privacy policy.',
        rate_limited: 'Too many attempts. Please try again in a few minutes.',
        error: 'We could not complete your subscription. Please try again.',
      };

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add('modal-open');
    dialog.current?.querySelector<HTMLElement>('input[type="email"]')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
      if (event.key === 'Tab' && dialog.current) {
        const focusables = [...dialog.current.querySelectorAll<HTMLElement>('button, input:not([type="hidden"]), a[href]')];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => returnFocus.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, consent, source, website, elapsedMs: Date.now() - started }),
      });
      const result = (await response.json().catch(() => ({}))) as { state?: Outcome };
      const outcome: Outcome =
        response.status === 429 ? 'rate_limited' : response.status === 422 ? 'invalid' : result.state && result.state in copy ? result.state : 'error';
      setStatus(outcome);
      if (outcome === 'pending') track('newsletter_signup', { step: 'requested', locale, source: source ?? null });
    } catch {
      setStatus('error');
    }
  }

  // Final states replace the form; recoverable ones keep it (with the email still filled in)
  const done = status === 'pending' || status === 'pending_recent' || status === 'already';
  const problem = status === 'email_failed' || status === 'invalid' || status === 'rate_limited' || status === 'error';

  return (
    <>
      <button
        type="button"
        className={`link-button newsletter-trigger ${className}`}
        onClick={(event) => {
          returnFocus.current = event.currentTarget;
          setStarted(Date.now());
          setStatus('idle');
          setOpen(true);
        }}
      >
        {copy.trigger}
      </button>
      {open ? (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <section ref={dialog} className="site-modal" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1}>
            <button className="site-modal__close" type="button" aria-label={copy.close} onClick={close}>
              <Close aria-hidden />
            </button>
            <h2 id={`${id}-title`}>{copy.title}</h2>
            <p>{copy.text}</p>
            {done ? (
              <p className="form-status form-status--success" role="status">{copy[status]}</p>
            ) : (
              <form className="modal-form" onSubmit={submit}>
                <label className="field">
                  <span className="field__label">{copy.email}</span>
                  <input type="email" name="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
                <label className="modal-form__honeypot" aria-hidden="true">
                  Website <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
                </label>
                <label className="consent">
                  <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                  <span>{copy.consent} <a href={`/${locale}/privacy`} target="_blank" rel="noopener">{locale === 'it' ? 'Privacy' : 'Privacy policy'}</a></span>
                </label>
                {problem ? <p className={`form-status ${status === 'email_failed' ? 'form-status--warning' : 'form-status--error'}`} role="alert">{copy[status]}</p> : null}
                <button type="submit" className="btn btn--primary" disabled={status === 'sending'} aria-busy={status === 'sending'}>
                  {status === 'sending' ? copy.sending : copy.submit}
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
