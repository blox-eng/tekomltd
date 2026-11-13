'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { YearIndex } from '@/components/projects/YearIndex';
import styles from './sales.module.css';

type Floor = { id: string; name: string; free: string; plan: ReactNode };
type Props = { view: 'switch' | 'scroll'; label: string; floors: Floor[]; /** The floor a switch view opens on without a hash. */ initial: string };

/**
 * `switch`: the elevation picks one floor; the URL hash names it, so a link opens that floor.
 * `scroll`: every floor in a row of snapping sections with a sticky floor column.
 * Without JavaScript both show every floor.
 */
export function Floors({ view, label, floors, initial }: Props) {
    const [current, setCurrent] = useState<string | null>(null);

    useEffect(() => {
        if (view !== 'switch') return;
        const pick = () => {
            const id = decodeURIComponent(window.location.hash.slice(1));
            setCurrent(floors.some((f) => f.id === id) ? id : initial);
        };
        pick();
        window.addEventListener('hashchange', pick);
        return () => window.removeEventListener('hashchange', pick);
    }, [view, floors, initial]);

    if (view === 'scroll')
        return (
            <div className={styles.byFloor}>
                <YearIndex label={label} items={floors.map(({ id, name }) => ({ id, label: name }))} />
                <div>
                    {floors.map((f) => (
                        <section key={f.id} id={f.id} className={styles.floorScroll} aria-label={f.name}>
                            <h3 className="micro">
                                {f.name} · {f.free}
                            </h3>
                            {f.plan}
                        </section>
                    ))}
                </div>
            </div>
        );

    return (
        <div className={styles.floors}>
            <nav aria-label={label} className={styles.elevation}>
                <ol>
                    {floors.map((f) => (
                        <li key={f.id}>
                            <a href={`#${f.id}`} aria-current={f.id === current ? 'true' : undefined}>
                                <span>{f.name}</span>
                                <span className={styles.free}>{f.free}</span>
                            </a>
                        </li>
                    ))}
                </ol>
            </nav>
            <div>
                {floors.map((f) => (
                    <section key={f.id} id={f.id} className={styles.floor} hidden={current !== null && f.id !== current} aria-label={f.name}>
                        {f.plan}
                    </section>
                ))}
            </div>
        </div>
    );
}
