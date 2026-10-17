import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Markdown from 'react-markdown';
import { LOCALES, type Locale } from '@tekom/i18n';
import { ServicePage } from '@/components/services/ServicePage';
import { allPageSlugs, getLegalPage, getPage } from '@/content/public-info';
import { allServiceSlugs, getService, listServices } from '@/content/services';
import { Link } from '@/i18n/navigation';
import { fallbackLocalesOf } from '@/lib/fallbacks';
import { describe, pageMetadata } from '@/lib/seo';
import { servicePhoto, shareImage, siteShareImage } from '@/lib/share';
import { isLegalSlug, LEGAL_SLUGS } from '@/content/paths';

export const dynamicParams = false;

type Params = { locale: Locale; slug: string };

/** Legal pages, the pages carried over from the old site and the service pages share this one route segment. */
const load = (slug: string, locale: Locale) => (isLegalSlug(slug) ? getLegalPage(slug, locale) : getPage(slug, locale));

export function generateStaticParams(): Params[] {
    const slugs = [...LEGAL_SLUGS, ...allPageSlugs().map((page) => page.slug)];
    // A service is built only in the locales it is written in; the others answer 404 rather than show Bulgarian.
    const services = allServiceSlugs().flatMap(({ slug, locales }) => locales.map((locale) => ({ locale, slug })));
    return [...LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug }))), ...services];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { locale, slug } = await params;
    const service = getService(slug, locale);
    if (service)
        return pageMetadata({
            locale,
            path: `/${slug}`,
            title: service.metaTitle,
            description: service.metaDescription,
            image: shareImage(servicePhoto(service), locale),
            translated: false
        });
    const page = load(slug, locale);
    if (!page) return {};
    return pageMetadata({
        locale,
        path: `/${slug}`,
        title: page.title,
        description: describe(page.body),
        image: siteShareImage(locale),
        fallbackLocales: fallbackLocalesOf(`/${slug}`)
    });
}

export default async function TextPage({ params }: { params: Promise<Params> }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const service = getService(slug, locale);
    if (service) return <ServicePage service={service} others={listServices(locale).filter((s) => s.slug !== slug)} locale={locale} />;
    const page = load(slug, locale);
    if (!page) notFound();
    const t = await getTranslations({ locale });

    return (
        <article className="wrap page">
            <h1>{page.title}</h1>
            <p className="micro">
                <time dateTime={page.updated}>{page.updated}</time>
            </p>
            {page.fallback && <p className="lang-note">{t('note')}</p>}
            <div className="prose" lang={page.fallback ? 'bg' : undefined}>
                <Markdown
                    components={{
                        a: ({ node: _node, href, children, ...props }) =>
                            href?.startsWith('/') && !href.startsWith('/media/') ? (
                                <Link href={href}>{children}</Link>
                            ) : (
                                <a href={href} {...props}>
                                    {children}
                                </a>
                            ),
                        img: ({ node: _node, alt, ...props }) => <img alt={alt ?? ''} loading="lazy" decoding="async" {...props} />
                    }}
                >
                    {page.body}
                </Markdown>
            </div>
        </article>
    );
}
