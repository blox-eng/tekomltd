import { describe, expect, it } from 'vitest';
import { formatStat } from './format';

describe('formatStat', () => {
    it('groups thousands the way each locale does', () => {
        expect(formatStat(24000, 'bg', false)).toBe('24 000');
        expect(formatStat(24000, 'en', false)).toBe('24,000');
        expect(formatStat(24000, 'de', false)).toBe('24.000');
    });
    it('leaves text values alone', () => expect(formatStat('35', 'bg', false)).toBe('35'));
    it('marks an unconfirmed value with an asterisk', () => expect(formatStat(1, 'en', true)).toBe('1*'));
});
