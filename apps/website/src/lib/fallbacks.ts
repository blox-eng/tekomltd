import { DEFAULT_LOCALE, LOCALES, type Locale } from '@tekom/i18n';
import { getProject } from '../content/projects';
import { defaultRoot } from '../content/load';
import { getLegalPage, getPage, listProgrammes, listPublications } from '../content/public-info';
import { isLegalSlug } from '../content/paths';
import { allServiceSlugs } from '../content/services';

const NON_DEFAULT = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

/**
 * Locales in which the page at `path` shows Bulgarian text instead of a translation.
 * Such a page duplicates the Bulgarian one, so it must not be indexed as its own.
 */
export function fallbackLocalesOf(path: string, root: string = defaultRoot()): Locale[] {
    const test = (isFallback: (locale: Locale) => boolean) => NON_DEFAULT.filter(isFallback);
    const project = /^\/projects\/([^/]+)$/.exec(path)?.[1];
    if (project) return test((l) => getProject(project, l, root)?.titleFallback ?? false);
    if (path === '/eu-programmes')
        return test(
            (l) => listProgrammes(l, root).some((p) => p.fallback || p.titleFallback) || listPublications(l, undefined, root).some((p) => p.titleFallback)
        );
    if (path === '/publications') return test((l) => listPublications(l, undefined, root).some((p) => p.titleFallback));
    const slug = /^\/([^/]+)$/.exec(path)?.[1];
    const service = slug ? allServiceSlugs(root).find((s) => s.slug === slug) : undefined;
    if (service) return NON_DEFAULT.filter((l) => !service.locales.includes(l));
    if (slug && isLegalSlug(slug)) return test((l) => getLegalPage(slug, l, root)?.fallback ?? false);
    if (slug && slug !== 'projects' && slug !== 'contact') return test((l) => getPage(slug, l, root)?.fallback ?? false);
    return [];
}
