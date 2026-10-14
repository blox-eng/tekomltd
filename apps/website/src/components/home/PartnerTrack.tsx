'use client';

import { useRef, type ReactNode } from 'react';
import styles from './home.module.css';

type Props = { label: string; prevLabel: string; nextLabel: string; children: ReactNode };

export function PartnerTrack({ label, prevLabel, nextLabel, children }: Props) {
    const track = useRef<HTMLDivElement>(null);
    const step = (direction: 1 | -1) => {
        const el = track.current;
        const card = el?.firstElementChild;
        if (el && card) el.scrollBy({ left: direction * (card.getBoundingClientRect().width + 12) });
    };

    return (
        <>
            <div ref={track} className={styles.ptrack}>
                {children}
            </div>
            <div className={styles.bar}>
                <span className="micro">{label}</span>
                <div className={styles.arrows}>
                    <button type="button" aria-label={prevLabel} onClick={() => step(-1)}>
                        ←
                    </button>
                    <button type="button" aria-label={nextLabel} onClick={() => step(1)}>
                        →
                    </button>
                </div>
            </div>
        </>
    );
}
