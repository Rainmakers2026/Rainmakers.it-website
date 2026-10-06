import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dist = path.join(here, 'dist');
const common = {
  bundle: true,
  absWorkingDir: root,
  tsconfig: path.join(root, 'tsconfig.json'),
  nodePaths: ['/opt/npm-tools/node_modules'],
  jsx: 'automatic',
  logLevel: 'warning',
  alias: {
    'next/navigation': path.join(here, 'shims/next-navigation.js'),
    '@vercel/analytics': path.join(here, 'shims/vercel-analytics.js'),
    '@vercel/analytics/react': path.join(here, 'shims/vercel-analytics.js'),
    '@vercel/analytics/next': path.join(here, 'shims/vercel-analytics.js'),
    'server-only': path.join(here, 'shims/empty.js'),
  },
};

await build({ ...common, entryPoints: [path.join(here, 'render.tsx')], platform: 'node', format: 'cjs', outfile: path.join(dist, 'render.cjs'), define: { 'process.env.NODE_ENV': '"production"' } });
await build({ ...common, entryPoints: [path.join(here, 'client.tsx')], platform: 'browser', format: 'iife', minify: true, outfile: path.join(dist, 'site/client.js'), define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_SITE_URL': '"https://www.rainmakers.it"' }, metafile: true }).then((r) => {
  const bytes = Object.values(r.metafile.outputs)[0].bytes;
  console.log('client bundle (minified, all components hydrated):', (bytes / 1024).toFixed(1), 'KB');
});
await build({ ...common, entryPoints: [path.join(here, 'api.ts')], platform: 'node', format: 'cjs', outfile: path.join(dist, 'api.cjs') });
execFileSync('node', [path.join(dist, 'render.cjs'), path.join(dist, 'site'), path.join(root, 'app/globals.css')], { stdio: 'inherit' });
