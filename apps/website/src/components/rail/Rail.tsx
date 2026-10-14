'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { activeIndex, recenter } from './rail';
import styles from './rail.module.css';

type Props = { label: string; count: number; prevLabel: string; nextLabel: string; more: ReactNode; children: ReactNode };

const pad = (n: number) => String(n).padStart(2, '0');

/** How long scrolling must stay quiet before a looped rail jumps back to its middle copy. */
const IDLE_MS = 120;

export function Rail({ label, count, prevLabel, nextLabel, more, children }: Props) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    // The page HTML holds each slide once; the browser adds a copy on each side to loop.
    const [looping, setLooping] = useState(false);

    useEffect(() => setLooping(count > 1), [count]);

    const slides = useCallback(() => [...(trackRef.current?.querySelectorAll(':scope > [data-rail-copy] > *') ?? [])], []);

    const lefts = useCallback(() => {
        const track = trackRef.current!;
        const origin = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
        return slides().map((slide) => slide.getBoundingClientRect().left - origin);
    }, [slides]);

    /** Width of one copy of the slides: the distance from a slide to the same slide in the next copy. */
    const loopWidth = useCallback(() => {
        const all = slides();
        return looping && all[0] && all[count] ? all[count].getBoundingClientRect().left - all[0].getBoundingClientRect().left : 0;
    }, [slides, looping, count]);

    const measure = useCallback(() => {
        const track = trackRef.current;
        if (!track) return;
        const atEnd = !looping && track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
        setActive(activeIndex(lefts(), atEnd) % count);
    }, [lefts, looping, count]);

    const jumpTo = (left: number) => trackRef.current?.scrollTo({ left, behavior: 'instant' });

    // The copies went in before the real slides: keep showing the same slide, now in the middle copy.
    useLayoutEffect(() => {
        const track = trackRef.current;
        if (looping && track) jumpTo(track.scrollLeft + loopWidth());
    }, [looping, loopWidth]);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        let frame = 0;
        let idle: ReturnType<typeof setTimeout> | undefined;
        let touching = false;
        // Never jump mid-scroll or under a finger: it would cancel a smooth move or a swipe's momentum.
        const settle = () => {
            clearTimeout(idle);
            idle = setTimeout(() => {
                if (touching) return;
                const next = recenter(track.scrollLeft, loopWidth());
                if (next !== track.scrollLeft) jumpTo(next);
            }, IDLE_MS);
        };
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
            if (looping) settle();
        };
        const onTouchStart = () => {
            touching = true;
            clearTimeout(idle);
        };
        const onTouchEnd = (e: TouchEvent) => {
            touching = e.touches.length > 0;
            if (looping) settle();
        };
        track.addEventListener('scroll', onScroll, { passive: true });
        track.addEventListener('touchstart', onTouchStart, { passive: true });
        track.addEventListener('touchend', onTouchEnd, { passive: true });
        track.addEventListener('touchcancel', onTouchEnd, { passive: true });
        window.addEventListener('resize', onScroll);
        measure();
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(idle);
            track.removeEventListener('scroll', onScroll);
            track.removeEventListener('touchstart', onTouchStart);
            track.removeEventListener('touchend', onTouchEnd);
            track.removeEventListener('touchcancel', onTouchEnd);
            window.removeEventListener('resize', onScroll);
        };
    }, [measure, looping, loopWidth]);

    const step = (direction: 1 | -1) => {
        const track = trackRef.current;
        if (!track) return;
        const edges = lefts();
        const current = activeIndex(edges, false);
        const target = looping ? current + direction : Math.min(Math.max(current + direction, 0), count - 1);
        const left = edges[target];
        if (left !== undefined) track.scrollBy({ left });
    };

    const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        step(e.key === 'ArrowRight' ? 1 : -1);
    };

    const clone = (key: 'before' | 'after') => (
        <div className={styles.copy} data-rail-copy={key} inert aria-hidden>
            {children}
        </div>
    );

    return (
        <section className={styles.rail} aria-label={label} onKeyDown={onKeyDown}>
            <div ref={trackRef} className={styles.track} data-rail-track>
                {looping && clone('before')}
                <div className={styles.copy} data-rail-copy="real">
                    {children}
                </div>
                {looping && clone('after')}
            </div>
            <div className={`wrap ${styles.bar}`}>
                <span className={`${styles.count} mono`} data-rail-count aria-live="polite">
                    {pad(active + 1)} / {pad(count)}
                </span>
                {more}
                <div className={styles.arrows}>
                    <button type="button" aria-label={prevLabel} aria-disabled={!looping && active === 0} onClick={() => step(-1)}>
                        ←
                    </button>
                    <button type="button" aria-label={nextLabel} aria-disabled={!looping && active === count - 1} onClick={() => step(1)}>
                        →
                    </button>
                </div>
            </div>
        </section>
    );
}
