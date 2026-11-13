import { describe, expect, it } from 'vitest';
import { cp1251, dxfText, twoFlatsMm } from '../__fixtures__/dxf';
import { readDxf } from './dxf';

describe('readDxf', () => {
    it('reads the header unit and the entities', () => {
        const { insunits, entities } = readDxf(Buffer.from(dxfText(twoFlatsMm(), { insunits: 4 })));
        expect(insunits).toBe(4);
        expect(entities.map((e) => e.type)).toEqual(['LWPOLYLINE', 'LINE', 'ARC', 'MTEXT', 'LWPOLYLINE', 'MTEXT', 'LWPOLYLINE', 'TEXT']);
        expect(entities[4]).toMatchObject({
            layer: 'TEKOM_UNIT',
            closed: true,
            points: [
                [1000, 2000],
                [9000, 2000],
                [9000, 12750],
                [1000, 12750]
            ]
        });
        expect(entities[2]).toMatchObject({ center: [9000, 7000], radius: 900, start: 0, end: 90 });
    });

    it('strips MTEXT formatting codes', () => expect(readDxf(Buffer.from(dxfText(twoFlatsMm()))).entities[5]!.text).toBe('12'));

    it('decodes a drawing saved in windows-1251', () => {
        const bytes = cp1251(dxfText([{ type: 'TEXT', layer: 'Стени', at: [0, 0], text: 'Ап 12' }], { codepage: 'ANSI_1251' }));
        expect(readDxf(bytes).entities[0]).toMatchObject({ layer: 'Стени', text: 'Ап 12' });
    });

    it('has no unit when the header does not set one', () => expect(readDxf(Buffer.from(dxfText(twoFlatsMm()))).insunits).toBeNull());
});
