'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Locale } from '@/content/types';
import { track } from '@/lib/analytics';
import { AREA_LABELS, type Area } from '@/lib/crm/taxonomy';
import { currentPage, visitUtm } from '@/lib/crm/client-source';
import { Check, Close } from './icons';

/** Server outcomes of POST /api/newsletter (lib/brevo/workflows.ts → SubscribeState). */
type Outcome = 'pending' | 'pending_recent' | 'already' | 'email_failed' | 'invalid' | 'rate_limited' | 'error';
type Status = 'idle' | 'sending' | Outcome;

/**
 * "Gocce di Innovazione", the only Rainmakers newsletter (2026-11-11), with double opt-in: this form only requests the
 * subscription (Supabase 'pending_confirmation'); it becomes active when the person confirms from the email.
 * Email required; first name and editorial interests (Giveback / Open Venture Building / Advisory) optional.
 * `inline`: the form is shown in place (closing section of the homepage) instead of a link opening a popup.
 */
export function NewsletterSignup({
  locale,
  className = '',
  source,
  inline = false,
}: {
  locale: Locale;
  className?: string;
  source?: 'footer' | 'final' | 'news' | 'popup';
  inline?: boolean;
}) {
  const id = useId();
  const dialog = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [interests, setInterests] = useState<Area[]>([]);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [started, setStarted] = useState(0);

  const copy = locale === 'it'
    ? {
        trigger: 'Iscriviti alla newsletter',
        title: 'Gocce di Innovazione, una volta al mese',
        text: 'La newsletter di Rainmakers: le idee, le opportunità e le storie che fanno crescere l’innovazione.',
        email: 'Email',
        placeholder: 'La tua email',
        firstName: 'Nome (facoltativo)',
        namePlaceholder: 'Il tuo nome (facoltativo)',
        interests: 'Mi interessano soprattutto (facoltativo)',
        consent: 'Voglio ricevere Gocce di Innovazione, la newsletter mensile di Rainmakers, e ho letto l’informativa privacy.',
        submit: 'Iscriviti',
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
        title: 'Gocce di Innovazione, once a month',
        text: 'The Rainmakers newsletter: the ideas, opportunities and stories that help innovation grow.',
        email: 'Email',
        placeholder: 'Your email',
        firstName: 'First name (optional)',
        namePlaceholder: 'Your first name (optional)',
        interests: 'I am mostly interested in (optional)',
        consent: 'I would like to receive Gocce di Innovazione, the Rainmakers monthly newsletter, and have read the privacy policy.',
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
        body: JSON.stringify({
          email,
          firstName,
          interests,
          locale,
          consent,
          source,
          sourcePage: currentPage(),
          utm: visitUtm(),
          website,
          elapsedMs: Date.now() - started,
        }),
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

  const interestChoices = (
    <fieldset className="choice-group choice-group--compact nl-interests">
      <legend className="field__label">{copy.interests}</legend>
      <div className="choice-group__options">
        {(Object.keys(AREA_LABELS) as Area[]).map((area) => (
          <label key={area} className="choice">
            <input
              type="checkbox"
              name="interests"
              value={area}
              checked={interests.includes(area)}
              onChange={(event) => setInterests((list) => (event.target.checked ? [...list, area] : list.filter((a) => a !== area)))}
            />
            <span>{AREA_LABELS[area][locale]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  if (inline) {
    return (
      <div className={`nl-inline ${className}`}>
        {done ? (
          <div className="nl-inline__done" role="status">
            <span className="nl-inline__done-mark" aria-hidden>
              <Check />
            </span>
            <p>{copy[status]}</p>
          </div>
        ) : (
          // The timer for the anti-spam check starts when the visitor first touches the form
          <form className="nl-inline__form" onSubmit={submit} onFocus={() => started || setStarted(Date.now())}>
            <div className="nl-inline__row">
              <label className="sr-only" htmlFor={`${id}-name`}>
                {copy.firstName}
              </label>
              <input
                id={`${id}-name`}
                className="nl-inline__input nl-inline__input--name"
                name="firstName"
                autoComplete="given-name"
                placeholder={copy.namePlaceholder}
                maxLength={80}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
              <label className="sr-only" htmlFor={`${id}-email`}>
                {copy.email}
              </label>
              <input
                id={`${id}-email`}
                className="nl-inline__input"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder={copy.placeholder}
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <label className="modal-form__honeypot" aria-hidden="true">
              Website <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </label>
            {interestChoices}
            <label className="consent nl-inline__consent">
              <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>
                {copy.consent}{' '}
                <a href={`/${locale}/privacy`} target="_blank" rel="noopener">
                  {locale === 'it' ? 'Privacy' : 'Privacy policy'}
                </a>
              </span>
            </label>
            {problem ? (
              <p className={`form-status ${status === 'email_failed' ? 'form-status--warning' : 'form-status--error'}`} role="alert">
                {copy[status]}
              </p>
            ) : null}
            <button type="submit" className="btn btn--primary nl-inline__submit" disabled={status === 'sending'} aria-busy={status === 'sending'}>
              {status === 'sending' ? copy.sending : copy.submit}
            </button>
          </form>
        )}
      </div>
    );
  }

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
                <label className="field">
                  <span className="field__label">{copy.firstName}</span>
                  <input name="firstName" autoComplete="given-name" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                </label>
                {interestChoices}
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
