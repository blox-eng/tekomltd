import type { ProjectCard } from '@/content/cards';

export type YearKey = 'now' | 'none' | number;
export type YearGroup = { key: YearKey; id: string; projects: ProjectCard[] };

/** Work in progress first ("днес"), then the years newest first, then projects without a year. Order inside a group is kept. */
export function groupByYear(projects: ProjectCard[]): YearGroup[] {
    const keyOf = (p: ProjectCard): YearKey => (p.inProgress ? 'now' : (p.year ?? 'none'));
    const rank = (key: YearKey) => (key === 'now' ? Infinity : key === 'none' ? -Infinity : key);
    const groups = new Map<YearKey, ProjectCard[]>();
    for (const project of projects) groups.set(keyOf(project), [...(groups.get(keyOf(project)) ?? []), project]);
    return [...groups].sort(([a], [b]) => rank(b) - rank(a)).map(([key, list]) => ({ key, id: `y-${key}`, projects: list }));
}
