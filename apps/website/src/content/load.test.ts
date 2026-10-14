import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkContent } from './check';
import { getHome } from './home';
import { allProjectSlugs, getProject, listProjects } from './projects';
import { allPageSlugs, getLegalPage, getPage, listProgrammes, listPublications } from './public-info';
import { getSettings } from './settings';

const root = join(__dirname, '__fixtures__', 'loader');

it('uses a fixture that passes the content check', () => expect(checkContent(root)).toEqual({ ok: true }));

describe('listProjects', () => {
    it('lists published projects by sort order and never drafts', () => {
        expect(listProjects('bg', root).map((p) => p.slug)).toEqual(['old-town-house', 'green-bath-eye-clinic', 'third-site']);
    });
    it('reads the image size from the file', () => {
        const card = listProjects('bg', root).find((p) => p.slug === 'green-bath-eye-clinic')!;
        expect(card.cover).toMatchObject({ src: '/media/projects/green-bath-eye-clinic/cover.jpg', width: 4, height: 3, alt: 'Фасадата на клиниката' });
    });
    it('uses the first image as cover when none is flagged, with the title as alt', () => {
        const card = listProjects('bg', root).find((p) => p.slug === 'old-town-house')!;
        expect(card.cover).toMatchObject({ src: '/media/projects/old-town-house/front.jpg', width: 8, height: 6, alt: 'Къща в стария град' });
    });
    it('falls back to Bulgarian for missing translations', () => {
        const cards = listProjects('en', root);
        expect(cards.find((p) => p.slug === 'old-town-house')).toMatchObject({ title: 'Къща в стария град', titleFallback: true });
        expect(cards.find((p) => p.slug === 'third-site')).toMatchObject({ title: 'Third site', titleFallback: false });
    });
    it('memoises per root', () => expect(listProjects('bg', root)).toEqual(listProjects('bg', root)));
});

describe('getProject', () => {
    it('returns the detail with the next project', () => {
        const p = getProject('old-town-house', 'bg', root)!;
        expect(p.next).toEqual({ slug: 'green-bath-eye-clinic', title: 'Очен медицински център в „Зелената баня“' });
        expect(p.images.map((i) => i.src)).toEqual(['/media/projects/old-town-house/front.jpg']);
    });
    it('wraps from the last project to the first', () => {
        expect(getProject('third-site', 'en', root)!.next).toEqual({ slug: 'old-town-house', title: 'Къща в стария град' });
    });
    it('keeps all gallery images in order', () => {
        expect(getProject('green-bath-eye-clinic', 'en', root)!.images.map((i) => [i.src, i.width])).toEqual([
            ['/media/projects/green-bath-eye-clinic/cover.jpg', 4],
            ['/media/projects/green-bath-eye-clinic/gallery/second.png', 5]
        ]);
    });
    it('returns null for an unknown slug and for a draft', () => {
        expect(getProject('nope', 'bg', root)).toBeNull();
        expect(getProject('hidden-draft', 'bg', root)).toBeNull();
    });
    it('flags a Bulgarian fallback title', () => expect(getProject('old-town-house', 'de', root)!.titleFallback).toBe(true));
});

describe('allProjectSlugs', () => {
    it('lists published projects with their old addresses and never drafts', () => {
        expect(allProjectSlugs(root)).toEqual([
            { slug: 'old-town-house', wpSlug: null, wpId: null, oldSlugs: [] },
            { slug: 'green-bath-eye-clinic', wpSlug: 'green-bath-eye-clinic', wpId: 1952, oldSlugs: ['eye-clinic'] },
            { slug: 'third-site', wpSlug: null, wpId: null, oldSlugs: [] }
        ]);
    });
});

describe('getHome', () => {
    it('puts only published on-rail projects on the rail, in sort order', () => {
        expect(getHome('bg', root).rail.map((c) => c.slug)).toEqual(['old-town-house', 'green-bath-eye-clinic']);
    });
    it('returns an empty partners list', () => expect(getHome('bg', root).partners).toEqual([]));
    it('localises panels, stats and crews', () => {
        const home = getHome('en', root);
        expect(home.panels[0]).toMatchObject({ kind: 'capability', afterProjectIndex: 0, accent: true, label: 'Our own crew', title: 'Facades' });
        const years = String(new Date().getFullYear() - 1991);
        expect(home.panels[1]).toMatchObject({ kind: 'crew_stat', statValue: years, unit: 'years on site', unconfirmed: false });
        expect(home.stats).toEqual([
            { value: years, label: 'години строим в Стара Загора', unconfirmed: false },
            { value: '1', label: 'семейство, две поколения на обекта', unconfirmed: true }
        ]);
        expect(home.crews[0]).toMatchObject({ key: 'site', scene: 'site', title: 'The crew on site' });
        expect(home.crews[0]!.roles[0]).toMatchObject({ tool: 'plumb', role: 'Foreman', years: 22 });
        expect(home.crews[1]!.title).toBe('Екипът в офиса');
    });
    it('loads brand logos with their size', () => {
        expect(getHome('bg', root).brands).toEqual([
            { name: 'Baumit', url: null, logo: { src: '/media/brands/baumit.png', width: 6, height: 2, alt: 'Baumit' } }
        ]);
    });
    it('includes the settings', () => expect(getHome('bg', root).settings.phone).toBe('+359 42 000 000'));
});

describe('getSettings', () => {
    it('picks the headline phrases for the locale and falls back to Bulgarian', () => {
        expect(getSettings('en', root).crewHeadline).toEqual(['The people behind the plaster', 'The people behind your dream home']);
        expect(getSettings('de', root).crewHeadline[0]).toBe('Хората зад мазилката');
    });
    it('localises address and meta', () => {
        expect(getSettings('en', root)).toMatchObject({ legalName: 'ТЕКОМ ООД', address: 'Stara Zagora, Bulgaria', email: 'office@example.com' });
    });
    it('carries the founding year, the second phone and the office hours', () => {
        expect(getSettings('en', root)).toMatchObject({ founded: 1991, phoneAlt: '+359 88 000 000', hours: 'Пон – Пет 9.00 – 18.00' });
    });
});

describe('public information', () => {
    it('lists programmes', () => {
        expect(listProgrammes('bg', root)).toMatchObject([
            { code: 'BG16RFPR001-1.004', totalBudgetEur: 120000, euContributionEur: 60000, periodEnd: '2025-12-31' }
        ]);
    });
    it('lists publications, newest first, filtered by kind', () => {
        expect(listPublications('bg', undefined, root)).toMatchObject([
            { kind: 'eu_notice', file: '/media/publications/notice.pdf', publishedOn: '2025-03-01' }
        ]);
        expect(listPublications('bg', 'procurement', root)).toEqual([]);
    });
    it('returns a legal page and falls back to Bulgarian', () => {
        expect(getLegalPage('privacy', 'en', root)).toMatchObject({ title: 'Privacy policy', fallback: false });
        expect(getLegalPage('privacy', 'de', root)).toMatchObject({ title: 'Политика за поверителност', body: 'Текст.', fallback: true });
        expect(getLegalPage('terms', 'bg', root)).toBeNull();
    });
    it('returns a WordPress page with its old address and falls back to Bulgarian', () => {
        expect(getPage('free-positions', 'en', root)).toMatchObject({
            title: 'Свободни позиции',
            wpUrl: 'https://www.tekomltd.com/free-positions/',
            body: 'Все още нямаме официално обявени свободни позиции.',
            fallback: true
        });
        expect(getPage('nope', 'bg', root)).toBeNull();
        expect(allPageSlugs(root)).toEqual([{ slug: 'free-positions', wpUrl: 'https://www.tekomltd.com/free-positions/' }]);
    });
});
