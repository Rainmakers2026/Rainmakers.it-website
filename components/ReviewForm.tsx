'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Locale, ReviewFormCopy } from '@/content/types';
import { reviewSchema, toFieldErrors, type ReviewErrorCode } from '@/lib/validation';
import { UTM_KEYS } from '@/lib/options';
import { track } from '@/lib/analytics';

type Status = 'idle' | 'sending' | 'done';
const MAX = 1500;

/**
 * "Lascia una review" form, inside the native popover of the "Dicono di noi" section.
 * POST /api/review → saved in Supabase (reviews) and emailed to info@rainmakers.it.
 */
export function ReviewForm({ copy, locale, external, platformUrl }: { copy: ReviewFormCopy; locale: Locale; external: string; platformUrl: string | null }) {
  const uid = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [fields, setFields] = useState({ name: '', email: '', company: '', role: '', review: '', publishConsent: true, consent: false });
  const [rating, setRating] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, ReviewErrorCode>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [hp, setHp] = useState('');
  const openedAt = useRef(0);
  const key = useRef('');

  useEffect(() => {
    openedAt.current = Date.now();
    key.current = crypto.randomUUID();
  }, []);

  const id = (f: string) => `${uid}-${f}`;
  const msg = (f: string) => (errors[f] ? copy.errors[errors[f] as keyof ReviewFormCopy['errors']] ?? copy.errors.required : null);
  const set = (f: keyof typeof fields) => (e: { target: { value: string } }) => setFields((s) => ({ ...s, [f]: e.target.value }));
  const described = (f: string) => (errors[f] ? `${id(f)}-error` : undefined);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;
    setServerError(null);
    const utm: Record<string, string> = {};
    const params = new URLSearchParams(window.location.search);
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) utm[k] = v.slice(0, 200);
    }
    const payload = {
      locale,
      ...fields,
      company: fields.company || undefined,
      role: fields.role || undefined,
      rating: rating ?? undefined,
      idempotencyKey: key.current,
      utm: Object.keys(utm).length ? utm : undefined,
      company_website_hp: hp,
      elapsedMs: Date.now() - openedAt.current,
    };
    const parsed = reviewSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error) as Record<string, ReviewErrorCode>);
      setServerError(copy.errors.summary);
      return;
    }
    setErrors({});
    setStatus('sending');
    try {
      const res = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; fields?: Record<string, ReviewErrorCode> };
      if (res.ok && data.ok) {
        setStatus('done');
        track('review_submit', { locale, rating: rating ?? 0 });
        return;
      }
      if (data.fields) setErrors(data.fields);
      setServerError(res.status === 429 ? copy.errors.rateLimited : data.fields ? copy.errors.summary : copy.errors.generic);
    } catch {
      setServerError(copy.errors.generic);
    }
    setStatus('idle');
  }

  if (status === 'done') {
    return (
      <div className="review-form review-form--done" role="status">
        <span className="review-form__splash" aria-hidden />
        <p className="review-form__done-title">{copy.successTitle}</p>
        <p>{copy.successText}</p>
      </div>
    );
  }

  const textField = (f: 'name' | 'email' | 'company' | 'role', label: string, opts: { required?: boolean; type?: string; auto?: string; max: number }) => (
    <div className={`field ${errors[f] ? 'has-error' : ''}`}>
      <label className="field__label" htmlFor={id(f)}>
        {label}{' '}
        {opts.required ? (
          <span className="field__req" aria-hidden>
            *
          </span>
        ) : (
          <span className="field__opt">({copy.optional})</span>
        )}
      </label>
      <input
        id={id(f)}
        type={opts.type ?? 'text'}
        autoComplete={opts.auto}
        required={opts.required}
        maxLength={opts.max}
        value={fields[f]}
        onChange={set(f)}
        aria-invalid={!!errors[f]}
        aria-describedby={described(f)}
      />
      {msg(f) ? (
        <p id={`${id(f)}-error`} className="field__error">
          {msg(f)}
        </p>
      ) : null}
    </div>
  );

  return (
    <form className="review-form" noValidate onSubmit={submit}>
      <fieldset className="review-form__rating">
        <legend className="field__label">
          {copy.rating} <span className="field__opt">({copy.optional})</span>
        </legend>
        <div className="stars" role="radiogroup" aria-label={copy.rating}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`star ${rating !== null && n <= rating ? 'is-on' : ''}`}>
              <input type="radio" name={id('rating')} value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <span className="sr-only">{copy.ratingLabels[n - 1]}</span>
              <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden focusable="false">
                <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" />
              </svg>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="review-form__row">
        {textField('name', copy.name, { required: true, auto: 'name', max: 120 })}
        {textField('email', copy.email, { required: true, type: 'email', auto: 'email', max: 254 })}
      </div>
      <div className="review-form__row">
        {textField('company', copy.company, { auto: 'organization', max: 120 })}
        {textField('role', copy.role, { auto: 'organization-title', max: 120 })}
      </div>

      <div className={`field ${errors.review ? 'has-error' : ''}`}>
        <label className="field__label" htmlFor={id('review')}>
          {copy.review}{' '}
          <span className="field__req" aria-hidden>
            *
          </span>
        </label>
        <textarea
          id={id('review')}
          rows={4}
          required
          maxLength={MAX}
          placeholder={copy.reviewHint}
          value={fields.review}
          onChange={set('review')}
          aria-invalid={!!errors.review}
          aria-describedby={[`${id('review')}-count`, described('review')].filter(Boolean).join(' ')}
        />
        <p id={`${id('review')}-count`} className="review-form__count" aria-live="polite">
          {fields.review.length} / {MAX}
        </p>
        {msg('review') ? (
          <p id={`${id('review')}-error`} className="field__error">
            {msg('review')}
          </p>
        ) : null}
      </div>

      <div className="hp" aria-hidden>
        <label htmlFor={id('hp')}>Company website</label>
        <input id={id('hp')} tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div className="consent">
        <input id={id('publish')} type="checkbox" checked={fields.publishConsent} onChange={(e) => setFields((s) => ({ ...s, publishConsent: e.target.checked }))} />
        <label htmlFor={id('publish')}>{copy.publishConsent}</label>
      </div>
      <div className={`consent ${errors.consent ? 'has-error' : ''}`}>
        <input
          id={id('consent')}
          type="checkbox"
          checked={fields.consent}
          onChange={(e) => setFields((s) => ({ ...s, consent: e.target.checked }))}
          aria-invalid={!!errors.consent}
          aria-describedby={described('consent')}
        />
        <label htmlFor={id('consent')}>
          {copy.consent}{' '}
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener">
            {copy.privacy}
            <span className="sr-only"> {external}</span>
          </a>
        </label>
        {msg('consent') ? (
          <p id={`${id('consent')}-error`} className="field__error">
            {msg('consent')}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p className="form-status form-status--error" role="alert">
          {serverError}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary btn--block" disabled={status === 'sending'} aria-busy={status === 'sending'}>
        {status === 'sending' ? copy.submitting : copy.submit}
      </button>
      {platformUrl ? (
        <a className="review-form__platform" href={platformUrl} target="_blank" rel="noopener" data-track="review_cta_click" data-location="review_platform">
          {copy.orPlatform} ↗<span className="sr-only"> {external}</span>
        </a>
      ) : (
        <a className="review-form__platform" href="#review-link-to-be-provided" data-placeholder="true">
          {copy.orPlatform} ↗
        </a>
      )}
    </form>
  );
}
