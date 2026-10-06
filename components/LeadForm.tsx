'use client';

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Intent, Locale } from '@/content/types';
import type { LeadFormCopy } from '@/lib/client-copy';
import { community, rainforest } from '@/content/shared';
import { leadSchema, toFieldErrors, type ErrorCode } from '@/lib/validation';
import { INTENTS, UTM_KEYS } from '@/lib/options';
import { track } from '@/lib/analytics';
import { INTENT_EVENT, readIntentFromUrl } from '@/lib/intent';
import { ArrowUpRight, Check, Plus, WhatsApp } from './icons';

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  companyStage: string;
  website: string;
  linkedin: string;
  challenges: string[];
  interests: string[];
  source: string;
  message: string;
  consent: boolean;
};

const empty: Fields = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  role: '',
  companyStage: '',
  website: '',
  linkedin: '',
  challenges: [],
  interests: [],
  source: '',
  message: '',
  consent: false,
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function LeadForm({ dict, locale }: { dict: LeadFormCopy; locale: Locale }) {
  const f = dict.form;
  const uid = useId();
  const [intent, setIntent] = useState<Intent>('join');
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hp, setHp] = useState('');
  const mountedAt = useRef<number>(0);
  const started = useRef(false);
  const utm = useRef<Record<string, string>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const thanksRef = useRef<HTMLHeadingElement>(null);

  // Intent can be preselected by any CTA (data-intent) or by ?intent= in the URL.
  useEffect(() => {
    mountedAt.current = Date.now();
    const fromUrl = readIntentFromUrl();
    if (fromUrl) setIntent(fromUrl);

    // UTM capture (kept for the session so in-page navigation doesn't lose it)
    try {
      const params = new URLSearchParams(window.location.search);
      const found: Record<string, string> = {};
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) found[k] = v.slice(0, 200);
      }
      if (Object.keys(found).length) sessionStorage.setItem('rm_utm', JSON.stringify(found));
      utm.current = Object.keys(found).length ? found : JSON.parse(sessionStorage.getItem('rm_utm') || '{}');
    } catch {
      /* storage may be unavailable */
    }

    const onIntent = (e: Event) => {
      const next = (e as CustomEvent<Intent>).detail;
      if (INTENTS.includes(next)) {
        setIntent(next);
        if (next === 'contact') setMoreOpen(false);
      }
    };
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);

  const markStarted = useCallback(() => {
    if (started.current) return;
    started.current = true;
    track('lead_form_start', { intent, locale });
  }, [intent, locale]);

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

  const toggleIn = (key: 'challenges' | 'interests', value: string) => {
    setFields((prev) => {
      const list = prev[key];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  };

  const payload = () => ({
    intent,
    locale,
    ...fields,
    companyStage: fields.companyStage || undefined,
    utm: Object.keys(utm.current).length ? utm.current : undefined,
    company_website_hp: hp,
    elapsedMs: Date.now() - mountedAt.current,
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    // 1. Client-side validation (same schema as the server)
    const parsed = leadSchema.safeParse(payload());
    if (!parsed.success) {
      const fe = toFieldErrors(parsed.error);
      setErrors(fe);
      if ((fe.website || fe.linkedin || fe.message) && intent !== 'contact') setMoreOpen(true);
      track('lead_form_error', { intent, fields: Object.keys(fe).join(',') });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    // 2. Server-side validation + storage
    setStatus('submitting');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Record<string, ErrorCode> };
      if (res.ok && data.ok) {
        setStatus('success');
        track('lead_form_submit', { intent, locale, stage: fields.companyStage });
        if (intent === 'community') track('community_request', { locale });
        requestAnimationFrame(() => thanksRef.current?.focus());
        return;
      }
      if (data.fields) {
        setErrors(data.fields);
        requestAnimationFrame(() => summaryRef.current?.focus());
      }
      setServerError(res.status === 429 ? f.errors.rateLimited : data.fields ? f.errors.summary : f.errors.generic);
      setStatus('error');
      track('lead_form_error', { intent, server: res.status });
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
    return (
      <div className="thanks" role="status" aria-live="polite">
        <span className="thanks__check" aria-hidden>
          <Check />
        </span>
        <h3 ref={thanksRef} tabIndex={-1} className="thanks__title">
          {dict.thanks.title}
        </h3>
        <p className="thanks__text">{dict.thanks.text[intent]}</p>
        <p className="thanks__next-title">{dict.thanks.nextTitle}</p>
        <div className="thanks__actions">
          <a
            className="next-card"
            href={rainforest.urlFor(locale)}
            target="_blank"
            rel="noopener"
            data-track="rainforest_cta_click"
            data-location="thank_you"
          >
            <strong>
              {dict.cta.rainforest} <ArrowUpRight aria-hidden className="inline-icon" />
            </strong>
            <span>{dict.thanks.rainforestText}</span>
            <span className="sr-only">{dict.a11y.external}</span>
          </a>
          <a
            className="next-card"
            href={community.publicWhatsappUrl}
            target="_blank"
            rel="noopener"
            data-track="whatsapp_click"
            data-location="thank_you"
          >
            <strong>
              <WhatsApp aria-hidden className="inline-icon" /> {dict.community.publicCommunityCta}
            </strong>
            <span>{dict.thanks.communityText}</span>
            <span className="sr-only">{dict.a11y.external}</span>
          </a>
        </div>
        <button type="button" className="link-button" onClick={reset}>
          {dict.thanks.reset}
        </button>
      </div>
    );
  }

  const errorIds = Object.keys(errors);
  const id = (name: string) => `${uid}-${name}`;
  const err = (name: keyof Fields | 'consent') => (errors[name] ? f.errors[errors[name]] : undefined);

  const fieldLabels: Record<string, string> = {
    firstName: f.firstName,
    lastName: f.lastName,
    email: f.email,
    company: f.company,
    role: f.role,
    companyStage: f.companyStage,
    website: f.website,
    linkedin: f.linkedin,
    message: f.message,
    consent: 'Privacy',
  };

  const messageField = (
    <TextArea
      id={id('message')}
      label={f.message}
      value={fields.message}
      onChange={(v) => set('message', v)}
      error={err('message')}
      required={intent === 'contact'}
      placeholder={f.messagePlaceholder}
      requiredText={f.required}
      optionalText={f.optional}
    />
  );

  return (
    <form className="lead-form" noValidate onSubmit={onSubmit} onFocusCapture={markStarted} aria-describedby={`${uid}-hint`}>
      {errorIds.length > 0 || serverError ? (
        <div ref={summaryRef} tabIndex={-1} className="form-summary" role="alert">
          <p>{serverError || f.errors.summary}</p>
          {errorIds.length > 0 ? (
            <ul>
              {errorIds.map((k) => (
                <li key={k}>
                  <a href={`#${id(k)}`}>{fieldLabels[k] ?? k}</a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <fieldset className="intent">
        <legend className="field__label">{f.intentLabel}</legend>
        <div className="intent__options">
          {INTENTS.map((value) => (
            <label key={value} className={`intent__option ${intent === value ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="intent"
                value={value}
                checked={intent === value}
                onChange={() => setIntent(value)}
              />
              <span className="intent__label">{f.intents[value].label}</span>
            </label>
          ))}
        </div>
        <p id={`${uid}-hint`} className="field__hint">
          {f.intents[intent].hint}
        </p>
      </fieldset>

      <div className="form-grid">
        <Input id={id('firstName')} label={f.firstName} value={fields.firstName} onChange={(v) => set('firstName', v)} error={err('firstName')} autoComplete="given-name" required requiredText={f.required} />
        <Input id={id('lastName')} label={f.lastName} value={fields.lastName} onChange={(v) => set('lastName', v)} error={err('lastName')} autoComplete="family-name" required requiredText={f.required} />
        <Input id={id('email')} label={f.email} type="email" value={fields.email} onChange={(v) => set('email', v)} error={err('email')} autoComplete="email" inputMode="email" required requiredText={f.required} className="span-2" />
        <Input id={id('company')} label={f.company} value={fields.company} onChange={(v) => set('company', v)} error={err('company')} autoComplete="organization" required requiredText={f.required} />
        <Input id={id('role')} label={f.role} value={fields.role} onChange={(v) => set('role', v)} error={err('role')} autoComplete="organization-title" required requiredText={f.required} />
        <Field id={id('companyStage')} label={f.companyStage} error={err('companyStage')} required requiredText={f.required} className="span-2">
          <select
            id={id('companyStage')}
            value={fields.companyStage}
            onChange={(e) => set('companyStage', e.target.value)}
            aria-invalid={!!errors.companyStage}
            aria-describedby={errors.companyStage ? `${id('companyStage')}-error` : undefined}
            required
          >
            <option value="" disabled>
              {f.companyStagePlaceholder}
            </option>
            {f.stages.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        {intent === 'contact' ? <div className="span-2">{messageField}</div> : null}
      </div>

      <div className="more">
        <button
          type="button"
          className="more__toggle"
          aria-expanded={moreOpen}
          aria-controls={id('more')}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <Plus aria-hidden className={`more__icon ${moreOpen ? 'is-open' : ''}`} />
          {f.moreToggle}
        </button>
        <div id={id('more')} className="more__panel" hidden={!moreOpen}>
          <p className="field__hint">{f.moreHint}</p>
          <div className="form-grid">
            <Input id={id('website')} label={f.website} type="url" value={fields.website} onChange={(v) => set('website', v)} error={err('website')} autoComplete="url" inputMode="url" placeholder="https://" optionalText={f.optional} />
            <Input id={id('linkedin')} label={f.linkedin} type="url" value={fields.linkedin} onChange={(v) => set('linkedin', v)} error={err('linkedin')} inputMode="url" placeholder="https://linkedin.com/in/…" optionalText={f.optional} />
          </div>
          <ChipGroup legend={f.challenges} name="challenges" options={f.challengeOptions} selected={fields.challenges} onToggle={(v) => toggleIn('challenges', v)} />
          <ChipGroup legend={f.interests} name="interests" options={f.interestOptions} selected={fields.interests} onToggle={(v) => toggleIn('interests', v)} />
          <Field id={id('source')} label={f.source} optionalText={f.optional}>
            <select id={id('source')} value={fields.source} onChange={(e) => set('source', e.target.value)}>
              <option value="">{f.sourcePlaceholder}</option>
              {f.sourceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {intent !== 'contact' ? messageField : null}
        </div>
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
            <span className="sr-only"> {dict.a11y.external}</span>
          </a>
        </label>
        {errors.consent ? (
          <p id={`${id('consent')}-error`} className="field__error">
            {f.errors.consent}
          </p>
        ) : null}
      </div>

      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
        {status === 'submitting' ? f.submitting : f.intents[intent].submit}
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
  className?: string;
  children: ReactNode;
}

function Field({ id, label, error, required, requiredText, optionalText, className = '', children }: FieldProps) {
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

function Input({ id, label, value, onChange, error, type = 'text', autoComplete, inputMode, placeholder, required, requiredText, optionalText, className }: InputProps) {
  return (
    <Field id={id} label={label} error={error} required={required} requiredText={requiredText} optionalText={optionalText} className={className}>
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
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </Field>
  );
}

function TextArea({ id, label, value, onChange, error, placeholder, required, requiredText, optionalText }: Omit<InputProps, 'type'>) {
  return (
    <Field id={id} label={label} error={error} required={required} requiredText={requiredText} optionalText={required ? undefined : optionalText}>
      <textarea
        id={id}
        rows={4}
        value={value}
        maxLength={2000}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </Field>
  );
}

function ChipGroup({
  legend,
  name,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <fieldset className="chips">
      <legend className="field__label">{legend}</legend>
      <div className="chips__list">
        {options.map((o) => (
          <label key={o.value} className={`chip ${selected.includes(o.value) ? 'is-active' : ''}`}>
            <input type="checkbox" name={name} value={o.value} checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
