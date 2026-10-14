import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

function required(name: string, value: string | undefined) {
    if (!value) throw new Error(`${name} is not set`);
    return value;
}

export function anonClient() {
    return createClient<Database>(
        required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
        required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        noSession
    );
}

/** Bypasses RLS. Only for scripts/ and the backup and daily-pulse workflows, never a request path. */
export function serviceClient() {
    return createClient<Database>(
        required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
        required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
        noSession
    );
}
