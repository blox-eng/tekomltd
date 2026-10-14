import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { allProjectSlugs } from './src/content/projects';
import { buildRedirects } from './src/lib/redirects';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** Old WordPress addresses → new paths, written by the importer. `archive` entries are deliberately absent: they stay unpublished. */
const urlMap: { files: Record<string, string>; pages: Record<string, string> } = JSON.parse(
    readFileSync(resolve(process.cwd(), '..', '..', 'design', 'wordpress-snapshot', 'url-map.json'), 'utf8')
);

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Workspace packages ship TypeScript source.
    transpilePackages: ['@tekom/ui', '@tekom/i18n'],
    async redirects() {
        return buildRedirects(allProjectSlugs(), Object.entries(urlMap.files), Object.entries(urlMap.pages));
    }
};

export default withNextIntl(nextConfig);
