import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { urlMapFrom } from './src/content/paths';
import { allProjectSlugs } from './src/content/projects';
import { allPageSlugs } from './src/content/public-info';
import { allServiceSlugs } from './src/content/services';
import { buildRedirects, exactPageRedirects } from './src/lib/redirects';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** Old WordPress file addresses → new paths, written by the importer. `archive` entries are deliberately absent: they stay unpublished. */
const urlMap: { files: Record<string, string> } = JSON.parse(readFileSync(urlMapFrom(resolve(process.cwd(), '..', '..')), 'utf8'));

const redirects = buildRedirects(allProjectSlugs(), Object.entries(urlMap.files), allPageSlugs(), allServiceSlugs());

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    // Workspace packages ship TypeScript source.
    transpilePackages: ['@tekom/ui', '@tekom/i18n'],
    // A page rendered on request (a 404, say) reads content/; the server function must carry its text files.
    outputFileTracingRoot: resolve(process.cwd(), '..', '..'),
    outputFileTracingIncludes: { '/**': ['../../content/**/*.yaml', '../../content/**/*.md'] },
    // Read by the middleware, which answers these before any routing (src/middleware.ts).
    env: { PAGE_REDIRECTS: JSON.stringify(exactPageRedirects(redirects)) },
    async redirects() {
        return redirects;
    }
};

export default withNextIntl(nextConfig);
