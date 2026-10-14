import type { ProjectCard } from '@/content/cards';
import type { Panel } from '@/content/home';

export type RailItem =
    | { kind: 'project'; project: ProjectCard }
    | { kind: 'panel'; panel: Extract<Panel, { kind: 'capability' }> }
    | { kind: 'crew'; panel: Extract<Panel, { kind: 'crew_stat' }> };

const panelItem = (panel: Panel): RailItem => (panel.kind === 'capability' ? { kind: 'panel', panel } : { kind: 'crew', panel });

/** Projects in order, each panel right after the project it names. Panels past the end close the rail. */
export function buildRail(projects: ProjectCard[], panels: Panel[]): RailItem[] {
    const lastIndex = projects.length - 1;
    const after = (index: number) => panels.filter((p) => Math.min(p.afterProjectIndex, lastIndex) === index).map(panelItem);
    if (projects.length === 0) return panels.map(panelItem);
    return projects.flatMap((project, i): RailItem[] => [{ kind: 'project', project }, ...after(i)]);
}

const START_TOLERANCE = 20;

/** `lefts` are the slides' left edges relative to the start of the track's content box. */
export function activeIndex(lefts: number[], atEnd: boolean): number {
    if (lefts.length === 0) return 0;
    if (atEnd) return lefts.length - 1;
    return lefts.reduce((active, left, i) => (left <= START_TOLERANCE ? i : active), 0);
}

const COLLAGE_CELLS = 9;
const TOOLS_PER_CREW_SLIDE = 6;

/** Nine glyphs for a crew slide: each crew slide starts six tools further in, wrapping round. */
export function collageTools<T>(tools: T[], crewSlideIndex: number): T[] {
    const start = crewSlideIndex * TOOLS_PER_CREW_SLIDE;
    return tools
        .slice(start, start + TOOLS_PER_CREW_SLIDE)
        .concat(tools)
        .slice(0, COLLAGE_CELLS);
}
