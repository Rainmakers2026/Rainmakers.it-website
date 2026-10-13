'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import type { CommunityFormCopy, Locale } from '@/content/types';
import { communitySchema, toFieldErrors, type ErrorCode } from '@/lib/validation';
import { UTM_KEYS } from '@/lib/options';
import { track } from '@/lib/analytics';
import { WhatsApp } from './icons';

type Status = 'closed' | 'open' | 'sending' | 'done';

/**
 * "Entra su WhatsApp" (PRD §10.2): a short request form saved in community_requests (POST /api/community);
 * the WhatsApp link returned by the server is shown after saving. Not a newsletter subscription.
 */
export function CommunityJoin({
  slug,
  name,
  joinLabel,
  copy,
  locale,
  external,
}: {
  slug: string;
  name: string;
  joinLabel: string;
  copy: CommunityFormCopy;
  locale: Locale;
  external: string;
}) {
  const uid = useId();
  const [status, setStatus] = useState<Status>('closed');
  const [fields, setFields] = useState({ firstName: '', email: '', consent: false });
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [hp, setHp] = useState('');
  const openedAt = useRef(0);

  const id = (f: string) => `${uid}-${f}`;
  const msg = (f: string) => (errors[f] ? copy.errors[errors[f] as keyof CommunityFormCopy['errors']] ?? copy.errors.required : null);

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
      community: slug,
      utm: Object.keys(utm).length ? utm : undefined,
      website_hp: hp,
      elapsedMs: Date.now() - openedAt.current,
    };
    const parsed = communitySchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setStatus('sending');
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; whatsappUrl?: string; fields?: Record<string, ErrorCode> };
      if (res.ok && data.ok && data.whatsappUrl) {
        setLink(data.whatsappUrl);
        setStatus('done');
        track('community_request', { community: slug, locale });
        return;
      }
      if (data.fields) setErrors(data.fields);
      setServerError(res.status === 429 ? copy.errors.rateLimited : data.fields ? copy.errors.summary : copy.errors.generic);
    } catch {
      setServerError(copy.errors.generic);
    }
    setStatus('open');
  }

  if (status === 'done' && link) {
    return (
      <div className="community-join community-join--done" role="status">
        <p>{copy.success}</p>
        <a className="btn btn--primary btn--block" href={link} target="_blank" rel="noopener" data-track="whatsapp_click" data-location="community_form" data-community={slug}>
          <WhatsApp aria-hidden />
          <span>{copy.open}</span>
          <span className="sr-only">
            {' '}
            — {name} {external}
          </span>
        </a>
      </div>
    );
  }

  if (status === 'closed') {
    return (
      <button
        type="button"
        className="btn btn--primary btn--block"
        aria-expanded={false}
        aria-controls={id('form')}
        onClick={() => {
          openedAt.current = Date.now();
          setStatus('open');
        }}
      >
        <WhatsApp aria-hidden />
        <span>{joinLabel}</span>
        <span className="sr-only"> — {name}</span>
      </button>
    );
  }

  return (
    <form id={id('form')} className="community-join" noValidate onSubmit={submit} aria-label={`${joinLabel} — ${name}`}>
      <p className="community-join__intro">{copy.intro}</p>
      <div className={`field ${errors.firstName ? 'has-error' : ''}`}>
        <label className="field__label" htmlFor={id('firstName')}>
          {copy.firstName} <span className="field__req" aria-hidden>*</span>
        </label>
        <input
          id={id('firstName')}
          autoComplete="given-name"
          required
          maxLength={80}
          value={fields.firstName}
          onChange={(e) => setFields((f) => ({ ...f, firstName: e.target.value }))}
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? `${id('firstName')}-error` : undefined}
        />
        {msg('firstName') ? <p id={`${id('firstName')}-error`} className="field__error">{msg('firstName')}</p> : null}
      </div>
      <div className={`field ${errors.email ? 'has-error' : ''}`}>
        <label className="field__label" htmlFor={id('email')}>
          {copy.email} <span className="field__req" aria-hidden>*</span>
        </label>
        <input
          id={id('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          value={fields.email}
          onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${id('email')}-error` : undefined}
        />
        {msg('email') ? <p id={`${id('email')}-error`} className="field__error">{msg('email')}</p> : null}
      </div>
      <div className="hp" aria-hidden>
        <label htmlFor={id('hp')}>Website</label>
        <input id={id('hp')} tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>
      <div className={`consent ${errors.consent ? 'has-error' : ''}`}>
        <input
          id={id('consent')}
          type="checkbox"
          checked={fields.consent}
          onChange={(e) => setFields((f) => ({ ...f, consent: e.target.checked }))}
          aria-invalid={!!errors.consent}
          aria-describedby={errors.consent ? `${id('consent')}-error` : undefined}
        />
        <label htmlFor={id('consent')}>
          {copy.consent}{' '}
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener">
            {copy.privacy}
            <span className="sr-only"> {external}</span>
          </a>
        </label>
        {msg('consent') ? <p id={`${id('consent')}-error`} className="field__error">{msg('consent')}</p> : null}
      </div>
      {serverError ? (
        <p className="form-status form-status--error" role="alert">
          {serverError}
        </p>
      ) : null}
      <div className="community-join__actions">
        <button type="submit" className="btn btn--primary" disabled={status === 'sending'} aria-busy={status === 'sending'}>
          {status === 'sending' ? copy.submitting : copy.submit}
        </button>
        <button type="button" className="link-button" onClick={() => setStatus('closed')}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}
