'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './projects.module.css';

type Props = { label: string; items: { id: string; label: string }[] };

/** The sticky year column of /projects. Plain anchor links; the script only marks the year in view. */
export function YearIndex({ label, items }: Props) {
    const [current, setCurrent] = useState(items[0]?.id);
    const list = useRef<HTMLOListElement>(null);

    useEffect(() => {
        const header = document.querySelector<HTMLElement>('.site-header');
        const setHeader = () => document.documentElement.style.setProperty('--header-h', `${header?.offsetHeight ?? 0}px`);
        setHeader();
        const resize = new ResizeObserver(setHeader);
        if (header) resize.observe(header);

        // A group is "in view" once its top passes just under the sticky header.
        const seen = new IntersectionObserver(
            (entries) => {
                const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (top) setCurrent(top.target.id);
            },
            { rootMargin: '-20% 0px -70% 0px' }
        );
        for (const { id } of items) {
            const group = document.getElementById(id);
            if (group) seen.observe(group);
        }
        return () => {
            resize.disconnect();
            seen.disconnect();
        };
    }, [items]);

    // On a phone the years are one sideways row: keep the current year in sight.
    useEffect(() => {
        list.current?.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, [current]);

    return (
        <nav aria-label={label} className={styles.yearIndex}>
            <ol ref={list}>
                {items.map(({ id, label: year }) => (
                    <li key={id}>
                        <a href={`#${id}`} aria-current={id === current ? 'true' : undefined} onClick={() => setCurrent(id)}>
                            {year}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
