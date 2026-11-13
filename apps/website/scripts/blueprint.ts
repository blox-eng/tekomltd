import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import YAML from 'yaml';
import { defaultRoot } from '../src/content/load';
import { PROJECT_FILE, PROJECTS_DIR, planFile, unitFile } from '../src/content/paths';
import { writePlan, type Plan } from '../src/content/plan';
import { floorKey } from '../src/content/schema';
import { readDxf, type Entity, type Point } from './lib/dxf';

export const UNIT_LAYER = 'TEKOM_UNIT';
/** Layers that hold dimensions or notes, never walls. */
const NOT_WALLS = /dim|annot|text|размер|текст|надпис/i;
const WALL_TYPES = new Set(['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE']);
const PER_METRE = { mm: 1000, cm: 100, m: 1 } as const;
type LengthUnit = keyof typeof PER_METRE;
const FROM_INSUNITS: Record<number, LengthUnit> = { 4: 'mm', 5: 'cm', 6: 'm' };

export type BlueprintResult = { plan: Plan; units: { code: string; built: number }[]; unit: LengthUnit; guessed: boolean; wallLines: number };
export class BlueprintError extends Error {
    constructor(readonly messages: string[]) {
        super(messages.join('\n'));
    }
}

const round = (n: number, places = 2) => {
    const r = Number(n.toFixed(places));
    return r === 0 ? 0 : r;
};

/** A floor is 8–120 m across: a width of 8000+ is millimetres, 200+ is centimetres, less is metres. */
const guessUnit = (width: number): LengthUnit => (width >= 8000 ? 'mm' : width > 200 ? 'cm' : 'm');

const shoelace = (points: Point[]) =>
    points.reduce((sum, [x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length]!;
        return sum + x * ny - nx * y;
    }, 0) / 2;

function centroid(points: Point[]): Point {
    const a = shoelace(points);
    let cx = 0;
    let cy = 0;
    points.forEach(([x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length]!;
        const f = x * ny - nx * y;
        cx += (x + nx) * f;
        cy += (y + ny) * f;
    });
    return [cx / (6 * a), cy / (6 * a)];
}

function inside([px, py]: Point, poly: Point[]): boolean {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i]!;
        const [xj, yj] = poly[j]!;
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
}

function extent(e: Entity): Point[] {
    if (e.points) return e.points;
    if (e.center && e.radius !== undefined) {
        const [x, y] = e.center;
        const r = e.radius;
        return [
            [x - r, y - r],
            [x + r, y + r]
        ];
    }
    return [];
}

export function blueprint(bytes: Buffer, opts: { walls?: string; units?: LengthUnit }): BlueprintResult {
    const { insunits, entities } = readDxf(bytes);
    const errors: string[] = [];
    const onUnitLayer = entities.filter((e) => e.layer === UNIT_LAYER);
    const outlines = onUnitLayer.filter((e) => e.type === 'LWPOLYLINE' && e.closed && (e.points?.length ?? 0) >= 3);
    const codes = onUnitLayer.filter((e) => (e.type === 'TEXT' || e.type === 'MTEXT') && e.text && e.at);
    for (const e of onUnitLayer)
        if (!outlines.includes(e) && !codes.includes(e)) errors.push(`${e.type} на слой ${UNIT_LAYER}: там са само затворени контури и кодове`);
    if (outlines.length === 0) throw new BlueprintError([`Няма контури на слой ${UNIT_LAYER}: начертай затворен контур за всеки обект`]);

    const candidates = entities.filter((e) => WALL_TYPES.has(e.type) && e.layer !== UNIT_LAYER && !NOT_WALLS.test(e.layer));
    const counts = new Map<string, number>();
    for (const e of candidates) counts.set(e.layer, (counts.get(e.layer) ?? 0) + 1);
    const layers = [...counts].sort((a, b) => b[1] - a[1]);
    const listed = layers.map(([name, n]) => `${name} (${n})`).join(', ');
    const chosen = opts.walls
        ?.split(',')
        .map((l) => l.trim())
        .filter(Boolean);
    // Furniture, installations and a title frame must not reach the public plan: with more than one layer, the owner names the walls.
    if (!chosen && layers.length > 1)
        throw new BlueprintError([
            `Линии има на няколко слоя: ${listed}. Избери стените с --walls "${layers[0]![0]}" (няколко слоя: --walls "${layers.map(([name]) => name).join(',')}")`
        ]);
    const walls = chosen ? entities.filter((e) => WALL_TYPES.has(e.type) && chosen.includes(e.layer)) : candidates;
    for (const layer of chosen ?? [])
        if (!walls.some((e) => e.layer === layer)) throw new BlueprintError([`Няма линии на слой „${layer}“. Слоеве с линии: ${listed}`]);
    const all = [...walls, ...outlines].flatMap(extent);
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const header = insunits !== null ? FROM_INSUNITS[insunits] : undefined;
    const unit = opts.units ?? header ?? guessUnit(maxX - minX);
    const f = 1 / PER_METRE[unit];
    const where = ([x, y]: Point) => `(${round(x * f)}, ${round(y * f)}) m`;
    const px = (x: number) => round((x - minX) * f);
    const py = (y: number) => round((maxY - y) * f);
    const pt = ([x, y]: Point) => `${px(x)} ${py(y)}`;

    const units: { code: string; d: string; x: number; y: number; built: number }[] = [];
    for (const outline of outlines) {
        const poly = outline.points!;
        const mid = centroid(poly);
        const own = codes.filter((c) => inside(c.at!, poly));
        if (own.length === 0) errors.push(`Контур без код при ${where(mid)}: добави текст с кода в контура на слой ${UNIT_LAYER}`);
        else if (own.length > 1) errors.push(`Два кода (${own.map((c) => c.text).join(', ')}) в един контур при ${where(mid)}: остави един`);
        else {
            const code = own[0]!.text!;
            if (!/^[A-Za-z0-9-]+$/.test(code)) errors.push(`Код „${code}“ при ${where(mid)}: пиши кода с латиница, цифри и тире, например 12 или A3`);
            if (units.some((u) => u.code === code)) errors.push(`Код ${code} е на два контура: всеки обект има свой код`);
            units.push({
                code,
                d: `M${poly.map(pt).join('L')}Z`,
                x: px(mid[0]),
                y: py(mid[1]),
                built: round(Math.abs(shoelace(poly)) * f * f, 1)
            });
        }
    }
    for (const c of codes)
        if (!outlines.some((o) => inside(c.at!, o.points!))) errors.push(`Код ${c.text} при ${where(c.at!)} е извън контур: премести го в контура`);
    if (errors.length) throw new BlueprintError(errors);

    const wallPath = walls
        .map((e) => {
            if (e.type === 'LINE' || e.type === 'LWPOLYLINE') return `M${e.points!.map(pt).join('L')}${e.closed ? 'Z' : ''}`;
            const [cx, cy] = e.center!;
            const r = e.radius!;
            const rr = round(r * f);
            if (e.type === 'CIRCLE') return `M${pt([cx + r, cy])}A${rr} ${rr} 0 1 1 ${pt([cx - r, cy])}A${rr} ${rr} 0 1 1 ${pt([cx + r, cy])}`;
            const rad = (deg: number) => (deg * Math.PI) / 180;
            const at = (deg: number): Point => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
            const sweep = (((e.end! - e.start!) % 360) + 360) % 360;
            // The drawing turns counter-clockwise; with y flipped for the screen that is sweep flag 0.
            return `M${pt(at(e.start!))}A${rr} ${rr} 0 ${sweep > 180 ? 1 : 0} 0 ${pt(at(e.end!))}`;
        })
        .join('');
    return {
        plan: {
            viewBox: [0, 0, round((maxX - minX) * f), round((maxY - minY) * f)],
            walls: wallPath,
            units: units.map(({ code, d, x, y }) => ({ code, d, x, y }))
        },
        units: units.map(({ code, built }) => ({ code, built })),
        unit,
        guessed: !opts.units && !header,
        wallLines: walls.length
    };
}

const stub = (code: string, floor: string, built: number) => `code: '${code}'
type: flat # flat, garage, parking, storage или shop
floors: ['${floor}']
rooms: # брой стаи; махни реда, ако не е апартамент
area:
  total: # обща площ, m²
  built: ${built} # застроена, измерена от чертежа
  net: # чиста площ, m²
orientation: [] # N NE E SE S SW W NW
status: upcoming # free, reserved, upcoming или sold
`;

const plural = (n: number) => (n === 1 ? 'обект' : 'обекта');

export function run(argv: string[], root: string, log: (s: string) => void): number {
    const flags = new Map<string, string>();
    const args: string[] = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]!;
        if (a.startsWith('--')) flags.set(a.slice(2), argv[++i] ?? '');
        else args.push(a);
    }
    const [slug, floor, file] = args;
    if (!slug || !floor || !file) {
        log('Пиши: pnpm blueprint <проект> <етаж> <файл.dxf> [--walls "<слой>"] [--units mm|cm|m]');
        return 1;
    }
    const folder = join(PROJECTS_DIR, slug);
    const project = join(folder, PROJECT_FILE);
    if (!existsSync(join(root, project))) {
        log(`Няма проект ${slug} в content/projects/`);
        return 1;
    }
    if (!floorKey.safeParse(floor).success) {
        log(`Етаж „${floor}“: пиши етажа с латиница и цифри: -1, 0, 4, penthouse`);
        return 1;
    }
    const units = flags.get('units');
    if (units !== undefined && !(units in PER_METRE)) {
        log('--units е mm, cm или m');
        return 1;
    }
    let result: BlueprintResult;
    try {
        result = blueprint(readFileSync(file), { walls: flags.get('walls'), units: units as LengthUnit | undefined });
    } catch (e) {
        if (!(e instanceof BlueprintError)) throw e;
        e.messages.forEach(log);
        return 1;
    }
    const plan = join(root, planFile(project, floor));
    mkdirSync(join(plan, '..'), { recursive: true });
    writeFileSync(plan, writePlan(result.plan));
    for (const { code, built } of result.units) {
        const path = join(root, unitFile(project, code));
        const name = `units/${code}.yaml`;
        if (!existsSync(path)) {
            mkdirSync(join(path, '..'), { recursive: true });
            writeFileSync(path, stub(code, floor, built));
            log(`Обект ${code}: написах ${name}; попълни стаи, обща и чиста площ и статус`);
            continue;
        }
        const mine = YAML.parse(readFileSync(path, 'utf8')) as { floors?: string[]; area?: { built?: number } };
        if (!mine?.floors?.includes(floor)) log(`Обект ${code} е и на етаж ${floor}: добави '${floor}' във floors в ${name}`);
        const had = mine?.area?.built;
        if (typeof had === 'number' && Math.abs(had - built) / built > 0.02)
            log(`Обект ${code}: застроена площ в ${name} е ${had} m², в чертежа е ${built} m²`);
    }
    const codes = result.units.map((u) => u.code).join(', ');
    const unitNote = result.guessed
        ? `${result.unit} (предположение; ако е грешно, добави ${(['mm', 'cm', 'm'] as const)
              .filter((u) => u !== result.unit)
              .map((u) => `--units ${u}`)
              .join(' или ')})`
        : result.unit;
    log(`Етаж ${floor}: ${result.units.length} ${plural(result.units.length)} (${codes}), стени: ${result.wallLines} линии, мерна единица: ${unitNote}`);
    return 0;
}

if (process.argv[1] && basename(process.argv[1]) === 'blueprint.ts') {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const argv = process.argv.slice(2);
    const fileIndex = argv.findIndex((a, i) => i > 0 && /\.dxf$/i.test(a));
    if (fileIndex >= 0) argv[fileIndex] = resolve(cwd, argv[fileIndex]!);
    process.exitCode = run(argv, resolve(defaultRoot()), (s) => console.log(s));
}
