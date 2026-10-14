import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { crewRoles, crews, enquiries, legalPages, projectImages, projects, railPanels, siteSettings } from './schema';
import { createTestDb, type TestDb } from './testing';

let db: TestDb['db'];
let close: TestDb['close'];

beforeAll(async () => {
    ({ db, close } = await createTestDb());
});
afterAll(async () => close());

beforeEach(async () => {
    await db.execute(
        sql`truncate projects, project_images, project_slug_history, rail_panels, crews, crew_roles, legal_pages, site_settings, enquiries cascade`
    );
});

const minimal = { slug: 'eye-clinic', titleBg: 'Очен медицински център', summaryBg: 'Кратко описание.', placeBg: 'Стара Загора' };

describe('projects', () => {
    it('needs Bulgarian title', async () => {
        await expect(db.insert(projects).values({ ...minimal, titleBg: null as never })).rejects.toThrow();
    });

    it('keeps slugs unique', async () => {
        await db.insert(projects).values(minimal);
        await expect(db.insert(projects).values(minimal)).rejects.toThrow();
    });

    it('allows only known scopes', async () => {
        await db.insert(projects).values({ ...minimal, scopes: ['full', 'stone'] });
        await expect(db.insert(projects).values({ ...minimal, slug: 'other', scopes: ['roofing' as never] })).rejects.toThrow();
    });

    it('caps the summary at 420 characters', async () => {
        await db.insert(projects).values({ ...minimal, summaryBg: 'а'.repeat(420) });
        await expect(db.insert(projects).values({ ...minimal, slug: 'other', summaryBg: 'а'.repeat(421) })).rejects.toThrow();
    });

    it('starts as a draft', async () => {
        const [row] = await db.insert(projects).values(minimal).returning();
        expect(row?.published).toBe(false);
    });

    it('stamps updated_at on every update', async () => {
        const [row] = await db.insert(projects).values(minimal).returning();
        await new Promise((r) => setTimeout(r, 10));
        await db.update(projects).set({ titleEn: 'Eye clinic' }).where(eq(projects.id, row!.id));
        const [after] = await db.select().from(projects).where(eq(projects.id, row!.id));
        expect(Date.parse(after!.updatedAt)).toBeGreaterThan(Date.parse(row!.updatedAt));
    });

    it('allows one cover per project', async () => {
        const [p] = await db.insert(projects).values(minimal).returning();
        const image = { projectId: p!.id, width: 2400, height: 1600, altBg: 'Корица', isCover: true };
        await db.insert(projectImages).values({ ...image, storagePath: 'projects/eye-clinic/a.jpg' });
        await expect(db.insert(projectImages).values({ ...image, storagePath: 'projects/eye-clinic/b.jpg' })).rejects.toThrow();
    });
});

describe('rail_panels', () => {
    const capability = { kind: 'capability' as const, labelBg: 'Наш екип', titleBg: 'Фасади', bodyBg: 'Текст.', afterProjectIndex: 0 };

    it('allows at most one red panel', async () => {
        await db.insert(railPanels).values({ ...capability, accent: true });
        await expect(db.insert(railPanels).values({ ...capability, accent: true })).rejects.toThrow();
    });

    it('needs a value on a crew stat', async () => {
        await expect(
            db.insert(railPanels).values({ kind: 'crew_stat', labelBg: 'години на обекта', bodyBg: 'Текст.', afterProjectIndex: 3 })
        ).rejects.toThrow();
        await db.insert(railPanels).values({ kind: 'crew_stat', statValue: '25', labelBg: 'години на обекта', bodyBg: 'Текст.', afterProjectIndex: 3 });
    });

    it('needs a title on a capability panel', async () => {
        await expect(db.insert(railPanels).values({ ...capability, titleBg: null })).rejects.toThrow();
    });
});

describe('crew_roles', () => {
    it('allows only known tool glyphs', async () => {
        const [crew] = await db.insert(crews).values({ key: 'site', titleBg: 'Екипът на обекта', bodyBg: 'Текст.', scene: 'site' }).returning();
        const role = { crewId: crew!.id, roleBg: 'Бригадир', years: 22 };
        await db.insert(crewRoles).values({ ...role, tool: 'plumb' });
        await expect(db.insert(crewRoles).values({ ...role, tool: 'hammer' as never })).rejects.toThrow();
    });
});

describe('legal_pages', () => {
    it('allows only the four legal slugs', async () => {
        await db.insert(legalPages).values({ slug: 'privacy', titleBg: 'Поверителност', bodyBg: '# Текст' });
        await expect(db.insert(legalPages).values({ slug: 'imprint' as never, titleBg: 'X', bodyBg: 'X' })).rejects.toThrow();
    });

    it('starts unreviewed', async () => {
        const [row] = await db.insert(legalPages).values({ slug: 'terms', titleBg: 'Условия', bodyBg: '# Текст' }).returning();
        expect(row?.reviewed).toBe(false);
    });
});

describe('site_settings', () => {
    const settings = {
        legalName: 'Теком ЕООД',
        eik: '123456789',
        addressBg: 'Стара Загора',
        phone: '+359 42 000 000',
        email: 'office@tekomltd.com',
        privacyEmail: 'privacy@tekomltd.com',
        headlineTurnBg: ['Хората зад ', 'всеки обект', 'всяка фасада']
    };

    it('allows one site_settings row', async () => {
        await db.insert(siteSettings).values(settings);
        await expect(db.insert(siteSettings).values(settings)).rejects.toThrow();
    });

    it('needs a start and two to four turning phrases', async () => {
        await expect(db.insert(siteSettings).values({ ...settings, headlineTurnBg: ['Хората зад ', 'всеки обект'] })).rejects.toThrow();
    });
});

describe('enquiries', () => {
    const enquiry = {
        name: 'Иван',
        email: 'ivan@example.com',
        scope: 'facade' as const,
        message: 'Здравейте.',
        locale: 'bg',
        consentAt: new Date().toISOString()
    };

    it('needs consent', async () => {
        await expect(db.insert(enquiries).values({ ...enquiry, consentAt: null as never })).rejects.toThrow();
    });

    it('allows only known locales', async () => {
        await db.insert(enquiries).values(enquiry);
        await expect(db.insert(enquiries).values({ ...enquiry, locale: 'fr' })).rejects.toThrow();
    });
});
