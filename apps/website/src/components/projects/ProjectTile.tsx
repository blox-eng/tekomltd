import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { ProjectCard } from '@/content/cards';
import { yearsStood } from './age';
import { InProgressLabel } from './Progress';
import { SquareImage } from './SquareImage';
import styles from './projects.module.css';

type Props = { project: ProjectCard; scopeLabels: Record<string, string>; note: string; eager: boolean };

export function ProjectTile({ project, scopeLabels, note, eager }: Props) {
    const t = useTranslations('project');
    const { cover } = project;
    const age = project.year === null ? null : t('ageShort', { n: yearsStood(project.year, new Date()) });
    const where = [project.place, project.year, age].filter(Boolean).join(' · ');

    return (
        <li>
            <Link href={`/projects/${project.slug}`} className={styles.tile}>
                <div className={styles.ph}>
                    <SquareImage image={cover} sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 420px" eager={eager} />
                </div>
                <div className={styles.scope}>
                    {project.scopes.map((scope) => (
                        <span key={scope}>{scopeLabels[scope]}</span>
                    ))}
                </div>
                <h3 lang={project.titleFallback ? 'bg' : undefined}>{project.title}</h3>
                {project.titleFallback && <span className={styles.note}>{note}</span>}
                <span className={`${styles.where} mono`}>
                    {where}
                    {project.inProgress && (
                        <>
                            {' · '}
                            <InProgressLabel />
                        </>
                    )}
                </span>
            </Link>
        </li>
    );
}
