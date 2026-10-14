import { describe, expect, it } from 'vitest';
import type { ProjectCard } from '@/content/cards';
import type { Panel } from '@/content/home';
import { activeIndex, buildRail, collageTools } from './rail';

const project = (slug: string) => ({ slug }) as ProjectCard;
const [p0, p1, p2] = [project('a'), project('b'), project('c')] as [ProjectCard, ProjectCard, ProjectCard];
const cap = (afterProjectIndex: number, title = 'cap'): Panel => ({ kind: 'capability', afterProjectIndex, accent: false, label: '', title, body: '' });
const crew = (afterProjectIndex: number): Panel => ({ kind: 'crew_stat', afterProjectIndex, statValue: '35', unit: '', body: '', unconfirmed: false });

describe('buildRail', () => {
    it('puts each panel after its project index', () => {
        const items = buildRail([p0, p1, p2], [cap(0), crew(1)]);
        expect(items.map((i) => i.kind)).toEqual(['project', 'panel', 'project', 'crew', 'project']);
    });

    it('appends panels whose index is past the end', () => {
        expect(buildRail([p0], [cap(9)]).at(-1)?.kind).toBe('panel');
    });

    it('keeps the given order for two panels at the same index', () => {
        const items = buildRail([p0, p1], [cap(0, 'first'), crew(0), cap(0, 'third')]);
        expect(items.map((i) => i.kind)).toEqual(['project', 'panel', 'crew', 'panel', 'project']);
        expect(items.flatMap((i) => (i.kind === 'panel' ? [i.panel.kind === 'capability' ? i.panel.title : ''] : []))).toEqual(['first', 'third']);
    });

    it('returns only panels when there are no projects', () => {
        expect(buildRail([], [cap(0)]).map((i) => i.kind)).toEqual(['panel']);
    });
});

describe('activeIndex', () => {
    it('is the last slide whose left edge has reached the start of the track', () => {
        expect(activeIndex([16, 428, 840], false)).toBe(0);
        expect(activeIndex([-300, 16, 428], false)).toBe(1);
    });

    it('is the last slide once the track is scrolled to its end', () => {
        expect(activeIndex([-900, -400, 20], true)).toBe(2);
        expect(activeIndex([-900, -400, 300], true)).toBe(2);
    });

    it('is 0 for an empty rail', () => {
        expect(activeIndex([], false)).toBe(0);
    });
});

describe('collageTools', () => {
    const tools = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
    it('starts six tools further in per crew slide, then fills the nine cells from the start', () => {
        expect(collageTools(tools, 0)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'a', 'b', 'c']);
        expect(collageTools(tools, 1)).toEqual(['g', 'h', 'i', 'j', 'k', 'a', 'b', 'c', 'd']);
    });
    it('is empty without tools', () => {
        expect(collageTools([], 0)).toEqual([]);
    });
});
