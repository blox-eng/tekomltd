import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@tekom/i18n';
import { ProjectTile } from '@/components/projects/ProjectTile';
import styles from '@/components/projects/projects.module.css';
import { listProjects } from '@/content/projects';
import { getSettings } from '@/content/settings';
import { pageMetadata } from '@/lib/seo';
import { siteShareImage } from '@/lib/share';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'nav' });
    return pageMetadata({
        locale: locale as Locale,
        image: siteShareImage(locale as Locale),
        path: '/projects',
        title: t('projects'),
        description: getSettings(locale as Locale).pageDescriptions.projects
    });
}

export default async function ProjectsPage({ params }: Props) {
    const { locale } = (await params) as { locale: Locale };
    setRequestLocale(locale);
    const [root, nav, map, scope] = await Promise.all([
        getTranslations({ locale }),
        getTranslations({ locale, namespace: 'nav' }),
        getTranslations({ locale, namespace: 'map' }),
        getTranslations({ locale, namespace: 'scope' })
    ]);
    const scopeLabels = Object.fromEntries((['full', 'restore', 'facade', 'interior', 'stone'] as const).map((key) => [key, scope(key)]));

    return (
        <div className="wrap">
            <section className={styles.intro}>
                <h1>{nav('projects')}</h1>
                <p>{map('p')}</p>
            </section>
            <ul className={styles.grid}>
                {listProjects(locale).map((project, index) => (
                    <ProjectTile key={project.slug} project={project} scopeLabels={scopeLabels} note={root('note')} eager={index < 3} />
                ))}
            </ul>
        </div>
    );
}
