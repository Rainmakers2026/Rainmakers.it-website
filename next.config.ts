import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const posthogCspDomain = process.env.NEXT_PUBLIC_POSTHOG_HOST
  ?.replace(/^https:\/\//, '')
  .split('/')[0]
  .split('.')
  .slice(-2)
  .join('.');
const posthogCspSource = posthogCspDomain ? ` https://*.${posthogCspDomain}` : '';

// Inline scripts are limited to JSON-LD, the reveal bootstrap and Next's own runtime.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com${posthogCspSource}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' https://vitals.vercel-insights.com${posthogCspSource}`,
  "worker-src 'self' blob:",
  // YouTube player is loaded only after a click, in privacy-enhanced mode (components/YouTubeFacade.tsx)
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Video thumbnail, served through /_next/image so the CSP img-src stays 'self'
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
