import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@tekom/i18n';
import { timeline } from '@/components/projects/age';
import { ProjectTile } from '@/components/projects/ProjectTile';
import { Timeline } from '@/components/projects/Timeline';
import styles from '@/components/projects/projects.module.css';
import { listProjects } from '@/content/projects';
import { getSettings } from '@/content/settings';
import { pageMetadata } from '@/lib/seo';
import { siteShareImage } from '@/lib/share';

// Ages count from today, so the page is rebuilt daily and rolls over on 1 January without a deploy.
export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'nav' });
    const { pageTitles, pageDescriptions } = getSettings(locale as Locale);
    return pageMetadata({
        locale: locale as Locale,
        image: siteShareImage(locale as Locale),
        path: '/projects',
        title: pageTitles.projects ?? t('projects'),
        description: pageDescriptions.projects
    });
}

export default async function ProjectsPage({ params }: Props) {
    const { locale } = (await params) as { locale: Locale };
    setRequestLocale(locale);
    const [root, nav, map, scope, t] = await Promise.all([
        getTranslations({ locale }),
        getTranslations({ locale, namespace: 'nav' }),
        getTranslations({ locale, namespace: 'map' }),
        getTranslations({ locale, namespace: 'scope' }),
        getTranslations({ locale, namespace: 'project' })
    ]);
    const scopeLabels = Object.fromEntries((['full', 'restore', 'facade', 'interior', 'stone'] as const).map((key) => [key, scope(key)]));
    const projects = listProjects(locale);
    const now = new Date();
    const line = timeline(projects, now);

    return (
        <div className="wrap">
            <section className={styles.intro}>
                <h1>{nav('projects')}</h1>
                <p>{map('p')}</p>
            </section>
            {line && <Timeline line={line} label={t('timeline')} today={t('today')} sum={t('timelineSum', { years: line.years, count: line.ticks.length })} />}
            <ul className={styles.grid}>
                {projects.map((project, index) => (
                    <ProjectTile key={project.slug} project={project} scopeLabels={scopeLabels} note={root('note')} eager={index < 3} />
                ))}
            </ul>
        </div>
    );
}
