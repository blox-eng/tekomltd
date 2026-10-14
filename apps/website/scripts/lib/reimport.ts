import { existsSync, rmSync } from 'node:fs';

/** The import is a one-off: once its output exists, people own it. A second run needs `--force`. */
export function assertFirstRun(outputs: string[], force: boolean) {
    const existing = outputs.filter((p) => existsSync(p));
    if (existing.length && !force) {
        throw new Error(`import:wp has already run (${existing.join(', ')} exists). Re-run with --force; it keeps files and images people added.`);
    }
}

export type ImageEntry = { file: string; alt?: Record<string, string>; is_cover?: boolean };

/**
 * Merges the images an import produced into the list in project.yaml, by file name. Entries people added stay where they
 * are, as does their cover choice. Entries of files the previous import wrote and this one did not are dropped; new
 * imported files are appended. Without any cover, the first imported image becomes the cover.
 */
export function mergeImages(existing: ImageEntry[], imported: { file: string; alt: Record<string, string> }[], previouslyImported: Set<string>): ImageEntry[] {
    const now = new Map(imported.map((i) => [i.file, i]));
    const merged: ImageEntry[] = existing
        .filter((e) => now.has(e.file) || !previouslyImported.has(e.file))
        .map((e) => (now.has(e.file) ? { ...e, alt: { ...e.alt, ...now.get(e.file)!.alt } } : e));
    const listed = new Set(merged.map((e) => e.file));
    for (const i of imported) if (!listed.has(i.file)) merged.push({ file: i.file, alt: i.alt });
    if (!merged.some((e) => e.is_cover) && imported.length) {
        const first = merged.find((e) => e.file === imported[0]!.file)!;
        first.is_cover = true;
    }
    return merged.map(({ is_cover, ...rest }) => (is_cover ? { ...rest, is_cover } : rest));
}

/** Deletes the files the previous import wrote that this run did not write again; never touches any other file. */
export function removeStale(previouslyWritten: Iterable<string>, writtenNow: Set<string>): string[] {
    const removed: string[] = [];
    for (const file of previouslyWritten) {
        if (writtenNow.has(file) || !existsSync(file)) continue;
        rmSync(file);
        removed.push(file);
    }
    return removed;
}
