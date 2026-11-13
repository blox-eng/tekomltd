import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@tekom/i18n';
import type { FloorView, UnitView } from '@/content/sales';
import { localePath } from '@/i18n/routing';
import { labelOf, floorName, unitAria } from './words';
import styles from './sales.module.css';

type Props = { slug: string; floor: FloorView; /** The unit drawn in red on its own page. */ current?: string; small?: boolean };

/** One floor, from the SVG that pnpm blueprint wrote. Each unit is a link; its code and status sit on top as real text. */
export function FloorPlan({ slug, floor, current, small = false }: Props) {
    const t = useTranslations('sales');
    const locale = useLocale() as Locale;
    const [, , w, h] = floor.plan.viewBox;
    const byCode = new Map<string, UnitView>(floor.units.map((u) => [u.code, u]));
    const hatch = `hatch-${floor.key}${current ? '-unit' : ''}`;
    return (
        <figure className={small ? `${styles.plan} ${styles.small}` : styles.plan}>
            <div className={styles.sheet} style={{ aspectRatio: `${w} / ${h}`, ['--ratio' as string]: w / h }}>
                <svg viewBox={floor.plan.viewBox.join(' ')} role="group" aria-label={t('plan', { floor: floorName(floor, t) })}>
                    <defs>
                        <pattern id={hatch} width={w / 60} height={w / 60} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2={w / 60} className={styles.hatchLine} />
                        </pattern>
                    </defs>
                    {floor.plan.units.map((outline) => {
                        const unit = byCode.get(outline.code);
                        if (!unit) return null;
                        const fill = unit.status === 'reserved' || unit.status === 'upcoming' ? `url(#${hatch})` : undefined;
                        const shape = <path d={outline.d} data-status={unit.status} data-current={unit.code === current || undefined} style={{ fill }} />;
                        return small ? (
                            <g key={outline.code}>{shape}</g>
                        ) : (
                            <a key={outline.code} href={localePath(`/projects/${slug}/${unit.slug}`, locale)} aria-label={unitAria(unit, floor, t, locale)}>
                                {shape}
                            </a>
                        );
                    })}
                    <path d={floor.plan.walls} className={styles.walls} />
                </svg>
                {!small &&
                    floor.plan.units.map((outline) => {
                        const unit = byCode.get(outline.code);
                        if (!unit) return null;
                        return (
                            <span
                                key={outline.code}
                                className={styles.tag}
                                data-status={unit.status}
                                style={{ left: `${(outline.x / w) * 100}%`, top: `${(outline.y / h) * 100}%` }}
                                aria-hidden="true"
                            >
                                <b>{labelOf(unit, t)}</b>
                                <span>{t(`status.${unit.status}`)}</span>
                            </span>
                        );
                    })}
            </div>
        </figure>
    );
}
