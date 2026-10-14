import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { excerpt, galleryUrls, parseDetails, slugifyFile } from './wp-parse';

type Item = { id: number; content: { rendered: string } };
const fixture: Item[] = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'design', 'mockup', 'data', 'portfolio.json'), 'utf8'));
const byId = (items: Item[], id: number) => {
    const item = items.find((x) => x.id === id);
    if (!item) throw new Error(`no portfolio item ${id}`);
    return item;
};

describe('parseDetails', () => {
    const p = byId(fixture, 1952);
    it('reads the details block', () =>
        expect(parseDetails(p.content.rendered)).toEqual({ date: '30-ти Април , 2025 г.', address: 'ул. “Х. Д. Асенов” № 93, Ст. Загора', areaM2: 872 }));
    it('treats an unknown date as missing', () => expect(parseDetails(byId(fixture, 912).content.rendered).date).toBeNull());
    it('reads the area after РЗП', () => expect(parseDetails(byId(fixture, 1323).content.rendered).areaM2).toBe(1200));
    it('has no area when the block has none', () => expect(parseDetails(byId(fixture, 1601).content.rendered).areaM2).toBeNull());
    it('returns nulls without a details block', () => expect(parseDetails('<p>Нищо.</p>')).toEqual({ date: null, address: null, areaM2: null }));
});

describe('excerpt', () => {
    it('cuts the excerpt at a real sentence end', () => {
        const e = excerpt(byId(fixture, 1866).content.rendered);
        expect(e.length).toBeLessThanOrEqual(420);
        expect(e.endsWith('инж.')).toBe(false);
        expect(e.endsWith('.')).toBe(true);
    });
    it('parses every project in the fixture', () => expect(fixture.map((x) => excerpt(x.content.rendered)).every(Boolean)).toBe(true));
    it('keeps every excerpt within 420 characters', () => expect(fixture.every((x) => excerpt(x.content.rendered).length <= 420)).toBe(true));
    it('never cuts after an abbreviation', () => {
        const ends = fixture.map((x) => excerpt(x.content.rendered));
        expect(ends.filter((e) => /(?<!\p{L})(ул|инж|арх|гр|с|кв|г|Х|Д)\.$/u.test(e))).toEqual([]);
    });
});

describe('galleryUrls', () => {
    it('keeps full-size gallery images only', () => {
        const urls = galleryUrls(byId(fixture, 1849).content.rendered);
        expect(urls.length).toBeGreaterThan(0);
        expect(urls.some((u) => /-\d+x\d+\.(jpe?g|png|webp)$/.test(u))).toBe(false);
        expect(new Set(urls).size).toBe(urls.length);
    });
    it('dedupes a thumbnail and its scaled original', () =>
        expect(
            galleryUrls('<a href="https://x.test/wp-content/uploads/a/DSC-scaled.jpg"><img src="https://x.test/wp-content/uploads/a/DSC-460x295.jpg"></a>')
        ).toEqual(['https://x.test/wp-content/uploads/a/DSC-scaled.jpg']));
});

describe('slugifyFile', () => {
    it('transliterates Bulgarian names', () => expect(slugifyFile('Публична-покана_ТЕКОМ.pdf')).toBe('publichna-pokana-tekom.pdf'));
    it('keeps latin names readable', () => expect(slugifyFile('DSC_0291-1-scaled.JPG')).toBe('dsc-0291-1-scaled.jpg'));
});
