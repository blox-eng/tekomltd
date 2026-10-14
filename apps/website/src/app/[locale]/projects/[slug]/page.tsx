import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LOCALES, type Locale } from '@tekom/i18n';
import { fallbackNote, projectFacts } from '@/components/projects/facts';
import styles from '@/components/projects/projects.module.css';
import { allProjectSlugs, getProject } from '@/content/projects';
import { JsonLd } from '@/components/JsonLd';
import { Link } from '@/i18n/navigation';
import { breadcrumbJsonLd, projectJsonLd } from '@/lib/jsonld';
import { fallbackLocalesOf } from '@/lib/fallbacks';
import { describe, pageMetadata } from '@/lib/seo';

export const dynamicParams = false;

type Params = { locale: Locale; slug: string };

export function generateStaticParams(): Params[] {
    return LOCALES.flatMap((locale) => allProjectSlugs().map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { locale, slug } = await params;
    const project = getProject(slug, locale);
    if (!project) return {};
    return pageMetadata({
        locale,
        path: `/projects/${slug}`,
        title: project.metaTitle ?? project.title,
        description: project.metaDescription ?? (project.summary ? describe(project.summary) : null),
        image: project.ogImage ?? project.cover,
        fallbackLocales: fallbackLocalesOf(`/projects/${slug}`)
    });
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const project = getProject(slug, locale);
    if (!project) notFound();
    const [root, nav, t, scope] = await Promise.all([
        getTranslations({ locale }),
        getTranslations({ locale, namespace: 'nav' }),
        getTranslations({ locale, namespace: 'project' }),
        getTranslations({ locale, namespace: 'scope' })
    ]);
    const scopeLabels = Object.fromEntries(project.scopes.map((key) => [key, scope(key)]));
    const facts = projectFacts(project, { address: t('address'), completed: t('completed'), area: t('area'), scope: t('scope') }, scopeLabels, locale);
    const note = fallbackNote(project, { note: root('note'), inBulgarian: t('inBulgarian') });
    const { cover } = project;
    const gallery = project.images.filter((image) => image.src !== cover.src);
    const position = String(project.position).padStart(2, '0');

    return (
        <div className={`wrap ${styles.detail}`}>
            <JsonLd data={projectJsonLd(project, locale)} />
            <JsonLd
                data={breadcrumbJsonLd(
                    [
                        { name: 'Tekom', path: '/' },
                        { name: nav('projects'), path: '/projects' },
                        { name: project.title, path: `/projects/${slug}` }
                    ],
                    locale
                )}
            />
            <Link href="/projects" className={styles.back}>
                {t('back')}
            </Link>
            <div className={styles.dhead}>
                <div className={styles.dhero}>
                    <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 860px) 100vw, 60vw" priority />
                </div>
                <div>
                    <div className={styles.scope}>
                        {project.scopes.map((key) => (
                            <span key={key}>{scopeLabels[key]}</span>
                        ))}
                    </div>
                    <h1 lang={project.titleFallback ? 'bg' : undefined}>{project.title}</h1>
                    {project.summary && <p lang={project.summaryFallback ? 'bg' : undefined}>{project.summary}</p>}
                    {note && <p className={`lang-note ${styles.note}`}>{note}</p>}
                    <dl className="facts">
                        {facts.map(({ key, label, value }) => (
                            <div key={key} style={{ display: 'contents' }}>
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className={styles.cta}>
                        <Link href="/contact" className="btn">
                            {t('cta')}
                            <span className="ar" aria-hidden="true">
                                →
                            </span>
                        </Link>
                    </p>
                </div>
            </div>
            {gallery.length > 0 && (
                <ul className={styles.gallery}>
                    {gallery.map((image) => (
                        <li key={image.src}>
                            <Image
                                src={image.src}
                                alt={image.alt}
                                width={image.width}
                                height={image.height}
                                sizes="(max-width: 520px) 100vw, (max-width: 860px) 50vw, 33vw"
                                loading="lazy"
                            />
                        </li>
                    ))}
                </ul>
            )}
            <div className={styles.next}>
                <span className="mono">
                    {position} / {String(project.total).padStart(2, '0')}
                </span>
                <Link href={`/projects/${project.next.slug}`} className={styles.nextLink}>
                    {t('next')} {project.next.title}
                    <span className="ar" aria-hidden="true">
                        →
                    </span>
                </Link>
            </div>
        </div>
    );
}
