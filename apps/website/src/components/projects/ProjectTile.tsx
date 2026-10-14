import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { ProjectCard } from '@/content/cards';
import styles from './projects.module.css';

type Props = { project: ProjectCard; scopeLabels: Record<string, string>; note: string };

export function ProjectTile({ project, scopeLabels, note }: Props) {
    const { cover } = project;
    const where = [project.place, project.year].filter(Boolean).join(' · ');

    return (
        <li>
            <Link href={`/projects/${project.slug}`} className={styles.tile}>
                <div className={styles.ph}>
                    <Image
                        src={cover.src}
                        alt={cover.alt}
                        width={cover.width}
                        height={cover.height}
                        sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 33vw"
                    />
                </div>
                <div className={styles.scope}>
                    {project.scopes.map((scope) => (
                        <span key={scope}>{scopeLabels[scope]}</span>
                    ))}
                </div>
                <h3 lang={project.titleFallback ? 'bg' : undefined}>{project.title}</h3>
                {project.titleFallback && <span className={styles.note}>{note}</span>}
                <span className={`${styles.where} mono`}>{where}</span>
            </Link>
        </li>
    );
}
