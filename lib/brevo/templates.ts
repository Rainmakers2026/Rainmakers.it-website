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
  const title = it ? 'Conferma la tua iscrizione alla newsletter' : 'Confirm your newsletter subscription';
  const p = it
    ? [
        'Hai chiesto di ricevere la newsletter mensile di Rainmakers. Per completare l’iscrizione, conferma il tuo indirizzo email.',
        `Il link è valido per ${ttlHours} ore. Se non hai richiesto l’iscrizione, ignora questa email: non riceverai altri messaggi.`,
      ]
    : [
        'You asked to receive the Rainmakers monthly newsletter. To complete your subscription, please confirm your email address.',
        `The link is valid for ${ttlHours} hours. If you did not request this, just ignore this email: you will not hear from us again.`,
      ];
  const label = it ? 'Conferma l’iscrizione' : 'Confirm subscription';
  return { subject: title, html: layout(locale, title, p, { label, url }), text: text(title, p, `${label}: ${url}`) };
}

/** Sent once, after confirmation (and after the contact is queued for the "Contatti" list). */
export function newsletterWelcomeEmail(locale: Locale): EmailContent {
  const it = locale === 'it';
  const title = it ? 'Benvenuto nella newsletter di Rainmakers' : 'Welcome to the Rainmakers newsletter';
  const p = it
    ? [
        'La tua iscrizione è confermata. Una volta al mese riceverai gli highlight dell’ecosistema e i link agli ultimi contenuti di Rainmakers.',
        'Ogni newsletter contiene un link per annullare l’iscrizione in qualsiasi momento. Per qualsiasi domanda puoi rispondere a questa email o scrivere a info@rainmakers.it.',
      ]
    : [
        'Your subscription is confirmed. Once a month you will receive ecosystem highlights and links to the latest Rainmakers content.',
        'Every newsletter includes a link to unsubscribe at any time. For any question, reply to this email or write to info@rainmakers.it.',
      ];
  return { subject: title, html: layout(locale, title, p), text: text(title, p) };
}

/** "Application received" after Join the Tribe — transactional, no marketing list. */
export function joinReceivedEmail(locale: Locale, kind: 'pitch' | 'cv', firstName: string): EmailContent {
  const it = locale === 'it';
  const name = esc(firstName.trim().slice(0, 80));
  const what = it ? (kind === 'pitch' ? 'il tuo pitch' : 'il tuo CV') : kind === 'pitch' ? 'your pitch' : 'your CV';
  const title = it ? 'Abbiamo ricevuto la tua candidatura' : 'We have received your application';
  const p = it
    ? [
        `Ciao ${name},`,
        `grazie per averci inviato ${what}. Il team Rainmakers lo esaminerà e ti ricontatterà.`,
        'Questa email conferma soltanto la ricezione: non ti abbiamo iscritto ad alcuna newsletter. Per domande puoi rispondere a questa email o scrivere a info@rainmakers.it.',
      ]
    : [
        `Hi ${name},`,
        `thank you for sending us ${what}. The Rainmakers team will review it and get back to you.`,
        'This email only confirms receipt: you have not been subscribed to any newsletter. For questions, reply to this email or write to info@rainmakers.it.',
      ];
  return { subject: title, html: layout(locale, title, p), text: text(title, p) };
}
