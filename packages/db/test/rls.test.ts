import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');
const editor = { email: 'rls-test@tekomltd.test', password: 'local-stack-only-password' };

function localStack() {
    const out = execFileSync(join(root, 'node_modules/.bin/supabase'), ['status', '-o', 'env'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
    });
    const env = Object.fromEntries(
        out
            .split('\n')
            .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
            .filter((m): m is RegExpMatchArray => m !== null)
            .map((m) => [m[1], m[2]])
    );
    for (const key of ['API_URL', 'DB_URL', 'ANON_KEY', 'SERVICE_ROLE_KEY']) {
        if (!env[key]) throw new Error(`supabase status has no ${key}; is the local stack running?`);
    }
    if (!/@(127\.0\.0\.1|localhost):/.test(env.DB_URL!)) throw new Error('RLS tests run against the local stack only');
    return env as Record<'API_URL' | 'DB_URL' | 'ANON_KEY' | 'SERVICE_ROLE_KEY', string>;
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

let sql: postgres.Sql;
let anon: SupabaseClient;
let service: SupabaseClient;
let authed: SupabaseClient;
let parents: { projectId: string; crewId: string };

const contentTables = [
    'projects',
    'project_slug_history',
    'project_images',
    'rail_panels',
    'promises',
    'stats',
    'crews',
    'crew_roles',
    'partner_services',
    'partners',
    'material_brands',
    'eu_programmes',
    'publications',
    'legal_pages',
    'site_settings'
] as const;

// Untyped on purpose: one fixture per table for the generic loops below.
function rowFor(table: (typeof contentTables)[number] | 'enquiries'): Record<string, any> {
    const n = Math.random().toString(36).slice(2, 8);
    switch (table) {
        case 'projects':
            return { slug: `p-${n}`, title_bg: 'Проект', summary_bg: 'Описание.', place_bg: 'Стара Загора' };
        case 'project_slug_history':
            return { project_id: parents.projectId, old_slug: `old-${n}` };
        case 'project_images':
            return { project_id: parents.projectId, storage_path: `projects/x/${n}.jpg`, width: 2400, height: 1600, alt_bg: 'Снимка' };
        case 'rail_panels':
            return { kind: 'capability', label_bg: 'Наш екип', title_bg: 'Фасади', body_bg: 'Текст.', after_project_index: 0 };
        case 'promises':
            return { title_bg: 'Обещание', body_bg: 'Текст.' };
        case 'stats':
            return { value: '25', label_bg: 'години' };
        case 'crews':
            return { key: 'office', title_bg: 'Екипът в офиса', body_bg: 'Текст.', scene: 'office' };
        case 'crew_roles':
            return { crew_id: parents.crewId, tool: 'plumb', role_bg: 'Бригадир', years: 22 };
        case 'partner_services':
            return { icon: 'blueprint', title_bg: 'Проверка', body_bg: 'Текст.' };
        case 'partners':
            return { name: `Partner ${n}`, role_bg: 'Дограма', logo_path: 'partners/x.svg' };
        case 'material_brands':
            return { name: `Brand ${n}`, logo_path: 'brands/x.svg' };
        case 'eu_programmes':
            return {
                code: `BG-${n}`,
                title_bg: 'Програма',
                summary_bg: 'Описание.',
                objectives_bg: 'Цели.',
                results_bg: 'Резултати.',
                total_budget_eur: 100000,
                eu_contribution_eur: 85000,
                period_start: '2024-01-01',
                period_end: '2025-12-31'
            };
        case 'publications':
            return { kind: 'eu_notice', title_bg: 'Съобщение', file_path: `publications/${n}.pdf`, published_on: '2025-04-30' };
        case 'legal_pages':
            return { slug: 'cookies', title_bg: 'Бисквитки', body_bg: '# Текст' };
        case 'site_settings':
            return {
                legal_name: 'Теком ЕООД',
                eik: '123456789',
                address_bg: 'Стара Загора',
                phone: '+359 42 000 000',
                email: 'office@tekomltd.com',
                privacy_email: 'privacy@tekomltd.com',
                headline_turn_bg: ['Хората зад ', 'всеки обект', 'всяка фасада']
            };
        case 'enquiries':
            return { name: 'Иван', email: 'ivan@example.com', scope: 'facade', message: 'Здравейте.', locale: 'bg', consent_at: new Date().toISOString() };
    }
}

beforeAll(async () => {
    const stack = localStack();
    sql = postgres(stack.DB_URL, { max: 1, onnotice: () => {} });
    await migrate(drizzle(sql), { migrationsFolder: resolve(__dirname, '../migrations') });
    await sql`truncate ${sql(contentTables)}, enquiries cascade`;

    anon = createClient(stack.API_URL, stack.ANON_KEY, noSession);
    service = createClient(stack.API_URL, stack.SERVICE_ROLE_KEY, noSession);

    const { error: createError } = await service.auth.admin.createUser({ ...editor, email_confirm: true });
    if (createError && !/already been registered|already exists/i.test(createError.message)) throw createError;
    authed = createClient(stack.API_URL, stack.ANON_KEY, noSession);
    const { error: signInError } = await authed.auth.signInWithPassword(editor);
    if (signInError) throw signInError;

    const project = await service.from('projects').insert(rowFor('projects')).select('id').single();
    const crew = await service
        .from('crews')
        .insert({ ...rowFor('crews'), key: 'site', scene: 'site' })
        .select('id')
        .single();
    if (project.error || crew.error) throw project.error ?? crew.error;
    parents = { projectId: project.data.id, crewId: crew.data.id };
});

afterAll(async () => {
    await sql?.end();
});

describe('anon', () => {
    it('reads published projects and not drafts', async () => {
        const published = Object.assign(rowFor('projects'), { published: true });
        const draft = Object.assign(rowFor('projects'), { published: false });
        expect((await service.from('projects').insert([published, draft])).error).toBeNull();

        const { data, error } = await anon.from('projects').select('slug');
        expect(error).toBeNull();
        const slugs = data!.map((r) => r.slug);
        expect(slugs).toContain(published.slug);
        expect(slugs).not.toContain(draft.slug);
    });

    it('sees images and old slugs of published projects only', async () => {
        const images = await anon.from('project_images').select('project_id');
        const history = await anon.from('project_slug_history').select('project_id');
        expect(images.error ?? history.error).toBeNull();
        expect([...images.data!, ...history.data!].map((r) => r.project_id)).not.toContain(parents.projectId);
    });

    it.each(contentTables)('cannot insert into %s', async (table) => {
        const { error } = await anon.from(table).insert(rowFor(table));
        expect(error?.code).toBe('42501');
    });

    it('cannot change or delete published rows', async () => {
        const row = Object.assign(rowFor('projects'), { published: true });
        expect((await service.from('projects').insert(row)).error).toBeNull();
        const updated = await anon.from('projects').update({ title_bg: 'Хакнато' }).eq('slug', row.slug).select();
        const deleted = await anon.from('projects').delete().eq('slug', row.slug).select();
        expect(updated.data ?? []).toHaveLength(0);
        expect(deleted.data ?? []).toHaveLength(0);
        const { data } = await service.from('projects').select('title_bg').eq('slug', row.slug).single();
        expect(data?.title_bg).toBe('Проект');
    });

    it('can send an enquiry but cannot read enquiries', async () => {
        expect((await anon.from('enquiries').insert(rowFor('enquiries'))).error).toBeNull();
        const { data } = await anon.from('enquiries').select('id');
        expect(data ?? []).toHaveLength(0);
        const { count } = await service.from('enquiries').select('id', { count: 'exact', head: true });
        expect(count).toBeGreaterThan(0);
    });

    it('cannot mark its own enquiry as handled', async () => {
        const { error } = await anon.from('enquiries').insert({ ...rowFor('enquiries'), handled_at: new Date().toISOString() });
        expect(error?.code).toBe('42501');
    });

    it('cannot upload to site-media', async () => {
        const { error } = await anon.storage.from('site-media').upload(`rls/${Date.now()}.txt`, 'x', { contentType: 'text/plain' });
        expect(error).not.toBeNull();
    });
});

describe('authenticated', () => {
    it.each([...contentTables, 'enquiries' as const])('can insert, update and delete %s', async (table) => {
        const inserted = await authed.from(table).insert(rowFor(table)).select('id').single();
        expect(inserted.error).toBeNull();
        const id = inserted.data!.id;

        const patch = table === 'enquiries' ? { handled_at: new Date().toISOString() } : { updated_at: new Date().toISOString() };
        const updated = await authed.from(table).update(patch).eq('id', id).select('id');
        expect(updated.error).toBeNull();
        expect(updated.data).toHaveLength(1);

        const deleted = await authed.from(table).delete().eq('id', id).select('id');
        expect(deleted.error).toBeNull();
        expect(deleted.data).toHaveLength(1);
    });

    it('can upload to site-media, which anon cannot list', async () => {
        const path = `rls/${Date.now()}.txt`;
        const { error } = await authed.storage.from('site-media').upload(path, 'x', { contentType: 'text/plain' });
        expect(error).toBeNull();
        const listed = await anon.storage.from('site-media').list('rls');
        expect(listed.data ?? []).toHaveLength(0);
        expect((await authed.storage.from('site-media').remove([path])).error).toBeNull();
    });
});

describe('auth', () => {
    it('lets nobody sign up', async () => {
        const { error } = await anon.auth.signUp({ email: `new-${Date.now()}@tekomltd.test`, password: 'another-password-123' });
        expect(error?.message).toMatch(/signups not allowed/i);
    });
});

describe('storage', () => {
    it('has a public site-media bucket', async () => {
        const { data, error } = await service.storage.getBucket('site-media');
        expect(error).toBeNull();
        expect(data?.public).toBe(true);
    });
});

describe('retention', () => {
    it('purges enquiries older than 12 months', async () => {
        const old = rowFor('enquiries');
        const recent = rowFor('enquiries');
        const [oldRow] = await sql`insert into enquiries ${sql(old)} returning id`;
        await sql`update enquiries set created_at = now() - interval '12 months 1 day' where id = ${oldRow!.id}`;
        const [recentRow] = await sql`insert into enquiries ${sql(recent)} returning id`;

        await sql`select public.purge_old_enquiries()`;

        const left = await sql`select id from enquiries where id in ${sql([oldRow!.id, recentRow!.id])}`;
        expect(left.map((r) => r.id)).toEqual([recentRow!.id]);
    });

    it('runs the purge daily at 03:00', async () => {
        const jobs = await sql`select schedule, command from cron.job where jobname = 'purge-old-enquiries'`;
        expect(jobs).toEqual([{ schedule: '0 3 * * *', command: 'select public.purge_old_enquiries()' }]);
    });

    it('is not callable through the API', async () => {
        const { error } = await anon.rpc('purge_old_enquiries');
        expect(error?.code).toBe('42501');
    });
});
