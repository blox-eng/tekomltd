import { describe, expect, it } from 'vitest';
import type { ProjectCard } from '@/content/cards';
import { groupByYear } from './years';

const card = (slug: string, year: number | null, inProgress = false) => ({ slug, year, inProgress }) as ProjectCard;

describe('groupByYear', () => {
    it('puts work in progress first, then years newest first, then projects without a year', () => {
        const groups = groupByYear([card('a', 2013), card('b', null), card('c', 2021), card('d', null, true), card('e', 2013), card('f', 2025)]);
        expect(groups.map((g) => [g.key, g.projects.map((p) => p.slug)])).toEqual([
            ['now', ['d']],
            [2025, ['f']],
            [2021, ['c']],
            [2013, ['a', 'e']],
            ['none', ['b']]
        ]);
    });
    it('keeps the given order inside a year', () =>
        expect(groupByYear([card('x', 2010), card('y', 2010)])[0]!.projects.map((p) => p.slug)).toEqual(['x', 'y']));
    it('leaves out groups with no project', () => expect(groupByYear([card('a', 2001)]).map((g) => g.key)).toEqual([2001]));
    it('gives each group an anchor id', () =>
        expect(groupByYear([card('d', null, true), card('a', 2001), card('b', null)]).map((g) => g.id)).toEqual(['y-now', 'y-2001', 'y-none']));
});
