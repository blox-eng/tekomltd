import { basename, dirname, join, resolve } from 'node:path';
import { LOCALES, type Locale } from '@tekom/i18n';

export const LEGAL_SLUGS = ['privacy', 'cookies', 'data-rights', 'terms'] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const SETTINGS_FILE = 'settings.yaml';
export const HOME_FILE = 'home.yaml';
export const EU_PROGRAMMES_FILE = 'eu-programmes.yaml';
export const PUBLICATIONS_FILE = 'publications.yaml';
export const PROJECTS_DIR = 'projects';
export const PROJECT_FILE = 'project.yaml';
export const LEGAL_DIR = 'legal';
export const PAGES_DIR = 'pages';

export const contentRootFrom = (repoRoot: string) => join(repoRoot, 'content');

export const projectFile = (slug: string) => join(PROJECTS_DIR, slug, PROJECT_FILE);
export const legalFile = (slug: LegalSlug, locale: Locale) => join(LEGAL_DIR, `${slug}.${locale}.md`);

export const pageFile = (slug: string, locale: Locale) => join(PAGES_DIR, `${slug}.${locale}.md`);

export function parsePageFile(name: string): { slug: string; locale: Locale } | null {
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.([a-z]{2})\.md$/.exec(basename(name));
    const locale = LOCALES.find((l) => l === match?.[2]);
    return match && locale ? { slug: match[1]!, locale } : null;
}

export function parseLegalFile(name: string): { slug: LegalSlug; locale: Locale } | null {
    const match = /^(.+)\.([a-z]{2})\.md$/.exec(basename(name));
    const slug = LEGAL_SLUGS.find((s) => s === match?.[1]);
    const locale = LOCALES.find((l) => l === match?.[2]);
    return slug && locale ? { slug, locale } : null;
}

/** A file reference inside a content file is relative to that file. */
export const resolveRef = (root: string, contentFile: string, ref: string) => resolve(root, dirname(contentFile), ref);
