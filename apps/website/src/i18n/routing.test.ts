import { describe, expect, it } from 'vitest';
import { localePath, routing } from './routing';

describe('localePath', () => {
    it('leaves Bulgarian without a prefix', () => {
        expect(localePath('/', 'bg')).toBe('/');
        expect(localePath('/contact', 'bg')).toBe('/contact');
    });

    it('prefixes en and de', () => {
        expect(localePath('/', 'en')).toBe('/en');
        expect(localePath('/contact', 'de')).toBe('/de/contact');
    });
});

describe('routing', () => {
    it('sets no cookie and does not detect the browser language', () => {
        expect(routing.localeCookie).toBe(false);
        expect(routing.localeDetection).toBe(false);
        expect(routing.localePrefix).toBe('as-needed');
    });

    it('sends no hreflang Link header: the HTML alternates are the only ones, and they leave out fallback pages', () => {
        expect(routing.alternateLinks).toBe(false);
    });
});
