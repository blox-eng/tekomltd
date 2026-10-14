import { describe, expect, it } from 'vitest';
import { formatDate, formatEur, formatSize } from './format';

describe('formatEur', () => {
    it('groups and places the euro sign per locale', () => {
        expect(formatEur(175569.98, 'en')).toBe('€175,569.98');
        expect(formatEur(175569.98, 'de')).toMatch(/^175\.569,98\s€$/);
        expect(formatEur(175569.98, 'bg')).toMatch(/175.569,98.€/);
    });
});

describe('formatDate', () => {
    it('writes a day, month name and year', () => {
        expect(formatDate('2025-02-01', 'en')).toBe('1 February 2025');
        expect(formatDate('2025-02-01', 'de')).toBe('1. Februar 2025');
    });
});

describe('formatSize', () => {
    it('picks KB or MB', () => {
        expect(formatSize(900)).toBe('1 KB');
        expect(formatSize(250_000)).toBe('244 KB');
        expect(formatSize(1_800_000)).toBe('1.7 MB');
    });
});
