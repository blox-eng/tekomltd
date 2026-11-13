import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LOCALES, type Locale } from '@tekom/i18n';
import { JsonLd } from '@/components/JsonLd';
import { FloorPlan } from '@/components/sales/FloorPlan';
import { floorId } from '@/components/sales/Sales';
import { UnitPlan } from '@/components/sales/UnitPlan';
import { UnitStatus } from '@/components/sales/UnitStatus';
import { area, details, floorName, labelOf } from '@/components/sales/words';
import styles from '@/components/sales/sales.module.css';
import projectStyles from '@/components/projects/projects.module.css';
import { enquiryHref } from '@/content/enquiry';
import { allUnitSlugs, getProject } from '@/content/projects';
import { Link } from '@/i18n/navigation';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { fallbackLocalesOf } from '@/lib/fallbacks';
import { pageMetadata, urlFor } from '@/lib/seo';
import { projectPhoto, shareImage } from '@/lib/share';

// Unknown or upper-case codes render on demand and call notFound(); see the project page for why this is not `false`.
export const dynamicParams = true;

type Params = { locale: Locale; slug: string; unit: string };

export function generateStaticParams(): Params[] {
    return LOCALES.flatMap((locale) => allUnitSlugs().map(({ slug, unit }) => ({ locale, slug, unit })));
}

function find(slug: string, unitSlug: string, locale: Locale) {
    const project = getProject(slug, locale);
    const unit = project?.sales?.units.find((u) => u.slug === unitSlug);
    return project && project.sales && unit ? { project, sales: project.sales, unit } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { locale, slug, unit: unitSlug } = await params;
    const found = find(slug, unitSlug, locale);
    if (!found) return {};
    const { project, unit } = found;
    const t = await getTranslations({ locale, namespace: 'sales' });
    const label = labelOf(unit, t);
    return pageMetadata({
        locale,
        path: `/projects/${slug}/${unit.slug}`,
        title: `${label} · ${project.title}`,
        description: t('unit.meta', {
            unit: label,
            details: details(unit, t, locale),
            status: t(`status.${unit.status}`),
            project: project.title,
            place: project.place
        }),
        image: shareImage(projectPhoto(project), locale),
        fallbackLocales: fallbackLocalesOf(`/projects/${slug}`)
    });
}

export default async function UnitPage({ params }: { params: Promise<Params> }) {
    const { locale, slug, unit: unitSlug } = await params;
    setRequestLocale(locale);
    const found = find(slug, unitSlug, locale);
    if (!found) notFound();
    const { project, sales, unit } = found;
    const [t, nav] = await Promise.all([getTranslations({ locale, namespace: 'sales' }), getTranslations({ locale, namespace: 'nav' })]);
    const label = labelOf(unit, t);
    const home = sales.floors.find((f) => f.key === unit.floors[0]!.key)!;
    const floors = unit.floors.map((f) => sales.floors.find((s) => s.key === f.key)!);
    const index = home.units.findIndex((u) => u.code === unit.code);
    const prev = home.units[index - 1];
    const next = home.units[index + 1];
    const path = `/projects/${slug}/${unit.slug}`;
    const ask =
        unit.status === 'sold'
            ? null
            : enquiryHref({
                  email: sales.email,
                  subjectPrefix: t('unit.subject'),
                  project: project.title,
                  unit: label,
                  floor: home.label ?? t('floorShort', { key: home.key }),
                  url: urlFor(path, locale),
                  greeting: t('unit.greeting', { unit: label })
              });
    const fact = (key: string, value: string) => (
        <>
            <dt>{t(`unit.facts.${key}`)}</dt>
            <dd>{value}</dd>
        </>
    );

    return (
        <div className={`wrap ${projectStyles.detail}`}>
            <JsonLd
                data={breadcrumbJsonLd(
                    [
                        { name: 'Tekom', path: '/' },
                        { name: nav('projects'), path: '/projects' },
                        { name: project.title, path: `/projects/${slug}` },
                        { name: label, path }
                    ],
                    locale
                )}
            />
            <Link href={`/projects/${slug}#${floorId(home.key)}`} className={projectStyles.back}>
                ← {t('unit.back', { floor: floorName(home, t) })}
            </Link>
            <div className={styles.unit}>
                <div>
                    {floors.map((f) => (
                        <UnitPlan key={f.key} floor={f} code={unit.code} caption={floors.length > 1} />
                    ))}
                </div>
                <div>
                    <h1>{label}</h1>
                    <p className={styles.of}>
                        <Link href={`/projects/${slug}`}>{project.title}</Link>, {project.place}
                    </p>
                    <div data-unit-facts>
                        <div className={styles.areas}>
                            <div>
                                <span>{t('unit.facts.total')}</span>
                                <b>{area(unit.area.total, locale)} m²</b>
                            </div>
                            <div>
                                <span>{t('unit.facts.net')}</span>
                                <b>{area(unit.area.net, locale)} m²</b>
                            </div>
                            <div className={styles.built}>
                                <span>{t('unit.facts.built')}</span>
                                <b>{area(unit.area.built, locale)} m²</b>
                            </div>
                        </div>
                        <dl className="facts">
                            {fact('type', t(`unit.typeName.${unit.type}`))}
                            {fact('floor', floors.map((f) => floorName(f, t)).join(', '))}
                            {unit.rooms !== null && fact('rooms', String(unit.rooms))}
                            {unit.terrace !== null && fact('terrace', `${area(unit.terrace, locale)} m²`)}
                            {unit.orientation.length > 0 && fact('orientation', unit.orientation.map((d) => t(`unit.dir.${d}`)).join(', '))}
                            <dt>{t('unit.facts.status')}</dt>
                            <dd>
                                <UnitStatus status={unit.status} />
                            </dd>
                        </dl>
                        {unit.note && (
                            <p className={styles.of} lang={unit.noteFallback ? 'bg' : undefined}>
                                {unit.note}
                            </p>
                        )}
                    </div>
                    {ask ? (
                        <p className={styles.ask}>
                            <a href={ask} className="btn">
                                {unit.status === 'free' ? t('unit.cta.free', { unit: label }) : t(`unit.cta.${unit.status}`)}
                                <span className="ar" aria-hidden="true">
                                    →
                                </span>
                            </a>
                        </p>
                    ) : (
                        <>
                            <p className={styles.soldNote}>{t('unit.sold')}</p>
                            <Link href={`/projects/${slug}#apartamenti`} className={projectStyles.nextLink}>
                                {t('unit.seeFree')}
                            </Link>
                        </>
                    )}
                    <div className={styles.where}>
                        <span className="micro">{t('unit.where')}</span>
                        <FloorPlan slug={slug} floor={home} current={unit.code} small />
                    </div>
                    {(prev || next) && (
                        <nav className={styles.steps} aria-label={t('unit.onFloor')}>
                            {prev ? (
                                <Link href={`/projects/${slug}/${prev.slug}`}>
                                    ← {t('unit.prev')}: {labelOf(prev, t)}
                                </Link>
                            ) : (
                                <span />
                            )}
                            {next && (
                                <Link href={`/projects/${slug}/${next.slug}`}>
                                    {t('unit.next')}: {labelOf(next, t)} →
                                </Link>
                            )}
                        </nav>
                    )}
                </div>
            </div>
        </div>
    );
}
