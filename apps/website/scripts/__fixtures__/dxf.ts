/** Builds small DXF files for the blueprint tests: only the group codes the reader uses. */
export type TestEntity =
    | { type: 'LINE'; layer: string; from: [number, number]; to: [number, number] }
    | { type: 'LWPOLYLINE'; layer: string; points: [number, number][]; closed?: boolean }
    | { type: 'ARC'; layer: string; center: [number, number]; radius: number; start: number; end: number }
    | { type: 'TEXT' | 'MTEXT'; layer: string; at: [number, number]; text: string };

const pair = (code: number, value: string | number) => `${String(code).padStart(3)}\n${value}`;

export function dxfText(entities: TestEntity[], header: { insunits?: number; codepage?: string } = {}): string {
    const head = [pair(0, 'SECTION'), pair(2, 'HEADER')];
    if (header.codepage) head.push(pair(9, '$DWGCODEPAGE'), pair(3, header.codepage));
    if (header.insunits !== undefined) head.push(pair(9, '$INSUNITS'), pair(70, header.insunits));
    head.push(pair(0, 'ENDSEC'), pair(0, 'SECTION'), pair(2, 'ENTITIES'));
    const body = entities.flatMap((e) => {
        const out = [pair(0, e.type), pair(8, e.layer)];
        if (e.type === 'LINE') out.push(pair(10, e.from[0]), pair(20, e.from[1]), pair(11, e.to[0]), pair(21, e.to[1]));
        if (e.type === 'LWPOLYLINE') {
            out.push(pair(90, e.points.length), pair(70, e.closed ? 1 : 0));
            for (const [x, y] of e.points) out.push(pair(10, x), pair(20, y));
        }
        if (e.type === 'ARC') out.push(pair(10, e.center[0]), pair(20, e.center[1]), pair(40, e.radius), pair(50, e.start), pair(51, e.end));
        if (e.type === 'TEXT' || e.type === 'MTEXT') out.push(pair(10, e.at[0]), pair(20, e.at[1]), pair(1, e.text));
        return out;
    });
    return [...head, ...body, pair(0, 'ENDSEC'), pair(0, 'EOF'), ''].join('\n');
}

/** Windows-1251 bytes of `text`: Cyrillic А–я map to 0xC0–0xFF, Ё/ё to 0xA8/0xB8. */
export function cp1251(text: string): Buffer {
    return Buffer.from(
        [...text].map((ch) => {
            const c = ch.codePointAt(0)!;
            if (c >= 0x410 && c <= 0x44f) return c - 0x410 + 0xc0;
            if (c === 0x401) return 0xa8;
            if (c === 0x451) return 0xb8;
            return c;
        })
    );
}

const rect = (x: number, y: number, w: number, h: number): [number, number][] => [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h]
];

/** A floor 20 m × 10.75 m in millimetres: two flats, 12 (8 × 10.75 = 86 m²) and 13. */
export const twoFlatsMm = (): TestEntity[] => [
    { type: 'LWPOLYLINE', layer: 'Стени', points: rect(1000, 2000, 20000, 10750), closed: true },
    { type: 'LINE', layer: 'Стени', from: [9000, 2000], to: [9000, 12750] },
    { type: 'ARC', layer: 'Стени', center: [9000, 7000], radius: 900, start: 0, end: 90 },
    { type: 'MTEXT', layer: 'Размери', at: [5000, 1000], text: '\\A1;{\\fArial|b0|i0|c204|p0;\\W1.000000;20,00 m}' },
    { type: 'LWPOLYLINE', layer: 'TEKOM_UNIT', points: rect(1000, 2000, 8000, 10750), closed: true },
    { type: 'MTEXT', layer: 'TEKOM_UNIT', at: [5000, 7000], text: '\\A1;{\\fArial|b0|i0|c204|p0;\\W1.000000;12}' },
    { type: 'LWPOLYLINE', layer: 'TEKOM_UNIT', points: rect(9000, 2000, 12000, 10750), closed: true },
    { type: 'TEXT', layer: 'TEKOM_UNIT', at: [15000, 7000], text: '13' }
];
