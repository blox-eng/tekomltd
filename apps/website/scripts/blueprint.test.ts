import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { dxfText, twoFlatsMm, type TestEntity } from './__fixtures__/dxf';
import { blueprint, BlueprintError, run } from './blueprint';
import { readPlan } from '../src/content/plan';

const bytes = (entities: TestEntity[], header = {}) => Buffer.from(dxfText(entities, header));
const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

describe('blueprint', () => {
    it('guesses millimetres from the size of the drawing', () => {
        const result = blueprint(bytes(twoFlatsMm()), {});
        expect(result).toMatchObject({ unit: 'mm', guessed: true, wallLines: 3 });
        expect(result.units).toEqual([
            { code: '12', built: 86 },
            { code: '13', built: 129 }
        ]);
        expect(result.plan.viewBox).toEqual([0, 0, 20, 10.75]);
    });

    it('keeps at most two decimals in the plan', () => {
        const { plan } = blueprint(bytes(twoFlatsMm()), {});
        const numbers = [plan.walls, ...plan.units.map((u) => u.d)]
            .join(' ')
            .match(/-?\d+(\.\d+)?/g)!
            .map(Number);
        expect(numbers.every((n) => decimals(n) <= 2)).toBe(true);
    });

    it('flips the drawing so north stays up', () => {
        const { plan } = blueprint(bytes(twoFlatsMm()), {});
        expect(plan.units[0]).toMatchObject({ code: '12', x: 4, y: 5.38 });
        expect(plan.units[0]!.d).toBe('M0 10.75L8 10.75L8 0L0 0Z');
    });

    it('drops dimensions and text from the walls', () => {
        const { plan } = blueprint(bytes(twoFlatsMm()), {});
        expect(plan.walls).not.toContain('NaN');
        expect(plan.walls.match(/M/g)).toHaveLength(3);
    });

    it('asks which layers are walls when the drawing has several', () => {
        const extra: TestEntity = { type: 'LINE', layer: 'Мебели', from: [2000, 3000], to: [3000, 3000] };
        expect(() => blueprint(bytes([...twoFlatsMm(), extra]), {})).toThrow(
            'Линии има на няколко слоя: Стени (3), Мебели (1). Избери стените с --walls "Стени" (няколко слоя: --walls "Стени,Мебели")'
        );
        expect(blueprint(bytes([...twoFlatsMm(), extra]), { walls: 'Стени' }).wallLines).toBe(3);
        expect(blueprint(bytes([...twoFlatsMm(), extra]), { walls: 'Стени,Мебели' }).wallLines).toBe(4);
    });

    it('refuses a walls layer that holds nothing', () =>
        expect(() => blueprint(bytes(twoFlatsMm()), { walls: 'Нищо' })).toThrow('Няма линии на слой „Нищо“. Слоеве с линии: Стени (3)'));

    it('draws an arc the way it turns in the drawing', () => {
        // Centre (9, 7) m, 0° → 90° counter-clockwise: from (9.9, 7) up to (9, 7.9). On screen y points down,
        // so the arc goes from (8.9, 5.75) to (8, 4.85) and bows away from the centre at (8, 5.75): sweep flag 0.
        const { plan } = blueprint(bytes(twoFlatsMm()), {});
        expect(plan.walls).toContain('M8.9 5.75A0.9 0.9 0 0 0 8 4.85');
    });

    it('reads the unit from the header, and the flag wins over both', () => {
        expect(blueprint(bytes(twoFlatsMm(), { insunits: 4 }), {})).toMatchObject({ unit: 'mm', guessed: false });
        const cm = blueprint(bytes(twoFlatsMm()), { units: 'cm' });
        expect(cm).toMatchObject({ unit: 'cm', guessed: false });
        expect(cm.units[0]!.built).toBe(8600);
    });

    it('refuses an outline without a code and says where it is', () => {
        const noCode = twoFlatsMm().filter((e) => !(e.type === 'TEXT' && e.text === '13'));
        expect(() => blueprint(bytes(noCode), {})).toThrow(BlueprintError);
        expect(() => blueprint(bytes(noCode), {})).toThrow('Контур без код при (15, 7.38) m: добави текст с кода в контура на слой TEKOM_UNIT');
    });

    it('refuses two codes in one outline', () => {
        const two: TestEntity[] = [...twoFlatsMm(), { type: 'TEXT', layer: 'TEKOM_UNIT', at: [16000, 8000], text: '14' }];
        expect(() => blueprint(bytes(two), {})).toThrow('Два кода (13, 14) в един контур при (15, 7.38) m: остави един');
    });

    it('refuses anything else on the unit layer', () => {
        const open: TestEntity[] = [...twoFlatsMm(), { type: 'LINE', layer: 'TEKOM_UNIT', from: [0, 0], to: [1, 1] }];
        expect(() => blueprint(bytes(open), {})).toThrow('LINE на слой TEKOM_UNIT: там са само затворени контури и кодове');
    });

    it('refuses a drawing without units', () =>
        expect(() => blueprint(bytes(twoFlatsMm().filter((e) => e.layer !== 'TEKOM_UNIT')), {})).toThrow(
            'Няма контури на слой TEKOM_UNIT: начертай затворен контур за всеки обект'
        ));
});

describe('run', () => {
    function content() {
        const root = mkdtempSync(join(tmpdir(), 'tekom-blueprint-'));
        dirs.push(root);
        mkdirSync(join(root, 'projects/sale-block'), { recursive: true });
        writeFileSync(join(root, 'projects/sale-block/project.yaml'), 'slug: sale-block\n');
        writeFileSync(join(root, 'floor.dxf'), dxfText(twoFlatsMm()));
        return root;
    }
    const lines: string[] = [];
    const log = (s: string) => lines.push(s);

    it('writes the plan and a stub for each new unit', () => {
        const root = content();
        expect(run(['sale-block', '1', join(root, 'floor.dxf')], root, log)).toBe(0);
        const plan = readPlan(readFileSync(join(root, 'projects/sale-block/plans/1.svg'), 'utf8'));
        expect(plan.units.map((u) => u.code)).toEqual(['12', '13']);
        const stub = YAML.parse(readFileSync(join(root, 'projects/sale-block/units/12.yaml'), 'utf8'));
        expect(stub).toMatchObject({ code: '12', type: 'flat', floors: ['1'], area: { built: 86 }, status: 'upcoming' });
        expect(lines.at(-1)).toBe(
            'Етаж 1: 2 обекта (12, 13), стени: 3 линии, мерна единица: mm (предположение; ако е грешно, добави --units cm или --units m)'
        );
    });

    it('leaves an existing unit file alone and shows a different area', () => {
        const root = content();
        mkdirSync(join(root, 'projects/sale-block/units'));
        const mine = "code: '12'\ntype: flat\nfloors: ['1']\nrooms: 3\narea: { total: 100, built: 80, net: 70 }\nstatus: free\n";
        writeFileSync(join(root, 'projects/sale-block/units/12.yaml'), mine);
        lines.length = 0;
        run(['sale-block', '1', join(root, 'floor.dxf')], root, log);
        expect(readFileSync(join(root, 'projects/sale-block/units/12.yaml'), 'utf8')).toBe(mine);
        expect(lines).toContain('Обект 12: застроена площ в units/12.yaml е 80 m², в чертежа е 86 m²');
    });

    it('asks to add the floor when a unit is also on another floor', () => {
        const root = content();
        run(['sale-block', '1', join(root, 'floor.dxf')], root, log);
        lines.length = 0;
        run(['sale-block', '2', join(root, 'floor.dxf')], root, log);
        expect(lines).toContain("Обект 12 е и на етаж 2: добави '2' във floors в units/12.yaml");
    });

    it('writes nothing when the drawing has an error', () => {
        const root = content();
        writeFileSync(join(root, 'floor.dxf'), dxfText(twoFlatsMm().filter((e) => e.type !== 'TEXT')));
        lines.length = 0;
        expect(run(['sale-block', '1', join(root, 'floor.dxf')], root, log)).toBe(1);
        expect(existsSync(join(root, 'projects/sale-block/plans'))).toBe(false);
        expect(lines[0]).toContain('Контур без код');
    });

    it('stops on a project that does not exist', () => {
        const root = content();
        lines.length = 0;
        expect(run(['no-such', '1', join(root, 'floor.dxf')], root, log)).toBe(1);
        expect(lines).toEqual(['Няма проект no-such в content/projects/']);
    });

    it('stops on a floor key that is not ASCII', () => {
        const root = content();
        lines.length = 0;
        expect(run(['sale-block', 'партер', join(root, 'floor.dxf')], root, log)).toBe(1);
        expect(lines[0]).toContain('-1, 0, 4, penthouse');
    });
});
