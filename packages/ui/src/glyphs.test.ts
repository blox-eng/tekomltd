import { describe, expect, it } from 'vitest';
import { CREW_GLYPH_KEYS, GLYPHS, SERVICE_GLYPH_KEYS, STATUS_GLYPHS } from './glyphs';

const crew = 'plumb trowel boards roller tiles spatula hat brick truss key ledger square laptop'.split(' ');
const services = 'blueprint square beam permit survey bolt drop air window kitchen leaf solar tree'.split(' ');
const keys = [...new Set([...crew, ...services])];

describe('GLYPHS', () => {
    it('has 25 unique keys', () => {
        expect(keys).toHaveLength(25);
    });

    it('lists the crew and service keys', () => {
        expect([...CREW_GLYPH_KEYS]).toEqual(crew);
        expect([...SERVICE_GLYPH_KEYS]).toEqual(services);
    });

    it('has a glyph for each unit status', () => {
        expect(STATUS_GLYPHS).toEqual({ free: 'door', reserved: 'hourglass', upcoming: 'blueprint', sold: 'key' });
        for (const key of Object.values(STATUS_GLYPHS)) expect(GLYPHS).toHaveProperty(key);
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
