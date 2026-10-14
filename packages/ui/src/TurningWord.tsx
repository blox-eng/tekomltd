'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = { start: string; turns: string[]; intervalMs?: number };

export function TurningWord({ start, turns, intervalMs = 3400 }: Props) {
    const [state, setState] = useState<{ index: number; out: string | null; count: number }>({ index: 0, out: null, count: 0 });
    const ref = useRef<HTMLSpanElement>(null);
    const index = useRef(0);
    const turnsRef = useRef(turns);
    turnsRef.current = turns;
    const clearOut = useRef<ReturnType<typeof setTimeout>>(undefined);

    const turn = useCallback(() => {
        const all = turnsRef.current;
        const previous = index.current;
        index.current = (previous + 1) % all.length;
        setState((s) => ({ index: index.current, out: all[previous] ?? null, count: s.count + 1 }));
        clearTimeout(clearOut.current);
        clearOut.current = setTimeout(() => setState((s) => ({ ...s, out: null })), 450);
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let seen = false;
        let held = false;
        const observer = new IntersectionObserver((entries) => {
            seen = entries[0]?.isIntersecting ?? false;
        });
        observer.observe(el);
        const hold = () => (held = true);
        const release = () => (held = false);
        el.addEventListener('mouseenter', hold);
        el.addEventListener('mouseleave', release);
        const timer = setInterval(() => {
            if (seen && !held && !document.hidden) turn();
        }, intervalMs);

        return () => {
            clearInterval(timer);
            observer.disconnect();
            el.removeEventListener('mouseenter', hold);
            el.removeEventListener('mouseleave', release);
        };
    }, [intervalMs, turn]);

    useEffect(() => () => clearTimeout(clearOut.current), []);

    return (
        <>
            {start}{' '}
            <span
                ref={ref}
                className="turn"
                role="button"
                tabIndex={0}
                onClick={turn}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        turn();
                    }
                }}
            >
                <span key={state.count} className={state.count > 0 ? 'turn-in drop' : 'turn-in'}>
                    {turns[state.index]}
                </span>
                {state.out !== null && (
                    <span className="turn-out" aria-hidden="true">
                        {state.out}
                    </span>
                )}
            </span>
        </>
    );
}
