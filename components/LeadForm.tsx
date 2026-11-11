'use client';

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Locale } from '@/content/types';
import type { LeadFormCopy } from '@/lib/client-copy';
import { rainforest } from '@/content/shared';
import { leadSchema, toFieldErrors, type ErrorCode } from '@/lib/validation';
import { UTM_KEYS } from '@/lib/options';
import { track } from '@/lib/analytics';
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from './icons';

/**
 * "Connect with Rainmakers" lead form (PRD §18–21), in three steps (Figma review 2026-10-15).
 * Flow: each step is validated before moving on → consent check → one POST /api/lead at the end
 * (server validation → Supabase) → success with next action.
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

/** Fields of each step. Every field stays mounted (hidden steps keep their values). */
const STEPS: (keyof Fields)[][] = [
  ['firstName', 'lastName', 'email'],
  ['company', 'role', 'profileType', 'link'],
  ['interest', 'consent'],
];
const LAST = STEPS.length - 1;
/** Step holding a field; anything else (e.g. timing checks) belongs to the last step. */
const stepOf = (field: string) => {
  const i = STEPS.findIndex((s) => s.includes(field as keyof Fields));
  return i < 0 ? LAST : i;
};

export function LeadForm({ dict, locale }: { dict: LeadFormCopy; locale: Locale }) {
  const f = dict.form;
  const uid = useId();
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [hp, setHp] = useState('');
  const mountedAt = useRef(0);
  /** One key per filled-in form: a double click or retry is stored once (contact_requests.idempotency_key). */
  const idempotencyKey = useRef('');
  const started = useRef(false);
  const utm = useRef<Record<string, string>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const stepRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
    idempotencyKey.current = crypto.randomUUID();
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
    idempotencyKey: idempotencyKey.current,
  });

  const goTo = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => stepRef.current?.focus());
  };

  /** Shows the errors on the earliest step that has one. */
  const showErrors = (fe: Record<string, ErrorCode>) => {
    setErrors(fe);
    const first = Math.min(...Object.keys(fe).map(stepOf));
    if (first !== step) setStep(first);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const parsed = leadSchema.safeParse(payload());
    const fe = parsed.success ? {} : toFieldErrors(parsed.error);

    // Steps 1–2: "Next" (or Enter) validates only the fields of the current step
    if (step < LAST) {
      const here = Object.fromEntries(Object.entries(fe).filter(([k]) => stepOf(k) === step));
      if (Object.keys(here).length) {
        setErrors(here);
        track('lead_form_error', { fields: Object.keys(here).join(','), step: step + 1, locale });
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }
      setErrors({});
      goTo(step + 1);
      return;
    }

    if (!parsed.success) {
      showErrors(fe);
      track('lead_form_error', { fields: Object.keys(fe).join(','), locale });
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
      if (data.fields) showErrors(data.fields);
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
    setStep(0);
    started.current = false;
    mountedAt.current = Date.now();
    idempotencyKey.current = crypto.randomUUID();
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
          <a className="next-card" href="#connect" data-track="community_cta_click" data-location="form_success">
            <strong>
              {dict.cta.join} <ArrowDown aria-hidden className="inline-icon" />
            </strong>
            <span>{s.joinText}</span>
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

      <ol className="form-steps" aria-hidden>
        {f.steps.labels.map((l, i) => (
          <li key={l} className={i === step ? 'is-current' : i < step ? 'is-done' : undefined}>
            <span className="form-steps__num">{i < step ? <Check /> : i + 1}</span>
            <span className="form-steps__label">{l}</span>
          </li>
        ))}
      </ol>
      <p ref={stepRef} tabIndex={-1} className="sr-only">
        {f.steps.progress.replace('{n}', String(step + 1)).replace('{total}', String(STEPS.length))}: {f.steps.labels[step]}
      </p>

      <fieldset className="form-step" hidden={step !== 0}>
        <legend className="sr-only">{f.steps.labels[0]}</legend>
        <div className="form-grid">
          <Input id={id('firstName')} label={f.firstName} value={fields.firstName} onChange={(v) => set('firstName', v)} error={err('firstName')} autoComplete="given-name" required requiredText={f.required} />
          <Input id={id('lastName')} label={f.lastName} value={fields.lastName} onChange={(v) => set('lastName', v)} error={err('lastName')} autoComplete="family-name" required requiredText={f.required} />
          <Input id={id('email')} label={f.email} type="email" value={fields.email} onChange={(v) => set('email', v)} error={err('email')} autoComplete="email" inputMode="email" required requiredText={f.required} className="span-2" />
        </div>
      </fieldset>

      <fieldset className="form-step" hidden={step !== 1}>
        <legend className="sr-only">{f.steps.labels[1]}</legend>
        <div className="form-grid">
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
        </div>
      </fieldset>

      <fieldset className="form-step" hidden={step !== 2}>
        <legend className="sr-only">{f.steps.labels[2]}</legend>
        <div className="form-grid">
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
      </fieldset>

      {/* Honeypot: invisible to people, tempting to bots */}
      <div className="hp" aria-hidden>
        <label htmlFor={id('hp')}>Company website</label>
        <input id={id('hp')} name="company_website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div className="form-nav">
        {step > 0 ? (
          <button
            type="button"
            className="btn btn--secondary form-nav__back"
            onClick={() => {
              setErrors({});
              goTo(step - 1);
            }}
          >
            {f.steps.back}
          </button>
        ) : null}
        {step < LAST ? (
          <button type="submit" className="btn btn--primary btn--lg form-nav__next">
            <span>{f.steps.next}</span>
            <ArrowRight aria-hidden />
          </button>
        ) : (
          <button type="submit" className="btn btn--primary btn--lg form-nav__next" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
            {status === 'submitting' ? f.submitting : f.submit}
          </button>
        )}
      </div>
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
