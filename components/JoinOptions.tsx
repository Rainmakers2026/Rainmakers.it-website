'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Locale } from '@/content/types';
import type { JoinErrorCode } from '@/lib/validation';
import { ACCEPTED_UPLOAD, MAX_UPLOAD_BYTES, checkUploadMeta } from '@/lib/uploads';
import { track } from '@/lib/analytics';
import { Close } from './icons';

type Option = 'project' | 'cv';
type Status = 'idle' | 'sending' | 'success' | 'error';
/** Why the last attempt failed: field errors (shown inline), too many requests, or a server/network problem. */
type Failure = 'validation' | 'rateLimited' | 'generic';
const MAX_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

export function JoinOptions({ locale }: { locale: Locale }) {
  const id = useId();
  const dialog = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [option, setOption] = useState<Option | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [started, setStarted] = useState(0);
  const [websiteCount, setWebsiteCount] = useState(1);
  const [serviceInterest, setServiceInterest] = useState('');
  const [errors, setErrors] = useState<Record<string, JoinErrorCode>>({});
  const [failure, setFailure] = useState<Failure>('generic');
  /** One key per opened form: a double click or retry is stored once (join_applications.idempotency_key). */
  const idempotencyKey = useRef('');
  const it = locale === 'it';
  const copy = it
    ? {
        project: 'Inviaci il tuo pitch',
        cv: 'Inviaci il tuo CV',
        title: 'Application form - Rainmakers',
        intro: 'Raccontaci il progetto o il tuo percorso: il team Rainmakers ti ricontatterà.',
        first: 'Nome',
        last: 'Cognome',
        email: 'Email',
        startupName: 'Nome Startup *',
        startupHint: 'Nome della startup (o del progetto, se l’azienda non è ancora costituita)',
        incorporated: 'La società è già costituita? *',
        selectOption: 'Seleziona un’opzione',
        year: 'Anno di Costituzione',
        yearHint: 'Inserire l’anno di costituzione, se già costituita',
        city: 'Città/Provincia *',
        cityHint: 'Dove si trova la sede principale della startup?',
        sector: 'Settore *',
        sectorHint: 'Descrivere il settore di appartenenza (es. web, cleantech, biotech, meccanico, chimico etc.)',
        website: 'Sito web',
        websiteHint: 'Inserire, se disponibile',
        addWebsite: 'Aggiungi un altro sito',
        service: 'Servizio di interesse *',
        serviceHint: 'Specificare il servizio richiesto',
        businessPlan: 'Redazione Business Plan',
        fundraising: 'Supporto per Fund Raising',
        businessDevelopment: 'Business Development',
        other: 'Altro',
        otherService: 'Se "Altro", Specificare:',
        company: 'Startup / organizzazione *',
        role: 'Ruolo *',
        linkProject: 'Link al pitch deck',
        filePitch: `Pitch deck (PDF, max ${MAX_MB} MB)`,
        fileCv: `CV (PDF, max ${MAX_MB} MB)`,
        fileHint: 'Carica un PDF oppure inserisci un link: almeno uno dei due è necessario.',
        linkCv: 'Link al CV o profilo LinkedIn',
        noteProject: 'Informazioni aggiuntive (opzionale)',
        noteCv: 'Raccontaci in breve il tuo profilo e cosa cerchi',
        privacy: 'Acconsento al trattamento dei dati per essere ricontattato e ho letto l’informativa privacy.',
        send: 'Invia',
        sending: 'Invio…',
        success: 'Grazie! Abbiamo ricevuto la tua richiesta: il team Rainmakers ti ricontatterà.',
        error: 'Non è stato possibile inviare la richiesta. Riprova tra qualche istante: i dati inseriti sono ancora qui.',
        rateLimited: 'Hai inviato troppe richieste. Riprova tra qualche minuto.',
        validation: 'Controlla i campi indicati.',
        errors: {
          required: 'Compila questo campo.',
          email: 'Inserisci un indirizzo email valido.',
          url: 'Inserisci un link valido (es. https://…).',
          consent: 'Serve il consenso al trattamento dei dati.',
          tooLong: 'Il testo è troppo lungo.',
          fileOrLink: 'Carica un PDF oppure inserisci un link.',
          fileType: 'Il file deve essere un PDF.',
          fileTooLarge: `Il file supera ${MAX_MB} MB: comprimilo oppure inserisci un link.`,
        } satisfies Record<JoinErrorCode, string>,
        close: 'Chiudi',
      }
    : {
        project: 'Send us your pitch',
        cv: 'Send us your CV',
        title: 'Application form - Rainmakers',
        intro: 'Tell us about your project or your experience and the Rainmakers team will get back to you.',
        first: 'First name',
        last: 'Last name',
        email: 'Email',
        startupName: 'Startup name *',
        startupHint: 'Name of the startup (or project, if the company is not incorporated yet)',
        incorporated: 'Is the company already incorporated? *',
        selectOption: 'Please select an option',
        year: 'Year of incorporation',
        yearHint: 'Enter the year of incorporation, if already incorporated',
        city: 'City / Province *',
        cityHint: 'Where is the startup’s main office?',
        sector: 'Sector *',
        sectorHint: 'Describe the sector (e.g. web, cleantech, biotech, mechanical, chemical, etc.)',
        website: 'Website',
        websiteHint: 'Add if available',
        addWebsite: 'Add another website',
        service: 'Service of interest *',
        serviceHint: 'Specify the service you need',
        businessPlan: 'Business plan writing',
        fundraising: 'Fundraising support',
        businessDevelopment: 'Business development',
        other: 'Other',
        otherService: 'If "Other", please specify:',
        company: 'Startup / organisation *',
        role: 'Role *',
        linkProject: 'Pitch deck link',
        filePitch: `Pitch deck (PDF, max ${MAX_MB} MB)`,
        fileCv: `CV (PDF, max ${MAX_MB} MB)`,
        fileHint: 'Upload a PDF or add a link: at least one of the two is required.',
        linkCv: 'CV or LinkedIn profile link',
        noteProject: 'Additional information (optional)',
        noteCv: 'Briefly tell us about your profile and what you are looking for',
        privacy: 'I agree to the processing of my data so Rainmakers can contact me and have read the privacy policy.',
        send: 'Send',
        sending: 'Sending…',
        success: 'Thank you! We have received your request and the Rainmakers team will get back to you.',
        error: 'We could not send your request. Please try again in a moment: your answers are still here.',
        rateLimited: 'Too many requests. Please try again in a few minutes.',
        validation: 'Please check the highlighted fields.',
        errors: {
          required: 'Please fill in this field.',
          email: 'Please enter a valid email address.',
          url: 'Please enter a valid link (e.g. https://…).',
          consent: 'We need your consent to process your data.',
          tooLong: 'This text is too long.',
          fileOrLink: 'Upload a PDF or add a link.',
          fileType: 'The file must be a PDF.',
          fileTooLarge: `The file is larger than ${MAX_MB} MB: compress it or add a link instead.`,
        } satisfies Record<JoinErrorCode, string>,
        close: 'Close',
      };

  useEffect(() => {
    if (!option) return;
    document.documentElement.classList.add('modal-open');
    dialog.current?.querySelector<HTMLElement>('input')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
      if (event.key === 'Tab' && dialog.current) {
        const focusables = [...dialog.current.querySelectorAll<HTMLElement>('button, input:not([type="hidden"]), select, textarea, a[href]')];
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

  function close() {
    setOption(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!option || status === 'sending') return;
    const data = new FormData(event.currentTarget);
    const entry = data.get('file');
    const file = entry instanceof File && entry.size > 0 ? entry : null;
    const linkValue = String(data.get(option === 'project' ? 'pitchDeck' : 'link') ?? '').trim();
    // Instant feedback; the server repeats every check (type, size, PDF signature)
    const fileError = file ? checkUploadMeta(file) : linkValue ? null : 'fileOrLink';
    if (fileError) {
      setErrors({ file: fileError });
      setFailure('validation');
      setStatus('error');
      return;
    }
    setErrors({});
    setStatus('sending');
    const fields = Object.fromEntries(data.entries());
    const websites = data.getAll('websites').map(String).filter(Boolean);
    const application = option === 'project'
      ? {
          startupName: String(fields.startupName ?? ''),
          companyIncorporated: String(fields.companyIncorporated ?? ''),
          incorporationYear: String(fields.incorporationYear ?? '') || undefined,
          cityProvince: String(fields.cityProvince ?? ''),
          sector: String(fields.sector ?? ''),
          websites,
          serviceInterest: String(fields.serviceInterest ?? ''),
          otherService: String(fields.otherService ?? '') || undefined,
        }
      : undefined;
    const payload = {
      locale,
      firstName: String(fields.firstName ?? ''),
      lastName: String(fields.lastName ?? ''),
      email: String(fields.email ?? ''),
      company: option === 'project' ? String(fields.startupName ?? '') : String(fields.company ?? ''),
      role: option === 'project' ? String(fields.serviceInterest ?? '') : String(fields.role ?? ''),
      link: linkValue || undefined,
      profileType: option === 'project' ? 'startup' : 'other',
      interest: String(fields.interest ?? ''),
      application,
      submissionType: option === 'project' ? 'pitch' : 'cv',
      consent: fields.consent === 'on',
      company_website_hp: String(fields.website ?? ''),
      elapsedMs: Date.now() - started,
      idempotencyKey: idempotencyKey.current,
    };
    const body = new FormData();
    body.set('payload', JSON.stringify(payload));
    if (file) body.set('file', file);
    try {
      const response = await fetch('/api/join', { method: 'POST', body });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; fields?: Record<string, JoinErrorCode> };
      if (response.ok && result.ok) {
        setStatus('success');
        track('join_application_submit', { kind: option === 'project' ? 'pitch' : 'cv', has_file: !!file, locale });
        return;
      }
      setErrors(result.fields ?? (response.status === 413 ? { file: 'fileTooLarge' } : {}));
      setFailure(result.fields || response.status === 413 ? 'validation' : response.status === 429 ? 'rateLimited' : 'generic');
      setStatus('error');
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

  const open = (value: Option, element: HTMLElement) => {
    setStatus('idle');
    setErrors({});
    idempotencyKey.current = crypto.randomUUID();
    setStarted(Date.now());
    setWebsiteCount(1);
    setServiceInterest('');
    returnFocus.current = element;
    setOption(value);
  };

  return (
    <>
      <div className="join-options">
        <button className="join-option" type="button" onClick={(event) => open('project', event.currentTarget)}>
          <span className="join-option__label">
            {copy.project}
            <span className="join-option__hint">{it ? 'Presentaci il tuo progetto in pochi passaggi.' : 'Introduce your startup in a few simple steps.'}</span>
          </span>
          <span aria-hidden>↗</span>
        </button>
        <button className="join-option" type="button" onClick={(event) => open('cv', event.currentTarget)}>
          <span className="join-option__label">
            {copy.cv}
            <span className="join-option__hint">{it ? 'Entra in contatto con il team Rainmakers.' : 'Get in touch with the Rainmakers team.'}</span>
          </span>
          <span aria-hidden>↗</span>
        </button>
      </div>
      {option ? (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <section ref={dialog} className="site-modal site-modal--wide" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1}>
            <button className="site-modal__close" type="button" aria-label={copy.close} onClick={close}>
              <Close aria-hidden />
            </button>
            <p className="eyebrow site-modal__eyebrow">{option === 'project' ? copy.project : copy.cv}</p>
            <h2 id={`${id}-title`}>{copy.title}</h2>
            <p>{copy.intro}</p>
            {status === 'success' ? (
              <p className="form-status form-status--success" role="status">{copy.success}</p>
            ) : (
              <form className="modal-form" onSubmit={submit}>
                <div className="form-grid">
                  <label className="field"><span className="field__label">{copy.first} *</span><input name="firstName" autoComplete="given-name" required /></label>
                  <label className="field"><span className="field__label">{copy.last} *</span><input name="lastName" autoComplete="family-name" required /></label>
                  <label className="field span-2"><span className="field__label">{copy.email} *</span><input type="email" name="email" autoComplete="email" required /></label>
                  {option === 'project' ? (
                    <>
                      <label className="field span-2">
                        <span className="field__label">{copy.startupName}</span>
                        <input name="startupName" maxLength={150} required />
                        <span className="field__hint">{copy.startupHint}</span>
                      </label>
                      <label className="field">
                        <span className="field__label">{copy.incorporated}</span>
                        <select name="companyIncorporated" defaultValue="" required>
                          <option value="" disabled>{copy.selectOption}</option>
                          <option value="yes">{it ? 'Sì' : 'Yes'}</option>
                          <option value="no">{it ? 'No' : 'No'}</option>
                        </select>
                      </label>
                      <label className="field">
                        <span className="field__label">{copy.year}</span>
                        <input name="incorporationYear" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="2026" />
                        <span className="field__hint">{copy.yearHint}</span>
                      </label>
                      <label className="field">
                        <span className="field__label">{copy.city}</span>
                        <input name="cityProvince" maxLength={120} required />
                        <span className="field__hint">{copy.cityHint}</span>
                      </label>
                      <label className="field">
                        <span className="field__label">{copy.sector}</span>
                        <input name="sector" maxLength={200} required />
                        <span className="field__hint">{copy.sectorHint}</span>
                      </label>
                      <div className="field span-2">
                        <span className="field__label">{copy.website}</span>
                        <div className="field__control">
                          {Array.from({ length: websiteCount }, (_, index) => (
                            <input key={index} name="websites" type="url" placeholder="https://" aria-label={`${copy.website} ${index + 1}`} maxLength={300} />
                          ))}
                          {websiteCount < 5 ? (
                            <button className="field__add" type="button" onClick={() => setWebsiteCount((count) => Math.min(count + 1, 5))}>
                              + {copy.addWebsite}
                            </button>
                          ) : null}
                        </div>
                        <span className="field__hint">{copy.websiteHint}</span>
                      </div>
                      <label className="field span-2">
                        <span className="field__label">{copy.linkProject}</span>
                        <input name="pitchDeck" type="url" placeholder="https://" maxLength={300} aria-invalid={!!errors.link} />
                        {fieldError('link')}
                      </label>
                      <label className="field span-2">
                        <span className="field__label">{copy.filePitch}</span>
                        <input name="file" type="file" accept={ACCEPTED_UPLOAD} aria-invalid={!!errors.file} aria-describedby={`${id}-file-hint${errors.file ? ` ${id}-file-error` : ''}`} />
                        <span className="field__hint" id={`${id}-file-hint`}>{copy.fileHint}</span>
                        {fieldError('file')}
                      </label>
                      <label className="field span-2">
                        <span className="field__label">{copy.service}</span>
                        <select name="serviceInterest" value={serviceInterest} onChange={(event) => setServiceInterest(event.target.value)} required>
                          <option value="" disabled>{copy.selectOption}</option>
                          <option value="business-plan">{copy.businessPlan}</option>
                          <option value="fundraising">{copy.fundraising}</option>
                          <option value="business-development">{copy.businessDevelopment}</option>
                          <option value="other">{copy.other}</option>
                        </select>
                        <span className="field__hint">{copy.serviceHint}</span>
                      </label>
                      {serviceInterest === 'other' ? (
                        <label className="field span-2">
                          <span className="field__label">{copy.otherService}</span>
                          <input name="otherService" maxLength={200} required />
                        </label>
                      ) : null}
                      <label className="field span-2">
                        <span className="field__label">{copy.noteProject}</span>
                        <textarea name="interest" maxLength={1000} rows={3} />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="field"><span className="field__label">{copy.company}</span><input name="company" maxLength={120} required /></label>
                      <label className="field"><span className="field__label">{copy.role}</span><input name="role" maxLength={120} required /></label>
                      <label className="field span-2">
                        <span className="field__label">{copy.linkCv}</span>
                        <input name="link" type="url" placeholder="https://" maxLength={300} aria-invalid={!!errors.link} />
                        {fieldError('link')}
                      </label>
                      <label className="field span-2">
                        <span className="field__label">{copy.fileCv}</span>
                        <input name="file" type="file" accept={ACCEPTED_UPLOAD} aria-invalid={!!errors.file} aria-describedby={`${id}-file-hint${errors.file ? ` ${id}-file-error` : ''}`} />
                        <span className="field__hint" id={`${id}-file-hint`}>{copy.fileHint}</span>
                        {fieldError('file')}
                      </label>
                      <label className="field span-2"><span className="field__label">{copy.noteCv}</span><textarea name="interest" maxLength={1000} rows={4} /></label>
                    </>
                  )}
                </div>
                <label className="modal-form__honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <label className="consent"><input type="checkbox" name="consent" required /><span>{copy.privacy} <a href={`/${locale}/privacy`} target="_blank" rel="noopener">{it ? 'Privacy' : 'Privacy policy'}</a></span></label>
                {status === 'error' ? (
                  <div className="form-status form-status--error" role="alert">
                    <p>{failure === 'validation' ? copy.validation : failure === 'rateLimited' ? copy.rateLimited : copy.error}</p>
                    {failure === 'validation' && Object.keys(errors).some((k) => k !== 'file' && k !== 'link') ? (
                      <ul>
                        {Object.entries(errors)
                          .filter(([k]) => k !== 'file' && k !== 'link')
                          .map(([k, code]) => (
                            <li key={k}>{copy.errors[code]}</li>
                          ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
                <button className="btn btn--primary" type="submit" disabled={status === 'sending'} aria-busy={status === 'sending'}>
                  {status === 'sending' ? copy.sending : copy.send}
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
