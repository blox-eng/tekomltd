import type { Metadata } from 'next';
import Markdown from 'react-markdown';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import emblem from '@tekom/ui/assets/eu-emblem.svg';
import type { Locale } from '@tekom/i18n';
import { formatDate, formatEur, formatSize } from '@/components/public/format';
import styles from '@/components/public/public.module.css';
import { listProgrammes, listPublications } from '@/content/public-info';
import { fallbackLocalesOf } from '@/lib/fallbacks';
import { pageMetadata } from '@/lib/seo';
import { siteShareImage } from '@/lib/share';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'eu' });
    return pageMetadata({
        locale: locale as Locale,
        image: siteShareImage(locale as Locale),
        path: '/eu-programmes',
        title: t('h'),
        description: t('p'),
        fallbackLocales: fallbackLocalesOf('/eu-programmes')
    });
}

export default async function EuProgrammesPage({ params }: Props) {
    const { locale } = (await params) as { locale: Locale };
    setRequestLocale(locale);
    const [root, t] = await Promise.all([getTranslations({ locale }), getTranslations({ locale, namespace: 'eu' })]);
    const publications = listPublications(locale);

    return (
        <div className={`wrap ${styles.page}`}>
            <h1>{t('h')}</h1>
            <p className="lead">{t('p')}</p>
            {listProgrammes(locale).map((programme) => {
                const documents = publications.filter((p) => p.programme === programme.code);
                const period = [programme.periodStart, programme.periodEnd].filter((d): d is string => d !== null).map((d) => formatDate(d, locale));
                const figures = [
                    programme.totalBudgetEur !== null && { label: t('totalBudget'), value: formatEur(programme.totalBudgetEur, locale) },
                    programme.euContributionEur !== null && { label: t('euContribution'), value: formatEur(programme.euContributionEur, locale) },
                    period.length > 0 && { label: t('period'), value: period.join(' – ') }
                ].filter((row) => row !== false);

                return (
                    <section key={programme.code} className={styles.programme} aria-labelledby={`programme-${programme.code}`}>
                        <div className={styles.badge}>
                            <img src={emblem.src} width={60} height={40} alt={t('emblemAlt')} />
                            <strong>{t('cofunded')}</strong>
                        </div>
                        <div>
                            <h2 id={`programme-${programme.code}`} lang={programme.titleFallback ? 'bg' : undefined}>
                                {programme.title}
                            </h2>
                            <p className="mono">{programme.code}</p>
                        </div>
                        {programme.logo && (
                            <img
                                className={styles.logo}
                                src={programme.logo.src}
                                width={programme.logo.width}
                                height={programme.logo.height}
                                alt={programme.title}
                            />
                        )}
                        {(programme.fallback || programme.titleFallback) && <p className="lang-note">{root('note')}</p>}
                        <div className={styles.block}>
                            <h3>{t('summary')}</h3>
                            <div className="prose" lang={programme.fallback ? 'bg' : undefined}>
                                <Markdown>{programme.summary}</Markdown>
                            </div>
                        </div>
                        <div className={styles.block}>
                            <h3>{t('objectives')}</h3>
                            <div className="prose" lang={programme.fallback ? 'bg' : undefined}>
                                <Markdown>{programme.objectives}</Markdown>
                            </div>
                        </div>
                        <div className={styles.block}>
                            <h3>{t('results')}</h3>
                            <div className="prose" lang={programme.fallback ? 'bg' : undefined}>
                                <Markdown>{programme.results}</Markdown>
                            </div>
                        </div>
                        {figures.length > 0 && (
                            <dl className="facts">
                                {figures.map(({ label, value }) => (
                                    <div key={label} style={{ display: 'contents' }}>
                                        <dt>{label}</dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                        {documents.length > 0 && (
                            <div className={styles.block}>
                                <h3>{t('notices')}</h3>
                                <ul className={styles.docs}>
                                    {documents.map((doc) => (
                                        <li key={doc.file}>
                                            <a href={doc.file}>{doc.title}</a>
                                            <span className={`${styles.meta} mono`}>
                                                <time dateTime={doc.publishedOn}>{formatDate(doc.publishedOn, locale)}</time> · {doc.extension.toUpperCase()} ·{' '}
                                                {formatSize(doc.bytes)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
