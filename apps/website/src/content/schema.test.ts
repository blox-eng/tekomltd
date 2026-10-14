import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { checkContent, main } from './check';
import { CrewRole, EuProgramme, Home, L, LegalPage, Page, Partner, Project, PromiseItem, Publication, RailPanel, Settings, Stat } from './schema';

const fixture = (name: string) => join(__dirname, '__fixtures__', name);

const minimal = { slug: 'a-b', title: { bg: 'Заглавие' }, place: { bg: 'Стара Загора' } };
const role = { tool: 'plumb', role: { bg: 'Бригадир' }, years: 22, quip: { bg: 'Шега' } };

describe('L', () => {
    it('needs Bulgarian', () => expect(L.safeParse({ en: 'x' }).success).toBe(false));
    it('rejects blank Bulgarian', () => expect(L.safeParse({ bg: '   ' }).success).toBe(false));
    it('allows missing en and de', () => expect(L.safeParse({ bg: 'x' }).success).toBe(true));
    it('rejects another locale', () => expect(L.safeParse({ bg: 'x', fr: 'y' }).success).toBe(false));
});

describe('Project', () => {
    it('accepts the minimal project and fills defaults', () => {
        const r = Project.parse(minimal);
        expect(r).toMatchObject({ show_on_map: false, wide: false, on_rail: true, draft: false, old_slugs: [], scopes: [], images: [] });
    });
    it('needs a Bulgarian title', () => expect(Project.safeParse({ ...minimal, title: { en: 'x' } }).success).toBe(false));
    it('allows only known scopes', () => expect(Project.safeParse({ ...minimal, scopes: ['roofing'] }).success).toBe(false));
    it('accepts known scopes', () => expect(Project.safeParse({ ...minimal, scopes: ['full', 'restore', 'facade', 'interior', 'stone'] }).success).toBe(true));
    it('rejects a slug with capitals or spaces', () => {
        expect(Project.safeParse({ ...minimal, slug: 'Green Bath' }).success).toBe(false);
    });
    it('caps a summary at 460 characters', () => {
        expect(Project.safeParse({ ...minimal, summary: { bg: 'я'.repeat(460) } }).success).toBe(true);
        expect(Project.safeParse({ ...minimal, summary: { bg: 'я'.repeat(461) } }).success).toBe(false);
        expect(Project.safeParse({ ...minimal, summary: { bg: 'ok', en: 'x'.repeat(461) } }).success).toBe(false);
    });
    it('rejects coordinates outside the globe', () => {
        expect(Project.safeParse({ ...minimal, lat: 91, lng: 25 }).success).toBe(false);
    });
    it('needs lat and lng together', () => expect(Project.safeParse({ ...minimal, lat: 42 }).success).toBe(false));
    it('rejects a file path that leaves the content folder', () => {
        const image = { file: '../secret.jpg' };
        expect(Project.safeParse({ ...minimal, images: [image] }).success).toBe(false);
        expect(Project.safeParse({ ...minimal, images: [{ ...image, file: '/etc/passwd.jpg' }] }).success).toBe(false);
    });
    it('allows one cover at most', () => {
        const image = { file: 'a.jpg', is_cover: true };
        expect(Project.safeParse({ ...minimal, images: [image, { ...image, file: 'b.jpg' }] }).success).toBe(false);
    });
    it('rejects an unknown key', () => expect(Project.safeParse({ ...minimal, published: true }).success).toBe(false));
});

describe('CrewRole', () => {
    it('accepts a crew glyph', () => expect(CrewRole.safeParse(role).success).toBe(true));
    it('allows only known glyph keys', () => expect(CrewRole.safeParse({ ...role, tool: 'hammer' }).success).toBe(false));
    it('rejects a service glyph that is not a crew glyph', () => expect(CrewRole.safeParse({ ...role, tool: 'solar' }).success).toBe(false));
});

describe('RailPanel', () => {
    const base = { after_project_index: 0, body: { bg: 'т' } };
    it('accepts a capability panel', () => {
        expect(RailPanel.safeParse({ ...base, kind: 'capability', label: { bg: 'л' }, title: { bg: 'з' } }).success).toBe(true);
    });
    it('accepts a crew stat panel', () => {
        expect(RailPanel.safeParse({ ...base, kind: 'crew_stat', stat_value: '25', unit: { bg: 'години' } }).success).toBe(true);
    });
    it('marks a crew stat confirmed unless flagged', () => {
        const stat = { ...base, kind: 'crew_stat', stat_value: '35', unit: { bg: 'години' } };
        expect(RailPanel.parse(stat)).toMatchObject({ unconfirmed: false });
        expect(RailPanel.parse({ ...stat, unconfirmed: true })).toMatchObject({ unconfirmed: true });
    });
    it('needs a stat value on a crew stat', () => {
        expect(RailPanel.safeParse({ ...base, kind: 'crew_stat', unit: { bg: 'години' } }).success).toBe(false);
    });
    it('rejects a negative position', () => {
        expect(RailPanel.safeParse({ ...base, after_project_index: -1, kind: 'capability', label: { bg: 'л' }, title: { bg: 'з' } }).success).toBe(false);
    });
});

describe('Home', () => {
    it('allows one red panel at most', () => {
        const red = { kind: 'capability', after_project_index: 0, accent: true, label: { bg: 'л' }, title: { bg: 'з' }, body: { bg: 'т' } };
        expect(Home.safeParse({ rail_panels: [red, { ...red, after_project_index: 1 }] }).success).toBe(false);
        expect(Home.safeParse({ rail_panels: [red] }).success).toBe(true);
    });
    it('defaults every list to empty', () => expect(Home.parse({})).toMatchObject({ partners: [], stats: [], crews: [] }));
});

describe('smaller types', () => {
    it('Promise needs title and body', () => {
        expect(PromiseItem.safeParse({ title: { bg: 'а' } }).success).toBe(false);
    });
    it('Partner may have no url', () => {
        expect(Partner.safeParse({ name: 'N', role: { bg: 'Дограма' }, logo: 'partners/n.svg' }).success).toBe(true);
    });
    it('Partner logo must be png or svg', () => {
        expect(Partner.safeParse({ name: 'N', role: { bg: 'Дограма' }, logo: 'partners/n.gif' }).success).toBe(false);
    });
    it('EuProgramme needs a real date', () => {
        const p = { code: 'X', title: { bg: 'а' }, summary: { bg: 'а' }, objectives: { bg: 'а' }, results: { bg: 'а' } };
        expect(EuProgramme.safeParse({ ...p, period_start: '2024-02-30' }).success).toBe(false);
        expect(EuProgramme.safeParse({ ...p, period_start: '2024-02-29' }).success).toBe(true);
    });
    it('LegalPage knows only the four slugs', () => {
        const page = { locale: 'bg', title: 'т', updated: '2026-10-14', reviewed: false, body: 'b' };
        expect(LegalPage.safeParse({ ...page, slug: 'privacy' }).success).toBe(true);
        expect(LegalPage.safeParse({ ...page, slug: 'imprint' }).success).toBe(false);
    });
    it('Settings needs two Bulgarian headline phrases', () => {
        const s = { legal_name: 'Т', founded: 1991, address: { bg: 'а' }, phone: '1', email: 'a@b.bg', privacy_email: 'p@b.bg' };
        expect(Settings.safeParse({ ...s, crew_headline: { bg: ['Хората зад мазилката'] } }).success).toBe(false);
        expect(Settings.safeParse({ ...s, crew_headline: { bg: ['Хората зад мазилката', 'Хората зад мечтата'] } }).success).toBe(true);
    });
    it('Stat value is a number, or text for a placeholder like {years}', () => {
        expect(Stat.parse({ value: 24000, label: { bg: 'м²' } }).value).toBe(24000);
        expect(Stat.parse({ value: '{years}', label: { bg: 'години' } }).value).toBe('{years}');
        expect(Stat.safeParse({ value: ' ', label: { bg: 'x' } }).success).toBe(false);
    });
    it('Settings needs the founding year', () => {
        const s = { legal_name: 'Т', address: { bg: 'а' }, phone: '1', email: 'a@b.bg', privacy_email: 'p@b.bg', crew_headline: { bg: ['А б', 'А в'] } };
        expect(Settings.safeParse(s).success).toBe(false);
        expect(Settings.safeParse({ ...s, founded: 1991, hours: { bg: 'Пон – Пет' } }).success).toBe(true);
    });
    it('Publication takes office documents and scans, not programs', () => {
        const p = { kind: 'procurement', title: { bg: 'Покана' }, published_on: '2026-03-17' };
        for (const file of [
            'publications/a.pdf',
            'publications/a.docx',
            'publications/a.doc',
            'publications/a.xlsx',
            'publications/a.png',
            'publications/a.jpg'
        ]) {
            expect(Publication.safeParse({ ...p, file }).success).toBe(true);
        }
        expect(Publication.safeParse({ ...p, file: 'publications/a.exe' }).success).toBe(false);
    });
    it('Page needs a title and a real date', () => {
        const page = { slug: 'about', locale: 'bg', title: 'За нас', updated: '2025-03-24', wp_url: 'https://www.tekomltd.com/about/', body: 'Текст.' };
        expect(Page.safeParse(page).success).toBe(true);
        expect(Page.safeParse({ ...page, title: ' ' }).success).toBe(false);
        expect(Page.safeParse({ ...page, slug: 'За нас' }).success).toBe(false);
    });
});

describe('checkContent', () => {
    it('passes a complete valid tree', () => expect(checkContent(fixture('valid'))).toEqual({ ok: true }));

    it('reports a published project without photos, but allows a draft', () => {
        const r = checkContent(fixture('no-photos'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.errors).toEqual([{ file: 'projects/bare-site/project.yaml', path: 'images', message: expect.stringMatching(/no photos/) }]);
    });

    it('reports a missing image with its file', () => {
        const r = checkContent(fixture('missing-image'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.errors).toHaveLength(1);
        expect(r.errors[0]!.file).toMatch(/project\.yaml$/);
        expect(r.errors[0]!.path).toBe('images.0.file');
        expect(r.errors[0]!.message).toMatch(/cover\.jpg/);
    });

    it('rejects headline phrases with a different start', () => {
        const r = checkContent(fixture('bad-headline'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.errors[0]!.file).toBe('settings.yaml');
        expect(r.errors[0]!.path).toBe('crew_headline.bg');
        expect(r.errors[0]!.message).toMatch(/Екипът зад мечтата/);
    });

    it('rejects a slug that does not match its folder', () => {
        const r = checkContent(fixture('slug-mismatch'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.errors[0]).toMatchObject({ path: 'slug' });
        expect(r.errors[0]!.message).toMatch(/green-bath-eye-clinic/);
    });

    it('rejects an old slug that is a current slug', () => {
        const r = checkContent(fixture('old-slug-collision'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.errors.some((e) => e.path === 'old_slugs.0' && /green-bath-eye-clinic/.test(e.message))).toBe(true);
    });

    it('reports every error, not just the first', () => {
        const r = checkContent(fixture('many-errors'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        const where = r.errors.map((e) => `${e.file}:${e.path}`);
        expect(where).toEqual(
            expect.arrayContaining([
                'projects/green-bath-eye-clinic/project.yaml:scopes.0',
                'projects/green-bath-eye-clinic/project.yaml:year',
                'home.yaml:crews.0.roles.0.tool'
            ])
        );
    });

    it('checks references between files', () => {
        const r = checkContent(fixture('bad-refs'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        const where = r.errors.map((e) => `${e.file}:${e.path}`);
        expect(where).toEqual(
            expect.arrayContaining([
                'publications.yaml:0.programme',
                'eu-programmes.yaml:1.code',
                'legal/terms.en.md:(file)',
                'projects/no-yaml/project.yaml:(file)',
                'home.yaml:rail_panels'
            ])
        );
    });

    it('requires settings.yaml, home.yaml, eu-programmes.yaml and publications.yaml when the root exists', () => {
        const r = checkContent(fixture('no-required-files'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.errors.map((e) => e.file)).toEqual(['settings.yaml', 'home.yaml', 'publications.yaml']);
    });

    it('rejects image sizes in content files', () => {
        expect(Project.safeParse({ ...minimal, images: [{ file: 'a.jpg', width: 1, height: 1 }] }).success).toBe(false);
    });

    it('fails on a missing root', () => {
        const r = checkContent(fixture('does-not-exist'));
        expect(r.ok).toBe(false);
    });

    it('exits 1 from the CLI when the content folder is missing', () => {
        const errors: unknown[] = [];
        const spy = vi.spyOn(console, 'error').mockImplementation((...args) => void errors.push(args));
        expect(main(['node', 'check.ts', fixture('does-not-exist')])).toBe(1);
        spy.mockRestore();
        expect(String(errors[0])).toContain('content folder not found');
    });

    it('checks pages and their links to media files', () => {
        const r = checkContent(fixture('bad-page'));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.errors).toEqual([
            { file: 'pages/About Us.bg.md', path: '(file)', message: 'name must be <slug>.<bg|en|de>.md' },
            { file: 'pages/about.bg.md', path: 'title', message: expect.any(String) },
            { file: 'pages/about.bg.md', path: 'body', message: 'file not found: /media/pages/about/missing.jpg' },
            { file: 'pages/free-positions.en.md', path: '(file)', message: 'needs the Bulgarian page pages/free-positions.bg.md' }
        ]);
    });
});
