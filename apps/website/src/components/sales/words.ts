import type { Locale } from '@tekom/i18n';
import type { FloorView, UnitView } from '@/content/sales';
import { unitLabel } from '@/content/enquiry';
import type { UnitType } from '@/content/schema';

type T = (key: string, values?: Record<string, string | number>) => string;

export const area = (n: number, locale: Locale) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);

/** The name of a floor: its own label, or "Етаж 4". */
export const floorName = (floor: Pick<FloorView, 'key' | 'label'>, t: T) => floor.label ?? t('floor', { key: floor.key });
/** A floor inside a sentence: "етаж 4", or its own label. */
export const floorInline = (floor: Pick<FloorView, 'key' | 'label'>, t: T) => floor.label ?? t('floorInline', { key: floor.key });

export const typeWords = (t: T) =>
    Object.fromEntries((['flat', 'garage', 'parking', 'storage', 'shop'] as const).map((k) => [k, t(`type.${k}`)])) as Record<UnitType, string>;

export const labelOf = (unit: UnitView, t: T) => unitLabel(unit, typeWords(t));

/** "3 стаи, 88 m² обща площ" */
export function details(unit: UnitView, t: T, locale: Locale) {
    const total = t('areaTotal', { n: area(unit.area.total, locale) });
    return unit.rooms === null ? total : `${t('rooms', { n: unit.rooms })}, ${total}`;
}

/** What a screen reader hears for a unit on a plan: "Ап. 12, етаж 1, 3 стаи, 88 m² обща площ, свободен". */
export const unitAria = (unit: UnitView, floor: Pick<FloorView, 'key' | 'label'>, t: T, locale: Locale) =>
    `${labelOf(unit, t)}, ${floorInline(floor, t)}, ${details(unit, t, locale)}, ${t(`status.${unit.status}`)}`;
