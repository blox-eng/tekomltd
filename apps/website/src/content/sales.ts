import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Locale } from '@tekom/i18n';
import { readYaml, t } from './load';
import { planFile, UNITS_DIR } from './paths';
import { readPlan, type Plan } from './plan';
import { Unit, UNIT_STATUSES, type Orientation, type Project, type UnitStatus, type UnitType } from './schema';

export type UnitView = {
    code: string;
    slug: string;
    type: UnitType;
    /** `label: null` means the page shows the default floor name. */
    floors: { key: string; label: string | null }[];
    rooms: number | null;
    area: { total: number; built: number; net: number };
    terrace: number | null;
    orientation: Orientation[];
    status: UnitStatus;
    note: string | null;
    noteFallback: boolean;
};
export type FloorView = { key: string; label: string | null; plan: Plan; units: UnitView[]; free: number };
export type Totals = { units: number; byStatus: Record<UnitStatus, number>; freeArea: { min: number; max: number } | null };
export type SalesView = {
    email: string;
    view: 'switch' | 'scroll';
    updated: string;
    /** Top floor first, as the building stands. */
    floors: FloorView[];
    /** Bottom floor first, then by code. */
    units: UnitView[];
    totals: Totals;
};

/** Every `units/*.yaml` of the project, relative to the content root. */
export function unitFiles(root: string, projectFile: string): string[] {
    const dir = join(dirname(projectFile), UNITS_DIR);
    if (!existsSync(join(root, dir))) return [];
    return readdirSync(join(root, dir))
        .filter((name) => name.endsWith('.yaml'))
        .map((name) => join(dir, name));
}

export function totalsOf(units: Pick<UnitView, 'status' | 'area'>[]): Totals {
    const byStatus = Object.fromEntries(UNIT_STATUSES.map((s) => [s, units.filter((u) => u.status === s).length])) as Record<UnitStatus, number>;
    const free = units.filter((u) => u.status === 'free').map((u) => u.area.total);
    return { units: units.length, byStatus, freeArea: free.length ? { min: Math.min(...free), max: Math.max(...free) } : null };
}

export function loadSales(project: Project, projectFile: string, root: string, locale: Locale, fallbackEmail: string): SalesView | null {
    const { sales } = project;
    if (!sales) return null;
    const floorIndex = new Map(sales.floors.map((f, i) => [f.key, i]));
    const floorLabel = new Map(sales.floors.map((f) => [f.key, f.label ? t(f.label, locale).text : null]));
    const units: UnitView[] = unitFiles(root, projectFile)
        .map((file) => readYaml(root, file, Unit))
        .map((u) => {
            const note = u.note ? t(u.note, locale) : null;
            return {
                code: u.code,
                slug: u.code.toLowerCase(),
                type: u.type,
                floors: u.floors.map((key) => ({ key, label: floorLabel.get(key) ?? null })),
                rooms: u.rooms ?? null,
                area: u.area,
                terrace: u.terrace ?? null,
                orientation: u.orientation,
                status: u.status,
                note: note?.text ?? null,
                noteFallback: note?.fallback ?? false
            };
        })
        .sort(
            (a, b) => (floorIndex.get(a.floors[0]!.key) ?? 0) - (floorIndex.get(b.floors[0]!.key) ?? 0) || a.code.localeCompare(b.code, 'en', { numeric: true })
        );
    const floors = sales.floors
        .map(({ key }) => {
            const on = units.filter((u) => u.floors.some((f) => f.key === key));
            return {
                key,
                label: floorLabel.get(key) ?? null,
                plan: readPlan(readFileSync(join(root, planFile(projectFile, key)), 'utf8')),
                units: on,
                free: on.filter((u) => u.status === 'free').length
            };
        })
        .reverse();
    return { email: sales.email ?? fallbackEmail, view: sales.view, updated: sales.updated, floors, units, totals: totalsOf(units) };
}
