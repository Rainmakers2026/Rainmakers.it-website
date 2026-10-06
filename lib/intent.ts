import type { Intent } from './options';
import { INTENTS } from './options';

/** Window event used by CTAs (data-intent="…") to preselect the lead form intent. */
export const INTENT_EVENT = 'rm:intent';

export function emitIntent(intent: Intent) {
  window.dispatchEvent(new CustomEvent<Intent>(INTENT_EVENT, { detail: intent }));
}

export function readIntentFromUrl(): Intent | null {
  try {
    const value = new URLSearchParams(window.location.search).get('intent');
    return value && (INTENTS as readonly string[]).includes(value) ? (value as Intent) : null;
  } catch {
    return null;
  }
}
