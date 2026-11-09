import type { MetadataRoute } from 'next';
import { allProjectSlugs } from '@/content/projects';
import { allPageSlugs } from '@/content/public-info';
import { allServiceSlugs } from '@/content/services';
import { LEGAL_SLUGS } from '@/content/paths';
import { fallbackLocalesOf } from '@/lib/fallbacks';
import { languageUrls, publishedLocales, urlFor } from '@/lib/seo';

export const dynamic = 'force-static';

const STATIC_PATHS = ['/', '/projects', '/eu-programmes', '/publications', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
    const paths = [
        ...STATIC_PATHS,
        ...allProjectSlugs().map(({ slug }) => `/projects/${slug}`),
        ...LEGAL_SLUGS.map((slug) => `/${slug}`),
        ...allPageSlugs().map(({ slug }) => `/${slug}`)
    ];
    const pages = paths.flatMap((path) => {
        const fallback = fallbackLocalesOf(path);
        return publishedLocales(fallback).map((locale) => ({ url: urlFor(path, locale), alternates: { languages: languageUrls(path, fallback) } }));
    });
    // Service pages exist only in the locales they are written in, and carry no hreflang until they have a translation.
    const services = allServiceSlugs().flatMap(({ slug, locales }) => locales.map((locale) => ({ url: urlFor(`/${slug}`, locale) })));
    return [...pages, ...services];
}
