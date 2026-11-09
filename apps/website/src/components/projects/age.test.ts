import { describe, expect, it } from 'vitest';
import { timeline, yearsStood } from './age';

const now = new Date(2026, 10, 9);

describe('yearsStood', () => {
    it('counts calendar years since completion', () => expect(yearsStood(2002, now)).toBe(24));
    it('is 0 in the year a project was finished', () => expect(yearsStood(2026, now)).toBe(0));
    it('rolls over on 1 January', () => expect(yearsStood(2025, new Date(2027, 0, 1))).toBe(2));
});

describe('timeline', () => {
    const projects = [
        { slug: 'b', title: 'B', year: 2011 },
        { slug: 'a', title: 'A', year: 2001 },
        { slug: 'c', title: 'C', year: 2011 },
        { slug: 'x', title: 'X', year: null }
    ];

    it('runs from the first year to today and leaves out undated projects', () => {
        const line = timeline(projects, now)!;
        expect([line.first, line.today, line.years]).toEqual([2001, 2026, 25]);
        expect(line.ticks.map((t) => t.slug)).toEqual(['a', 'b', 'c']);
    });
    it('places each tick by year and stacks a shared year', () => {
        const [a, b, c] = timeline(projects, now)!.ticks;
        expect([a!.at, b!.at, c!.at]).toEqual([0, 40, 40]);
        expect([b!.stack, c!.stack]).toEqual([0, 1]);
    });
    it('has nothing to draw without a dated project', () => expect(timeline([{ slug: 'x', title: 'X', year: null }], now)).toBeNull());
});
