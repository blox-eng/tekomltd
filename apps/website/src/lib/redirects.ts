import type { Redirect } from 'next/dist/lib/load-custom-routes';
import { LOCALES } from '@tekom/i18n';

type ProjectIdentity = { slug: string; wpSlug: string | null; wpId: number | null; oldSlugs: readonly string[] };
type Pair = readonly [from: string, to: string];

/** Percent-encode each segment the way browsers request it, and escape what path-to-regexp treats as syntax. */
const encodePath = (path: string) =>
    path
        .split('/')
        .map((segment) => encodeURIComponent(segment).replace(/[()*+?:{}]/g, '\\$&'))
        .join('/');

const permanent = (source: string, destination: string): Redirect => ({ source, destination, permanent: true });
const stripSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

/** Next.js redirects for every old WordPress address worth keeping. Built once, at build time. */
export function buildRedirects(projects: readonly ProjectIdentity[], files: readonly Pair[], pages: readonly Pair[] = []): Redirect[] {
    const redirects: Redirect[] = [permanent('/portfolio_category/:p*', '/projects'), permanent('/home/privacy-policy', '/privacy')];

    // Next strips a trailing slash before it looks at custom redirects, so sources carry none.
    for (const [from, to] of pages) {
        if (stripSlash(from) !== to) redirects.push(permanent(encodePath(stripSlash(from)), to));
    }

    for (const { slug, wpSlug, wpId, oldSlugs } of projects) {
        const destination = `/projects/${slug}`;
        if (wpSlug) redirects.push(permanent(`/project-view/${encodePath(wpSlug)}/:rest*`, destination));
        if (wpId !== null) redirects.push(permanent(`/project-view/${wpId}/:rest*`, destination));
        for (const old of oldSlugs) {
            redirects.push(permanent(`/projects/${encodePath(old)}`, destination));
            for (const locale of LOCALES.filter((l) => l !== 'bg'))
                redirects.push(permanent(`/${locale}/projects/${encodePath(old)}`, `/${locale}${destination}`));
        }
    }

    for (const [from, to] of files) redirects.push(permanent(encodePath(from), to));
    return redirects;
}
