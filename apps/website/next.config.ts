import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { urlMapFrom } from './src/content/paths';
import { allProjectSlugs } from './src/content/projects';
import { allPageSlugs } from './src/content/public-info';
import { buildRedirects } from './src/lib/redirects';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** Old WordPress file addresses → new paths, written by the importer. `archive` entries are deliberately absent: they stay unpublished. */
const urlMap: { files: Record<string, string> } = JSON.parse(readFileSync(urlMapFrom(resolve(process.cwd(), '..', '..')), 'utf8'));

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    // Workspace packages ship TypeScript source.
    transpilePackages: ['@tekom/ui', '@tekom/i18n'],
    async redirects() {
        return buildRedirects(allProjectSlugs(), Object.entries(urlMap.files), allPageSlugs());
    }
};

export default withNextIntl(nextConfig);
