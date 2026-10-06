import { hydrateRoot } from 'react-dom/client';
import { HomePage } from '@/components/HomePage';
import { communitiesFallback } from '@/content/shared';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/content/types';

const root = document.getElementById('root')!;
const locale = root.dataset.locale as Locale;
hydrateRoot(root, <HomePage dict={getDictionary(locale)} locale={locale} communities={communitiesFallback} />, {
  onRecoverableError: (e) => console.error('[hydration]', e),
});
