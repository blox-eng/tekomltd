import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@tekom/i18n';
import { formatDate, formatSize } from '@/components/public/format';
import { PublicationList } from '@/components/public/PublicationList';
import styles from '@/components/public/public.module.css';
import { listPublications } from '@/content/public-info';
import { PUBLICATION_KINDS } from '@/content/schema';
import { getSettings } from '@/content/settings';
import { fallbackLocalesOf } from '@/lib/fallbacks';
import { pageMetadata } from '@/lib/seo';
import { siteShareImage } from '@/lib/share';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'publications' });
    const { pageTitles, pageDescriptions } = getSettings(locale as Locale);
    return pageMetadata({
        locale: locale as Locale,
        image: siteShareImage(locale as Locale),
        path: '/publications',
        title: pageTitles.publications ?? t('h'),
        description: pageDescriptions.publications,
        fallbackLocales: fallbackLocalesOf('/publications')
    });
}

export default async function PublicationsPage({ params }: Props) {
    const { locale } = (await params) as { locale: Locale };
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'publications' });
    const publications = listPublications(locale);
    const rows = publications.map((p) => ({
        key: p.file,
        kind: p.kind,
        title: p.title,
        href: p.file,
        date: p.publishedOn,
        dateLabel: formatDate(p.publishedOn, locale),
        info: `${p.extension.toUpperCase()} · ${formatSize(p.bytes)}`
    }));
    const kinds = PUBLICATION_KINDS.filter((kind) => publications.some((p) => p.kind === kind)).map((kind) => ({ kind, label: t(kind) }));

    return (
        <div className={`wrap ${styles.page}`}>
            <h1>{t('h')}</h1>
            <PublicationList rows={rows} kinds={kinds} allLabel={t('all')} classes={{ filters: styles.filters!, docs: styles.docs!, meta: styles.meta! }} />
        </div>
    );
}
