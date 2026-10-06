import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Roboto } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { isLocale, locales } from '@/content/types';
import { getDictionary } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';
import '../globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-roboto',
});

export const viewport: Viewport = {
  themeColor: '#0e2136',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata(getDictionary(locale));
}

/**
 * Enables reveal animations before first paint, with a failsafe:
 * if the client bundle hasn't initialised within 4s, content is shown anyway.
 */
const revealBootstrap = `(function(d){d.classList.add('js');setTimeout(function(){if(!d.classList.contains('reveal-ready'))d.classList.remove('js')},4000)})(document.documentElement)`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={roboto.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
