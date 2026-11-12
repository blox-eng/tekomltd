import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkContent } from '../src/content/check';
import { newUpdate, UPDATE_TEMPLATE } from './new-update';

const VALID = join(__dirname, '..', 'src', 'content', '__fixtures__', 'valid');
const dirs: string[] = [];
afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** The valid content tree, with green-bath-eye-clinic turned into a project in progress. */
function tree() {
    const root = mkdtempSync(join(tmpdir(), 'tekom-update-'));
    dirs.push(root);
    cpSync(VALID, root, { recursive: true });
    const file = join(root, 'projects/green-bath-eye-clinic/project.yaml');
    writeFileSync(file, readFileSync(file, 'utf8').replace(/^year: .*$/m, '') + '\nprogress:\n  status: in_progress\n  kind: facade\n');
    return root;
}

describe('newUpdate', () => {
    it('writes the template under today’s date and returns the path', () => {
        const root = tree();
        const path = newUpdate(root, 'green-bath-eye-clinic', '2026-11-12');
        expect(path).toBe(join(root, 'projects/green-bath-eye-clinic/updates/2026-11-12.bg.md'));
        expect(readFileSync(path, 'utf8')).toBe(UPDATE_TEMPLATE);
    });
    it('makes content that passes the check', () => {
        const root = tree();
        newUpdate(root, 'green-bath-eye-clinic', '2026-11-12');
        expect(checkContent(root, { today: '2026-11-12' })).toEqual({ ok: true, warnings: [] });
    });
    it('refuses a project that does not exist', () => {
        const root = tree();
        expect(() => newUpdate(root, 'nope', '2026-11-12')).toThrow('no project nope in content/projects');
        expect(existsSync(join(root, 'projects/nope'))).toBe(false);
    });
    it('never overwrites an update', () => {
        const root = tree();
        newUpdate(root, 'green-bath-eye-clinic', '2026-11-12');
        expect(() => newUpdate(root, 'green-bath-eye-clinic', '2026-11-12')).toThrow(/2026-11-12\.bg\.md already exists/);
    });
});
