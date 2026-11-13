import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DEFAULT_LOCALE, type Locale } from '@tekom/i18n';
import { z } from 'zod';
import { loadImg, parseFrontMatter, t, type Img } from './load';
import { parseUpdateFile, UPDATES_DIR } from './paths';
import { imagePath, L, type Kind, type Progress, type Project, type Stage, type StageKey } from './schema';

export const DEFAULT_STAGES: Record<Kind, StageKey[]> = {
    building: ['design', 'permit', 'excavation', 'zero', 'act14', 'act15', 'act16'],
    house: ['design', 'permit', 'zero', 'rough', 'roof', 'finishing', 'use_permit'],
    facade: ['scaffold', 'insulation', 'render', 'scaffold_down', 'handover']
};

export type StageState = 'done' | 'active' | 'next';

export const stagesOf = (progress: Progress): Stage[] => progress.stages ?? DEFAULT_STAGES[progress.kind].map((key) => ({ key }));

export const stageState = (stage: Stage): StageState => (stage.done ? 'done' : stage.started ? 'active' : 'next');

/** Today in Sofia as `YYYY-MM-DD`, wherever the build runs (CI and Netlify run in UTC). */
export const sofiaToday = (now: Date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Sofia' }).format(now);

export function parseQuarter(expected: string): { year: number; quarter: 1 | 2 | 3 | 4 } {
    const [year, quarter] = expected.split('-Q');
    return { year: Number(year), quarter: Number(quarter) as 1 | 2 | 3 | 4 };
}

export type StageView = { key: StageKey | null; label: string | null; labelFallback: boolean; started: string | null; done: string | null; state: StageState };
export type UpdateView = { date: string; body: string; fallback: boolean; photos: Img[]; cta: { label: string; href: string } | null };
export type ProgressView = {
    status: Progress['status'];
    kind: Kind;
    expected: { year: number; quarter: 1 | 2 | 3 | 4 } | null;
    permit: string | null;
    note: string | null;
    noteFallback: boolean;
    stages: StageView[];
    updates: UpdateView[];
    lastUpdate: string | null;
};

/** Front matter of an update. Photos live in the Bulgarian file only. */
export const UpdateFront = z.strictObject({
    photos: z.array(z.strictObject({ file: imagePath, alt: z.string().optional() })).default([]),
    /** Show this update on the home page. */
    home: z.boolean().default(false),
    cta: z
        .strictObject({
            label: L,
            href: z.string().refine((h) => /^\/(?!\/)/.test(h) || h.startsWith('mailto:'), 'the button goes to a page of this site (/…) or to mailto:')
        })
        .optional()
});

/** `<project folder>/updates/<name>` for every update file, relative to the content root. */
export function updateFiles(root: string, projectFile: string): { file: string; date: string; locale: Locale }[] {
    const dir = join(dirname(projectFile), UPDATES_DIR);
    if (!existsSync(join(root, dir))) return [];
    return readdirSync(join(root, dir))
        .flatMap((name) => {
            const parsed = parseUpdateFile(name);
            return parsed ? [{ file: join(dir, name), ...parsed }] : [];
        })
        .sort((a, b) => b.date.localeCompare(a.date));
}

function loadUpdates(root: string, projectFile: string, locale: Locale): UpdateView[] {
    const files = updateFiles(root, projectFile);
    return files
        .filter((f) => f.locale === DEFAULT_LOCALE)
        .map((bg) => {
            const own = files.find((f) => f.date === bg.date && f.locale === locale);
            const { data, body: bgBody } = parseFrontMatter(readFileSync(join(root, bg.file), 'utf8'));
            const { photos, cta } = UpdateFront.parse(data);
            const body = own ? parseFrontMatter(readFileSync(join(root, own.file), 'utf8')).body : bgBody;
            return {
                date: bg.date,
                body,
                fallback: own === undefined,
                photos: photos.map((p) => loadImg(root, bg.file, p.file, p.alt ?? '')),
                cta: cta ? { label: t(cta.label, locale).text, href: cta.href } : null
            };
        });
}

export function loadProgress(project: Project, projectFile: string, root: string, locale: Locale): ProgressView | null {
    const { progress } = project;
    if (!progress) return null;
    const note = progress.note ? t(progress.note, locale) : null;
    const updates = loadUpdates(root, projectFile, locale);
    return {
        status: progress.status,
        kind: progress.kind,
        expected: progress.expected ? parseQuarter(progress.expected) : null,
        permit: progress.permit ?? null,
        note: note?.text ?? null,
        noteFallback: note?.fallback ?? false,
        stages: stagesOf(progress).map((stage) => {
            const label = stage.label ? t(stage.label, locale) : null;
            return {
                key: stage.key ?? null,
                label: label?.text ?? null,
                labelFallback: label?.fallback ?? false,
                started: stage.started ?? null,
                done: stage.done ?? null,
                state: stageState(stage)
            };
        }),
        updates,
        lastUpdate: updates[0]?.date ?? null
    };
}
