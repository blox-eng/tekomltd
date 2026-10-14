import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

export const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');
export const MOCKUP_DIR = join(REPO_ROOT, 'design', 'mockup');

type T3 = { bg: string; en: string; de: string };

export type Mockup = {
    PLACE: Record<string, { en: string; de: string }>;
    SVC: { after: number; cls: string; k: T3; t: T3; d: T3 }[];
    CREW: { after: number; big: string; u: T3; d: T3 }[];
    CREWS: { photo: string | null; scene: 'site' | 'office'; t: T3; d: T3; m: { i: string; r: T3; y: number; q: T3 }[] }[];
    PSVC: { i: string; t: T3; d: T3 }[];
    PARTNERS: unknown[];
    T: Record<string, Record<'bg' | 'en' | 'de', unknown>>;
};

export type MockProject = {
    id: number;
    slug: string;
    wide?: boolean;
    y?: number;
    a?: number;
    s: string[];
    place: string;
    addr: string;
    t: T3;
};

/**
 * The site data of the mockup, read from its own script (the constants from SCOPE to T), so every
 * string comes over exactly as it is written there. The script runs in an empty sandbox (no require, no process).
 */
export function readMockup(): Mockup {
    const tpl = readFileSync(join(MOCKUP_DIR, 'mockup.tpl.html'), 'utf8');
    const start = tpl.indexOf('const SCOPE=');
    const end = tpl.indexOf('let lang=');
    if (start < 0 || end < start) throw new Error('mockup.tpl.html: cannot find the data constants');
    return runInNewContext(`${tpl.slice(start, end)}\n({ PLACE, SVC, CREW, CREWS, PSVC, PARTNERS, T })`, {}, { timeout: 1000 }) as Mockup;
}

export const readMockProjects = (): MockProject[] => JSON.parse(readFileSync(join(MOCKUP_DIR, 'data', 'projects.json'), 'utf8'));

export const readGeo = (): Record<string, [number, number, string, string]> => JSON.parse(readFileSync(join(MOCKUP_DIR, 'data', 'geo.json'), 'utf8'));
