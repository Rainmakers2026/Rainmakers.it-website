import type { Dictionary, Locale } from '@/content/types';
import { Connect } from './Connect';

/** Back-compat alias for the current lead-capture section. */
export function Join({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return <Connect dict={dict} locale={locale} />;
}
