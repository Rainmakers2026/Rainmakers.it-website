import type { Dictionary } from '@/content/types';
import { Access } from './Access';

/** Back-compat alias for the current access section. */
export function Value({ dict }: { dict: Dictionary }) {
  return <Access dict={dict} />;
}
