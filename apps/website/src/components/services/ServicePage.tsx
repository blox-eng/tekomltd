import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@tekom/i18n';
import { JsonLd } from '@/components/JsonLd';
import home from '@/components/home/home.module.css';
import { ProjectTile } from '@/components/projects/ProjectTile';
import projects from '@/components/projects/projects.module.css';
import { SCOPES } from '@/content/schema';
import type { ServiceDetail, ServiceLink } from '@/content/services';
import { Link } from '@/i18n/navigation';
import { breadcrumbJsonLd, serviceJsonLd } from '@/lib/jsonld';
import { brandName } from '@/lib/seo';
import styles from './services.module.css';

type Props = { service: ServiceDetail; others: ServiceLink[]; locale: Locale };

export async function ServicePage({ service, others, locale }: Props) {
    const [t, root, scope] = await Promise.all([
        getTranslations({ locale, namespace: 'service' }),
        getTranslations({ locale }),
        getTranslations({ locale, namespace: 'scope' })
    ]);
    const scopeLabels = Object.fromEntries(SCOPES.map((key) => [key, scope(key)]));
    const { cover } = service.cover;

    return (
        <article className={`wrap ${styles.page}`}>
            <JsonLd data={serviceJsonLd(service, locale)} />
            <JsonLd
                data={breadcrumbJsonLd(
                    [
                        { name: brandName(locale), path: '/' },
                        { name: service.name, path: `/${service.slug}` }
                    ],
                    locale
                )}
            />
            <header className={projects.dhead}>
                <Link href={`/projects/${service.cover.slug}`} className={projects.dhero} aria-label={service.cover.title}>
                    <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 860px) 100vw, 60vw" priority />
                </Link>
                <div>
                    <p className="micro">{t('label')}</p>
                    <h1 className={styles.h1}>{service.h1}</h1>
                    <p className={styles.intro}>{service.intro}</p>
                    <Link href="/contact" className={projects.nextLink}>
                        {service.cta.button}{' '}
                        <span className="ar" aria-hidden="true">
                            →
                        </span>
                    </Link>
                </div>
            </header>

            <section className={styles.split}>
                <h2>{t('benefits')}</h2>
                <ul className={home.risks}>
                    {service.benefits.map((b) => (
                        <li key={b.title}>
                            <b>{b.title}</b>
                            <span>{b.body}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className={styles.split}>
                <h2>{service.stepsTitle}</h2>
                <ol className={styles.steps}>
                    {service.steps.map((step, i) => (
                        <li key={step.title}>
                            <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                            <div>
                                <h3>{step.title}</h3>
                                <p>{step.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            {service.explainers.map((e) => (
                <section key={e.title} className={styles.split}>
                    <h2>{e.title}</h2>
                    <p className={styles.text}>{e.body}</p>
                </section>
            ))}

            <section className={styles.split}>
                <h2>{service.materialsTitle}</h2>
                <p className={styles.text}>{service.materials}</p>
            </section>

            <section className={styles.section}>
                <div className="sh">
                    <h2>{service.projectsTitle}</h2>
                </div>
                <ul className={projects.grid}>
                    {service.projects.map((project, index) => (
                        <ProjectTile key={project.slug} project={project} scopeLabels={scopeLabels} note={root('note')} eager={index < 3} />
                    ))}
                </ul>
                <table className={styles.table}>
                    <caption className="micro">{t('table')}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{t('project')}</th>
                            <th scope="col">{t('year')}</th>
                            <th scope="col">{t('place')}</th>
                            <th scope="col" className={styles.wide}>
                                {t('scope')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {service.projects.map((project) => (
                            <tr key={project.slug}>
                                <td>
                                    <Link href={`/projects/${project.slug}`}>{project.title}</Link>
                                </td>
                                <td className="mono">{project.year ?? '—'}</td>
                                <td>{project.place}</td>
                                <td className={styles.wide}>{project.scopes.map((key) => scopeLabels[key]).join(', ')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {service.faq.length > 0 && (
                <section className={styles.split}>
                    <h2>{t('faq')}</h2>
                    <dl className={styles.faq}>
                        {service.faq.map(({ q, a }) => (
                            <div key={q}>
                                <dt>{q}</dt>
                                <dd>{a}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}

            <section className={styles.cta}>
                <h2>{service.cta.title}</h2>
                <p>{service.cta.body}</p>
                <Link href="/contact" className="btn">
                    {service.cta.button}
                    <span className="ar" aria-hidden="true">
                        →
                    </span>
                </Link>
            </section>

            {others.length > 0 && (
                <nav className={styles.more} aria-label={t('more')}>
                    <span className="micro">{t('more')}</span>
                    {others.map(({ slug, name }) => (
                        <Link key={slug} href={`/${slug}`} className={projects.nextLink}>
                            {name}{' '}
                            <span className="ar" aria-hidden="true">
                                →
                            </span>
                        </Link>
                    ))}
                </nav>
            )}
        </article>
    );
}
