'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { activeIndex } from './rail';
import styles from './rail.module.css';

type Props = { label: string; count: number; prevLabel: string; nextLabel: string; more: ReactNode; children: ReactNode };

const pad = (n: number) => String(n).padStart(2, '0');

export function Rail({ label, count, prevLabel, nextLabel, more, children }: Props) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);

    const measure = useCallback(() => {
        const track = trackRef.current;
        if (!track) return;
        const origin = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
        const lefts = [...track.children].map((slide) => slide.getBoundingClientRect().left - origin);
        setActive(activeIndex(lefts, track.scrollLeft + track.clientWidth >= track.scrollWidth - 2));
    }, []);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };
        track.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        measure();
        return () => {
            cancelAnimationFrame(frame);
            track.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [measure]);

    const step = (direction: 1 | -1) => {
        const track = trackRef.current;
        const target = track?.children[Math.min(Math.max(active + direction, 0), count - 1)];
        if (!track || !target) return;
        const origin = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
        track.scrollBy({ left: target.getBoundingClientRect().left - origin });
    };

    const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        step(e.key === 'ArrowRight' ? 1 : -1);
    };

    return (
        <section className={styles.rail} aria-label={label} onKeyDown={onKeyDown}>
            <div ref={trackRef} className={styles.track} data-rail-track>
                {children}
            </div>
            <div className={`wrap ${styles.bar}`}>
                <span className={`${styles.count} mono`} data-rail-count aria-live="polite">
                    {pad(active + 1)} / {pad(count)}
                </span>
                {more}
                <div className={styles.arrows}>
                    <button type="button" aria-label={prevLabel} aria-disabled={active === 0} onClick={() => step(-1)}>
                        ←
                    </button>
                    <button type="button" aria-label={nextLabel} aria-disabled={active === count - 1} onClick={() => step(1)}>
                        →
                    </button>
                </div>
            </div>
        </section>
    );
}
