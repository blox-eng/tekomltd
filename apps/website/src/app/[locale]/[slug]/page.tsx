import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Markdown from 'react-markdown';
import { LOCALES, type Locale } from '@tekom/i18n';
import { allPageSlugs, getLegalPage, getPage } from '@/content/public-info';
import { Link } from '@/i18n/navigation';
import { fallbackLocalesOf } from '@/lib/fallbacks';
import { describe, pageMetadata } from '@/lib/seo';
import { siteShareImage } from '@/lib/share';
import { isLegalSlug, LEGAL_SLUGS } from '@/content/paths';

export const dynamicParams = false;

type Params = { locale: Locale; slug: string };

/** Legal pages and the pages carried over from the old site share one layout and one route segment. */
const load = (slug: string, locale: Locale) => (isLegalSlug(slug) ? getLegalPage(slug, locale) : getPage(slug, locale));

export function generateStaticParams(): Params[] {
    const slugs = [...LEGAL_SLUGS, ...allPageSlugs().map((page) => page.slug)];
    return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { locale, slug } = await params;
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
