import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { parse } from 'yaml';
import { defaultRoot } from '../src/content/load';
import { PROJECT_FILE, PROJECTS_DIR } from '../src/content/paths';

const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx']);

const isDraftProject = (dir: string) => {
    const file = join(dir, PROJECT_FILE);
    return existsSync(file) && parse(readFileSync(file, 'utf8'))?.draft === true;
};

/** Replaces `outDir` with every image and document under `contentRoot` (draft projects excluded), keeping the relative path. Returns the file count. */
export function syncMedia(contentRoot: string, outDir: string): number {
    if (!existsSync(contentRoot)) return 0;
    const root = resolve(contentRoot);
    rmSync(outDir, { recursive: true, force: true });
    let copied = 0;
    const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) {
                if (dirname(path) === join(root, PROJECTS_DIR) && isDraftProject(path)) continue;
                walk(path);
            } else if (MEDIA_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
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
    const contentRoot = resolve(process.argv[2] ?? defaultRoot());
    const outDir = resolve(process.argv[3] ?? join(process.cwd(), 'public', 'media'));
    console.log(`sync-media: ${syncMedia(contentRoot, outDir)} files from ${contentRoot}`);
}
