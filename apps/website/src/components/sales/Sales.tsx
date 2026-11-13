import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@tekom/i18n';
import type { SalesView } from '@/content/sales';
import { FloorPlan } from './FloorPlan';
import { Floors } from './Floors';
import { Totals } from './Totals';
import { UnitList, type UnitRow } from './UnitList';
import { area, floorName, labelOf } from './words';
import styles from './sales.module.css';

export const floorId = (key: string) => `etazh-${key}`;

/** The sales layout of a project with units: totals, the floors, the list. A project without units never renders it. */
export function Sales({ slug, sales }: { slug: string; sales: SalesView }) {
    const t = useTranslations('sales');
    const locale = useLocale() as Locale;
    const bottomUp = [...sales.floors].reverse();
    const initial = floorId((bottomUp.find((f) => f.free > 0) ?? bottomUp[0]!).key);
    const rows: UnitRow[] = sales.units.map((u) => ({
        slug: u.slug,
        label: labelOf(u, t),
        type: u.type,
        floors: u.floors.map((f) => f.key),
        floorNames: u.floors.map((f) => floorName(f, t)).join(', '),
        rooms: u.rooms,
        area: area(u.area.total, locale),
        status: u.status,
        statusWord: t(`status.${u.status}`)
    }));
    const present = <T,>(values: T[]) => [...new Set(values)];
    return (
        <section id="apartamenti" className={styles.sales} aria-labelledby="sales-title">
            <h2 className="micro" id="sales-title">
                {t('title')}
            </h2>
            <Totals totals={sales.totals} updated={sales.updated} />
            <Floors
                view={sales.view}
                label={t('floorsNav')}
                initial={initial}
                floors={sales.floors.map((f) => ({
                    id: floorId(f.key),
                    name: floorName(f, t),
                    free: t('freeOnFloor', { n: f.free }),
                    plan: <FloorPlan slug={slug} floor={f} />
                }))}
            />
            <UnitList
                href={`/projects/${slug}`}
                rows={rows}
                types={present(sales.units.map((u) => u.type)).map((k) => ({ value: k, label: t(`types.${k}`) }))}
                floors={bottomUp.map((f) => ({ value: f.key, label: floorName(f, t) }))}
                rooms={present(sales.units.flatMap((u) => (u.rooms === null ? [] : [u.rooms])))
                    .sort((a, b) => a - b)
                    .map((n) => ({ value: String(n), label: t('rooms', { n }) }))}
                words={{
                    title: t('listTitle'),
                    type: t('filter.type'),
                    floor: t('filter.floor'),
                    rooms: t('filter.rooms'),
                    all: t('filter.all'),
                    onlyFree: t('filter.onlyFree'),
                    noneFree: t('noneFree'),
                    noneMatch: t('noneMatch'),
                    col: { unit: t('col.unit'), floor: t('col.floor'), rooms: t('col.rooms'), area: t('col.area'), status: t('col.status') }
                }}
            />
        </section>
    );
}
