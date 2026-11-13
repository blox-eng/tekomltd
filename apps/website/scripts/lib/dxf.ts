/** Reads the few DXF entities a floor plan needs. Everything else in the file is skipped. */
export type Point = [number, number];
export type Entity = {
    type: 'LINE' | 'LWPOLYLINE' | 'ARC' | 'CIRCLE' | 'TEXT' | 'MTEXT';
    layer: string;
    points?: Point[];
    closed?: boolean;
    center?: Point;
    radius?: number;
    start?: number;
    end?: number;
    text?: string;
    at?: Point;
};

const KNOWN = new Set(['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'TEXT', 'MTEXT']);

/** `\A1;{\fArial|b0;\W1.0;12}` → `12`. */
export const plainText = (mtext: string) =>
    mtext
        .replace(/\\P/g, ' ')
        .replace(/\\[ACcFfHhQTWp][^;]*;/g, '')
        .replace(/\\[LlOoKk]/g, '')
        .replace(/[{}]/g, '')
        .trim();

/** A drawing saved by AutoCAD 2007 (AC1021) or later is UTF-8, even when $DWGCODEPAGE still names ANSI_1251. */
function decode(bytes: Buffer): string {
    const head = bytes.toString('latin1', 0, 64 * 1024);
    const version = Number(head.match(/\$ACADVER\s*\r?\n\s*1\s*\r?\n\s*AC(\d+)/)?.[1] ?? 0);
    const page = head.match(/\$DWGCODEPAGE\s*\r?\n\s*3\s*\r?\n([^\r\n]+)/)?.[1]?.trim();
    return new TextDecoder(version < 1021 && page === 'ANSI_1251' ? 'windows-1251' : 'utf-8').decode(bytes);
}

/** Entities whose coordinates are in their object system (OCS). LINE and MTEXT are already in world coordinates. */
const OCS = new Set(['LWPOLYLINE', 'ARC', 'CIRCLE', 'TEXT']);

/** A mirrored entity has extrusion (0, 0, -1): its OCS x points the other way. Turn it back into world coordinates. */
function unmirror(e: Entity): Entity {
    const flip = ([x, y]: Point): Point => [-x, y];
    const out: Entity = { ...e };
    if (e.points) out.points = e.points.map(flip);
    if (e.at) out.at = flip(e.at);
    if (e.center) out.center = flip(e.center);
    if (e.type === 'ARC' && e.start !== undefined && e.end !== undefined) {
        out.start = (((180 - e.end) % 360) + 360) % 360;
        out.end = (((180 - e.start) % 360) + 360) % 360 || 360;
    }
    return out;
}

export function readDxf(bytes: Buffer): { insunits: number | null; entities: Entity[] } {
    const lines = decode(bytes).split(/\r?\n/);
    let insunits: number | null = null;
    let variable = '';
    let section = '';
    let expectSection = false;
    const entities: Entity[] = [];
    let current: (Entity & { chunks: string[]; x?: number; z?: number }) | null = null;
    let mtext = '';

    const finish = () => {
        if (!current) return;
        if (current.type === 'MTEXT') current.text = plainText(current.chunks.join('') + mtext);
        else if (current.type === 'TEXT') current.text = mtext.trim();
        const { chunks, x, z, ...entity } = current;
        void chunks;
        void x;
        entities.push(z !== undefined && z < 0 && OCS.has(entity.type) ? unmirror(entity) : entity);
        current = null;
        mtext = '';
    };

    for (let i = 0; i + 1 < lines.length; i += 2) {
        const code = Number(lines[i]!.trim());
        const value = lines[i + 1]!.trim();
        if (code === 0) {
            finish();
            if (value === 'SECTION') expectSection = true;
            else if (value === 'ENDSEC') section = '';
            else if (section === 'ENTITIES' && KNOWN.has(value)) current = { type: value as Entity['type'], layer: '', chunks: [] };
            continue;
        }
        if (expectSection && code === 2) {
            section = value;
            expectSection = false;
            continue;
        }
        if (section === 'HEADER') {
            if (code === 9) variable = value;
            else if (variable === '$INSUNITS' && code === 70) insunits = Number(value);
            continue;
        }
        if (!current) continue;
        const n = Number(value);
        const e = current;
        if (code === 8) e.layer = value;
        else if (code === 230) e.z = n;
        else if (e.type === 'LWPOLYLINE') {
            if (code === 70) e.closed = (n & 1) === 1;
            else if (code === 10) e.x = n;
            else if (code === 20) (e.points ??= []).push([e.x ?? 0, n]);
        } else if (e.type === 'LINE') {
            if (code === 10 || code === 11) e.x = n;
            else if (code === 20) e.points = [[e.x ?? 0, n]];
            else if (code === 21) e.points = [...(e.points ?? []), [e.x ?? 0, n]];
        } else if (e.type === 'ARC' || e.type === 'CIRCLE') {
            if (code === 10) e.x = n;
            else if (code === 20) e.center = [e.x ?? 0, n];
            else if (code === 40) e.radius = n;
            else if (code === 50) e.start = n;
            else if (code === 51) e.end = n;
        } else {
            if (code === 10) e.x = n;
            else if (code === 20) e.at = [e.x ?? 0, n];
            else if (code === 1) mtext = value;
            else if (code === 3) e.chunks.push(value);
        }
    }
    finish();
    return { insunits, entities };
}
