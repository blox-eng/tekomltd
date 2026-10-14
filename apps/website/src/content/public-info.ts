import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_LOCALE, type Locale } from '@tekom/i18n';
import { defaultRoot, imgOrNull, mediaUrl, once, parseFrontMatter, readYaml, text } from './load';
import { EU_PROGRAMMES_FILE, legalFile, PUBLICATIONS_FILE, type LegalSlug } from './paths';
import { EuProgramme, LegalPage, Publication, PUBLICATION_KINDS } from './schema';
import { z } from 'zod';
import type { Img } from './load';

export type Programme = {
    code: string;
    title: string;
    summary: string;
    objectives: string;
    results: string;
    totalBudgetEur: number | null;
    euContributionEur: number | null;
    periodStart: string | null;
    periodEnd: string | null;
    logo: Img | null;
};

export type PublicationView = {
    programme: string | null;
    kind: (typeof PUBLICATION_KINDS)[number];
    title: string;
    file: string;
    publishedOn: string;
    wpUrl: string | null;
};

export type LegalView = { slug: LegalSlug; locale: Locale; title: string; updated: string; reviewed: boolean; body: string; fallback: boolean };

export function listProgrammes(locale: Locale, root: string = defaultRoot()): Programme[] {
    const rows = once(root, 'programmes', () => readYaml(root, EU_PROGRAMMES_FILE, z.array(EuProgramme)));
    return rows.map((p) => ({
        code: p.code,
        title: text(p.title, locale),
        summary: text(p.summary, locale),
        objectives: text(p.objectives, locale),
        results: text(p.results, locale),
        totalBudgetEur: p.total_budget_eur ?? null,
        euContributionEur: p.eu_contribution_eur ?? null,
        periodStart: p.period_start ?? null,
        periodEnd: p.period_end ?? null,
        logo: imgOrNull(root, EU_PROGRAMMES_FILE, p.programme_logo, p.code)
    }));
}

/** Newest first. */
export function listPublications(locale: Locale, kind?: PublicationView['kind'], root: string = defaultRoot()): PublicationView[] {
    const rows = once(root, 'publications', () => readYaml(root, PUBLICATIONS_FILE, z.array(Publication)));
    return rows
        .filter((p) => kind === undefined || p.kind === kind)
        .map((p) => ({
            programme: p.programme ?? null,
            kind: p.kind,
            title: text(p.title, locale),
            file: mediaUrl(root, PUBLICATIONS_FILE, p.file),
            publishedOn: p.published_on,
            wpUrl: p.wp_url ?? null
        }))
        .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn));
}

export function getLegalPage(slug: LegalSlug, locale: Locale, root: string = defaultRoot()): LegalView | null {
    const read = (l: Locale) =>
        once(root, `legal:${slug}.${l}`, () => {
            const path = join(root, legalFile(slug, l));
            if (!existsSync(path)) return null;
            const { data, body } = parseFrontMatter(readFileSync(path, 'utf8'));
            return LegalPage.parse({ ...data, slug, locale: l, body });
        });
    const page = read(locale) ?? read(DEFAULT_LOCALE);
    if (!page) return null;
    return { slug, locale, title: page.title, updated: page.updated, reviewed: page.reviewed, body: page.body, fallback: page.locale !== locale };
}
