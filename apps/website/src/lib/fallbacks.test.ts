import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fallbackLocalesOf } from './fallbacks';

const root = join(__dirname, '..', 'content', '__fixtures__', 'loader');

describe('fallbackLocalesOf', () => {
    it('flags the locales whose project title is the Bulgarian one', () => {
        expect(fallbackLocalesOf('/projects/old-town-house', root)).toEqual(['en', 'de']);
        expect(fallbackLocalesOf('/projects/third-site', root)).toEqual(['de']);
        expect(fallbackLocalesOf('/projects/green-bath-eye-clinic', root)).toContain('de');
    });
    it('flags a carried-over page and a legal page that fall back', () => {
        expect(fallbackLocalesOf('/free-positions', root)).toEqual(['en', 'de']);
        expect(fallbackLocalesOf('/privacy', root)).toEqual(['de']);
    });
    it('flags the EU page when a programme text falls back', () => {
        expect(fallbackLocalesOf('/eu-programmes', root)).toContain('en');
    });
    it('has no fallback for pages made of translated chrome', () => {
        expect(fallbackLocalesOf('/', root)).toEqual([]);
        expect(fallbackLocalesOf('/contact', root)).toEqual([]);
        expect(fallbackLocalesOf('/projects', root)).toEqual([]);
    });
});
