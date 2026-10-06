import type { Dictionary } from '@/content/types';
import { Why } from './Why';

/** Back-compat alias for the current Why section, which is the canonical copy model. */
export function Challenge({ dict }: { dict: Dictionary }) {
  return <Why dict={dict} />;
}
