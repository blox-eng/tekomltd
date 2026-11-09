import type { CSSProperties } from 'react';
import { Link } from '@/i18n/navigation';
import type { timeline } from './age';
import styles from './projects.module.css';

type Props = { line: NonNullable<ReturnType<typeof timeline>>; label: string; today: string; sum: string };

export function Timeline({ line, label, today, sum }: Props) {
    const rows = Math.max(...line.ticks.map((tick) => tick.stack)) + 1;

    return (
        <figure className={styles.timeline} aria-label={label}>
            <ol className={styles.track} style={{ '--rows': rows } as CSSProperties}>
                {line.ticks.map((tick) => (
                    <li
                        key={tick.slug}
                        style={{ '--at': `${tick.at}%`, '--stack': tick.stack } as CSSProperties}
                        data-side={tick.at < 33 ? 'start' : tick.at > 66 ? 'end' : 'middle'}
                    >
                        <Link href={`/projects/${tick.slug}`} aria-label={`${tick.title}, ${tick.year}`}>
                            <span className={styles.tip} aria-hidden="true">
                                {tick.title} · {tick.year}
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>
            <div className={`${styles.axis} mono`} aria-hidden="true">
                <span>{line.first}</span>
                <span>{today}</span>
            </div>
            <figcaption className="mono">{sum}</figcaption>
        </figure>
    );
}
