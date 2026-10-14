'use client';

import { useState, type ReactNode } from 'react';
import styles from './map.module.css';

/** Shows the place and title of the pin under the pointer or focus, as the mockup does. */
export function MapTip({ children }: { children: ReactNode }) {
    const [tip, setTip] = useState('');
    const read = (target: EventTarget) => (target instanceof Element ? (target.closest<HTMLElement | SVGElement>('[data-tip]')?.dataset.tip ?? null) : null);
    return (
        <>
            <div
                className={styles.maps}
                onMouseOver={(e) => setTip(read(e.target) ?? '')}
                onFocus={(e) => setTip(read(e.target) ?? '')}
                onMouseLeave={() => setTip('')}
                onBlur={() => setTip('')}
            >
                {children}
            </div>
            <div className={styles.tip} aria-live="polite">
                {tip}
            </div>
        </>
    );
}
