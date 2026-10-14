import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { syncMedia } from './sync-media';

const root = join(__dirname, '..', 'src', 'content', '__fixtures__', 'loader');

describe('syncMedia', () => {
    const out = mkdtempSync(join(tmpdir(), 'media-'));
    const copied = syncMedia(root, out);

    it('copies a nested image to the same relative path', () => {
        expect(existsSync(join(out, 'projects', 'green-bath-eye-clinic', 'gallery', 'second.png'))).toBe(true);
        expect(copied).toBeGreaterThan(0);
    });
    it('copies pdfs', () => expect(existsSync(join(out, 'publications', 'notice.pdf'))).toBe(true));
    it('copies office documents', () => expect(existsSync(join(out, 'publications', 'form.docx'))).toBe(true));
    it('does not copy yaml or markdown', () => {
        expect(readdirSync(out)).not.toContain('home.yaml');
        expect(existsSync(join(out, 'legal'))).toBe(false);
        expect(existsSync(join(out, 'projects', 'old-town-house', 'project.yaml'))).toBe(false);
    });
    it('skips the media of draft projects', () => {
        expect(existsSync(join(out, 'projects', 'hidden-draft'))).toBe(false);
        expect(existsSync(join(out, 'projects', 'third-site', 'a.png'))).toBe(true);
    });
    it('clears stale files from the output folder first', () => {
        const stale = mkdtempSync(join(tmpdir(), 'media-stale-'));
        mkdirSync(join(stale, 'projects', 'gone'), { recursive: true });
        writeFileSync(join(stale, 'projects', 'gone', 'old.jpg'), 'x');
        syncMedia(root, stale);
        expect(existsSync(join(stale, 'projects', 'gone'))).toBe(false);
        expect(existsSync(join(stale, 'publications', 'notice.pdf'))).toBe(true);
    });
    it('does nothing when the content folder is missing', () => expect(syncMedia(join(out, 'nope'), join(out, 'x'))).toBe(0));
});
