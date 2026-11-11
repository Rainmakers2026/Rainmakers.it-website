import 'server-only';
import type { Locale } from '@/content/types';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Minimal, brand-coloured layout that renders in every mail client (inline styles, one column). */
function layout(locale: Locale, title: string, paragraphs: string[], cta?: { label: string; url: string }) {
  const footer =
    locale === 'it'
      ? 'Rainmakers · Milano · <a href="mailto:info@rainmakers.it" style="color:#7b92e8">info@rainmakers.it</a>'
      : 'Rainmakers · Milan · <a href="mailto:info@rainmakers.it" style="color:#7b92e8">info@rainmakers.it</a>';
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1b3a5c">${p}</p>`).join('');
  const button = cta
    ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#4b61d1;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">${esc(cta.label)}</a></p>`
    : '';
  return `<!doctype html><html lang="${locale}"><body style="margin:0;padding:24px;background:#f2f4f7;font-family:Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#4b61d1">Rainmakers</p>
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:#0e2136">${esc(title)}</h1>
${body}${button}
<p style="margin:32px 0 0;font-size:12px;color:#5b6b80">${footer}</p>
</td></tr></table></td></tr></table></body></html>`;
}

const text = (title: string, paragraphs: string[], extra?: string) =>
  [title, '', ...paragraphs.map((p) => p.replace(/<[^>]+>/g, '')), ...(extra ? ['', extra] : []), '', 'Rainmakers · info@rainmakers.it'].join('\n');

/** Double opt-in: the only email sent before consent is confirmed. Purely transactional. */
export function confirmationEmail(locale: Locale, url: string, ttlHours: number): EmailContent {
  const it = locale === 'it';
  const title = it ? 'Conferma la tua iscrizione a Gocce di Innovazione' : 'Confirm your subscription to Gocce di Innovazione';
  const p = it
    ? [
        'Hai chiesto di ricevere Gocce di Innovazione, la newsletter mensile di Rainmakers. Per completare l’iscrizione, conferma il tuo indirizzo email.',
        `Il link è valido per ${ttlHours} ore. Se non hai richiesto l’iscrizione, ignora questa email: non riceverai altri messaggi.`,
      ]
    : [
        'You asked to receive Gocce di Innovazione, the Rainmakers monthly newsletter. To complete your subscription, please confirm your email address.',
        `The link is valid for ${ttlHours} hours. If you did not request this, just ignore this email: you will not hear from us again.`,
      ];
  const label = it ? 'Conferma l’iscrizione' : 'Confirm subscription';
  return { subject: title, html: layout(locale, title, p, { label, url }), text: text(title, p, `${label}: ${url}`) };
}

/** Sent once, after confirmation; ends with the personal unsubscribe link (lib/crm/links.ts). */
export function newsletterWelcomeEmail(locale: Locale, unsubscribeUrl: string | null = null): EmailContent {
  const it = locale === 'it';
  const title = it ? 'Benvenuto in Gocce di Innovazione' : 'Welcome to Gocce di Innovazione';
  const p = it
    ? [
        'La tua iscrizione è confermata. Una volta al mese riceverai gli highlight dell’ecosistema e i link agli ultimi contenuti di Rainmakers.',
        'Ogni newsletter contiene un link per annullare l’iscrizione in qualsiasi momento. Per qualsiasi domanda puoi rispondere a questa email o scrivere a info@rainmakers.it.',
      ]
    : [
        'Your subscription is confirmed. Once a month you will receive ecosystem highlights and links to the latest Rainmakers content.',
        'Every newsletter includes a link to unsubscribe at any time. For any question, reply to this email or write to info@rainmakers.it.',
      ];
  const unsubscribeLabel = it ? 'Non vuoi più riceverla? Annulla l’iscrizione' : 'No longer interested? Unsubscribe';
  const withLink = unsubscribeUrl ? [...p, `<a href="${esc(unsubscribeUrl)}" style="color:#5b6b80;font-size:13px">${esc(unsubscribeLabel)}</a>`] : p;
  return {
    subject: title,
    html: layout(locale, title, withLink),
    text: text(title, p, unsubscribeUrl ? `${unsubscribeLabel}: ${unsubscribeUrl}` : undefined),
  };
}

export type JoinKind = 'pitch' | 'cv' | 'giveback' | 'company' | 'invest';

/** "Application received" after a "Come vuoi iniziare?" form — transactional, no marketing list. */
export function joinReceivedEmail(locale: Locale, kind: JoinKind, firstName: string): EmailContent {
  const it = locale === 'it';
  const name = esc(firstName.trim().slice(0, 80));
  const what = {
    pitch: it ? 'il tuo pitch' : 'your pitch',
    cv: it ? 'il tuo CV' : 'your CV',
    giveback: it ? 'la tua proposta di contributo' : 'your offer to contribute',
    company: it ? 'la richiesta della tua azienda' : 'your company’s request',
    invest: it ? 'la tua candidatura come investitore' : 'your investor application',
  }[kind];
  const title = it ? 'Abbiamo ricevuto la tua candidatura' : 'We have received your application';
  const p = it
    ? [
        `Ciao ${name},`,
        `grazie per averci inviato ${what}. Il team Rainmakers ${kind === 'giveback' || kind === 'company' || kind === 'invest' ? 'la' : 'lo'} esaminerà e ti ricontatterà.`,
        'Questa email conferma soltanto la ricezione: non ti abbiamo iscritto ad alcuna newsletter. Per domande puoi rispondere a questa email o scrivere a info@rainmakers.it.',
      ]
    : [
        `Hi ${name},`,
        `thank you for sending us ${what}. The Rainmakers team will review it and get back to you.`,
        'This email only confirms receipt: you have not been subscribed to any newsletter. For questions, reply to this email or write to info@rainmakers.it.',
      ];
  return { subject: title, html: layout(locale, title, p), text: text(title, p) };
}

/** Rows "Label: value" plus an optional quoted block, in the internal (Italian) layout. */
function teamEmail(title: string, subject: string, rows: [string, string][], quote?: string, footnote?: string): EmailContent {
  const paragraphs = [
    ...rows.map(([k, v]) => `<strong>${esc(k)}:</strong> ${esc(v).replace(/\n/g, '<br>')}`),
    ...(quote ? [`<span style="display:block;border-left:3px solid #7b92e8;padding:8px 14px;background:#f5f7ff">${esc(quote).replace(/\n/g, '<br>')}</span>`] : []),
    ...(footnote ? [footnote] : []),
  ];
  return {
    subject,
    html: layout('it', title, paragraphs),
    text: text(title, [...rows.map(([k, v]) => `${k}: ${v}`), ...(quote ? ['', quote] : []), ...(footnote ? ['', footnote] : [])]),
  };
}

const JOIN_TITLES: Record<JoinKind, string> = {
  company: 'Innova la tua azienda',
  pitch: 'Accelera la tua startup (pitch)',
  giveback: 'Unisciti al Giveback',
  cv: 'Lavora con noi (CV)',
  invest: 'Investi con noi',
};

/**
 * Team notification for a "Come vuoi iniziare?" request (sent to the team inbox, reply-to = the visitor).
 * `fields` are the readable answers (lib/crm/readable.ts → readableFields), labelled in Italian.
 */
export function joinNotificationEmail(kind: JoinKind, fields: Record<string, string>, message: string | undefined, file: { name: string } | null): EmailContent {
  const name = `${fields.Nome ?? ''} ${fields.Cognome ?? ''}`.trim();
  const rows = Object.entries(fields).filter(([, v]) => v !== '');
  if (file) rows.push(['Documento', `${file.name} (in allegato)`]);
  const note = message || undefined;
  const title = `${JOIN_TITLES[kind]}: nuova richiesta da ${name}`;
  return teamEmail(
    title,
    `📩 ${JOIN_TITLES[kind]} — ${name}${fields.Organizzazione ? ` (${fields.Organizzazione})` : ''}`,
    rows,
    note,
    'Rispondi a questa email per scrivere direttamente alla persona. La richiesta è salvata nel CRM Rainmakers OS (Supabase → form_submissions).',
  );
}

/** Internal notice of a confirmed newsletter subscription (double opt-in completed). */
export function newsletterSubscriberEmail(s: { email: string; locale?: string | null; source?: string | null }): EmailContent {
  const title = 'Nuova iscrizione confermata alla newsletter';
  return teamEmail(
    title,
    `✉️ Newsletter: nuova iscrizione confermata — ${s.email}`,
    [
      ['Email', s.email],
      ['Lingua', (s.locale ?? '—').toUpperCase()],
      ['Punto di iscrizione', s.source ?? '—'],
    ],
    undefined,
    'L’indirizzo ha confermato l’iscrizione a Gocce di Innovazione con il doppio opt-in (Supabase → newsletter_subscriptions). Entrerà nella lista Brevo quando la sincronizzazione sarà attivata.',
  );
}

/** Team notification for a new review (sent to the team inbox, reply-to = the author). Italian: internal. */
export function reviewNotificationEmail(r: {
  name: string;
  email: string;
  company?: string;
  role?: string;
  rating?: number;
  review: string;
  publishConsent: boolean;
  locale: Locale;
}): EmailContent {
  const stars = r.rating ? `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}/5)` : '—';
  const who = [r.company, r.role].filter(Boolean).join(' · ') || '—';
  const rows: [string, string][] = [
    ['Nome', r.name],
    ['Email', r.email],
    ['Azienda / ruolo', who],
    ['Valutazione', stars],
    ['Pubblicabile sul sito', r.publishConsent ? 'Sì (nome e azienda)' : 'No'],
    ['Lingua', r.locale.toUpperCase()],
  ];
  const title = `Nuova review da ${r.name}`;
  const quote = esc(r.review).replace(/\n/g, '<br>');
  const paragraphs = [
    ...rows.map(([k, v]) => `<strong>${k}:</strong> ${esc(v)}`),
    `<span style="display:block;border-left:3px solid #7b92e8;padding:8px 14px;background:#f5f7ff">${quote}</span>`,
    'Rispondi a questa email per scrivere direttamente all’autore. La review è salvata anche in Supabase (tabella reviews, stato "new").',
  ];
  return {
    subject: `⭐ Nuova review sul sito — ${r.name}${r.company ? ` (${r.company})` : ''}`,
    html: layout('it', title, paragraphs),
    text: text(title, [...rows.map(([k, v]) => `${k}: ${v}`), '', r.review]),
  };
}
