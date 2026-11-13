/** A floor plan in the one SVG shape the site writes and reads. `pnpm blueprint` writes it; the pages inline it. */
export type PlanUnit = { code: string; d: string; x: number; y: number };
export type Plan = { viewBox: [number, number, number, number]; walls: string; units: PlanUnit[] };

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

export function writePlan(plan: Plan): string {
    const units = plan.units.map((u) => `  <path data-unit="${u.code}" data-x="${u.x}" data-y="${u.y}" d="${u.d}"/>`);
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${plan.viewBox.join(' ')}">`,
        `  <path class="walls" d="${plan.walls}"/>`,
        ...units,
        '</svg>',
        ''
    ].join('\n');
}

export function readPlan(svg: string): Plan {
    const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
    const box = attr(root, 'viewBox')?.split(/\s+/).map(Number);
    if (!box || box.length !== 4 || box.some((n) => !Number.isFinite(n))) throw new Error('плана няма viewBox; направи го отново с pnpm blueprint');
    const paths = svg.match(/<path\b[^>]*>/g) ?? [];
    const walls = paths.find((p) => attr(p, 'class') === 'walls');
    if (!walls) throw new Error('плана няма стени (<path class="walls">); направи го отново с pnpm blueprint');
    const units = paths.flatMap((p) => {
        const code = attr(p, 'data-unit');
        return code === undefined ? [] : [{ code, d: attr(p, 'd') ?? '', x: Number(attr(p, 'data-x')), y: Number(attr(p, 'data-y')) }];
    });
    return { viewBox: box as Plan['viewBox'], walls: attr(walls, 'd') ?? '', units };
}
