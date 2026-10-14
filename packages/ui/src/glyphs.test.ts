import { describe, expect, it } from 'vitest';
import { GLYPHS } from './glyphs';

const crew = 'plumb trowel boards roller tiles spatula hat brick truss key ledger square laptop'.split(' ');
const services = 'blueprint square beam permit survey bolt drop air window kitchen leaf solar tree'.split(' ');
const keys = [...new Set([...crew, ...services])];

describe('GLYPHS', () => {
    it('has 25 unique keys', () => {
        expect(keys).toHaveLength(25);
    });

    it.each(keys)('has %s', (key) => {
        expect(GLYPHS).toHaveProperty(key);
    });

    it('is line-only and script-free', () => {
        for (const [key, svg] of Object.entries(GLYPHS)) {
            expect(svg, key).not.toContain('fill=');
            expect(svg, key).not.toContain('<script');
        }
    });
});
