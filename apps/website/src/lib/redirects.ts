import type { Redirect } from 'next/dist/lib/load-custom-routes';
import { DEFAULT_LOCALE, LOCALES } from '@tekom/i18n';

type ProjectIdentity = { slug: string; wpSlug: string | null; wpId: number | null; oldSlugs: readonly string[] };
type PageIdentity = { slug: string; wpUrl: string | null };
type Pair = readonly [from: string, to: string];

/** Percent-encode each segment the way browsers request it, and escape what path-to-regexp treats as syntax. */
const encodePath = (path: string) =>
    path
        .split('/')
        .map((segment) => encodeURIComponent(segment).replace(/[()*+?:{}]/g, '\\$&'))
        .join('/');

const permanent = (source: string, destination: string): Redirect => ({ source, destination, statusCode: 301 });
const stripSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

/** Old WordPress pages whose new home is a route of the site rather than a page file. */
const STATIC: readonly Pair[] = [
    ['/portfolio_category/:p*', '/projects'],
    ['/home/privacy-policy', '/privacy'],
    ['/privacy-policy', '/privacy']
];

/** Next.js redirects for every old WordPress address worth keeping. Built once, at build time. */
export function buildRedirects(projects: readonly ProjectIdentity[], files: readonly Pair[], pages: readonly PageIdentity[] = []): Redirect[] {
    const redirects: Redirect[] = STATIC.map(([from, to]) => permanent(from, to));

    // A page file names its old address in `wp_url`. Next strips a trailing slash before it looks at custom redirects, so sources carry none.
    for (const { slug, wpUrl } of pages) {
        if (!wpUrl) continue;
        const from = stripSlash(decodeURI(new URL(wpUrl).pathname));
        const to = `/${slug}`;
        if (from !== to) redirects.push(permanent(encodePath(from), to));
    }

    for (const { slug, wpSlug, wpId, oldSlugs } of projects) {
        const destination = `/projects/${slug}`;
        if (wpSlug) redirects.push(permanent(`/project-view/${encodePath(wpSlug)}/:rest*`, destination));
        if (wpId !== null) redirects.push(permanent(`/project-view/${wpId}/:rest*`, destination));
        for (const old of oldSlugs) {
            redirects.push(permanent(`/projects/${encodePath(old)}`, destination));
            for (const locale of LOCALES.filter((l) => l !== DEFAULT_LOCALE))
                redirects.push(permanent(`/${locale}/projects/${encodePath(old)}`, `/${locale}${destination}`));
        }
    }

    for (const [from, to] of files) redirects.push(permanent(encodePath(from), to));
    const seen = new Set<string>();
    return redirects.filter(({ source }) => !seen.has(source) && seen.add(source));
}
