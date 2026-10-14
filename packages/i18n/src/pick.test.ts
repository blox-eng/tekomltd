import { describe, it, expect } from 'vitest';
import { pick } from './pick';

const row = { title_bg: 'Очен медицински център', title_en: 'Eye clinic', title_de: null };

describe('pick', () => {
    it('returns the locale text', () => expect(pick(row, 'title', 'en')).toEqual({ text: 'Eye clinic', fallback: false }));
    it('falls back to Bulgarian', () => expect(pick(row, 'title', 'de')).toEqual({ text: 'Очен медицински център', fallback: true }));
    it('treats blank text as missing', () => expect(pick({ ...row, title_en: '  ' }, 'title', 'en').fallback).toBe(true));
    it('returns Bulgarian without fallback for bg', () => expect(pick(row, 'title', 'bg')).toEqual({ text: 'Очен медицински център', fallback: false }));
    it('returns an empty string when Bulgarian is missing too', () => expect(pick({}, 'title', 'de')).toEqual({ text: '', fallback: true }));
});
