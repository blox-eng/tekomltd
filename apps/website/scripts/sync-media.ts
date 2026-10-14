import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';

const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.pdf']);

/** Copies every image and PDF under `contentRoot` to `outDir`, keeping the relative path. Returns the file count. */
export function syncMedia(contentRoot: string, outDir: string): number {
    if (!existsSync(contentRoot)) return 0;
    const root = resolve(contentRoot);
    let copied = 0;
    const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) walk(path);
            else if (MEDIA_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
                const target = join(outDir, relative(root, path));
                mkdirSync(dirname(target), { recursive: true });
                copyFileSync(path, target);
                copied++;
            }
        }
    };
    walk(root);
    return copied;
}

if (process.argv[1] && basename(process.argv[1]) === 'sync-media.ts') {
    const contentRoot = resolve(process.argv[2] ?? join(process.cwd(), '..', '..', 'content'));
    const outDir = resolve(process.argv[3] ?? join(process.cwd(), 'public', 'media'));
    console.log(`sync-media: ${syncMedia(contentRoot, outDir)} files from ${contentRoot}`);
}
