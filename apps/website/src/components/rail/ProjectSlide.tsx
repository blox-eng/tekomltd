import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { ProjectCard } from '@/content/cards';
import styles from './rail.module.css';

type Props = { project: ProjectCard; scopeLabels: Record<string, string>; first: boolean };

export function ProjectSlide({ project, scopeLabels, first }: Props) {
    const { cover } = project;
    const where = [project.place, project.year].filter(Boolean).join(' · ');

    return (
        <Link href={`/projects/${project.slug}`} className={`${styles.slide} ${styles.project}${project.wide ? ` ${styles.wide}` : ''}`}>
            <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 640px) 100vw, 60vh" priority={first} />
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
