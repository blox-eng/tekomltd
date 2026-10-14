import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';

// PGlite has no pg_cron and no Supabase storage schema; the local Supabase stack (test:rls) covers these.
const LOCAL_STACK_ONLY = new Set(['0002_retention', '0003_storage']);

const migrationsDir = new URL('../migrations/', import.meta.url);

export async function createTestDb() {
    const client = new PGlite();
    // Stand-ins for what Supabase provides, just enough for the policies in 0001 to be created.
    await client.exec(`
        CREATE ROLE anon NOLOGIN;
        CREATE ROLE authenticated NOLOGIN;
        CREATE SCHEMA auth;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
        CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'SELECT ''{}''::jsonb';
        CREATE TABLE auth.mfa_factors (id uuid PRIMARY KEY, user_id uuid NOT NULL, status text NOT NULL);
    `);

    const journal: { entries: { tag: string }[] } = JSON.parse(readFileSync(new URL('meta/_journal.json', migrationsDir), 'utf8'));
    for (const { tag } of journal.entries) {
        if (LOCAL_STACK_ONLY.has(tag)) continue;
        await client.exec(readFileSync(new URL(`${tag}.sql`, migrationsDir), 'utf8'));
    }

    return { db: drizzle(client, { schema }), close: () => client.close() };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
