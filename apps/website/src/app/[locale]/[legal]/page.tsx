import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Markdown from 'react-markdown';
import { LOCALES, type Locale } from '@tekom/i18n';
import { getLegalPage } from '@/content/public-info';
import { LEGAL_SLUGS, type LegalSlug } from '@/content/paths';

export const dynamicParams = false;

type Params = { locale: Locale; legal: string };

const isLegalSlug = (s: string): s is LegalSlug => (LEGAL_SLUGS as readonly string[]).includes(s);

export function generateStaticParams(): Params[] {
    return LOCALES.flatMap((locale) => LEGAL_SLUGS.map((legal) => ({ locale, legal })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { locale, legal } = await params;
    const page = isLegalSlug(legal) ? getLegalPage(legal, locale) : null;
    return { title: page?.title };
}

export default async function LegalPage({ params }: { params: Promise<Params> }) {
    const { locale, legal } = await params;
    setRequestLocale(locale);
    const page = isLegalSlug(legal) ? getLegalPage(legal, locale) : null;
    if (!page) notFound();
    const t = await getTranslations({ locale });

    return (
        <article className="wrap page">
            <h1>{page.title}</h1>
            <p className="micro">
                <time dateTime={page.updated}>{page.updated}</time>
            </p>
            {page.fallback && <p className="lang-note">{t('note')}</p>}
            <div className="prose">
                <Markdown>{page.body}</Markdown>
            </div>
        </article>
    );
}
