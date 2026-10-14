import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertFirstRun, mergeImages, removeStale } from './reimport';

describe('assertFirstRun', () => {
    const dir = mkdtempSync(join(tmpdir(), 'reimport-'));
    it('runs when nothing was imported yet', () => expect(() => assertFirstRun([join(dir, 'projects')], false)).not.toThrow());
    it('refuses a second run without --force', () => {
        mkdirSync(join(dir, 'projects'));
        expect(() => assertFirstRun([join(dir, 'projects')], false)).toThrow(/--force/);
        expect(() => assertFirstRun([join(dir, 'projects')], true)).not.toThrow();
    });
});

describe('mergeImages', () => {
    const alt = { bg: 'Къща' };
    it('keeps added images, their order and the cover choice', () => {
        const existing = [
            { file: 'mine.jpg', alt: { bg: 'Моя', en: 'Mine' }, is_cover: true },
            { file: 'a.jpg', alt: { bg: 'Стара', en: 'House' } }
        ];
        expect(
            mergeImages(
                existing,
                [
                    { file: 'a.jpg', alt },
                    { file: 'b.jpg', alt }
                ],
                new Set(['a.jpg'])
            )
        ).toEqual([
            { file: 'mine.jpg', alt: { bg: 'Моя', en: 'Mine' }, is_cover: true },
            { file: 'a.jpg', alt: { bg: 'Къща', en: 'House' } },
            { file: 'b.jpg', alt }
        ]);
    });
    it('drops images the previous import wrote and this one did not', () => {
        expect(mergeImages([{ file: 'gone.jpg' }, { file: 'a.jpg' }], [{ file: 'a.jpg', alt }], new Set(['gone.jpg', 'a.jpg']))).toEqual([
            { file: 'a.jpg', alt, is_cover: true }
        ]);
    });
    it('makes the first imported image the cover of a new project', () => {
        expect(
            mergeImages(
                [],
                [
                    { file: 'a.jpg', alt },
                    { file: 'b.jpg', alt }
                ],
                new Set()
            )
        ).toEqual([
            { file: 'a.jpg', alt, is_cover: true },
            { file: 'b.jpg', alt }
        ]);
    });
});

describe('removeStale', () => {
    it('deletes only files the previous import wrote and this one did not', () => {
        const dir = mkdtempSync(join(tmpdir(), 'reimport-'));
        const [old, kept, mine] = ['old.jpg', 'kept.jpg', 'mine.jpg'].map((f) => join(dir, f)) as [string, string, string];
        for (const f of [old, kept, mine]) writeFileSync(f, 'x');
        expect(removeStale([old, kept], new Set([kept]))).toEqual([old]);
        expect([existsSync(old), existsSync(kept), existsSync(mine)]).toEqual([false, true, true]);
    });
});
