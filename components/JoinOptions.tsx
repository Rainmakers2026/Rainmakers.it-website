'use client';

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import type { FinalCopy, Locale, StartPathKey } from '@/content/types';
import type { CrmErrorCode } from '@/lib/crm/schema';
import { FORMS, type FormKey } from '@/lib/crm/forms';
import {
  AMOUNT_LABELS,
  AREA_LABELS,
  AVAILABILITY_LABELS,
  COLLABORATION_LABELS,
  COMPANY_SIZE_LABELS,
  CONTRIBUTION_LABELS,
  EXPERIENCE_LABELS,
  FUNDING_STATUS_LABELS,
  GEOGRAPHY_LABELS,
  INDUSTRY_LABELS,
  INNOVATION_OBJECTIVE_LABELS,
  JOB_AREA_LABELS,
  PLAYER_TYPE_LABELS,
  PRIMARY_NEED_LABELS,
  SERVICE_LABELS,
  STAGE_LABELS,
  countryOptions,
  playerGroup,
  type PlayerType,
} from '@/lib/crm/taxonomy';
import { currentPage, visitUtm } from '@/lib/crm/client-source';
import { ACCEPTED_UPLOAD, MAX_UPLOAD_BYTES, checkUploadMeta } from '@/lib/uploads';
import { track } from '@/lib/analytics';
import { START_HASH } from '@/lib/nav';
import { ArrowRight, Check, Close, IconBriefcase, IconBuilding, IconGive, IconRocket } from './icons';

type Option = 'company' | 'project' | 'giveback' | 'cv' | 'invest';
/** Card (and its hash, lib/nav.ts → START_HASH) behind each popup */
const OPTION_PATH = { company: 'company', project: 'startup', giveback: 'giveback', cv: 'work', invest: 'invest' } as const satisfies Record<Option, StartPathKey>;
/** CRM form behind each popup (lib/crm/forms.ts) */
const OPTION_FORM: Record<Option, FormKey> = { company: 'company', project: 'startup', giveback: 'giveback', cv: 'job', invest: 'invest' };
const HASH_OPTION = Object.fromEntries((Object.keys(OPTION_PATH) as Option[]).map((o) => [START_HASH[OPTION_PATH[o]], o])) as Record<string, Option>;
/** Hash that opens the "Lavora con noi" popup (header link, from any page) */
export const WORK_HASH = START_HASH.work;
type Status = 'idle' | 'sending' | 'success' | 'error';
/** Why the last attempt failed: field errors (shown inline), too many requests, or a server/network problem. */
type Failure = 'validation' | 'rateLimited' | 'generic';
type Labels = Record<string, { it: string; en: string }>;
const MAX_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

/** Step that holds each field, to bring the visitor back to the first one the server flagged. */
const STEP0 = new Set(['firstName', 'lastName', 'email', 'phone', 'jobTitle']);
const STEP1 = new Set(['organizationName', 'organizationWebsite', 'playerType', 'industry', 'country', 'city']);
const fieldStep = (option: Option, key: string) => (STEP0.has(key) ? 0 : option === 'cv' ? 1 : STEP1.has(key) ? 1 : 2);

/**
 * "Come vuoi iniziare?" (rebuilt 2026-11-11 on the CRM, lib/crm): four cards — "Innova la tua azienda", "Accelera la
 * tua startup", "Unisciti al Giveback", "Lavora con noi" — and the "Investi con noi" popup (no card, opened from its
 * hash). One shared form: common fields (who you are, your organisation, player type, industry, country), then only
 * the block that fits the player type (startup / investor / accelerator) or the form (company, Giveback, job), the
 * privacy notice and a separate, optional newsletter box that is never preselected. Values are stable codes
 * (lib/crm/taxonomy.ts). Submissions go to POST /api/join → Supabase "Rainmakers OS" and an email to the team.
 * Also used on /join; each card's hash opens its popup directly.
 */
export function JoinOptions({ locale, paths }: { locale: Locale; paths: FinalCopy['paths'] }) {
  const id = useId();
  const dialog = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [option, setOption] = useState<Option | null>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [started, setStarted] = useState(0);
  const [playerType, setPlayerType] = useState<PlayerType | ''>('');
  const [optIn, setOptIn] = useState(false);
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, CrmErrorCode>>({});
  const [failure, setFailure] = useState<Failure>('generic');
  /** One key per opened form: a double click or retry is stored once (form_submissions.idempotency_key). */
  const idempotencyKey = useRef('');
  const it = locale === 'it';
  const countries = useMemo(() => countryOptions(locale), [locale]);
  const copy = it
    ? {
        steps: {
          company: ['Chi sei', 'L’organizzazione', 'Il progetto'],
          project: ['Chi sei', 'La startup', 'Il pitch'],
          invest: ['Chi sei', 'L’organizzazione', 'Come investi'],
          giveback: ['Chi sei', 'Chi rappresenti', 'Il tuo contributo'],
          cv: ['Chi sei', 'Il tuo profilo'],
        },
        progress: 'Passo {n} di {total}',
        next: 'Avanti',
        back: 'Indietro',
        title: {
          company: 'Richiesta progetto - Rainmakers',
          project: 'Application form - Rainmakers',
          cv: 'Candidatura - Rainmakers',
          giveback: 'Giveback - Rainmakers',
          invest: 'Investi con noi - Rainmakers',
        },
        intro: {
          invest: 'Raccontaci chi sei e come investi: il team Rainmakers ti ricontatta per conoscerti.',
          company: 'Raccontaci la tua organizzazione e la sfida che vuoi affrontare in tre passaggi: il team Rainmakers ti ricontatta per costruire insieme il progetto.',
          project: 'Raccontaci il progetto in tre passaggi: il team Rainmakers lo valuta e ti ricontatta.',
          cv: 'Raccontaci chi sei e cosa sai fare: il team Rainmakers ti ricontatterà.',
          giveback: 'Raccontaci come vorresti contribuire alla crescita di Rainmakers e dell’ecosistema: ti ricontattiamo per capire insieme come farlo.',
        },
        first: 'Nome *',
        last: 'Cognome *',
        email: 'Email *',
        phone: 'Telefono',
        jobTitle: 'Ruolo',
        orgName: {
          company: 'Nome dell’organizzazione *',
          project: 'Nome della startup *',
          invest: 'Fondo, società o veicolo *',
          giveback: 'Organizzazione',
          cv: '',
        },
        orgHint: {
          project: 'O del progetto, se la società non è ancora costituita',
          giveback: 'Se rappresenti un’organizzazione (facoltativo)',
        } as Partial<Record<Option, string>>,
        website: 'Sito web',
        playerType: 'Tipo di organizzazione',
        industry: 'Settore *',
        country: 'Paese',
        city: 'Città',
        selectOption: 'Seleziona un’opzione',
        multiHint: 'Puoi sceglierne più di uno',
        startupStage: 'Fase della startup *',
        fundingStatus: 'Stato del fundraising',
        fundingRange: 'Quanto cercate di raccogliere',
        primaryNeed: 'Di cosa avete più bisogno',
        investmentTicket: 'Ticket indicativo per operazione *',
        investmentStages: 'Fasi in cui investi',
        investmentIndustries: 'Settori di investimento',
        investmentGeographies: 'Aree geografiche',
        supportedStages: 'Fasi delle startup che supportate *',
        supportedIndustries: 'Settori su cui lavorate',
        servicesOffered: 'Servizi che offrite',
        companySize: 'Dimensione',
        innovationObjective: 'Obiettivo di innovazione *',
        collaborationInterest: 'Che tipo di collaborazione vi interessa',
        contribution: 'Come vorresti contribuire? *',
        availability: 'Quanto tempo puoi dedicare?',
        experience: 'Anni di esperienza *',
        jobArea: 'Area di interesse *',
        linkedin: 'Profilo LinkedIn',
        documentLink: { project: 'Link al pitch deck', cv: 'Link al CV' } as Partial<Record<Option, string>>,
        file: { project: `Pitch deck (PDF, max ${MAX_MB} MB)`, cv: `CV (PDF, max ${MAX_MB} MB)` } as Partial<Record<Option, string>>,
        fileHint: 'Carica un PDF oppure inserisci un link: almeno uno dei due è necessario.',
        message: {
          company: 'Raccontaci la vostra sfida (facoltativo)',
          project: 'Informazioni aggiuntive (facoltativo)',
          invest: 'Altro che vuoi condividere (facoltativo)',
          giveback: 'Raccontaci di te e di cosa ti piacerebbe fare (facoltativo)',
          cv: 'Altre informazioni (facoltativo)',
        },
        privacy: 'Ho letto l’informativa privacy e acconsento al trattamento dei miei dati per gestire questa richiesta.',
        privacyLink: 'Informativa privacy',
        newsletter: 'Voglio ricevere anche Gocce di Innovazione, la newsletter mensile di Rainmakers (facoltativo). Ti chiederemo di confermare via email.',
        interests: 'Mi interessano soprattutto (facoltativo)',
        send: 'Invia',
        sending: 'Invio…',
        successTitle: 'Ricevuto, grazie!',
        success: 'Il team Rainmakers ti ricontatterà presto. Ti abbiamo inviato una email di conferma.',
        successNewsletter: 'Per la newsletter ti abbiamo inviato un’email a parte: conferma l’iscrizione dal link che contiene.',
        done: 'Chiudi',
        error: 'Non è stato possibile inviare la richiesta. Riprova tra qualche istante: i dati inseriti sono ancora qui.',
        rateLimited: 'Hai inviato troppe richieste. Riprova tra qualche minuto.',
        validation: 'Controlla i campi indicati.',
        errors: {
          required: 'Compila questo campo.',
          email: 'Inserisci un indirizzo email valido.',
          url: 'Inserisci un link valido (es. https://…).',
          consent: 'Serve la presa visione dell’informativa privacy.',
          tooLong: 'Il testo è troppo lungo.',
          invalid: 'Scegli un valore dall’elenco.',
          fileOrLink: 'Carica un PDF oppure inserisci un link.',
          fileType: 'Il file deve essere un PDF.',
          fileTooLarge: `Il file supera ${MAX_MB} MB: comprimilo oppure inserisci un link.`,
        } satisfies Record<CrmErrorCode, string>,
        close: 'Chiudi',
      }
    : {
        steps: {
          company: ['About you', 'Your organisation', 'The project'],
          project: ['About you', 'The startup', 'The pitch'],
          invest: ['About you', 'Your organisation', 'How you invest'],
          giveback: ['About you', 'Who you represent', 'Your contribution'],
          cv: ['About you', 'Your profile'],
        },
        progress: 'Step {n} of {total}',
        next: 'Next',
        back: 'Back',
        title: {
          company: 'Project request - Rainmakers',
          project: 'Application form - Rainmakers',
          cv: 'Application - Rainmakers',
          giveback: 'Giveback - Rainmakers',
          invest: 'Invest with us - Rainmakers',
        },
        intro: {
          invest: 'Tell us who you are and how you invest: the Rainmakers team will get back to you.',
          company: 'Tell us about your organisation and the challenge you want to take on in three steps: the Rainmakers team will get back to you to build the project together.',
          project: 'Tell us about your project in three steps: the Rainmakers team will review it and get back to you.',
          cv: 'Tell us who you are and what you do best: the Rainmakers team will get back to you.',
          giveback: 'Tell us how you would like to help Rainmakers and the ecosystem grow: we will get back to you to work out how together.',
        },
        first: 'First name *',
        last: 'Last name *',
        email: 'Email *',
        phone: 'Phone',
        jobTitle: 'Role',
        orgName: {
          company: 'Organisation name *',
          project: 'Startup name *',
          invest: 'Fund, company or vehicle *',
          giveback: 'Organisation',
          cv: '',
        },
        orgHint: {
          project: 'Or the project, if the company is not incorporated yet',
          giveback: 'If you represent an organisation (optional)',
        } as Partial<Record<Option, string>>,
        website: 'Website',
        playerType: 'Type of organisation',
        industry: 'Industry *',
        country: 'Country',
        city: 'City',
        selectOption: 'Select an option',
        multiHint: 'You can choose more than one',
        startupStage: 'Startup stage *',
        fundingStatus: 'Fundraising status',
        fundingRange: 'How much you aim to raise',
        primaryNeed: 'What you need most',
        investmentTicket: 'Indicative ticket per deal *',
        investmentStages: 'Stages you invest in',
        investmentIndustries: 'Industries you invest in',
        investmentGeographies: 'Geographies',
        supportedStages: 'Startup stages you support *',
        supportedIndustries: 'Industries you work in',
        servicesOffered: 'Services you offer',
        companySize: 'Size',
        innovationObjective: 'Innovation objective *',
        collaborationInterest: 'Kind of collaboration you are interested in',
        contribution: 'How would you like to contribute? *',
        availability: 'How much time can you give?',
        experience: 'Years of experience *',
        jobArea: 'Area of interest *',
        linkedin: 'LinkedIn profile',
        documentLink: { project: 'Pitch deck link', cv: 'CV link' } as Partial<Record<Option, string>>,
        file: { project: `Pitch deck (PDF, max ${MAX_MB} MB)`, cv: `CV (PDF, max ${MAX_MB} MB)` } as Partial<Record<Option, string>>,
        fileHint: 'Upload a PDF or add a link: at least one of the two is required.',
        message: {
          company: 'Tell us about your challenge (optional)',
          project: 'Additional information (optional)',
          invest: 'Anything else you want to share (optional)',
          giveback: 'Tell us about yourself and what you would like to do (optional)',
          cv: 'Anything else (optional)',
        },
        privacy: 'I have read the privacy policy and agree to the processing of my data to handle this request.',
        privacyLink: 'Privacy policy',
        newsletter: 'I would also like to receive Gocce di Innovazione, the Rainmakers monthly newsletter (optional). We will ask you to confirm by email.',
        interests: 'I am mostly interested in (optional)',
        send: 'Send',
        sending: 'Sending…',
        successTitle: 'Received, thank you!',
        success: 'The Rainmakers team will get back to you soon. We have sent you a confirmation email.',
        successNewsletter: 'For the newsletter we have sent you a separate email: confirm your subscription from the link inside.',
        done: 'Close',
        error: 'We could not send your request. Please try again in a moment: your answers are still here.',
        rateLimited: 'Too many requests. Please try again in a few minutes.',
        validation: 'Please check the highlighted fields.',
        errors: {
          required: 'Please fill in this field.',
          email: 'Please enter a valid email address.',
          url: 'Please enter a valid link (e.g. https://…).',
          consent: 'Please confirm you have read the privacy policy.',
          tooLong: 'This text is too long.',
          invalid: 'Please choose a value from the list.',
          fileOrLink: 'Upload a PDF or add a link.',
          fileType: 'The file must be a PDF.',
          fileTooLarge: `The file is larger than ${MAX_MB} MB: compress it or add a link instead.`,
        } satisfies Record<CrmErrorCode, string>,
        close: 'Close',
      };

  const stepLabels = option ? copy.steps[option] : [];
  const lastStep = stepLabels.length - 1;
  const def = option ? FORMS[OPTION_FORM[option]] : null;
  const group = def?.player ? playerGroup(playerType || null) : null;

  useEffect(() => {
    if (!option) return;
    document.documentElement.classList.add('modal-open');
    dialog.current?.querySelector<HTMLElement>('fieldset:not([hidden]) input')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab' && dialog.current) {
        const focusables = [...dialog.current.querySelectorAll<HTMLElement>('button, input:not([type="hidden"]), select, textarea, a[href]')].filter(
          (el) => !el.closest('[hidden]'),
        );
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
  }, [option]);

  // New step: focus its first field (keyboard and screen-reader users land in the right place)
  useEffect(() => {
    if (!option) return;
    dialog.current?.querySelector<HTMLElement>(`[data-step="${step}"] input, [data-step="${step}"] select`)?.focus();
  }, [step, option]);

  function close() {
    setOption(null);
    // Opened from a link (header, "Cosa fa Rainmakers"): drop the hash so the same link can open the popup again
    if (HASH_OPTION[window.location.hash.slice(1)]) history.replaceState(null, '', `${window.location.pathname}${window.location.search}#connect`);
    requestAnimationFrame(() => returnFocus.current?.focus());
  }

  /** Native validation of the current step only; the first invalid field reports itself. */
  function stepIsValid() {
    const fields = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-step="${step}"] :is(input, select, textarea)`);
    for (const field of fields ?? []) if (!field.checkValidity()) return field.reportValidity(), false;
    // Required checkbox groups: at least one box
    for (const group of formRef.current?.querySelectorAll<HTMLFieldSetElement>(`[data-step="${step}"] fieldset[data-required]`) ?? []) {
      if (!group.querySelector('input:checked')) {
        const first = group.querySelector<HTMLInputElement>('input');
        first?.setCustomValidity(copy.errors.required);
        first?.reportValidity();
        first?.addEventListener('change', () => first.setCustomValidity(''), { once: true });
        return false;
      }
    }
    return true;
  }

  function next() {
    if (!stepIsValid()) return;
    setStep((s) => Math.min(s + 1, lastStep));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!option || !def || status === 'sending') return;
    if (step < lastStep) return next();
    if (!stepIsValid()) return;
    const data = new FormData(event.currentTarget);
    const entry = data.get('file');
    const file = entry instanceof File && entry.size > 0 ? entry : null;
    const v = (name: string) => String(data.get(name) ?? '').trim();
    const all = (name: string) => data.getAll(name).map(String);
    // Instant feedback; the server repeats every check (type, size, PDF signature)
    const fileError = !def.document ? null : file ? checkUploadMeta(file) : v('documentLink') ? null : 'fileOrLink';
    if (fileError) {
      setErrors({ file: fileError });
      setFailure('validation');
      setStatus('error');
      return;
    }
    setErrors({});
    setStatus('sending');
    const payload = {
      form: OPTION_FORM[option],
      locale,
      idempotencyKey: idempotencyKey.current,
      sourcePage: currentPage(),
      utm: visitUtm(),
      firstName: v('firstName'),
      lastName: v('lastName'),
      email: v('email'),
      phone: v('phone'),
      jobTitle: v('jobTitle'),
      organizationName: v('organizationName'),
      organizationWebsite: v('organizationWebsite'),
      playerType: v('playerType'),
      industry: v('industry'),
      country: v('country'),
      city: v('city'),
      message: v('message'),
      startupStage: v('startupStage'),
      fundingStatus: v('fundingStatus'),
      fundingRange: v('fundingRange'),
      primaryNeed: v('primaryNeed'),
      investmentTicket: v('investmentTicket'),
      investmentStages: all('investmentStages'),
      investmentIndustries: all('investmentIndustries'),
      investmentGeographies: all('investmentGeographies'),
      supportedStages: all('supportedStages'),
      supportedIndustries: all('supportedIndustries'),
      servicesOffered: all('servicesOffered'),
      companySize: v('companySize'),
      innovationObjective: v('innovationObjective'),
      collaborationInterest: all('collaborationInterest'),
      contribution: v('contribution'),
      availability: v('availability'),
      experience: v('experience'),
      jobArea: v('jobArea'),
      linkedin: v('linkedin'),
      documentLink: v('documentLink'),
      privacy: data.get('privacy') === 'on',
      newsletterOptIn: data.get('newsletterOptIn') === 'on',
      editorialInterests: data.get('newsletterOptIn') === 'on' ? all('editorialInterests') : [],
      company_website_hp: v('website'),
      elapsedMs: Date.now() - started,
    };
    const body = new FormData();
    body.set('payload', JSON.stringify(payload));
    if (file) body.set('file', file);
    try {
      const response = await fetch('/api/join', { method: 'POST', body });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; newsletter?: string | null; fields?: Record<string, CrmErrorCode> };
      if (response.ok && result.ok) {
        setNewsletterSent(payload.newsletterOptIn && (result.newsletter === 'pending' || result.newsletter === 'pending_recent'));
        setStatus('success');
        track('join_application_submit', { kind: OPTION_FORM[option], has_file: !!file, newsletter: payload.newsletterOptIn, locale });
        return;
      }
      const fields = result.fields ?? (response.status === 413 ? { file: 'fileTooLarge' as const } : {});
      setErrors(fields);
      setFailure(result.fields || response.status === 413 ? 'validation' : response.status === 429 ? 'rateLimited' : 'generic');
      setStatus('error');
      // Back to the first step with a flagged field
      const steps = Object.keys(fields).map((k) => fieldStep(option, k));
      if (steps.length) setStep(Math.min(...steps));
    } catch {
      setFailure('generic');
      setStatus('error');
    }
  }

  /** Inline message for a field, if the last attempt flagged it. */
  const fieldError = (name: string) =>
    errors[name] ? (
      <span className="field__error" id={`${id}-${name}-error`}>
        {copy.errors[errors[name]]}
      </span>
    ) : null;
  const invalidProps = (name: string) => (errors[name] ? { 'aria-invalid': true, 'aria-describedby': `${id}-${name}-error` } : {});

  const open = (value: Option, element: HTMLElement | null) => {
    setStatus('idle');
    setErrors({});
    setStep(0);
    idempotencyKey.current = crypto.randomUUID();
    setStarted(Date.now());
    setPlayerType(FORMS[OPTION_FORM[value]].defaultPlayerType ?? '');
    setOptIn(false);
    setNewsletterSent(false);
    returnFocus.current = element;
    setOption(value);
    track('community_cta_click', { location: `start_${OPTION_PATH[value]}`, locale });
  };

  // A card's hash (header "Lavora con noi", "Cosa fa Rainmakers" CTAs, also from other pages): open its popup on
  // arrival and on each click
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      const option = HASH_OPTION[hash];
      if (option) open(option, document.getElementById(hash)?.querySelector('button') ?? null);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `open` only sets state; listen once
  }, []);

  // ── field helpers (plain render functions, not components: all steps stay mounted, typed values survive) ──
  const renderStep = (index: number, children: ReactNode) => (
    <fieldset className="join-step" data-step={index} hidden={step !== index}>
      <legend className="sr-only">{stepLabels[index]}</legend>
      <div className="form-grid">{children}</div>
    </fieldset>
  );

  const text = (name: string, label: string, opts: { required?: boolean; type?: string; auto?: string; max?: number; span?: boolean; hint?: string; placeholder?: string } = {}) => (
    <label className={`field${opts.span ? ' span-2' : ''}`}>
      <span className="field__label">{label}</span>
      <input
        name={name}
        type={opts.type ?? 'text'}
        autoComplete={opts.auto}
        maxLength={opts.max ?? 120}
        required={opts.required}
        placeholder={opts.placeholder}
        {...(opts.type === 'tel' ? { pattern: '[+0-9 .()\\-]*' } : {})}
        {...invalidProps(name)}
      />
      {opts.hint ? <span className="field__hint">{opts.hint}</span> : null}
      {fieldError(name)}
    </label>
  );

  const select = (
    name: string,
    label: string,
    labels: Labels,
    opts: { required?: boolean; span?: boolean; only?: readonly string[] | null; value?: string; onChange?: (v: string) => void; hint?: string } = {},
  ) => (
    <label className={`field${opts.span ? ' span-2' : ''}`}>
      <span className="field__label">{label}</span>
      <select
        name={name}
        required={opts.required}
        {...(opts.onChange ? { value: opts.value ?? '', onChange: (e) => opts.onChange!(e.target.value) } : { defaultValue: '' })}
        {...invalidProps(name)}
      >
        <option value="" disabled={opts.required}>
          {copy.selectOption}
        </option>
        {Object.entries(labels)
          .filter(([value]) => !opts.only || opts.only.includes(value))
          .map(([value, l]) => (
            <option key={value} value={value}>
              {l[locale]}
            </option>
          ))}
      </select>
      {opts.hint ? <span className="field__hint">{opts.hint}</span> : null}
      {fieldError(name)}
    </label>
  );

  /** Multiple choice as checkbox chips; `required`: at least one (checked step by step, and on the server) */
  const multi = (name: string, label: string, labels: Labels, required = false) => (
    <fieldset className="field span-2 choice-group" data-required={required || undefined} {...invalidProps(name)}>
      <legend className="field__label">{label}</legend>
      <span className="field__hint">{copy.multiHint}</span>
      <div className="choice-group__options">
        {Object.entries(labels).map(([value, l]) => (
          <label key={value} className="choice">
            <input type="checkbox" name={name} value={value} />
            <span>{l[locale]}</span>
          </label>
        ))}
      </div>
      {fieldError(name)}
    </fieldset>
  );

  const documentFields = (o: Option) =>
    def?.document ? (
      <>
        {text('documentLink', copy.documentLink[o] ?? '', { type: 'url', max: 300, placeholder: 'https://', span: true })}
        <label className="field span-2">
          <span className="field__label">{copy.file[o]}</span>
          <input name="file" type="file" accept={ACCEPTED_UPLOAD} aria-invalid={!!errors.file} aria-describedby={`${id}-file-hint${errors.file ? ` ${id}-file-error` : ''}`} />
          <span className="field__hint" id={`${id}-file-hint`}>
            {copy.fileHint}
          </span>
          {fieldError('file')}
        </label>
      </>
    ) : null;

  /** Privacy notice for this request, then the newsletter: separate, optional, never preselected */
  const consents = (
    <>
      <label className={`consent span-2${errors.privacy ? ' has-error' : ''}`}>
        <input type="checkbox" name="privacy" required {...invalidProps('privacy')} />
        <span>
          {copy.privacy}{' '}
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener">
            {copy.privacyLink}
          </a>
        </span>
        {fieldError('privacy')}
      </label>
      <label className="consent span-2">
        <input type="checkbox" name="newsletterOptIn" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
        <span>{copy.newsletter}</span>
      </label>
      {optIn ? (
        <fieldset className="field span-2 choice-group choice-group--compact">
          <legend className="field__label">{copy.interests}</legend>
          <div className="choice-group__options">
            {Object.entries(AREA_LABELS).map(([value, l]) => (
              <label key={value} className="choice">
                <input type="checkbox" name="editorialInterests" value={value} />
                <span>{l[locale]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </>
  );

  /** The block that fits the chosen player type */
  const groupBlock =
    group === 'startup' ? (
      <>
        {select('startupStage', copy.startupStage, STAGE_LABELS, { required: true })}
        {select('fundingStatus', copy.fundingStatus, FUNDING_STATUS_LABELS)}
        {select('fundingRange', copy.fundingRange, AMOUNT_LABELS)}
        {select('primaryNeed', copy.primaryNeed, PRIMARY_NEED_LABELS)}
      </>
    ) : group === 'investor' ? (
      <>
        {select('investmentTicket', copy.investmentTicket, AMOUNT_LABELS, { required: true, span: true })}
        {multi('investmentStages', copy.investmentStages, STAGE_LABELS)}
        {multi('investmentIndustries', copy.investmentIndustries, INDUSTRY_LABELS)}
        {multi('investmentGeographies', copy.investmentGeographies, GEOGRAPHY_LABELS)}
      </>
    ) : group === 'accelerator' ? (
      <>
        {multi('supportedStages', copy.supportedStages, STAGE_LABELS, true)}
        {multi('supportedIndustries', copy.supportedIndustries, INDUSTRY_LABELS)}
        {multi('servicesOffered', copy.servicesOffered, SERVICE_LABELS)}
      </>
    ) : null;

  /**
   * Display order: company, startup, giveback, work (2026-10-21). The "Investi con noi" card was removed on 2026-11-02:
   * its popup still opens from its hash (the Investment CTA of "Cosa fa Rainmakers").
   */
  const cards = [
    { key: 'company' as const, Icon: IconBuilding, ...paths.company },
    { key: 'project' as const, Icon: IconRocket, ...paths.startup },
    { key: 'giveback' as const, Icon: IconGive, ...paths.giveback },
    { key: 'cv' as const, Icon: IconBriefcase, ...paths.work },
  ];

  return (
    <>
      <ul className="start-cards">
        {cards.map(({ key, Icon, title, text: cardText, cta }, i) => (
          <li key={key} id={START_HASH[OPTION_PATH[key]]} className="reveal" style={{ '--i': i } as CSSProperties}>
            <button className={`start-card start-card--${key}`} type="button" aria-haspopup="dialog" onClick={(event) => open(key, event.currentTarget)}>
              <span className="start-card__icon" aria-hidden>
                <Icon />
              </span>
              <strong className="start-card__title">{title}</strong>
              <span className="start-card__text">{cardText}</span>
              <span className="start-card__cta">
                {cta}
                <ArrowRight aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {option && def ? (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <section ref={dialog} className="site-modal site-modal--wide join-modal" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1}>
            <button className="site-modal__close" type="button" aria-label={copy.close} onClick={close}>
              <Close aria-hidden />
            </button>
            <p className="eyebrow site-modal__eyebrow">{paths[OPTION_PATH[option]].title}</p>
            <h2 id={`${id}-title`}>{copy.title[option]}</h2>
            {status === 'success' ? (
              <div className="join-done" role="status">
                <span className="join-done__mark" aria-hidden>
                  <Check />
                </span>
                <p className="join-done__title">{copy.successTitle}</p>
                <p>{copy.success}</p>
                {newsletterSent ? <p>{copy.successNewsletter}</p> : null}
                <button className="btn btn--secondary" type="button" onClick={close}>
                  {copy.done}
                </button>
              </div>
            ) : (
              <>
                <p className="join-modal__intro">{copy.intro[option]}</p>
                <ol className="join-progress" aria-label={copy.progress.replace('{n}', String(step + 1)).replace('{total}', String(stepLabels.length))}>
                  {stepLabels.map((label, i) => (
                    <li key={label} className={i < step ? 'is-done' : i === step ? 'is-current' : undefined} aria-current={i === step ? 'step' : undefined}>
                      <span className="join-progress__dot" aria-hidden>
                        {i < step ? <Check /> : i + 1}
                      </span>
                      <span className="join-progress__label">{label}</span>
                    </li>
                  ))}
                </ol>
                <form ref={formRef} className="modal-form" onSubmit={submit}>
                  {renderStep(
                    0,
                    <>
                      {text('firstName', copy.first, { required: true, auto: 'given-name', max: 80 })}
                      {text('lastName', copy.last, { required: true, auto: 'family-name', max: 80 })}
                      {text('email', copy.email, { required: true, type: 'email', auto: 'email', max: 254, span: true })}
                      {text('phone', copy.phone, { type: 'tel', auto: 'tel', max: 40 })}
                      {option !== 'cv' ? text('jobTitle', copy.jobTitle, { auto: 'organization-title' }) : null}
                    </>,
                  )}

                  {option === 'cv' ? (
                    renderStep(
                      1,
                      <>
                        {select('jobArea', copy.jobArea, JOB_AREA_LABELS, { required: true })}
                        {select('experience', copy.experience, EXPERIENCE_LABELS, { required: true })}
                        {text('city', copy.city, { auto: 'address-level2' })}
                        <label className="field">
                          <span className="field__label">{copy.country}</span>
                          <select name="country" defaultValue="IT" autoComplete="country">
                            {countries.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {text('linkedin', copy.linkedin, { type: 'url', max: 300, placeholder: 'https://linkedin.com/in/…', span: true })}
                        {documentFields(option)}
                        <label className="field span-2">
                          <span className="field__label">{copy.message.cv}</span>
                          <textarea name="message" maxLength={2000} rows={3} />
                        </label>
                        {consents}
                      </>,
                    )
                  ) : (
                    <>
                      {renderStep(
                        1,
                        <>
                          {text('organizationName', copy.orgName[option], {
                            required: def.organizationRequired,
                            auto: 'organization',
                            max: 150,
                            span: true,
                            hint: copy.orgHint[option],
                          })}
                          {select('playerType', `${copy.playerType}${def.organizationRequired ? ' *' : ''}`, PLAYER_TYPE_LABELS, {
                            required: def.organizationRequired,
                            only: def.playerTypes,
                            value: playerType,
                            onChange: (v) => setPlayerType(v as PlayerType | ''),
                          })}
                          {select('industry', copy.industry, INDUSTRY_LABELS, { required: true })}
                          {text('organizationWebsite', copy.website, { type: 'url', max: 300, placeholder: 'https://', span: true })}
                          <label className="field">
                            <span className="field__label">{copy.country}</span>
                            <select name="country" defaultValue="IT" autoComplete="country">
                              {countries.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {text('city', copy.city, { auto: 'address-level2' })}
                        </>,
                      )}
                      {renderStep(
                        2,
                        <>
                          {def.corporateBlock ? (
                            <>
                              {select('innovationObjective', copy.innovationObjective, INNOVATION_OBJECTIVE_LABELS, { required: true })}
                              {select('companySize', copy.companySize, COMPANY_SIZE_LABELS)}
                              {multi('collaborationInterest', copy.collaborationInterest, COLLABORATION_LABELS)}
                            </>
                          ) : null}
                          {groupBlock}
                          {option === 'giveback' ? (
                            <>
                              {select('contribution', copy.contribution, CONTRIBUTION_LABELS, { required: true })}
                              {select('availability', copy.availability, AVAILABILITY_LABELS)}
                              {text('linkedin', copy.linkedin, { type: 'url', max: 300, placeholder: 'https://linkedin.com/in/…', span: true })}
                            </>
                          ) : null}
                          {documentFields(option)}
                          <label className="field span-2">
                            <span className="field__label">{copy.message[option]}</span>
                            <textarea name="message" maxLength={2000} rows={3} />
                          </label>
                          {consents}
                        </>,
                      )}
                    </>
                  )}

                  <label className="modal-form__honeypot" aria-hidden="true">
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                  {status === 'error' ? (
                    <div className="form-status form-status--error" role="alert">
                      <p>{failure === 'validation' ? copy.validation : failure === 'rateLimited' ? copy.rateLimited : copy.error}</p>
                    </div>
                  ) : null}
                  <div className="join-modal__actions">
                    {step > 0 ? (
                      <button className="btn btn--secondary" type="button" onClick={() => setStep((s) => s - 1)}>
                        {copy.back}
                      </button>
                    ) : (
                      <span />
                    )}
                    {step < lastStep ? (
                      <button className="btn btn--primary" type="button" onClick={next}>
                        {copy.next}
                        <ArrowRight aria-hidden />
                      </button>
                    ) : (
                      <button className="btn btn--primary" type="submit" disabled={status === 'sending'} aria-busy={status === 'sending'}>
                        {status === 'sending' ? copy.sending : copy.send}
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
