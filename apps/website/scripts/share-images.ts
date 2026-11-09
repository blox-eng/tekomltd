import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { LOCALES } from '@tekom/i18n';
import { defaultRoot } from '../src/content/load';
import { allProjectSlugs, getProject } from '../src/content/projects';
import { allServiceSlugs, getService } from '../src/content/services';
import { projectPhoto, servicePhoto, SHARE_DIR, shareFile, sitePhoto, type SharePhoto } from '../src/lib/share';
import { renderShareImage } from '../src/lib/share-image';

/** Replaces `outDir` with the share image of every page, one file per distinct photo and wordmark. Returns the file count. */
export async function writeShareImages(contentRoot: string, outDir: string): Promise<number> {
    const jobs = new Map<string, { photo: SharePhoto | null; locale: (typeof LOCALES)[number] }>();
    for (const locale of LOCALES) {
        const photos = [
            sitePhoto(locale, contentRoot),
            ...allProjectSlugs(contentRoot).map(({ slug }) => projectPhoto(getProject(slug, locale, contentRoot)!)),
            ...allServiceSlugs(contentRoot)
                .filter((service) => service.locales.includes(locale))
                .map(({ slug }) => servicePhoto(getService(slug, locale, contentRoot)!))
        ];
        for (const photo of photos) jobs.set(shareFile(photo, locale), { photo, locale });
    }
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    for (const [file, { photo, locale }] of jobs) writeFileSync(join(outDir, file), await renderShareImage(photo, locale, contentRoot));
    return jobs.size;
}

if (process.argv[1] && basename(process.argv[1]) === 'share-images.ts') {
    const contentRoot = resolve(process.argv[2] ?? defaultRoot());
    const outDir = resolve(process.argv[3] ?? join(process.cwd(), 'public', SHARE_DIR));
    writeShareImages(contentRoot, outDir).then((count) => console.log(`share-images: ${count} files from ${contentRoot}`));
}
