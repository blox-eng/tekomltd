import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { latestAnnouncement, leadOf } from './announcement';

const root = join(__dirname, '__fixtures__', 'sales');

describe('latestAnnouncement', () => {
    it('picks the newest home update of a published project', () =>
        expect(latestAnnouncement('bg', root)).toEqual({
            project: { slug: 'sale-block', title: 'Жилищна сграда „Пример“' },
            date: '2026-11-01',
            lead: 'Първите три апартамента вече имат собственици. Остават свободни обекти на всеки етаж, включително мезонетът на последния етаж с изглед към парка и гаражите в…',
            fallback: false,
            cta: { label: 'Свободни апартаменти', href: '/projects/sale-block#apartamenti' }
        }));

    it('uses the translation of the text and of the button', () =>
        expect(latestAnnouncement('en', root)).toMatchObject({
            lead: 'The first three flats have owners.',
            fallback: false,
            cta: { label: 'Available flats' }
        }));

    it('is null when no update is on the home page', () => expect(latestAnnouncement('bg', join(__dirname, '__fixtures__', 'loader'))).toBeNull());
});

describe('leadOf', () => {
    it('keeps the first paragraph as plain text', () => expect(leadOf('**Покрив** и [фасада](/x).\n\nОще')).toBe('Покрив и фасада.'));
    it('cuts a long paragraph at a word', () => expect(leadOf('дума '.repeat(50))).toMatch(/^(дума ){0,31}дума…$/));
});
