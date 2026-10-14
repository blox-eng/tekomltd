import { describe, it, expect } from 'vitest';
import bg from '../messages/bg.json';
import en from '../messages/en.json';
import de from '../messages/de.json';
import { LOCALES, DEFAULT_LOCALE } from './locales';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
    return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof value === 'string' ? { ...acc, [path]: value } : { ...acc, ...flatten(value, path) };
    }, {});
}

const catalogues = { bg: flatten(bg), en: flatten(en), de: flatten(de) };

describe('locales', () => {
    it('lists bg, en, de with bg as default', () => {
        expect(LOCALES).toEqual(['bg', 'en', 'de']);
        expect(DEFAULT_LOCALE).toBe('bg');
    });
});

describe('message catalogues', () => {
    it('have the same key set', () => {
        const keys = Object.keys(catalogues.bg).sort();
        expect(Object.keys(catalogues.en).sort()).toEqual(keys);
        expect(Object.keys(catalogues.de).sort()).toEqual(keys);
    });
    it.each(Object.entries(catalogues))('%s has no empty value', (_locale, flat) => {
        expect(Object.entries(flat).filter(([, value]) => value.trim() === '')).toEqual([]);
    });
});
