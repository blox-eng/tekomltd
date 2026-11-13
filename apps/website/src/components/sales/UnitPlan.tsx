import { useTranslations } from 'next-intl';
import type { FloorView } from '@/content/sales';
import { floorName } from './words';
import styles from './sales.module.css';

/** One unit drawn large: the floor plan cropped to the unit and a metre around it. */
export function UnitPlan({ floor, code, caption }: { floor: FloorView; code: string; caption: boolean }) {
    const t = useTranslations('sales');
    const outline = floor.plan.units.find((u) => u.code === code);
    if (!outline) return null;
    const numbers = outline.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    const [, , w, h] = floor.plan.viewBox;
    const x0 = Math.max(0, Math.min(...xs) - 1);
    const y0 = Math.max(0, Math.min(...ys) - 1);
    const x1 = Math.min(w, Math.max(...xs) + 1);
    const y1 = Math.min(h, Math.max(...ys) + 1);
    const name = floorName(floor, t);
    return (
        <figure className={styles.plan} data-unit-plan>
            <div className={`${styles.sheet} ${styles.crop}`} style={{ aspectRatio: `${x1 - x0} / ${y1 - y0}`, ['--ratio' as string]: (x1 - x0) / (y1 - y0) }}>
                <svg viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} role="img" aria-label={t('plan', { floor: name })}>
                    <path d={outline.d} className={styles.unitOutline} />
                    <path d={floor.plan.walls} className={styles.walls} />
                </svg>
            </div>
            {caption && <figcaption className="micro">{name}</figcaption>}
        </figure>
    );
}
