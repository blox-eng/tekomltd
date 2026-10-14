import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expectTypeOf, it } from 'vitest';
import type { projects } from './schema';
import type { Database, Row, Tables, TablesInsert } from './types';

// Compile-time checks: tsc (pnpm typecheck) fails if the supabase-js types drift from the schema.
async function typedQuery(client: SupabaseClient<Database>) {
    const { data } = await client.from('projects').select('slug, title_bg, scopes, project_images(storage_path, is_cover)').eq('published', true);
    return data;
}

describe('row types', () => {
    it('use database column names', () => {
        expectTypeOf<Row<typeof projects>>().toHaveProperty('title_bg').toEqualTypeOf<string>();
        expectTypeOf<Tables<'projects'>>().toHaveProperty('built_area_m2').toEqualTypeOf<number | null>();
        expectTypeOf<Tables<'projects'>>().toHaveProperty('scopes').toEqualTypeOf<('full' | 'restore' | 'facade' | 'interior' | 'stone')[]>();
        expectTypeOf<Tables<'enquiries'>>().toHaveProperty('created_at').toEqualTypeOf<string>();
    });

    it('make defaults optional on insert', () => {
        expectTypeOf<{ slug: string; title_bg: string; summary_bg: string; place_bg: string }>().toMatchTypeOf<TablesInsert<'projects'>>();
    });

    it('type supabase-js queries and embeds', () => {
        type Result = NonNullable<Awaited<ReturnType<typeof typedQuery>>>[number];
        expectTypeOf<Result['title_bg']>().toEqualTypeOf<string>();
        expectTypeOf<Result['project_images']>().toEqualTypeOf<{ storage_path: string; is_cover: boolean }[]>();
    });
});
