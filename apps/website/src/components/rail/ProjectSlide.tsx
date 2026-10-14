import { Link } from '@/i18n/navigation';
import { SquareImage } from '@/components/projects/SquareImage';
import type { ProjectCard } from '@/content/cards';
import styles from './rail.module.css';

type Props = { project: ProjectCard; scopeLabels: Record<string, string>; first: boolean };

export function ProjectSlide({ project, scopeLabels, first }: Props) {
    const { cover } = project;
    const where = [project.place, project.year].filter(Boolean).join(' · ');

    return (
        <Link href={`/projects/${project.slug}`} className={`${styles.slide} ${styles.project}`}>
            <SquareImage image={cover} sizes="(max-width: 640px) 100vw, min(880px, 100vh)" eager={first} />
            <div className={styles.cap}>
                <div className={styles.scope}>
                    {project.scopes.map((scope) => (
                        <span key={scope}>{scopeLabels[scope]}</span>
                    ))}
                </div>
                <h3>{project.title}</h3>
                <span className={`${styles.where} mono`}>{where}</span>
            </div>
        </Link>
    );
}
