import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { defaultRoot } from '../src/content/load';
import { PROJECT_FILE, PROJECTS_DIR, UPDATES_DIR } from '../src/content/paths';
import { sofiaToday } from '../src/content/progress';

export const UPDATE_TEMPLATE = `---
# Снимки: качете ги в папката updates и ги запишете тук, например:
# photos:
#   - file: 2026-11-20-1.jpg
#     alt: Покривът е готов
photos: []
---

**Направено:**

**Следва:**
`;

/** Writes `projects/<slug>/updates/<today>.bg.md` from the template and returns its path. */
export function newUpdate(root: string, slug: string, today: string): string {
    const folder = join(root, PROJECTS_DIR, slug);
    if (!existsSync(join(folder, PROJECT_FILE))) throw new Error(`no project ${slug} in content/projects`);
    const path = join(folder, UPDATES_DIR, `${today}.bg.md`);
    if (existsSync(path)) throw new Error(`${path} already exists; edit it, or add the update tomorrow`);
    mkdirSync(join(folder, UPDATES_DIR), { recursive: true });
    writeFileSync(path, UPDATE_TEMPLATE);
    return path;
}

if (process.argv[1] && basename(process.argv[1]) === 'new-update.ts') {
    const slug = process.argv[2];
    if (!slug) {
        console.error('new-update: give the project folder, for example: pnpm new-update stoletov-46');
        process.exitCode = 1;
    } else {
        try {
            const path = newUpdate(resolve(defaultRoot()), slug, sofiaToday());
            console.log(`new-update: wrote ${path}`);
        } catch (e) {
            console.error(`new-update: ${(e as Error).message}`);
            process.exitCode = 1;
        }
    }
}
