import { describe, expect, it } from 'vitest';
import { fallbackNote, projectFacts } from './facts';

const labels = { address: 'Address', completed: 'Completed', area: 'Built area', scope: 'Our scope' };
const scopeLabels = { full: 'Full build', facade: 'Facade' };
const base = { address: 'ul. 1', place: 'Stara Zagora', year: 2015, areaM2: 2000, scopes: ['full', 'facade'] as const };

describe('projectFacts', () => {
    it('lists every fact that is set', () => {
        expect(projectFacts({ ...base, scopes: [...base.scopes] }, labels, scopeLabels, 'en')).toEqual([
            { key: 'address', label: 'Address', value: 'ul. 1, Stara Zagora' },
            { key: 'completed', label: 'Completed', value: '2015' },
            { key: 'area', label: 'Built area', value: '2,000 m²' },
            { key: 'scope', label: 'Our scope', value: 'Full build, Facade' }
        ]);
    });

    it('hides a missing fact instead of printing null', () => {
        const facts = projectFacts({ address: null, place: 'Stara Zagora', year: null, areaM2: null, scopes: [] }, labels, scopeLabels, 'bg');
        expect(facts.map((f) => f.key)).toEqual(['address']);
        expect(facts[0]!.value).toBe('Stara Zagora');
        expect(JSON.stringify(facts)).not.toContain('null');
    });
});

describe('fallbackNote', () => {
    const keys = { note: 'Translation to follow', inBulgarian: 'Description in Bulgarian. Translation to follow.' };
    it('is empty when nothing fell back', () => {
        expect(fallbackNote({ titleFallback: false, summaryFallback: false }, keys)).toBeNull();
    });
    it('names the summary when it fell back', () => {
        expect(fallbackNote({ titleFallback: false, summaryFallback: true }, keys)).toBe(keys.inBulgarian);
        expect(fallbackNote({ titleFallback: true, summaryFallback: true }, keys)).toBe(keys.inBulgarian);
    });
    it('uses the short note when only the title fell back', () => {
        expect(fallbackNote({ titleFallback: true, summaryFallback: false }, keys)).toBe(keys.note);
    });
});
