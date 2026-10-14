import type { MetadataRoute } from 'next';
import { LOCALES } from '@tekom/i18n';
import { allProjectSlugs } from '@/content/projects';
import { allPageSlugs } from '@/content/public-info';
import { LEGAL_SLUGS } from '@/content/paths';
import { languageUrls, urlFor } from '@/lib/seo';

export const dynamic = 'force-static';

const STATIC_PATHS = ['/', '/projects', '/eu-programmes', '/publications', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
    const paths = [
        ...STATIC_PATHS,
        ...allProjectSlugs().map(({ slug }) => `/projects/${slug}`),
        ...LEGAL_SLUGS.map((slug) => `/${slug}`),
        ...allPageSlugs().map(({ slug }) => `/${slug}`)
    ];
    return paths.flatMap((path) => LOCALES.map((locale) => ({ url: urlFor(path, locale), alternates: { languages: languageUrls(path) } })));
}
