'use client';

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Locale } from '@/content/types';
import { SECTION_IDS } from '@/content/types';
import type { LeadFormCopy } from '@/lib/client-copy';
import { rainforest } from '@/content/shared';
import { leadSchema, toFieldErrors, type ErrorCode } from '@/lib/validation';
import { UTM_KEYS } from '@/lib/options';
import { track } from '@/lib/analytics';
import { ArrowDown, ArrowUpRight, Check } from './icons';

/**
 * "Connect with Rainmakers" lead form (PRD §18–21).
 * Flow: client validation → consent check → POST /api/lead (server validation → Supabase) → success with next action.
 */
type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  link: string;
  profileType: string;
  interest: string;
  consent: boolean;
};

const empty: Fields = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  role: '',
  link: '',
  profileType: '',
  interest: '',
  consent: false,
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function LeadForm({ dict, locale }: { dict: LeadFormCopy; locale: Locale }) {
  const f = dict.form;
  const uid = useId();
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [hp, setHp] = useState('');
  const mountedAt = useRef(0);
  const started = useRef(false);
  const utm = useRef<Record<string, string>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
    // Campaign attribution from the landing URL (no storage needed on a one-page site)
    const params = new URLSearchParams(window.location.search);
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) utm.current[k] = v.slice(0, 200);
    }
  }, []);

  const markStarted = useCallback(() => {
    if (started.current) return;
    started.current = true;
    track('lead_form_start', { locale });
  }, [locale]);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const payload = () => ({
    locale,
    ...fields,
    profileType: fields.profileType || undefined,
    utm: Object.keys(utm.current).length ? utm.current : undefined,
    company_website_hp: hp,
    elapsedMs: Date.now() - mountedAt.current,
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const parsed = leadSchema.safeParse(payload());
    if (!parsed.success) {
      const fe = toFieldErrors(parsed.error);
      setErrors(fe);
      track('lead_form_error', { fields: Object.keys(fe).join(','), locale });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; fields?: Record<string, ErrorCode> };
      if (res.ok && data.ok) {
        setStatus('success');
        track('lead_form_submit', { profile_type: fields.profileType, locale });
        requestAnimationFrame(() => successRef.current?.focus());
        return;
      }
      if (data.fields) {
        setErrors(data.fields);
        requestAnimationFrame(() => summaryRef.current?.focus());
      }
      setServerError(res.status === 429 ? f.errors.rateLimited : data.fields ? f.errors.summary : f.errors.generic);
      setStatus('error');
      track('lead_form_error', { server: res.status, locale });
    } catch {
      setServerError(f.errors.generic);
      setStatus('error');
    }
  }

  const reset = () => {
    setFields(empty);
    setErrors({});
    setStatus('idle');
    started.current = false;
    mountedAt.current = Date.now();
  };

  if (status === 'success') {
    const s = dict.success;
    return (
      <div className="success" role="status" aria-live="polite">
        <span className="success__check" aria-hidden>
          <Check />
        </span>
        <h3 ref={successRef} tabIndex={-1} className="success__title">
          {s.title}
        </h3>
        <p className="success__text">{s.text}</p>
        <p className="success__next-title">{s.nextTitle}</p>
        <div className="success__actions">
          <a className="next-card next-card--primary" href={rainforest.urlFor(locale)} target="_blank" rel="noopener" data-track="rainforest_cta_click" data-location="form_success">
            <strong>
              {dict.cta.exploreRainforest} <ArrowUpRight aria-hidden className="inline-icon" />
            </strong>
            <span>{s.rainforestText}</span>
            <span className="sr-only">{dict.external}</span>
          </a>
          <a className="next-card" href={`#${SECTION_IDS.community}`} data-track="community_cta_click" data-location="form_success">
            <strong>
              {dict.cta.community} <ArrowDown aria-hidden className="inline-icon" />
            </strong>
            <span>{s.communityText}</span>
          </a>
        </div>
        <button type="button" className="link-button" onClick={reset}>
          {s.reset}
        </button>
      </div>
    );
  }

  const id = (name: string) => `${uid}-${name}`;
  const err = (name: keyof Fields) => (errors[name] ? f.errors[errors[name]] : undefined);
  const labels: Record<string, string> = {
    firstName: f.firstName,
    lastName: f.lastName,
    email: f.email,
    company: f.company,
    role: f.role,
    link: f.link,
    profileType: f.profileType,
    interest: f.interest,
    consent: 'Privacy',
  };
  const errorKeys = Object.keys(errors);

  return (
    <form className="lead-form" noValidate onSubmit={onSubmit} onFocusCapture={markStarted}>
      {errorKeys.length > 0 || serverError ? (
        <div ref={summaryRef} tabIndex={-1} className="form-summary" role="alert">
          <p>{serverError || f.errors.summary}</p>
          {errorKeys.length > 0 ? (
            <ul>
              {errorKeys.map((k) => (
                <li key={k}>
                  <a href={`#${id(k)}`}>{labels[k] ?? k}</a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="form-grid">
        <Input id={id('firstName')} label={f.firstName} value={fields.firstName} onChange={(v) => set('firstName', v)} error={err('firstName')} autoComplete="given-name" required requiredText={f.required} />
        <Input id={id('lastName')} label={f.lastName} value={fields.lastName} onChange={(v) => set('lastName', v)} error={err('lastName')} autoComplete="family-name" required requiredText={f.required} />
        <Input id={id('email')} label={f.email} type="email" value={fields.email} onChange={(v) => set('email', v)} error={err('email')} autoComplete="email" inputMode="email" required requiredText={f.required} className="span-2" />
        <Input id={id('company')} label={f.company} value={fields.company} onChange={(v) => set('company', v)} error={err('company')} autoComplete="organization" required requiredText={f.required} />
        <Input id={id('role')} label={f.role} value={fields.role} onChange={(v) => set('role', v)} error={err('role')} autoComplete="organization-title" required requiredText={f.required} />
        <Field id={id('profileType')} label={f.profileType} error={err('profileType')} required requiredText={f.required} className="span-2">
          <select
            id={id('profileType')}
            value={fields.profileType}
            onChange={(e) => set('profileType', e.target.value)}
            aria-invalid={!!errors.profileType}
            aria-describedby={errors.profileType ? `${id('profileType')}-error` : undefined}
            required
          >
            <option value="" disabled>
              {f.profilePlaceholder}
            </option>
            {f.profiles.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Input id={id('link')} label={f.link} type="url" value={fields.link} onChange={(v) => set('link', v)} error={err('link')} inputMode="url" placeholder="https://" optionalText={f.optional} hint={f.linkHint} className="span-2" />
        <Field id={id('interest')} label={f.interest} error={err('interest')} optionalText={f.optional} className="span-2">
          <textarea
            id={id('interest')}
            rows={3}
            maxLength={1000}
            value={fields.interest}
            placeholder={f.interestPlaceholder}
            onChange={(e) => set('interest', e.target.value)}
            aria-invalid={!!errors.interest}
            aria-describedby={errors.interest ? `${id('interest')}-error` : undefined}
          />
        </Field>
      </div>

      {/* Honeypot: invisible to people, tempting to bots */}
      <div className="hp" aria-hidden>
        <label htmlFor={id('hp')}>Company website</label>
        <input id={id('hp')} name="company_website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div className={`consent ${errors.consent ? 'has-error' : ''}`}>
        <input
          id={id('consent')}
          type="checkbox"
          checked={fields.consent}
          onChange={(e) => set('consent', e.target.checked)}
          aria-invalid={!!errors.consent}
          aria-describedby={errors.consent ? `${id('consent')}-error` : undefined}
          required
        />
        <label htmlFor={id('consent')}>
          {f.consent}{' '}
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener">
            {f.consentLink}
            <span className="sr-only"> {dict.external}</span>
          </a>
        </label>
        {errors.consent ? (
          <p id={`${id('consent')}-error`} className="field__error">
            {f.errors.consent}
          </p>
        ) : null}
      </div>

      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
        {status === 'submitting' ? f.submitting : f.submit}
      </button>
    </form>
  );
}

/* ───────────── Field primitives ───────────── */

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  requiredText?: string;
  optionalText?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

function Field({ id, label, error, required, requiredText, optionalText, hint, className = '', children }: FieldProps) {
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required ? (
          <span className="field__req" aria-hidden title={requiredText}>
            *
          </span>
        ) : optionalText ? (
          <span className="field__opt">({optionalText})</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends Omit<FieldProps, 'children'> {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: 'email' | 'url' | 'text';
  placeholder?: string;
}

function Input({ id, label, value, onChange, error, type = 'text', autoComplete, inputMode, placeholder, required, requiredText, optionalText, hint, className }: InputProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <Field id={id} label={label} error={error} required={required} requiredText={requiredText} optionalText={optionalText} hint={hint} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
      />
    </Field>
  );
}
