import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readYaml } from './load';
import { projectFile } from './paths';
import { loadSales } from './sales';
import { Project } from './schema';

const root = join(__dirname, '__fixtures__', 'sales');
const load = (slug: string, locale: 'bg' | 'en' = 'bg') => {
    const file = projectFile(slug);
    return loadSales(readYaml(root, file, Project), file, root, locale, 'info@tekomltd.com');
};

describe('loadSales', () => {
    it('is null for a project without a sales block', () => expect(load('rising-block')).toBeNull());

    it('counts the totals from the units', () =>
        expect(load('sale-block')!.totals).toEqual({
            units: 8,
            byStatus: { free: 3, reserved: 1, upcoming: 1, sold: 3 },
            freeArea: { min: 48, max: 112 }
        }));

    it('shows a maisonette on both floors and counts it once', () => {
        const sales = load('sale-block')!;
        const codesOn = (key: string) => sales.floors.find((f) => f.key === key)!.units.map((u) => u.code);
        expect(codesOn('1')).toContain('7');
        expect(codesOn('2')).toContain('7');
        expect(sales.units.filter((u) => u.code === '7')).toHaveLength(1);
        expect(sales.floors.find((f) => f.key === '2')!.free).toBe(1);
    });

    it('lists the floors top first', () => expect(load('sale-block')!.floors.map((f) => f.key)).toEqual(['2', '1', '0']));

    it('reads the plan of each floor', () => {
        const ground = load('sale-block')!.floors.find((f) => f.key === '0')!;
        expect(ground.label).toBe('Партер');
        expect(ground.plan.units.map((u) => u.code).sort()).toEqual(['11', 'G1']);
    });

    it('gives each unit a lowercase slug', () => expect(load('sale-block')!.units.find((u) => u.code === 'A3')!.slug).toBe('a3'));

    it('uses the site e-mail when the project sets none', () => expect(load('sale-block')!.email).toBe('info@tekomltd.com'));

    it('defaults to the switch view', () => expect(load('sale-block')!.view).toBe('switch'));

    it('marks a note that falls back to Bulgarian', () => {
        const unit = load('sale-block', 'en')!.units.find((u) => u.code === '12')!;
        expect(unit).toMatchObject({ note: 'Ъглов апартамент с две тераси.', noteFallback: true, terrace: 9.5, orientation: ['S'] });
    });
});

describe('getProject', () => {
    it('carries the sales view of a project for sale', async () => {
        const { getProject } = await import('./projects');
        expect(getProject('sale-block', 'bg', root)!.sales!.totals.units).toBe(8);
        expect(getProject('rising-block', 'bg', root)!.sales).toBeNull();
    });
});
